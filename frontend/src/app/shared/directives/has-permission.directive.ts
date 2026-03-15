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

  @Input() set appHasPermission(value: string) {
    const [module, action] = value.split(':');
    const allowed =
      action === 'write'
        ? this.permissions.canWrite(module as keyof UserPermissions)
        : this.permissions.canRead(module as keyof UserPermissions);

    this.vcr.clear();
    if (allowed) {
      this.vcr.createEmbeddedView(this.templateRef);
    }
  }
}
