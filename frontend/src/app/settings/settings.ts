import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PermissionService } from '../auth/permission.service';

@Component({
  selector: 'app-settings',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NzIconModule],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
      <h1 class="text-xl font-semibold flex items-center gap-2">
        <span nz-icon nzType="setting" nzTheme="outline" class="text-2xl"></span>
        Settings
      </h1>
    </div>
    <div class="flex gap-0 border-b border-border mb-4">
      @if (permission.canRead('settings-general')) {
        <a routerLink="/settings/general"
           routerLinkActive="active-tab"
           style="color: var(--color-text)"
           class="px-4 py-2 text-sm transition-colors tab-link">
          <span nz-icon nzType="profile" nzTheme="outline" class="mr-1"></span>
          General
        </a>
      }
      @if (permission.canRead('settings-serial')) {
        <a routerLink="/settings/serial"
           routerLinkActive="active-tab"
           style="color: var(--color-text)"
           class="px-4 py-2 text-sm transition-colors tab-link">
          <span nz-icon nzType="number" nzTheme="outline" class="mr-1"></span>
          Serial Settings
        </a>
      }
      @if (permission.canRead('settings-pricing')) {
        <a routerLink="/settings/pricing-categories"
           routerLinkActive="active-tab"
           style="color: var(--color-text)"
           class="px-4 py-2 text-sm transition-colors tab-link">
          <span nz-icon nzType="percentage" nzTheme="outline" class="mr-1"></span>
          Pricing Categories
        </a>
      }
    </div>
    <router-outlet></router-outlet>
  `,
})
export class Settings {
  constructor(public permission: PermissionService) { }
}
