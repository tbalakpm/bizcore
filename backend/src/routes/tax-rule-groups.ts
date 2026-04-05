import { eq, asc, desc } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { taxRuleGroups, db } from '../db';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';
import { toNumber } from '../utils/number.util';

export const taxRuleGroupsRouter = express.Router();

taxRuleGroupsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(taxRuleGroups).orderBy(desc(taxRuleGroups.priority), asc(taxRuleGroups.name)).all();
    LogService.info('Fetched tax rule groups list', { count: data.length });
    res.json({ data });
  } catch (error) {
    LogService.error('Failed to fetch tax rule groups', error);
    res.status(500).json({ error: 'Failed to fetch tax rule groups' });
  }
});

taxRuleGroupsRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid tax rule group ID' });
  }

  const group = await db.select().from(taxRuleGroups).where(eq(taxRuleGroups.id, id)).get();
  if (!group) {
    LogService.warn('Tax rule group not found', { groupId: id });
    return res.status(404).json({ error: 'Tax rule group not found' });
  }

  res.json(group);
});

taxRuleGroupsRouter.post('/', async (req, res) => {
  const { name, priority, description } = req.body;

  try {
    const inserted = await db
      .insert(taxRuleGroups)
      .values({
        name,
        priority: toNumber(priority),
        description,
      })
      .returning()
      .get();

    await auditLog({
      action: 'CREATE_TAX_RULE_GROUP',
      entity: 'TAX_RULE_GROUP',
      entityId: inserted.id,
      newValue: inserted,
    });

    LogService.info('Tax rule group created successfully', { groupId: inserted.id });
    res.status(201).json(inserted);
  } catch (err) {
    LogService.error('Failed to create tax rule group', err);
    res.status(400).json({ error: 'Failed to create tax rule group' });
  }
});

taxRuleGroupsRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const oldGroup = await db.select().from(taxRuleGroups).where(eq(taxRuleGroups.id, id)).get();
  if (!oldGroup) {
    return res.status(404).json({ error: 'Tax rule group not found' });
  }

  const { name, priority, description } = req.body;
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (priority !== undefined) updateData.priority = toNumber(priority);
  if (description !== undefined) updateData.description = description;

  await db
    .update(taxRuleGroups)
    .set(updateData)
    .where(eq(taxRuleGroups.id, id))
    .run();

  const updatedGroup = await db.select().from(taxRuleGroups).where(eq(taxRuleGroups.id, id)).get();

  await auditLog({
    action: 'UPDATE_TAX_RULE_GROUP',
    entity: 'TAX_RULE_GROUP',
    entityId: id,
    oldValue: oldGroup,
    newValue: updatedGroup,
  });

  LogService.info('Tax rule group updated successfully', { groupId: id });
  res.json(updatedGroup);
});

taxRuleGroupsRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const group = await db.select().from(taxRuleGroups).where(eq(taxRuleGroups.id, id)).get();
  if (!group) {
    return res.status(404).json({ error: 'Tax rule group not found' });
  }

  await db.delete(taxRuleGroups).where(eq(taxRuleGroups.id, id)).run();

  await auditLog({
    action: 'DELETE_TAX_RULE_GROUP',
    entity: 'TAX_RULE_GROUP',
    entityId: id,
    oldValue: group,
  });

  LogService.info('Tax rule group deleted successfully', { groupId: id });
  res.status(204).send();
});
