import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, NgZone } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import type { UserPermissions } from '../models/permission.model';

export interface AuthResponse {
  token: string;
}

export interface DecodedToken {
  sub: number;
  username: string;
  role: string;
  permissions: Partial<UserPermissions>;
  exp: number;
  mustChangePassword: boolean;
}

/** User-activity events that reset the idle clock */
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http: HttpClient = inject(HttpClient);
  private router = inject(Router);
  private zone = inject(NgZone);

  private readonly TOKEN_KEY = 'bc_token';

  /** Timer that fires 60 s before the access token expires */
  private refreshTimer?: ReturnType<typeof setTimeout>;

  /** Last time the user did anything (ms since epoch) */
  private lastActivityAt = Date.now();

  constructor() {
    this.startActivityTracking();
    this.scheduleTokenRefresh(this.token);
  }

  // ─── Token storage (sessionStorage – clears on tab close) ─────────────────

  /** Reactive signal for the current token */
  public readonly tokenSignal = signal<string | null>(this.token);

  private setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this.tokenSignal.set(token);
    this.scheduleTokenRefresh(token);
  }

  private removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.tokenSignal.set(null);
    this.clearRefreshTimer();
  }

  get token(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // ─── Activity tracking ─────────────────────────────────────────────────────

  /** Listen to DOM events outside Angular's change-detection zone for efficiency */
  private startActivityTracking(): void {
    if (typeof window === 'undefined') return;
    this.zone.runOutsideAngular(() => {
      for (const evt of ACTIVITY_EVENTS) {
        window.addEventListener(evt, () => { this.lastActivityAt = Date.now(); }, { passive: true });
      }
    });
  }

  // ─── Token refresh scheduling ──────────────────────────────────────────────

  /**
   * Schedule a check ~60 seconds before the access token expires.
   * At that point we check whether the user has been active during this token's
   * lifetime — if yes, silently refresh; if idle, log out.
   */
  private scheduleTokenRefresh(token: string | null): void {
    this.clearRefreshTimer();
    if (!token) return;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const issuedAt = (decoded as any).iat ? (decoded as any).iat * 1000 : Date.now();
      const expiry = decoded.exp * 1000;
      const tokenLifetimeMs = expiry - issuedAt; // e.g. 15 min
      const refreshAt = expiry - 60_000;          // fire 60 s before expiry
      const delay = refreshAt - Date.now();

      if (delay <= 0) {
        // Already past the refresh-trigger point
        if (Date.now() < expiry) {
          this.trySilentRefreshOrLogout(tokenLifetimeMs);
        } else {
          // Already expired — check idleness then decide
          this.trySilentRefreshOrLogout(tokenLifetimeMs);
        }
      } else {
        this.refreshTimer = setTimeout(
          () => this.trySilentRefreshOrLogout(tokenLifetimeMs),
          delay,
        );
      }
    } catch {
      // Unparseable token — clear it
      this.removeToken();
      this.zone.run(() => this.router.navigateByUrl('/login'));
    }
  }

  /**
   * Decide whether to silently refresh or log out based on idle time.
   * If the user hasn't interacted since before this token was issued
   * (i.e. idle for a full token lifetime), treat the session as expired.
   */
  private trySilentRefreshOrLogout(tokenLifetimeMs: number): void {
    const idleMs = Date.now() - this.lastActivityAt;

    if (idleMs >= tokenLifetimeMs) {
      // User has been idle for at least one full token lifetime — log out
      this.zone.run(() => {
        this.logout();
      });
    } else {
      // User was active — silently refresh in the background
      this.silentRefresh();
    }
  }

  /** Attempt a background token refresh. Only force logout if the refresh itself fails. */
  private silentRefresh(): void {
    this.refreshToken().subscribe({
      error: () => {
        // Refresh token expired or revoked — force logout
        this.zone.run(() => {
          this.removeToken();
          this.router.navigateByUrl('/login');
        });
      },
    });
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  // ─── Decoded token helpers ─────────────────────────────────────────────────

  get decodedToken(): DecodedToken | null {
    const t = this.tokenSignal();
    if (!t) return null;
    try {
      return jwtDecode<DecodedToken>(t);
    } catch {
      return null;
    }
  }

  get isLoggedIn(): boolean {
    return !!this.tokenSignal();
  }

  get mustChangePassword(): boolean {
    return this.decodedToken?.mustChangePassword ?? false;
  }

  get currentUserRole(): string | null {
    return this.decodedToken?.role ?? null;
  }

  get currentUserPermissions(): Partial<UserPermissions> {
    return this.decodedToken?.permissions ?? {};
  }

  // ─── Auth endpoints ────────────────────────────────────────────────────────

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { username, password }, { withCredentials: true })
      .pipe(tap((res) => {
        this.lastActivityAt = Date.now(); // login counts as activity
        this.setToken(res.token);
      }));
  }

  register(username: string, password: string): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/auth/register`, { username, password });
  }

  /**
   * Exchange the httpOnly refresh-token cookie for a new access token.
   * Called automatically by the auth interceptor on 401 responses.
   */
  refreshToken(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(tap((res) => this.setToken(res.token)));
  }

  /** Change password and reset flag */
  changePassword(newPassword: string): Observable<unknown> {
    return this.http
      .post(`${environment.apiUrl}/auth/change-password`, { newPassword }, { withCredentials: true })
      .pipe(tap(() => this.logout())); // Force re-login with new password
  }

  /** Revoke the refresh token server-side and clear local state */
  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => { } }); // best-effort
    this.removeToken();
    this.router.navigateByUrl('/login');
  }
}
