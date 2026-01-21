import bcrypt from 'bcryptjs';
import express, { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import seedCategoryData from '../seed/categories.json'; //with { type: "json" };
import { db } from '../db';
import { categories, NewCategory, users } from '../schema';
import { eq } from 'drizzle-orm';

export const authRouter = express.Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password || password.length < 4) {
    return res.status(400).json({ error: req.i18n?.t('user.invalid') });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).get();
  if (existing) {
    return res.status(400).json({ error: req.i18n?.t('user.exists') });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await db.insert(users).values({ username, passwordHash }).returning({ id: users.id }).get();

  // seed data
  await seedCategories(newUser.id);

  return res.status(201).json({ message: req.i18n?.t('user.created') });
});

authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user) return res.status(401).json({ error: req.i18n?.t('auth.invalid') });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: req.i18n?.t('auth.invalid') });

  const token = jwt.sign({ sub: user.id, username: user.username }, config.jwtSecret, { expiresIn: '7d' });

  return res.json({ token });
});

const seedCategories = async (userId: number) => {
  // console.log(seedCategoryData);
  const userCategories = seedCategoryData.categories.map((c: Partial<NewCategory>) => {
    c.userId = userId;
    return c;
  });

  await db.insert(categories).values(userCategories as NewCategory[]);
};
