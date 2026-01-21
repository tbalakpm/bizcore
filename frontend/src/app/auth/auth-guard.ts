import { Injectable, inject } from '@angular/core';
import { type CanActivate, Router, type UrlTree } from '@angular/router';
import { AuthService } from './auth-service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    if (this.auth.isLoggedIn) return true;
    return this.router.parseUrl('/login');
  }
}
