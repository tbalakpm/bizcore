import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import localeEnIn from '@angular/common/locales/en-IN';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth-interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import {
  LUCIDE_ICONS,
  LucideIconProvider,
  Pencil, Trash2, Printer, FileCheck, FilterX, Plus, ArrowLeft,
  Check, X, Save, ScanBarcode, Eye, Copy, ToggleLeft, ToggleRight,
} from 'lucide-angular';

const icons = {
  Pencil, Trash2, Printer, FileCheck, FilterX, Plus, ArrowLeft,
  Check, X, Save, ScanBarcode, Eye, Copy, ToggleLeft, ToggleRight,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json',
      }),
      fallbackLang: 'en',
      lang: 'en',
    }),
    { provide: LOCALE_ID, useValue: 'en-IN' },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideCharts(withDefaultRegisterables()),
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) },
  ],
};
