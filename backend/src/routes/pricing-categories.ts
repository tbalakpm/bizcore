import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { db } from '../db';
import { pricingCategories, pricingCategoryProducts, products } from '../db/schema';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { toNumber } from '../utils/number.util';

export const pricingCategoriesRouter = express.Router();

// GET /pricing-categories - list all with pagination
pricingCategoriesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const hasPaginationQuery =
      req.query.limit !== undefined ||
      req.query.offset !== undefined ||
      req.query.page !== undefined ||
      req.query.pageNum !== undefined;

    const pagination = hasPaginationQuery
      ? parsePagination({
        limit: req.query.limit as string | undefined,
        offset: req.query.offset as string | undefined,
        page: req.query.page as string | undefined,
        pageNum: req.query.pageNum as string | undefined,
      })
      : undefined;

    const filters: SQL[] = [];
    const filterableFields = ['code', 'name', 'description'] as const;
    const sortableFields = ['id', ...filterableFields, 'isActive', 'createdAt', 'updatedAt'] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    for (const field of filterableFields) {
      if (req.query[field]) {
        const column = pricingCategories[field];
        if (column) {
          filters.push(like(column, `%${req.query[field]}%`));
        }
      }
    }

    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === 'true';
      filters.push(eq(pricingCategories.isActive, isActive));
    }

    const orderBy: SQL[] = [];
    if (req.query.sort) {
      const sortParams = (req.query.sort as string).split(',');
      for (const param of sortParams) {
        const [field, direction] = param.split(':');
        const dir = resolveSortDirection(direction);
        if (!field || !isSortableField(field)) continue;
        const column = pricingCategories[field];
        if (column) orderBy.push(dir(column));
      }
    } else {
      orderBy.push(resolveSortDirection('asc')(pricingCategories.name));
    }

    const baseQuery = db.select().from(pricingCategories);
    const query = filters.length > 0 ? baseQuery.where(and(...filters)) : baseQuery;

    const countResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(pricingCategories);
    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const filteredCount = whereCondition
      ? (
        await db
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(pricingCategories)
          .where(whereCondition)
      )[0].count
      : countResult[0].count;

    const orderedQuery = query.orderBy(...orderBy);
    const result = pagination
      ? await orderedQuery.limit(pagination.limit).offset(pagination.offset).all()
      : await orderedQuery.all();

    res.json({
      data: result,
      pagination: pagination
        ? toPagination(pagination.limit, pagination.offset, filteredCount, pagination.pageNum)
        : { limit: result.length, offset: 0, total: filteredCount, page: 1, totalPages: 1 },
    });
  } catch (error) {
    console.error('Failed to fetch pricing categories', error);
    res.status(500).json({ error: 'Failed to fetch pricing categories' });
  }
});

// GET /pricing-categories/:id
pricingCategoriesRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid pricing category ID' });

  const category = await db.select().from(pricingCategories).where(eq(pricingCategories.id, id)).get();
  if (!category) return res.status(404).json({ error: 'Pricing category not found' });

  res.json(category);
});

// POST /pricing-categories
pricingCategoriesRouter.post('/', async (req, res) => {
  const { code, name, description, isActive } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const category = await db
      .insert(pricingCategories)
      .values({ code, name, description, isActive: isActive !== false })
      .returning()
      .get();
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Pricing category already exists or invalid data' });
  }
});

// PUT /pricing-categories/:id
pricingCategoriesRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const category = await db.select().from(pricingCategories).where(eq(pricingCategories.id, id)).get();
  if (!category) return res.status(404).json({ error: 'Pricing category not found' });

  const { code, name, description, isActive } = req.body;
  if (code !== undefined) category.code = code;
  if (name !== undefined) category.name = name;
  if (description !== undefined) category.description = description;
  if (typeof isActive === 'boolean') category.isActive = isActive;

  await db
    .update(pricingCategories)
    .set({ code: category.code, name: category.name, description: category.description, isActive: category.isActive })
    .where(eq(pricingCategories.id, id))
    .run();

  res.json(category);
});

// DELETE /pricing-categories/:id
pricingCategoriesRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const category = await db.select({ id: pricingCategories.id }).from(pricingCategories).where(eq(pricingCategories.id, id)).get();
  if (!category) return res.status(404).json({ error: 'Pricing category not found' });

  await db.delete(pricingCategories).where(eq(pricingCategories.id, id)).run();
  res.status(204).send();
});

// ── Product Margins Sub-resource ────────────────────────────────────────────

// GET /pricing-categories/:id/products - list all product margins for a category
pricingCategoriesRouter.get('/:id/products', async (req: Request, res: Response) => {
  const pricingCategoryId = parseInt(req.params['id'] as string, 10);
  if (Number.isNaN(pricingCategoryId)) return res.status(400).json({ error: 'Invalid pricing category ID' });

  const rows = await db
    .select({
      id: pricingCategoryProducts.id,
      pricingCategoryId: pricingCategoryProducts.pricingCategoryId,
      productId: pricingCategoryProducts.productId,
      productCode: products.code,
      productName: products.name,
      marginType: pricingCategoryProducts.marginType,
      marginPct: pricingCategoryProducts.marginPct,
      marginAmount: pricingCategoryProducts.marginAmount,
    })
    .from(pricingCategoryProducts)
    .leftJoin(products, eq(pricingCategoryProducts.productId, products.id))
    .where(eq(pricingCategoryProducts.pricingCategoryId, pricingCategoryId))
    .all();

  res.json(rows);
});

// PUT /pricing-categories/:id/products - bulk upsert product margins
pricingCategoriesRouter.put('/:id/products', async (req: Request, res: Response) => {
  const pricingCategoryId = parseInt(req.params['id'] as string, 10);
  if (Number.isNaN(pricingCategoryId)) return res.status(400).json({ error: 'Invalid pricing category ID' });

  const category = await db.select({ id: pricingCategories.id }).from(pricingCategories).where(eq(pricingCategories.id, pricingCategoryId)).get();
  if (!category) return res.status(404).json({ error: 'Pricing category not found' });

  const items: { productId: number; marginType: string; marginPct: string; marginAmount: string }[] = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Body must be an array of product margins' });

  // Delete existing margins for this category then re-insert
  await db.delete(pricingCategoryProducts).where(eq(pricingCategoryProducts.pricingCategoryId, pricingCategoryId)).run();

  if (items.length > 0) {
    await (db.insert(pricingCategoryProducts).values(
      items.map((item) => ({
        pricingCategoryId,
        productId: item.productId,
        marginType: (item.marginType || 'none') as any,
        marginPct: toNumber(item.marginPct) || 0,
        marginAmount: toNumber(item.marginAmount) || 0.00,
      }))
    ) as any).run();
  }

  res.json({ success: true });
});
