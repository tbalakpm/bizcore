import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip intercepting translation file calls
  if (req.url.includes('/assets/i18n')) {
    return next(req);
  }

  const currentLang = inject(TranslateService).getCurrentLang();
  const token = inject(AuthService).token;
  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': currentLang || 'en',
    },
  });

  return next(cloned);
};
