import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth/auth-service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, DatePipe],
  templateUrl: './app.html',
})
export class App {
  public auth = inject(AuthService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private langKey = 'current_lang';

  today = new Date();

  protected readonly title = signal('Personal Accountant');

  constructor() {
    this.translate.addLangs(['en', 'ta']);
    this.translate.setFallbackLang('en');

    const storedLang = localStorage.getItem(this.langKey) || 'en';
    this.translate.use(storedLang);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  switchLang(lang: string) {
    this.translate.use(lang);
    localStorage.setItem(this.langKey, lang);
  }
}
