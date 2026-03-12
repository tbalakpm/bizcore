import { Component, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth/auth-service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, DatePipe],
  templateUrl: './app.html',
})
export class App implements OnDestroy {
  public auth = inject(AuthService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private langKey = 'current_lang';
  private themeKey = 'theme_mode';
  private mediaQuery: MediaQueryList | null = null;
  private systemThemeListener: ((event: MediaQueryListEvent) => void) | null = null;

  today = new Date();
  themeMode = signal<'system' | 'light' | 'dark'>('system');
  isDarkTheme = signal(false);
  currentMenu = signal<'main' | 'reports'>('main');

  isSidebarCollapsed = signal(false);
  sidebarWidth = signal(260);
  isResizing = signal(false);
  private readonly minSidebarWidth = 200;
  private readonly maxSidebarWidth = 400;
  private readonly sidebarStateKey = 'sidebar_state';

  protected readonly title = signal('BizCore');

  constructor() {
    this.translate.addLangs(['en', 'ta']);
    this.translate.setFallbackLang('en');

    const storedLang = sessionStorage.getItem(this.langKey) || 'en';
    this.translate.use(storedLang);
    this.initializeTheme();

    if (typeof window !== 'undefined') {
      const storedSidebar = localStorage.getItem(this.sidebarStateKey);
      if (storedSidebar) {
        try {
          const state = JSON.parse(storedSidebar);
          this.isSidebarCollapsed.set(state.collapsed ?? false);
          this.sidebarWidth.set(state.width ?? 260);
        } catch (e) {}
      }
    }
  }

  ngOnDestroy() {
    if (this.mediaQuery && this.systemThemeListener) {
      this.mediaQuery.removeEventListener('change', this.systemThemeListener);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  switchLang(lang: string) {
    this.translate.use(lang);
    sessionStorage.setItem(this.langKey, lang);
  }

  toggleTheme() {
    const nextTheme = this.isDarkTheme() ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  switchMenu(menu: 'main' | 'reports') {
    this.currentMenu.set(menu);
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
    this.saveSidebarState();
  }

  startResizing(event: MouseEvent) {
    if (this.isSidebarCollapsed()) return;
    this.isResizing.set(true);
    event.preventDefault(); // allow drag
    // Disable text selection during resize
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isResizing()) return;
    
    // Calculate new width based on mouse position
    let newWidth = event.clientX;
    if (newWidth < this.minSidebarWidth) newWidth = this.minSidebarWidth;
    if (newWidth > this.maxSidebarWidth) newWidth = this.maxSidebarWidth;
    
    this.sidebarWidth.set(newWidth);
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.isResizing()) {
      this.isResizing.set(false);
      this.saveSidebarState();
      document.body.style.userSelect = ''; // Re-enable text selection
    }
  }

  private saveSidebarState() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.sidebarStateKey, JSON.stringify({
        collapsed: this.isSidebarCollapsed(),
        width: this.sidebarWidth()
      }));
    }
  }

  private initializeTheme() {
    if (typeof window === 'undefined') {
      return;
    }

    const storedTheme = localStorage.getItem(this.themeKey);
    if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system') {
      this.themeMode.set(storedTheme);
    }

    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemThemeListener = (event: MediaQueryListEvent) => {
      if (this.themeMode() === 'system') {
        this.applyResolvedTheme(event.matches);
      }
    };

    this.mediaQuery.addEventListener('change', this.systemThemeListener);
    this.applyTheme();
  }

  private setTheme(mode: 'system' | 'light' | 'dark') {
    this.themeMode.set(mode);
    localStorage.setItem(this.themeKey, mode);
    this.applyTheme();
  }

  private applyTheme() {
    const resolvedDarkMode =
      this.themeMode() === 'dark' || (this.themeMode() === 'system' && this.mediaQuery?.matches);
    this.applyResolvedTheme(Boolean(resolvedDarkMode));
  }

  private applyResolvedTheme(isDark: boolean) {
    this.isDarkTheme.set(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }
}
