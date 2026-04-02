import { Directive, Input, inject, ViewContainerRef, TemplateRef } from '@angular/core';
import { PermissionService } from '../../auth/permission.service';
import type { UserPermissions } from '../../models/permission.model';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private permissions = inject(PermissionService);
  private vcr = inject(ViewContainerRef);
  private templateRef = inject(TemplateRef);

  @Input() set appHasPermission(value: string | undefined) {
    if (!value) {
      this.vcr.clear();
      return;
    }
    
    const [module, action] = value.split(':') as [keyof UserPermissions, string];
    let allowed = false;

    switch (action) {
      case 'read':
        allowed = this.permissions.canRead(module);
        break;
      case 'add':
        allowed = this.permissions.canAdd(module);
        break;
      case 'edit':
        allowed = this.permissions.canEdit(module);
        break;
      case 'delete':
        allowed = this.permissions.canDelete(module);
        break;
      case 'print':
        allowed = this.permissions.canPrint(module);
        break;
      case 'write': // Backward compatibility
        allowed = this.permissions.canWrite(module);
        break;
      default:
        allowed = this.permissions.canRead(module);
        break;
    }

    this.vcr.clear();
    if (allowed) {
      this.vcr.createEmbeddedView(this.templateRef);
    }
  }
}
