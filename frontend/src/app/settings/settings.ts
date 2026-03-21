import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';

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
      <a routerLink="/settings/pricing-categories"
         routerLinkActive="border-b-2 border-accent text-accent font-semibold"
         class="px-4 py-2 text-sm hover:text-accent transition-colors">
        <span nz-icon nzType="percentage" nzTheme="outline" class="mr-1"></span>
        Pricing Categories
      </a>
    </div>
    <router-outlet></router-outlet>
  `,
})
export class Settings {}
