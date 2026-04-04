import { eq } from 'drizzle-orm';
import express from 'express';

import { db, settings } from '../db';

export const settingsRouter = express.Router();

settingsRouter.get('/', async (_req, res) => {
  const data = await db.select().from(settings).orderBy(settings.id).all();
  res.json({ data });
});

settingsRouter.get('/:key', async (req, res) => {
  const setting = await db.select().from(settings).where(eq(settings.key, req.params.key)).get();
  if (!setting) {
    return res.status(404).json({ error: 'Setting not found' });
  }

  return res.json(setting);
});

settingsRouter.put('/:key', async (req, res) => {

  const key = req.params.key;
  const { value } = req.body;

  const existing = await db.select().from(settings).where(eq(settings.key, key)).get();
  if (!existing) {
    const created = await db.insert(settings).values({ key, value }).returning().get();
    return res.status(201).json(created);
  }

  await db.update(settings).set({ value }).where(eq(settings.key, key)).run();
  const updated = await db.select().from(settings).where(eq(settings.key, key)).get();
  return res.json(updated);
});
