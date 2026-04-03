import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth-service';
import type { ModulePermissions, UserPermissions } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private auth = inject(AuthService);

  private get isAdmin(): boolean {
    return this.auth.currentUserRole === 'admin';
  }

  private get permissions(): Partial<UserPermissions> {
    return this.auth.currentUserPermissions;
  }

  private hasPermission(module: keyof UserPermissions, action: keyof ModulePermissions): boolean {
    if (this.isAdmin) return true;
    const perm = this.permissions[module];

    if (!perm) return false;

    // Backward compatibility for old string-based permissions
    if (typeof perm === 'string') {
      if (perm === 'none') return false;
      if (perm === 'read') return action === 'read';
      if (perm === 'write') return true; // write gave full access previously
      return false;
    }

    // New object-based permissions
    return !!perm[action];
  }

  getFirstReadPermission() {
    const permissions = this.auth.currentUserPermissions as any;
    const permissionKeys = Object.keys(this.auth.currentUserPermissions);

    for (const key of permissionKeys) {
      if (permissions[key].read) {
        return key;
      }
    }
    return '';
  }


  canRead(module: keyof UserPermissions): boolean {
    return this.hasPermission(module, 'read');
  }

  canAdd(module: keyof UserPermissions): boolean {
    return this.hasPermission(module, 'add');
  }

  canEdit(module: keyof UserPermissions): boolean {
    return this.hasPermission(module, 'edit');
  }

  canDelete(module: keyof UserPermissions): boolean {
    return this.hasPermission(module, 'delete');
  }

  canPrint(module: keyof UserPermissions): boolean {
    return this.hasPermission(module, 'print');
  }

  // To maintain legacy support if needed
  canWrite(module: keyof UserPermissions): boolean {
    return this.canAdd(module) || this.canEdit(module) || this.canDelete(module);
  }
}
