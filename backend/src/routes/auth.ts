import crypto from 'node:crypto';
import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { and, eq, gt, isNull } from 'drizzle-orm';

import { config } from '../config';
import { db, refreshTokens, users } from '../db';
import { rateLimit } from '../middleware/rate-limit';
import { isStrongPassword } from '../utils/password.util';

export const authRouter = express.Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COOKIE_NAME = 'bc_rt';

/** SHA-256 hash of a raw token (hex string) */
function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Sign a short-lived access JWT */
function signAccessToken(user: { id: number; username: string; role: string; permissions: string | null }) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      permissions: JSON.parse(user.permissions || '{}'),
    },
    config.jwtSecret,
    { expiresIn: config.accessTokenExpirySeconds },
  );
}

/** Create a new DB refresh token record and return the raw value to set as cookie */
async function createRefreshToken(userId: number): Promise<string> {
  // Clean up old tokens for this user before creating a new one
  const now = new Date();
  const raw = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(now.getTime() + config.refreshTokenExpiryDays * 24 * 60 * 60 * 1000);

  await db.insert(refreshTokens).values({ userId, tokenHash, expiresAt });

  return raw;
}

/** Send the refresh token as an httpOnly cookie */
function setRefreshCookie(res: Response, raw: string) {
  res.cookie(COOKIE_NAME, raw, {
    httpOnly: true,
    secure: !config.isDevelopment,
    sameSite: 'lax',
    maxAge: config.refreshTokenExpiryDays * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

/** Clear the refresh token cookie */
function clearRefreshCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: req.i18n?.t('auth.invalid') });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 8 chars with upper, lower and number' });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).get();
  if (existing) {
    return res.status(400).json({ error: req.i18n?.t('user.exists') });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ username, passwordHash }).returning({ id: users.id }).get();

  return res.status(201).json({ message: req.i18n?.t('user.created') });
});

authRouter.post('/login', rateLimit({ windowMs: 60 * 1000, max: 10 }), async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      role: users.role,
      permissions: users.permissions,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user) return res.status(401).json({ error: req.i18n?.t('auth.invalid') });
  if (!user.isActive) return res.status(401).json({ error: req.i18n?.t('auth.invalid') });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: req.i18n?.t('auth.invalid') });

  const accessToken = signAccessToken(user);
  const rawRefreshToken = await createRefreshToken(user.id);

  setRefreshCookie(res, rawRefreshToken);

  return res.json({ token: accessToken });
});

/** Rotate refresh token: validate cookie → revoke old → issue new pair */
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const raw: string | undefined = req.cookies?.[COOKIE_NAME];

  if (!raw) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const tokenHash = hashToken(raw);
  const now = new Date();

  const record = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, now),
      ),
    )
    .get();

  if (!record) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: req.i18n?.t('auth.invalid') });
  }

  // Revoke the used token (rotation — one-time use)
  await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(eq(refreshTokens.id, record.id));

  // Load user
  const user = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      permissions: users.permissions,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, record.userId))
    .get();

  if (!user || !user.isActive) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: req.i18n?.t('auth.invalid') });
  }

  const accessToken = signAccessToken(user);
  const newRawRefreshToken = await createRefreshToken(user.id);

  setRefreshCookie(res, newRawRefreshToken);

  return res.json({ token: accessToken });
});

/** Revoke refresh token and clear cookie */
authRouter.post('/logout', async (req: Request, res: Response) => {
  const raw: string | undefined = req.cookies?.[COOKIE_NAME];

  if (raw) {
    const tokenHash = hashToken(raw);
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)));
  }

  clearRefreshCookie(res);
  return res.json({ message: 'Logged out' });
});
