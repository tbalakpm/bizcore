import { eq } from 'drizzle-orm';
import express from 'express';

import { db, productSerialNumbers, serialNumbers } from '../db';
import { productSerialNumberService } from '../services/product-serial-number.service';
import { serialNumberService } from '../services/serial-number.service';

export const serialNumbersRouter = express.Router();

serialNumbersRouter.get('/invoice-configs', async (_req, res) => {
  const data = await db.select().from(serialNumbers).orderBy(serialNumbers.id).all();
  res.json({ data });
});

serialNumbersRouter.put('/invoice-configs/:key', async (req, res) => {
  const key = req.params.key;
  const { prefix, current, length } = req.body;

  const existing = await db.select().from(serialNumbers).where(eq(serialNumbers.key, key)).get();
  if (!existing) {
    const created = await db.insert(serialNumbers).values({ key, prefix, current, length }).returning().get();
    return res.status(201).json(created);
  }

  await db.update(serialNumbers).set({ prefix, current, length }).where(eq(serialNumbers.key, key)).run();
  const updated = await db.select().from(serialNumbers).where(eq(serialNumbers.key, key)).get();
  return res.json(updated);
});

serialNumbersRouter.get('/product-configs', async (_req, res) => {
  const data = await db.select().from(productSerialNumbers).orderBy(productSerialNumbers.id).all();
  res.json({ data });
});

serialNumbersRouter.post('/invoice/:type', async (req, res) => {
  const type = req.params.type as 'stockInvoice' | 'salesInvoice' | 'purchaseInvoice';

  if (!['stockInvoice', 'salesInvoice', 'purchaseInvoice'].includes(type)) {
    return res.status(400).json({ error: 'Invalid invoice serial type' });
  }

  const date = req.body?.date ? new Date(req.body.date) : new Date();
  const value = await serialNumberService.generateInvoiceNumber(type, undefined, date);
  return res.json({ value });
});

serialNumbersRouter.post('/product/:serialType', async (req, res) => {
  const serialType = req.params.serialType as 'code' | 'tag' | 'batch';
  const { productId, mode, date } = req.body;

  if (!productId || Number.isNaN(parseInt(productId, 10))) {
    return res.status(400).json({ error: 'productId is required' });
  }

  if (!Object.values(productSerialNumberService.modes).includes(mode)) {
    return res.status(400).json({ error: 'Invalid product serial mode' });
  }

  if (!Object.values(productSerialNumberService.serialTypes).includes(serialType)) {
    return res.status(400).json({ error: 'Invalid product serial type' });
  }

  const value = await productSerialNumberService.generate({
    productId: parseInt(productId, 10),
    mode,
    serialType,
    date: date ? new Date(date) : new Date(),
  });

  return res.json({ value });
});
