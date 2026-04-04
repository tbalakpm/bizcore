import type { Request, Response, NextFunction } from 'express';
import { LogService } from '../core/logger/logger.service';

export function logger(req: Request, res: Response, next: NextFunction): void {
  try {
    const url = (Array.isArray(req.url) ? req.url.join(', ') : req.url);
    const startTime = Date.now();
    const method = req.method;
    const ip = req.ip || 'unknown';

    // Hook into response to capture size and timing
    const originalSend = res.send;
    res.send = function (data) {
      const responseSize = JSON.stringify(data || {}).length || 0;
      const timeTaken = Date.now() - startTime;
      const statusCode = res.statusCode;

      // const meta = { method, url, ip, statusCode, timeTaken, responseSize };
      const meta = { ip }

      if (statusCode >= 500) {
        LogService.error(`${method} ${url} - ${statusCode} [${timeTaken}ms, ${responseSize}B]`, undefined, meta);
      } else if (statusCode >= 400) {
        LogService.warn(`${method} ${url} - ${statusCode} [${timeTaken}ms, ${responseSize}B]`, meta);
      } else {
        LogService.info(`${method} ${url} - ${statusCode} [${timeTaken}ms, ${responseSize}B]`, meta);
      }

      return originalSend.call(this, data);
    };

    next();
  } catch (err) {
    const url = Array.isArray(req.url) ? req.url.join(', ') : req.url;
    LogService.error(`${req.method} ${url} – middleware error`, err);
    next();
  }
}
