import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PermissionService } from '../auth/permission.service';

@Component({
  selector: 'app-product-settings',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NzIconModule],
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
      <h1 class="text-xl font-semibold flex items-center gap-2">
        <span nz-icon nzType="appstore" nzTheme="outline" class="text-2xl"></span>
        Product Settings
      </h1>
    </div>
    <div class="flex gap-0 border-b border-border mb-4">
      @if (permission.canRead('categories')) {
        <a routerLink="/product-settings/categories"
           routerLinkActive="active-tab"
           style="color: var(--color-text)"
           class="px-4 py-2 text-sm transition-colors tab-link">
          <span nz-icon nzType="tags" nzTheme="outline" class="mr-1"></span>
          Categories
        </a>
      }
      @if (permission.canRead('settings-general')) {
        <a routerLink="/product-settings/brands"
            routerLinkActive="active-tab"
            style="color: var(--color-text)"
            class="px-4 py-2 text-sm transition-colors tab-link">
          <span nz-icon nzType="crown" nzTheme="outline" class="mr-1"></span>
          Brands
        </a>
      }
      @if (permission.canRead('settings-product-templates')) {
        <a routerLink="/product-settings/product-templates"
            routerLinkActive="active-tab"
            style="color: var(--color-text)"
            class="px-4 py-2 text-sm transition-colors tab-link">
          <span nz-icon nzType="layout" nzTheme="outline" class="mr-1"></span>
          Templates
        </a>
      }
      @if (permission.canRead('settings-attributes')) {
        <a routerLink="/product-settings/attributes"
            routerLinkActive="active-tab"
            style="color: var(--color-text)"
            class="px-4 py-2 text-sm transition-colors tab-link">
          <span nz-icon nzType="tag" nzTheme="outline" class="mr-1"></span>
          Attributes
        </a>
      }
    </div>
    <router-outlet></router-outlet>
  `,
})
export class ProductSettings {
  constructor(public permission: PermissionService) { }
}
