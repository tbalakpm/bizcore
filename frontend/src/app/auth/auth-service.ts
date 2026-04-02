import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal, computed } from '@angular/core';
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
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http: HttpClient = inject(HttpClient);
  private router = inject(Router);
  private readonly TOKEN_KEY = 'bc_token';

  // ─── Token storage (sessionStorage – clears on tab close) ─────────────────

  /** Reactive signal for the current token */
  public readonly tokenSignal = signal<string | null>(this.token);

  private setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this.tokenSignal.set(token);
  }

  private removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.tokenSignal.set(null);
  }

  get token(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.TOKEN_KEY);
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

  /**
   * True if we have a token.
   * We don't check expiration here because the interceptor handles 401s by refreshing.
   * Hiding the UI just because the access token is expired (while the refresh token might still be valid)
   * causes jarring flickering and hides the header prematurely.
   */
  get isLoggedIn(): boolean {
    return !!this.tokenSignal();
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
      .pipe(tap((res) => this.setToken(res.token)));
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

  /** Revoke the refresh token server-side and clear local state */
  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => {} }); // best-effort
    this.removeToken();
    this.router.navigateByUrl('/login');
  }
}
