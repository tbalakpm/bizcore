import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * LoggerService — centralised logging for the Angular frontend.
 *
 * - Always writes to the browser console.
 * - Sends WARN and ERROR entries to the backend `/api/logs` endpoint
 *   so they appear in the server-side structured log stream.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly apiUrl = `${environment.apiUrl}/logs`;
  private readonly isDev = !environment.production;

  constructor(private http: HttpClient) {}

  debug(message: string, data?: Record<string, unknown>): void {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, data ?? '');
    }
    // debug is not forwarded to the backend to avoid noise
  }

  info(message: string, data?: Record<string, unknown>): void {
    console.info(`[INFO] ${message}`, data ?? '');
    // info is not forwarded by default — uncomment if required
    // this.sendToBackend('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, data ?? '');
    this.sendToBackend('warn', message, data);
  }

  error(message: string, error?: unknown, data?: Record<string, unknown>): void {
    const errorData = this.serializeError(error);
    console.error(`[ERROR] ${message}`, error ?? '', data ?? '');
    this.sendToBackend('error', message, { ...errorData, ...(data ?? {}) });
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  private sendToBackend(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const entry: LogEntry = { level, message, data };
    this.http.post(this.apiUrl, entry).subscribe({
      error: (e) => {
        // Avoid infinite loop — only log to console
        console.warn('[LoggerService] Failed to send log to backend', e);
      },
    });
  }

  private serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
      return {
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
      };
    }
    if (error !== undefined && error !== null) {
      return { errorRaw: String(error) };
    }
    return {};
  }
}
