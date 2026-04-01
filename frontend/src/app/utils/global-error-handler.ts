import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '../shared/services/logger.service';

/**
 * GlobalErrorHandler replaces Angular's default ErrorHandler.
 * Uncaught errors from anywhere in the app are routed through
 * LoggerService, which forwards them to the backend log endpoint.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error('Uncaught Angular error', error, { source: 'GlobalErrorHandler' });
    // Re-throw so the browser still shows the error in dev tools
    console.error(message, error);
  }
}
