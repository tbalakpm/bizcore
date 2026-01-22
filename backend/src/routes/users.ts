import express, { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { asc, eq } from 'drizzle-orm';

import { db, users } from '../db';

export const usersRouter = express.Router();

usersRouter.get('/', async (_req: Request, res: Response) => {
  const result = await db.select().from(users);
  //.orderBy(asc(users.username)).all();

  res.json(result);
});

usersRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = await db.select().from(users).where(eq(users.id, id)).get();
  if (!user) return res.status(404).json({ error: req.i18n?.t('user.notFound') });
  res.json(user);
});

usersRouter.post('/', async (req, res) => {
  const { username, password, firstName, lastName, role, isActive } = req.body;

  if (!username) return res.status(400).json({ error: 'Name is required' });
  if (!password) return res.status(400).json({ error: 'Password is required' });
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password is less than 4 chars' });
  }

  try {
    const user = await db
      .insert(users)
      .values({
        username,
        passwordHash: await bcrypt.hash(password, 10),
        firstName,
        lastName,
        role,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: req.i18n?.t('user.exists') });
  }
});

usersRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { username, firstName, lastName, role, isActive } = req.body;

  const user = await db.select().from(users).where(eq(users.id, id)).get();
  if (!user) return res.status(404).json({ error: req.i18n?.t('user.notFound') });

  if (username) user.username = username;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (role) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;

  await db
    .update(users)
    .set({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    })
    .where(eq(users.id, id))
    .run();

  res.json(user);
});

usersRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const user = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).get();
  if (!user) return res.status(404).json({ error: req.i18n?.t('user.notFound') });

  await db.delete(users).where(eq(users.id, id)).run();
  res.status(204).send();
});
