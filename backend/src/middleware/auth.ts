import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { JWT_SECRET } from '../config';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  //req.headers.get("Authorization") || req.headers.get("authorization");
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: req.i18n?.t('auth.required') });
  }

  const token = header.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const user = await db
      .select({
        id: users.id,
        username: users.username,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, parseInt(payload.sub!, 10)))
      .get();

    if (!user || !user.isActive) {
      return res.status(401).json({ error: req.i18n?.t('auth.invalid') });
    }

    req.user = user;

    next();
  } catch (err) {
    req.user = undefined;
    console.error(err);
    return res.status(401).json({ error: req.i18n?.t('auth.invalid') });
  }
}
