import { and, eq, sql } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { taxRules, db } from '../db';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';
import { toNumber } from '../utils/number.util';

export const taxRulesRouter = express.Router();

taxRulesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(taxRules).all();
    LogService.info('Fetched tax rules list', { count: data.length });
    res.json({ data });
  } catch (error) {
    LogService.error('Failed to fetch tax rules', error);
    res.status(500).json({ error: 'Failed to fetch tax rules' });
  }
});

taxRulesRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid tax rule ID' });
  }

  const taxRule = await db.select().from(taxRules).where(eq(taxRules.id, id)).get();
  if (!taxRule) {
    LogService.warn('Tax rule not found', { taxRuleId: id });
    return res.status(404).json({ error: 'Tax rule not found' });
  }

  res.json(taxRule);
});

taxRulesRouter.post('/', async (req, res) => {
  const { hsnCodeStartsWith, minPrice, maxPrice, tax_rate, effective_from } = req.body;

  try {
    const inserted = await db
      .insert(taxRules)
      .values({
        hsnCodeStartsWith: hsnCodeStartsWith || '',
        minPrice: toNumber(minPrice),
        maxPrice: toNumber(maxPrice),
        tax_rate: toNumber(tax_rate),
        effective_from: effective_from || new Date().toISOString().split('T')[0],
      })
      .returning()
      .get();

    await auditLog({
      action: 'CREATE_TAX_RULE',
      entity: 'TAX_RULE',
      entityId: inserted.id,
      newValue: inserted,
    });

    LogService.info('Tax rule created successfully', { taxRuleId: inserted.id });
    res.status(201).json(inserted);
  } catch (err) {
    LogService.error('Failed to create tax rule', err);
    res.status(400).json({ error: 'Failed to create tax rule' });
  }
});

taxRulesRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const oldTaxRule = await db.select().from(taxRules).where(eq(taxRules.id, id)).get();
  if (!oldTaxRule) {
    return res.status(404).json({ error: 'Tax rule not found' });
  }

  const { hsnCodeStartsWith, minPrice, maxPrice, tax_rate, effective_from } = req.body;
  const updateData: any = {};
  if (hsnCodeStartsWith !== undefined) updateData.hsnCodeStartsWith = hsnCodeStartsWith;
  if (minPrice !== undefined) updateData.minPrice = toNumber(minPrice);
  if (maxPrice !== undefined) updateData.maxPrice = toNumber(maxPrice);
  if (tax_rate !== undefined) updateData.tax_rate = toNumber(tax_rate);
  if (effective_from !== undefined) updateData.effective_from = effective_from;

  await db
    .update(taxRules)
    .set(updateData)
    .where(eq(taxRules.id, id))
    .run();

  const updatedTaxRule = await db.select().from(taxRules).where(eq(taxRules.id, id)).get();

  await auditLog({
    action: 'UPDATE_TAX_RULE',
    entity: 'TAX_RULE',
    entityId: id,
    oldValue: oldTaxRule,
    newValue: updatedTaxRule,
  });

  LogService.info('Tax rule updated successfully', { taxRuleId: id });
  res.json(updatedTaxRule);
});

taxRulesRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const taxRule = await db.select().from(taxRules).where(eq(taxRules.id, id)).get();
  if (!taxRule) {
    return res.status(404).json({ error: 'Tax rule not found' });
  }

  await db.delete(taxRules).where(eq(taxRules.id, id)).run();

  await auditLog({
    action: 'DELETE_TAX_RULE',
    entity: 'TAX_RULE',
    entityId: id,
    oldValue: taxRule,
  });

  LogService.info('Tax rule deleted successfully', { taxRuleId: id });
  res.status(204).send();
});
