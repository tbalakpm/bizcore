import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth-service';
import type { PermissionLevel, UserPermissions } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private auth = inject(AuthService);

  private get isAdmin(): boolean {
    return this.auth.currentUserRole === 'admin';
  }

  private get permissions(): Partial<UserPermissions> {
    return this.auth.currentUserPermissions;
  }

  canRead(module: keyof UserPermissions): boolean {
    if (this.isAdmin) return true;
    const level = this.permissions[module];
    return level === 'read' || level === 'write';
  }

  canWrite(module: keyof UserPermissions): boolean {
    if (this.isAdmin) return true;
    return this.permissions[module] === 'write';
  }
}
