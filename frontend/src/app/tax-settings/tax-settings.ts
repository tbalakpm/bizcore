import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [
    CommonModule, RouterModule, NzIconModule
  ],
  template: `
  <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
  <h1 class="text-xl font-semibold flex items-center gap-2">
    <span nz-icon nzType="code-sandbox" nzTheme="outline" class="text-2xl"></span>
    Tax Engine
  </h1>
</div>

<div class="flex gap-0 border-b border-border mb-4">
  <!-- @if (permission.canRead('settings-general')) { -->
  <a
    [routerLink]="['./tax-rate']"
    routerLinkActive="active-tab"
    class="px-4 py-2 text-sm transition-colors tab-link text-text"
  >
    <span nz-icon nzType="profile" nzTheme="outline" class="mr-1"></span>
    Tax Rates
  </a>
  <!-- } -->
  <!-- @if (permission.canRead('settings-serial')) { -->
  <a
    [routerLink]="['./rule-group']"
    routerLinkActive="active-tab"
    class="px-4 py-2 text-sm transition-colors tab-link text-text"
  >
    <span nz-icon nzType="number" nzTheme="outline" class="mr-1"></span>
    Rule Groups
  </a>
  <!-- } -->
  <!-- @if (permission.canRead('settings-pricing')) { -->
  <a
    [routerLink]="['./tax-rules']"
    routerLinkActive="active-tab"
    class="px-4 py-2 text-sm transition-colors tab-link text-text"
  >
    <span nz-icon nzType="percentage" nzTheme="outline" class="mr-1"></span>
    Tax Rules
  </a>
  <!-- } -->
  <!-- @if (permission.canRead('settings-pricing')) { -->
  <a
    [routerLink]="['./states']"
    routerLinkActive="active-tab"
    class="px-4 py-2 text-sm transition-colors tab-link text-text"
  >
    <span nz-icon nzType="borderless-table" nzTheme="outline" class="mr-1"></span>
    States
  </a>
  <!-- } -->
</div>
<router-outlet></router-outlet>
`,
})
export class TaxSettings {


}
