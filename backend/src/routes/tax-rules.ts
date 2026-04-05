import { eq, asc } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { taxRules, taxRuleConditions, db } from '../db';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';
import { toNumber } from '../utils/number.util';
import { taxRuleEngine } from '../services/tax-rule-engine.service';

export const taxRulesRouter = express.Router();

taxRulesRouter.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const result = await taxRuleEngine.evaluate(req.body);
    res.json(result);
  } catch (error) {
    LogService.error('Failed to evaluate tax rule', error);
    res.status(500).json({ error: 'Failed to evaluate tax rule' });
  }
});

taxRulesRouter.post('/evaluate-bulk', async (req: Request, res: Response) => {
  try {
    const inputs = req.body as any[];
    const results = await Promise.all(inputs.map(input => taxRuleEngine.evaluate(input)));
    res.json(results);
  } catch (error) {
    LogService.error('Failed to evaluate tax rules bulk', error);
    res.status(500).json({ error: 'Failed to evaluate tax rules bulk' });
  }
});

taxRulesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(taxRules).orderBy(asc(taxRules.hsnCodeStartsWith), asc(taxRules.minPrice)).all();
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
  const { ruleGroupId, taxRateId, hsnCodeStartsWith, minPrice, maxPrice, isInterState, isIntraState, customerType, priority, effectiveFrom, effectiveTo, conditions } = req.body;

  try {
    const inserted = await db
      .transaction(async (tx) => {
        const rule = await tx
          .insert(taxRules)
          .values({
            ruleGroupId: toNumber(ruleGroupId),
            taxRateId: toNumber(taxRateId),
            hsnCodeStartsWith: hsnCodeStartsWith || '',
            minPrice: toNumber(minPrice),
            maxPrice: toNumber(maxPrice),
            isInterState: !!isInterState,
            isIntraState: !!isIntraState,
            customerType: customerType || 'retail',
            priority: toNumber(priority),
            effectiveFrom: effectiveFrom || new Date().toISOString().split('T')[0],
            effectiveTo: effectiveTo || null,
          })
          .returning()
          .get();

        if (Array.isArray(conditions) && conditions.length > 0) {
          for (const cond of conditions) {
            await tx.insert(taxRuleConditions).values({
              taxRuleId: rule.id,
              field: cond.field,
              operator: cond.operator,
              value: String(cond.value),
            }).run();
          }
        }
        return rule;
      });

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

  const { ruleGroupId, taxRateId, hsnCodeStartsWith, minPrice, maxPrice, isInterState, isIntraState, customerType, priority, effectiveFrom, effectiveTo, conditions } = req.body;
  
  try {
    const updated = await db.transaction(async (tx) => {
      const updateData: any = {};
      if (ruleGroupId !== undefined) updateData.ruleGroupId = toNumber(ruleGroupId);
      if (taxRateId !== undefined) updateData.taxRateId = toNumber(taxRateId);
      if (hsnCodeStartsWith !== undefined) updateData.hsnCodeStartsWith = hsnCodeStartsWith;
      if (minPrice !== undefined) updateData.minPrice = toNumber(minPrice);
      if (maxPrice !== undefined) updateData.maxPrice = toNumber(maxPrice);
      if (isInterState !== undefined) updateData.isInterState = !!isInterState;
      if (isIntraState !== undefined) updateData.isIntraState = !!isIntraState;
      if (customerType !== undefined) updateData.customerType = customerType;
      if (priority !== undefined) updateData.priority = toNumber(priority);
      if (effectiveFrom !== undefined) updateData.effectiveFrom = effectiveFrom;
      if (effectiveTo !== undefined) updateData.effectiveTo = effectiveTo;

      if (Object.keys(updateData).length > 0) {
        await tx
          .update(taxRules)
          .set(updateData)
          .where(eq(taxRules.id, id))
          .run();
      }

      if (conditions !== undefined && Array.isArray(conditions)) {
        // Simple sync: delete all and re-insert
        await tx.delete(taxRuleConditions).where(eq(taxRuleConditions.taxRuleId, id)).run();
        for (const cond of conditions) {
          await tx.insert(taxRuleConditions).values({
            taxRuleId: id,
            field: cond.field,
            operator: cond.operator,
            value: String(cond.value),
          }).run();
        }
      }

      return await tx.select().from(taxRules).where(eq(taxRules.id, id)).get();
    });

    await auditLog({
      action: 'UPDATE_TAX_RULE',
      entity: 'TAX_RULE',
      entityId: id,
      oldValue: oldTaxRule,
      newValue: updated,
    });

    LogService.info('Tax rule updated successfully', { taxRuleId: id });
    res.json(updated);
  } catch (err) {
    LogService.error('Failed to update tax rule', err);
    res.status(400).json({ error: 'Failed to update tax rule' });
  }
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
