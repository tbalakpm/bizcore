import { and, eq, sql } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { taxRates, db } from '../db';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';
import { toNumber } from '../utils/number.util';

export const taxRatesRouter = express.Router();

taxRatesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(taxRates).all();
    LogService.info('Fetched tax rates list', { count: data.length });
    res.json({ data });
  } catch (error) {
    LogService.error('Failed to fetch tax rates', error);
    res.status(500).json({ error: 'Failed to fetch tax rates' });
  }
});

taxRatesRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid tax rate ID' });
  }

  const taxRate = await db.select().from(taxRates).where(eq(taxRates.id, id)).get();
  if (!taxRate) {
    LogService.warn('Tax rate not found', { taxRateId: id });
    return res.status(404).json({ error: 'Tax rate not found' });
  }

  res.json(taxRate);
});

taxRatesRouter.post('/', async (req, res) => {
  const { rate, cgst_rate, sgst_rate, igst_rate, cess_rate, cess_amount, effective_from } = req.body;

  try {
    const inserted = await db
      .insert(taxRates)
      .values({
        rate: toNumber(rate),
        cgst_rate: toNumber(cgst_rate),
        sgst_rate: toNumber(sgst_rate),
        igst_rate: toNumber(igst_rate),
        cess_rate: toNumber(cess_rate),
        cess_amount: toNumber(cess_amount),
        effective_from: effective_from || new Date().toISOString().split('T')[0],
      })
      .returning()
      .get();

    await auditLog({
      action: 'CREATE_TAX_RATE',
      entity: 'TAX_RATE',
      entityId: inserted.id,
      newValue: inserted,
    });

    LogService.info('Tax rate created successfully', { taxRateId: inserted.id, rate: inserted.rate });
    res.status(201).json(inserted);
  } catch (err) {
    LogService.error('Failed to create tax rate', err);
    res.status(400).json({ error: 'Failed to create tax rate' });
  }
});

taxRatesRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const oldTaxRate = await db.select().from(taxRates).where(eq(taxRates.id, id)).get();
  if (!oldTaxRate) {
    return res.status(404).json({ error: 'Tax rate not found' });
  }

  const { rate, cgst_rate, sgst_rate, igst_rate, cess_rate, cess_amount, effective_from } = req.body;
  const updateData: any = {};
  if (rate !== undefined) updateData.rate = toNumber(rate);
  if (cgst_rate !== undefined) updateData.cgst_rate = toNumber(cgst_rate);
  if (sgst_rate !== undefined) updateData.sgst_rate = toNumber(sgst_rate);
  if (igst_rate !== undefined) updateData.igst_rate = toNumber(igst_rate);
  if (cess_rate !== undefined) updateData.cess_rate = toNumber(cess_rate);
  if (cess_amount !== undefined) updateData.cess_amount = toNumber(cess_amount);
  if (effective_from !== undefined) updateData.effective_from = effective_from;

  await db
    .update(taxRates)
    .set(updateData)
    .where(eq(taxRates.id, id))
    .run();

  const updatedTaxRate = await db.select().from(taxRates).where(eq(taxRates.id, id)).get();

  await auditLog({
    action: 'UPDATE_TAX_RATE',
    entity: 'TAX_RATE',
    entityId: id,
    oldValue: oldTaxRate,
    newValue: updatedTaxRate,
  });

  LogService.info('Tax rate updated successfully', { taxRateId: id });
  res.json(updatedTaxRate);
});

taxRatesRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const taxRate = await db.select().from(taxRates).where(eq(taxRates.id, id)).get();
  if (!taxRate) {
    return res.status(404).json({ error: 'Tax rate not found' });
  }

  await db.delete(taxRates).where(eq(taxRates.id, id)).run();

  await auditLog({
    action: 'DELETE_TAX_RATE',
    entity: 'TAX_RATE',
    entityId: id,
    oldValue: taxRate,
  });

  LogService.info('Tax rate deleted successfully', { taxRateId: id });
  res.status(204).send();
});
