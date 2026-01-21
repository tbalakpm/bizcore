import express, { type Request, type Response } from 'express';
import { authRequired } from '../middleware/auth';
import { db } from '../db';
import { categories } from '../schema';
import { asc, desc, eq } from 'drizzle-orm';

export const categoriesRouter = express.Router();

categoriesRouter.use(authRequired);

categoriesRouter.get('/', async (req: Request, res: Response) => {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, req.user?.id!))
    .orderBy(desc(categories.type), asc(categories.name))
    .all();

  res.json(result);
});

categoriesRouter.post('/', async (req, res) => {
  const { name, description, type, isActive } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (!type) return res.status(400).json({ error: 'Type is required.' });
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  try {
    const category = await db
      .insert(categories)
      .values({
        name,
        description,
        type,
        isActive: isActive !== false,
        userId: req.user.id,
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

  const { name, description, type, isActive } = req.body;
  if (name !== undefined) category.name = name;
  if (type !== undefined) category.type = type;
  if (description !== undefined) category.description = description;
  if (typeof isActive === 'boolean') category.isActive = isActive;

  await db
    .update(categories)
    .set({
      name: category.name,
      description: category.description,
      type: category.type,
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
