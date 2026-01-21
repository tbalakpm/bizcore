import express, { type Request, type Response } from 'express';
import { authRequired } from '../middleware/auth';
import { getLocalYYYYMMDD, isValidDateString } from '../utils/datefns';
import { db } from '../db';
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { categories, entries, registers } from '../schema';

export const entryRouter = express.Router();
entryRouter.use(authRequired);

entryRouter.get('/', async (req: Request, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  let { startDate, endDate } = req.query;
  startDate = startDate as string | undefined;
  endDate = endDate as string | undefined;

  const today = new Date();
  const todayStr = getLocalYYYYMMDD(today);
  const monthStartStr = getLocalYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), 1));

  if (!startDate) startDate = monthStartStr;
  if (!endDate) endDate = todayStr;

  if (!isValidDateString(startDate as string) || !isValidDateString(endDate as string)) {
    return res.status(400).json({ error: req.i18n?.t('entry.invalidDate') });
  }

  const result = await db
    .select({
      id: entries.id,
      date: entries.date,
      amount: entries.amount,
      description: entries.description,
      registerId: entries.registerId,
      registerName: registers.name,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryType: categories.type,
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, req.user.id),
        gte(entries.date, startDate as string),
        lte(entries.date, endDate as string),
      ),
    )
    .innerJoin(registers, eq(entries.registerId, registers.id))
    .innerJoin(categories, eq(registers.categoryId, categories.id))
    .orderBy(asc(entries.date), desc(categories.type))
    .all();

  const totalIncome = result.filter((e) => e.categoryType === 'I').reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = result.filter((e) => e.categoryType !== 'I').reduce((sum, e) => sum + e.amount, 0);
  // const total = entries.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  res.json({ items: result, totalIncome, totalExpenses });
});

entryRouter.get('/:id', async (req: Request, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  const id = parseInt(req.params.id as string, 10);
  const entry = await db.select().from(entries).where(eq(entries.id, id)).get();
  if (!entry) return res.status(404).json({ error: req.i18n?.t('entry.notFound') });

  res.json(entry);
});

entryRouter.post('/', async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  let { date, amount, description, registerId } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required.' });
  }
  if (!date) {
    const todayStr = getLocalYYYYMMDD(new Date());
    date = todayStr;
  }
  if (!isValidDateString(date)) {
    return res.status(400).json({ error: req.i18n?.t('entry.invalidDate') });
  }

  const entry = await db
    .insert(entries)
    .values({
      date,
      amount,
      description,
      registerId,
      userId: req.user.id,
    })
    .returning()
    .get();

  res.status(201).json(entry);
});

entryRouter.put('/:id', async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  const id = parseInt(req.params.id, 10);
  const entry = await db.select().from(entries).where(eq(entries.id, id)).get();
  if (!entry) return res.status(404).json({ error: req.i18n?.t('entry.notFound') });

  const { date, amount, description, registerId } = req.body;

  if (date) {
    if (!isValidDateString(date)) {
      return res.status(400).json({ error: req.i18n?.t('entry.invalidDate') });
    }
    entry.date = date;
  }
  if (amount !== undefined) entry.amount = amount;
  if (description !== undefined) entry.description = description;
  if (registerId !== undefined) entry.registerId = registerId;

  await db
    .update(entries)
    .set({
      date: entry.date,
      amount: entry.amount,
      description: entry.description,
      registerId: entry.registerId,
    })
    .where(eq(entries.id, id))
    .run();

  res.json(entry);
});

entryRouter.delete('/:id', async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated.' });

  const id = parseInt(req.params.id, 10);
  const entry = await db.select({ id: entries.id }).from(entries).where(eq(entries.id, id)).get();
  if (!entry) return res.status(404).json({ error: req.i18n?.t('entry.notFound') });

  await db.delete(entries).where(eq(entries.id, id)).run();
  res.status(204).send();
});
