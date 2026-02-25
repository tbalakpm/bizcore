import type { Request, Response, NextFunction } from 'express';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  err: '\x1b[31m', // Red
  gray: '\x1b[90m', // Gray
};

export function logger(req: Request, res: Response, next: NextFunction) {
  try {
    const url = (Array.isArray(req.url) ? req.url.join(', ') : req.url).padEnd(25, ' ').slice(0, 25);
    const startTime = Date.now();
    const method = req.method.padEnd(6, ' ');
    const ip = req.ip || 'unknown';

    // Hook into response to capture size and timing
    const originalSend = res.send;
    res.send = function (data) {
      const responseSize = JSON.stringify(data).length || 0;
      const timeTaken = Date.now() - startTime;
      const statusCode = res.statusCode;

      if (statusCode >= 500) {
        // Log server errors with ERR level
        console.error(
          `${colors.gray}[${new Date().toLocaleTimeString()}]${colors.reset} ${colors.err}[ERR ]${colors.reset} ${method} ${url} (IP: ${ip}) - Status: ${statusCode} - Time: ${timeTaken.toString().padStart(3, ' ')}ms - Response size: ${responseSize.toString().padStart(5, ' ')} bytes`,
        );
      } else if (statusCode >= 400 && statusCode < 500) {
        // Log client errors with WARN level
        console.warn(
          `${colors.gray}[${new Date().toLocaleTimeString()}]${colors.reset} ${colors.warn}[WARN]${colors.reset} ${method} ${url} (IP: ${ip}) - Status: ${statusCode} - Time: ${timeTaken.toString().padStart(3, ' ')}ms - Response size: ${responseSize.toString().padStart(5, ' ')} bytes`,
        );
      } else {
        // Log successful requests with INFO level
        console.log(
          `${colors.gray}[${new Date().toLocaleTimeString()}]${colors.reset} ${colors.info}[INFO]${colors.reset} ${method} ${url} (IP: ${ip}) - Status: ${statusCode} - Time: ${timeTaken.toString().padStart(3, ' ')}ms - Response size: ${responseSize.toString().padStart(5, ' ')} bytes`,
        );
      }
      // const logLevel = statusCode >= 400 && statusCode < 500 ? 'WARN' : 'INFO';
      // const levelColor = statusCode >= 400 && statusCode < 500 ? colors.warn : colors.info;

      // console.log(
      //   `${colors.gray}[${new Date().toLocaleTimeString()}]${colors.reset} ${levelColor}[${logLevel}]${colors.reset} ${method} ${url} (IP: ${ip}) - Status: ${statusCode} - Time: ${timeTaken.toString().padStart(3, ' ')}ms - Response size: ${responseSize.toString().padStart(5, ' ')} bytes`,
      // );

      return originalSend.call(this, data);
    };

    next();
  } catch (err) {
    const url = Array.isArray(req.url) ? req.url.join(', ') : req.url;
    console.log(
      `${colors.gray}[${new Date().toLocaleTimeString()}]${colors.reset} ${colors.err}[ERR ]${colors.reset} ${req.method} ${url} error occurred.\n`,
      err,
    );
    next();
  }
}
