import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs/internal/operators/tap';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string;
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
      .pipe(tap((res) => localStorage.setItem(this.tokenKey, res.token)));
  }

  register(username: string, password: string) {
    return this.http.post(`${environment.apiUrl}/auth/register`, { username, password });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }
}
