import {
  type HttpErrorResponse,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from './auth-service';

/**
 * True while a token-refresh request is in-flight.
 * Module-level so the single flag is shared across all interceptor calls.
 */
let isRefreshing = false;

/**
 * Queues pending requests while a refresh is in-flight.
 * Emits the new access token once the refresh succeeds (or null on failure).
 */
const refreshToken$ = new BehaviorSubject<string | null>(null);

function addAuthHeaders(req: HttpRequest<unknown>, token: string | null, lang: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Accept-Language': lang || 'en',
    },
  });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  lang: string,
): ReturnType<HttpInterceptorFn> {
  if (isRefreshing) {
    // Wait for the ongoing refresh to complete then retry
    return refreshToken$.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((newToken) => next(addAuthHeaders(req, newToken, lang))),
    );
  }

  isRefreshing = true;
  refreshToken$.next(null);

  return auth.refreshToken().pipe(
    switchMap((res) => {
      isRefreshing = false;
      refreshToken$.next(res.token);
      return next(addAuthHeaders(req, res.token, lang));
    }),
    catchError((err) => {
      isRefreshing = false;
      // Refresh failed — force logout
      auth.logout();
      return throwError(() => err);
    }),
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip i18n asset calls
  if (req.url.includes('/assets/i18n')) {
    return next(req);
  }

  const auth = inject(AuthService);
  const lang = inject(TranslateService).getCurrentLang();

  // Skip adding token to auth endpoints (login, refresh, logout)
  const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)/.test(req.url);
  const cloned = isAuthEndpoint ? req : addAuthHeaders(req, auth.token, lang);

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      // Only attempt refresh on API 401s, never on auth endpoints themselves
      if (err.status === 401 && !isAuthEndpoint) {
        return handle401(req, next, auth, lang);
      }
      return throwError(() => err);
    }),
  );
};
