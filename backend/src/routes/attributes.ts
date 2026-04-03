import { eq, sql } from 'drizzle-orm';
import express from 'express';
import { db, attributes } from '../db';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';

export const attributesRouter = express.Router();

attributesRouter.get('/', async (req, res) => {
  try {
    const data = await db.select().from(attributes).all();
    // Parse JSON fields
    const parsedData = data.map(item => ({
      ...item,
      options: item.options ? JSON.parse(item.options) : null,
      defaultValue: item.defaultValue ? JSON.parse(item.defaultValue) : null,
    }));
    res.json(parsedData);
  } catch (error) {
    LogService.error('Failed to fetch attributes', error);
    res.status(500).json({ error: 'Failed to fetch attributes' });
  }
});

attributesRouter.post('/', async (req, res) => {
  const { name, description, type, options, defaultValue, isActive } = req.body;
  try {
    const result = await db.insert(attributes).values({
      name,
      description,
      type,
      options: options ? JSON.stringify(options) : null,
      defaultValue: defaultValue ? JSON.stringify(defaultValue) : null,
      isActive: isActive !== false
    }).returning().get();
    
    const finalResult = {
        ...result,
        options: result.options ? JSON.parse(result.options) : null,
        defaultValue: result.defaultValue ? JSON.parse(result.defaultValue) : null,
    };

    await auditLog({
      action: 'CREATE_ATTRIBUTE',
      entity: 'ATTRIBUTE',
      entityId: result.id,
      newValue: finalResult,
    });
    
    res.status(201).json(finalResult);
  } catch (error) {
    LogService.error('Failed to create attribute', error);
    res.status(400).json({ error: 'Failed to create attribute' });
  }
});

attributesRouter.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { name, description, type, options, defaultValue, isActive } = req.body;
    try {
        const old = await db.select().from(attributes).where(eq(attributes.id, id)).get();
        if (!old) return res.status(404).json({ error: 'Attribute not found' });

        const result = await db.update(attributes).set({
            name,
            description,
            type,
            options: options ? JSON.stringify(options) : null,
            defaultValue: defaultValue ? JSON.stringify(defaultValue) : null,
            isActive: typeof isActive === 'boolean' ? isActive : old.isActive,
            updatedAt: sql`CURRENT_TIMESTAMP`
        }).where(eq(attributes.id, id)).returning().get();

        const finalResult = {
            ...result,
            options: result.options ? JSON.parse(result.options) : null,
            defaultValue: result.defaultValue ? JSON.parse(result.defaultValue) : null,
        };

        await auditLog({
            action: 'UPDATE_ATTRIBUTE',
            entity: 'ATTRIBUTE',
            entityId: id,
            oldValue: old,
            newValue: finalResult,
        });

        res.json(finalResult);
    } catch (error) {
        LogService.error('Failed to update attribute', error);
        res.status(400).json({ error: 'Failed to update attribute' });
    }
});

attributesRouter.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const old = await db.select().from(attributes).where(eq(attributes.id, id)).get();
        if (!old) return res.status(404).json({ error: 'Attribute not found' });

        await db.delete(attributes).where(eq(attributes.id, id)).run();

        await auditLog({
            action: 'DELETE_ATTRIBUTE',
            entity: 'ATTRIBUTE',
            entityId: id,
            oldValue: old,
        });

        res.status(204).send();
    } catch (error) {
        LogService.error('Failed to delete attribute', error);
        res.status(400).json({ error: 'Failed to delete attribute' });
    }
});
