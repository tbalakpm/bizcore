import { eq, sql, gt } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';
import { db, inventories, products } from '../db';

export const inventoriesRouter = express.Router();

inventoriesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await db
      .select({
        id: inventories.id,
        productId: inventories.productId,
        gtn: inventories.gtn,
        unitsInStock: inventories.unitsInStock,
        location: inventories.location,
        code: products.code,
        name: products.name,
      })
      .from(inventories)
      .innerJoin(products, eq(products.id, inventories.productId))
      // .where(gt(inventories.unitsInStock, 0)) // Only fetch available inventory
      .all();

    res.json({ data, pagination: { total: data.length, limit: data.length, offset: 0, page: 1, totalPages: 1 } });
  } catch (error) {
    console.error('Failed to fetch inventories', error);
    res.status(500).json({ error: 'Failed to fetch available stock' });
  }
});
