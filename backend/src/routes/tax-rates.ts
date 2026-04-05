import { eq, asc } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { taxRates, db, TaxRate } from '../db';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';
import { toNumber } from '../utils/number.util';

export const taxRatesRouter = express.Router();

taxRatesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(taxRates).orderBy(asc(taxRates.rate)).all();
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
  const { rate, cgstRate, sgstRate, igstRate, cessRate, cessAmount, effectiveFrom } = req.body;

  try {
    const inserted = await db
      .insert(taxRates)
      .values({
        rate: toNumber(rate),
        cgstRate: toNumber(cgstRate),
        sgstRate: toNumber(sgstRate),
        igstRate: toNumber(igstRate),
        cessRate: toNumber(cessRate),
        cessAmount: toNumber(cessAmount),
        effectiveFrom: effectiveFrom || new Date().toISOString().split('T')[0],
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

  const { rate, cgstRate, sgstRate, igstRate, cessRate, cessAmount, effectiveFrom } = req.body;
  const updateData: any = {};
  if (rate !== undefined) updateData.rate = toNumber(rate);
  if (cgstRate !== undefined) updateData.cgstRate = toNumber(cgstRate);
  if (sgstRate !== undefined) updateData.sgstRate = toNumber(sgstRate);
  if (igstRate !== undefined) updateData.igstRate = toNumber(igstRate);
  if (cessRate !== undefined) updateData.cessRate = toNumber(cessRate);
  if (cessAmount !== undefined) updateData.cessAmount = toNumber(cessAmount);
  if (effectiveFrom !== undefined) updateData.effectiveFrom = effectiveFrom;

  await db
    .update(taxRates)
    .set(updateData as TaxRate)
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
