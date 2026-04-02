import { Injectable, inject } from '@angular/core';
import { type ActivatedRouteSnapshot, type CanActivate, type CanActivateChild, Router, type UrlTree } from '@angular/router';
import { AuthService } from './auth-service';
import { PermissionService } from './permission.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
  private auth = inject(AuthService);
  private permissionService = inject(PermissionService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.auth.isLoggedIn) return this.router.parseUrl('/login');

    if (this.auth.mustChangePassword && !route.routeConfig?.path?.includes('change-password')) {
      return this.router.parseUrl('/change-password');
    }
    return this.checkPermission(route);
  }

  canActivateChild(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (!this.auth.isLoggedIn) return this.router.parseUrl('/login');

    if (this.auth.mustChangePassword && !route.routeConfig?.path?.includes('change-password')) {
      return this.router.parseUrl('/change-password');
    }
    return this.checkPermission(route);
  }

  private checkPermission(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const module = route.data?.['module'];
    if (module && !this.permissionService.canRead(module)) {
      return this.router.createUrlTree(['/dashboard']);
    }
    return true;
  }
}
