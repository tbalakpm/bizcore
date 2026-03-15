import { Directive, Input, inject, ElementRef, Renderer2 } from '@angular/core';
import { PermissionService } from '../../auth/permission.service';
import type { UserPermissions } from '../../models/permission.model';

@Directive({
  selector: '[appReadonlyIf]',
  standalone: true,
})
export class ReadonlyIfDirective {
  private permissions = inject(PermissionService);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input() set appReadonlyIf(module: string) {
    if (!this.permissions.canWrite(module as keyof UserPermissions)) {
      this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
      this.renderer.addClass(this.el.nativeElement, 'opacity-50');
      this.renderer.addClass(this.el.nativeElement, 'cursor-not-allowed');
    }
  }
}
