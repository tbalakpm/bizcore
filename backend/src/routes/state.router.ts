import { eq, asc } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';
import { db, states } from '../db';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';

export const stateRouter = express.Router();

// Get all states
stateRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(states).orderBy(asc(states.stateName)).all();
    res.json({ data });
  } catch (error: any) {
    LogService.error('Failed to fetch states', error);
    res.status(500).json({ error: error.message });
  }
});

// Create state
stateRouter.post('/', async (req, res) => {
  try {
    const body = req.body;
    const inserted = await db.insert(states)
      .values({
        stateName: body.stateName,
        stateCode: body.stateCode,
        stateShortCode: body.stateShortCode,
        countryCode: body.countryCode || 'IN',
        isUnionTerritory: !!body.isUnionTerritory,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      })
      .returning()
      .get();
    
    await auditLog({
      action: 'CREATE_STATE',
      entity: 'STATE',
      entityId: inserted.id,
      newValue: inserted,
    });

    LogService.info('State created successfully', { stateId: inserted.id });
    res.status(201).json(inserted);
  } catch (error: any) {
    LogService.error('Failed to create state', error);
    res.status(400).json({ error: error.message });
  }
});

// Update state
stateRouter.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const oldRecord = await db.select().from(states).where(eq(states.id, id)).get();
    if (!oldRecord) {
      return res.status(404).json({ error: 'State not found' });
    }

    const body = req.body;
    await db.update(states)
      .set({
        stateName: body.stateName,
        stateCode: body.stateCode,
        stateShortCode: body.stateShortCode,
        countryCode: body.countryCode,
        isUnionTerritory: body.isUnionTerritory,
        isActive: body.isActive,
      })
      .where(eq(states.id, id))
      .run();

    const updated = await db.select().from(states).where(eq(states.id, id)).get();

    await auditLog({
      action: 'UPDATE_STATE',
      entity: 'STATE',
      entityId: id,
      oldValue: oldRecord,
      newValue: updated,
    });

    LogService.info('State updated successfully', { stateId: id });
    res.json(updated);
  } catch (error: any) {
    LogService.error('Failed to update state', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete state
stateRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const record = await db.select().from(states).where(eq(states.id, id)).get();
    if (!record) {
      return res.status(404).json({ error: 'State not found' });
    }
    
    await db.delete(states).where(eq(states.id, id)).run();

    await auditLog({
      action: 'DELETE_STATE',
      entity: 'STATE',
      entityId: id,
      oldValue: record,
    });

    LogService.info('State deleted successfully', { stateId: id });
    res.status(204).send();
  } catch (error: any) {
    LogService.error('Failed to delete state', error);
    res.status(400).json({ error: error.message });
  }
});

export default stateRouter;
