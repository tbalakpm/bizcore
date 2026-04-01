import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncLocalStorage } from '../core/logger/request-context';

/**
 * Middleware that creates an AsyncLocalStorage context per request.
 * Populates requestId (from header or generated UUID) and userId from JWT auth.
 *
 * Must be registered BEFORE the main logger middleware.
 */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  const userId = req.user?.id ?? null;

  asyncLocalStorage.run({ requestId, userId }, () => next());
}
