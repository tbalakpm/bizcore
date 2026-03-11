import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';

import { config } from '../config';
import { db, users } from '../db';
import { rateLimit } from '../middleware/rate-limit';
import { isStrongPassword } from '../utils/password.util';

export const authRouter = express.Router();

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
    })
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user) return res.status(401).json({ error: req.i18n?.t('auth.invalid') });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: req.i18n?.t('auth.invalid') });

  const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, config.jwtSecret, {
    expiresIn: '7d',
  });

  return res.json({ token });
});

// const seedCategories = async (userId: number) => {
//   // console.log(seedCategoryData);
//   const userCategories = seedCategoryData.categories.map((c: Partial<NewCategory>) => {
//     c.userId = userId;
//     return c;
//   });

//   await db.insert(categories).values(userCategories as NewCategory[]);
// };
