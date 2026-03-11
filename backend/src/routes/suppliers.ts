import { eq, sql } from 'drizzle-orm';
import express from 'express';

import { db, suppliers } from '../db';
import { parsePagination, toPagination } from '../utils/list-query.util';

export const suppliersRouter = express.Router();

suppliersRouter.get('/', async (req, res) => {
  const hasPaginationQuery =
    req.query.limit !== undefined ||
    req.query.offset !== undefined ||
    req.query.page !== undefined ||
    req.query.pageNum !== undefined;

  const pagination = hasPaginationQuery
    ? parsePagination({
        limit: req.query.limit as string | undefined,
        offset: req.query.offset as string | undefined,
        page: req.query.page as string | undefined,
        pageNum: req.query.pageNum as string | undefined,
      })
    : undefined;

  const baseQuery = db.select().from(suppliers).orderBy(suppliers.id);
  const data = pagination
    ? await baseQuery.limit(pagination.limit).offset(pagination.offset).all()
    : await baseQuery.all();

  const countResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(suppliers);
  const total = countResult[0].count;

  res.json({
    data,
    pagination: pagination
      ? toPagination(pagination.limit, pagination.offset, total, pagination.pageNum)
      : {
          limit: data.length,
          offset: 0,
          total,
          page: 1,
          totalPages: 1,
        },
  });
});

suppliersRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid supplier ID' });
  }

  const supplier = await db.select().from(suppliers).where(eq(suppliers.id, id)).get();
  if (!supplier) {
    return res.status(404).json({ error: 'Supplier not found' });
  }

  return res.json(supplier);
});

suppliersRouter.post('/', async (req, res) => {
  const { code, name, notes, gstin, billingAddressId, shippingAddressId, isActive } = req.body;
  if (!code || !name) {
    return res.status(400).json({ error: 'Code and name are required' });
  }

  const supplier = await db
    .insert(suppliers)
    .values({
      code,
      name,
      notes,
      gstin,
      billingAddressId,
      shippingAddressId,
      isActive: isActive !== false,
    })
    .returning()
    .get();

  return res.status(201).json(supplier);
});

suppliersRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid supplier ID' });
  }

  const supplier = await db.select().from(suppliers).where(eq(suppliers.id, id)).get();
  if (!supplier) {
    return res.status(404).json({ error: 'Supplier not found' });
  }

  const { code, name, notes, gstin, billingAddressId, shippingAddressId, isActive } = req.body;
  await db
    .update(suppliers)
    .set({
      code: code ?? supplier.code,
      name: name ?? supplier.name,
      notes: notes ?? supplier.notes,
      gstin: gstin ?? supplier.gstin,
      billingAddressId: billingAddressId ?? supplier.billingAddressId,
      shippingAddressId: shippingAddressId ?? supplier.shippingAddressId,
      isActive: typeof isActive === 'boolean' ? isActive : supplier.isActive,
    })
    .where(eq(suppliers.id, id))
    .run();

  const updated = await db.select().from(suppliers).where(eq(suppliers.id, id)).get();
  return res.json(updated);
});

suppliersRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid supplier ID' });
  }

  const supplier = await db.select({ id: suppliers.id }).from(suppliers).where(eq(suppliers.id, id)).get();
  if (!supplier) {
    return res.status(404).json({ error: 'Supplier not found' });
  }

  await db.delete(suppliers).where(eq(suppliers.id, id)).run();
  return res.status(204).send();
});
