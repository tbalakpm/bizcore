import type { NextFunction, Request, Response } from 'express';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

type RateLimitOptions = {
  windowMs: number;
  max: number;
};

export const rateLimit = ({ windowMs, max }: RateLimitOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      return res.status(429).json({ error: req.i18n?.t('auth.tooManyRequests') || 'Too many requests' });
    }

    bucket.count += 1;
    buckets.set(key, bucket);
    return next();
  };
};
