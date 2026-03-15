import { eq, sql, gt, and } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';
import { db, inventories, products } from '../db';

export const inventoriesRouter = express.Router();

inventoriesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;

    let totalCountQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(inventories)
      .innerJoin(products, eq(products.id, inventories.productId))
      .$dynamic();

    let dataQuery = db
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
      .$dynamic();

    const filters: any[] = [];
    if (req.query.inStock === 'true') {
      filters.push(gt(inventories.unitsInStock, 0));
    }
    if (q) {
      const searchPattern = `%${q}%`;
      filters.push(sql`(${inventories.gtn} LIKE ${searchPattern} OR ${products.name} LIKE ${searchPattern})`);
    }

    if (filters.length > 0) {
      totalCountQuery = totalCountQuery.where(and(...filters));
      dataQuery = dataQuery.where(and(...filters));
    }

    const [totalRes] = await totalCountQuery.execute();
    const data = await dataQuery
      .limit(limit)
      .offset(offset)
      .execute();

    const total = Number(totalRes?.count || 0);

    res.json({
      data,
      pagination: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch inventories', error);
    res.status(500).json({ error: 'Failed to fetch available stock' });
  }
});
