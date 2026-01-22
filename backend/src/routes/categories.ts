import express, { type Request, type Response } from 'express';
import { asc, eq } from 'drizzle-orm';

import { db, categories } from '../db';

export const categoriesRouter = express.Router();

categoriesRouter.get('/', async (req: Request, res: Response) => {
  const result = await db
    .select()
    .from(categories)
    // .where(eq(categories.userId, req.user?.id!))
    .orderBy(asc(categories.name))
    .all();

  res.json(result);
});

categoriesRouter.post('/', async (req, res) => {
  const { code, name, description, isActive } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!code) return res.status(400).json({ error: 'Code is required' });
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated' });

  try {
    const category = await db
      .insert(categories)
      .values({
        code,
        name,
        description,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: req.i18n?.t('category.exists') });
  }
});

categoriesRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const category = await db.select().from(categories).where(eq(categories.id, id)).get();
  if (!category) return res.status(404).json({ error: req.i18n?.t('category.notFound') });

  const { code, name, description, type, isActive } = req.body;
  if (code !== undefined) category.code = code;
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (typeof isActive === 'boolean') category.isActive = isActive;

  await db
    .update(categories)
    .set({
      code: category.code,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
    })
    .where(eq(categories.id, id))
    .run();

  res.json(category);
});

categoriesRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const category = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).get();
  if (!category) return res.status(404).json({ error: req.i18n?.t('category.notFound') });

  await db.delete(categories).where(eq(categories.id, id)).run();
  res.status(204).send();
});
