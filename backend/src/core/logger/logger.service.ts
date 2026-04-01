import { logger } from './logger';
import { getContext } from './request-context';

/**
 * LogService - A static wrapper around the pino logger.
 * Automatically merges the current request context (requestId, userId)
 * into every log entry for traceability.
 */
export class LogService {
  static info(message: string, data: Record<string, unknown> = {}): void {
    logger.info({ ...getContext(), ...data }, message);
  }

  static warn(message: string, data: Record<string, unknown> = {}): void {
    logger.warn({ ...getContext(), ...data }, message);
  }

  static error(message: string, err?: unknown, data: Record<string, unknown> = {}): void {
    logger.error({ ...getContext(), err, ...data }, message);
  }

  static debug(message: string, data: Record<string, unknown> = {}): void {
    logger.debug({ ...getContext(), ...data }, message);
  }
}
