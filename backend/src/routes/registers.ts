import express from 'express';
import { authRequired } from '../middleware/auth';
import { isValidDateString } from '../utils/datefns';
import { db } from '../db';
import { eq, asc } from 'drizzle-orm';
import { categories, registers } from '../schema';

export const registersRouter = express.Router();

registersRouter.use(authRequired);

registersRouter.get('/', async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  const result = await db
    .select({
      id: registers.id,
      name: registers.name,
      description: registers.description,
      amount: registers.amount,
      date: registers.date,
      categoryId: registers.categoryId,
      categoryName: categories.name,
      categoryType: categories.type,
      isActive: registers.isActive,
    })
    .from(registers)
    .leftJoin(categories, eq(registers.categoryId, categories.id))
    .where(eq(registers.userId, req.user.id))
    .orderBy(asc(registers.name))
    .all();

  res.json(result);
});

registersRouter.get('/:id', async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  const id = parseInt(req.params.id, 10);

  const register = await db
    .select({
      id: registers.id,
      name: registers.name,
      description: registers.description,
      amount: registers.amount,
      date: registers.date,
      categoryId: registers.categoryId,
      categoryName: categories.name,
      isActive: registers.isActive,
    })
    .from(registers)
    .leftJoin(categories, eq(registers.categoryId, categories.id))
    .where(eq(registers.id, id))
    .get();
  if (!register) return res.status(404).json({ error: req.i18n?.t('register.notFound') });

  res.json(register);
});

registersRouter.post('/', async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  const { name, description, amount, date, categoryId, isActive } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (!categoryId) return res.status(400).json({ error: 'Category is required.' });
  if (date && !isValidDateString(date)) {
    return res.status(400).json({ error: req.i18n?.t('register.invalidDate') });
  }

  try {
    const register = await db
      .insert(registers)
      .values({
        name,
        description,
        amount,
        date,
        categoryId,
        isActive: isActive !== false,
        userId: req.user.id,
      })
      .returning()
      .get();

    res.status(201).json(register);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: req.i18n?.t('register.exists') });
  }
});

registersRouter.put('/:id', async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  const id = parseInt(req.params.id, 10);

  const register = await db.select().from(registers).where(eq(registers.id, id)).get();
  if (!register) return res.status(404).json({ error: req.i18n?.t('register.notFound') });

  const { name, description, amount, date, categoryId, isActive } = req.body;
  if (name !== undefined) register.name = name;
  if (description !== undefined) register.description = description;
  if (amount !== undefined) register.amount = amount;
  if (date) {
    if (!isValidDateString(date)) {
      return res.status(400).json({ error: req.i18n?.t('register.invalidDate') });
    }
    register.date = date;
  }
  if (categoryId !== undefined) register.categoryId = categoryId;
  if (typeof isActive === 'boolean') register.isActive = isActive;

  await db
    .update(registers)
    .set({
      name: register.name,
      description: register.description,
      amount: register.amount,
      date: register.date,
      categoryId: register.categoryId,
      isActive: register.isActive,
    })
    .where(eq(registers.id, id))
    .run();

  res.json(register);
});

registersRouter.delete('/:id', async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  const id = parseInt(req.params.id, 10);
  const register = await db.select({ id: registers.id }).from(registers).where(eq(registers.id, id)).get();
  if (!register) return res.status(404).json({ error: req.i18n?.t('register.notFound') });

  await db.delete(registers).where(eq(registers.id, id)).run();
  res.status(204).send();
});
