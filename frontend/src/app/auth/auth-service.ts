import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs/internal/operators/tap';
import { jwtDecode } from 'jwt-decode';
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
  private tokenKey = 'bc_token';

  login(username: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, {
        username,
        password,
      })
      .pipe(tap((res) => sessionStorage.setItem(this.tokenKey, res.token)));
  }

  register(username: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/register`, { username, password });
  }

  logout() {
    sessionStorage.removeItem(this.tokenKey);
  }

  get token(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get decodedToken(): DecodedToken | null {
    const token = this.token;
    if (!token) return null;
    try {
      return jwtDecode<DecodedToken>(token);
    } catch {
      return null;
    }
  }

  get currentUserRole(): string | null {
    return this.decodedToken?.role ?? null;
  }

  get currentUserPermissions(): Partial<UserPermissions> {
    return this.decodedToken?.permissions ?? {};
  }
}
