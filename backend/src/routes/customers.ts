import express, { type Request, type Response } from 'express';
import { eq } from 'drizzle-orm';

import { db, customers } from '../db';

export const customersRouter = express.Router();

customersRouter.get('/', async (req: Request, res: Response) => {
  const result = await db.select().from(customers).all();

  res.json(result);
});

customersRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid customer ID' });
  }

  const customer = await db.select().from(customers).where(eq(customers.id, id)).get();
  if (!customer) {
    return res.status(404).json({ error: req.i18n?.t('customer.notFound') || 'Customer not found' });
  }

  res.json(customer);
});

customersRouter.post('/', async (req, res) => {
  const { code, name, type, notes, isActive } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!code) return res.status(400).json({ error: 'Code is required' });
  if (!req.user?.id) return res.status(401).json({ error: 'User not authenticated' });

  try {
    const customer = await db
      .insert(customers)
      .values({
        code,
        name,
        type: type || 'retail',
        notes,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: req.i18n?.t('customer.exists') || 'Customer already exists' });
  }
});

customersRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id as string, 10);

  const customer = await db.select().from(customers).where(eq(customers.id, id)).get();
  if (!customer) return res.status(404).json({ error: req.i18n?.t('customer.notFound') || 'Customer not found' });

  const { code, name, type, notes, isActive } = req.body;
  if (code !== undefined) customer.code = code;
  if (name !== undefined) customer.name = name;
  if (type !== undefined) customer.type = type;
  if (notes !== undefined) customer.notes = notes;
  if (typeof isActive === 'boolean') customer.isActive = isActive;

  await db
    .update(customers)
    .set({
      code: customer.code,
      name: customer.name,
      type: customer.type,
      notes: customer.notes,
      isActive: customer.isActive,
    })
    .where(eq(customers.id, id))
    .run();

  res.json(customer);
});

customersRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id as string, 10);

  const customer = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, id)).get();
  if (!customer) return res.status(404).json({ error: req.i18n?.t('customer.notFound') || 'Customer not found' });

  await db.delete(customers).where(eq(customers.id, id)).run();
  res.status(204).send();
});
