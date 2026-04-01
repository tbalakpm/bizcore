import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { config } from '../config';
import { db } from '../db';
import { users } from '../db';
import { eq } from 'drizzle-orm';
import { setUserId } from '../core/logger/request-context';
import { LogService } from '../core/logger/logger.service';

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  let token: string | undefined;

  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.slice(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    // Fallback to query parameter for file downloads
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: req.i18n?.t('auth.required') });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const user = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, parseInt(payload.sub!, 10)))
      .get();

    if (!user || !user.isActive) {
      return res.status(401).json({ error: req.i18n?.t('auth.invalid') });
    }

    req.user = user;
    setUserId(user.id);

    next();
  } catch (err) {
    req.user = undefined;
    LogService.error('Auth verification failed');
    return res.status(401).json({ error: req.i18n?.t('auth.invalid') });
  }
}

export function requireRole(...allowedRoles: Array<'user' | 'manager' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    if (!role || !allowedRoles.some((allowedRole) => allowedRole === role)) {
      return res.status(403).json({ error: req.i18n?.t('auth.forbidden') || 'Forbidden' });
    }

    next();
  };
}
