import { and, asc, desc, eq, like, sql } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { categories, db, products } from '../db';

export const productsRouter = express.Router();

productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Pagination
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 100);
    const offsetParam = req.query.offset as string | undefined;
    const pageParam = (req.query.pageNum ?? req.query.page) as string | undefined;

    const pageNumRaw = pageParam ? parseInt(pageParam, 10) : NaN;
    const pageNum = Number.isFinite(pageNumRaw) && pageNumRaw > 0 ? pageNumRaw : undefined;

    // Backward compatible:
    // - If `offset` is provided, use it.
    // - Else if `page`/`pageNum` is provided, convert to offset.
    const offset = offsetParam
      ? Math.max(parseInt(offsetParam, 10) || 0, 0)
      : Math.max(((pageNum ?? 1) - 1) * limit, 0);

    // Build filters dynamically
    const filters: any[] = [];
    const filterableFields = ['code', 'name', 'description', 'qtyPerUnit'] as const;
    const sortableFields = [
      'id',
      ...filterableFields,
      'categoryName',
      'unitPrice',
      // 'unitsInStock',
      'isActive',
      'createdAt',
      'updatedAt',
    ] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    for (const field of filterableFields) {
      if (req.query[field]) {
        const column = products[field];
        if (column) {
          filters.push(like(column as any, `%${req.query[field]}%`));
        }
      }
    }

    // Filter by categoryId (exact match)
    if (req.query.categoryId) {
      const categoryId = parseInt(req.query.categoryId as string, 10);
      if (!Number.isNaN(categoryId)) {
        filters.push(eq(products.categoryId, categoryId));
      }
    }

    // Filter by categoryName (partial match) - remove this from here
    // Will be added after the join is established

    // Filter by active status
    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === 'true';
      filters.push(eq(products.isActive, isActive));
    }

    // Filter by price range
    if (req.query.minPrice) {
      const minPrice = parseFloat(req.query.minPrice as string);
      if (!Number.isNaN(minPrice)) {
        filters.push(sql`CAST(${products.unitPrice} AS REAL) >= ${minPrice}`);
      }
    }

    if (req.query.maxPrice) {
      const maxPrice = parseFloat(req.query.maxPrice as string);
      if (!Number.isNaN(maxPrice)) {
        filters.push(sql`CAST(${products.unitPrice} AS REAL) <= ${maxPrice}`);
      }
    }

    // Filter by stock range
    // if (req.query.minStock) {
    //   const minStock = parseInt(req.query.minStock as string, 10);
    //   if (!Number.isNaN(minStock)) {
    //     filters.push(sql`${products.unitsInStock} >= ${minStock}`);
    //   }
    // }

    // if (req.query.maxStock) {
    //   const maxStock = parseInt(req.query.maxStock as string, 10);
    //   if (!Number.isNaN(maxStock)) {
    //     filters.push(sql`${products.unitsInStock} <= ${maxStock}`);
    //   }
    // }

    // Build sort dynamically
    const orderBy: any[] = [];
    if (req.query.sort) {
      const sortParams = (req.query.sort as string).split(',');
      console.log('Sort params:', sortParams);

      for (const param of sortParams) {
        const [field, direction] = param.split(':');
        const dir = direction?.toLowerCase() === 'desc' ? desc : asc;

        if (!field || !isSortableField(field)) {
          console.log(field, 'not sortable - available fields:', sortableFields);
          continue;
        }

        console.log('Processing sortable field:', field);

        // Handle categoryName sorting (from joined categories table)
        if (field === 'categoryName') {
          orderBy.push(dir(categories.name));
          console.log('Added to orderBy:', field, direction || 'asc');
        } else {
          const column = products[field];
          if (column) {
            orderBy.push(dir(column));
            console.log('Added to orderBy:', field, direction || 'asc');
          } else {
            console.log('Column not found for field:', field);
          }
        }
      }
    } else {
      orderBy.push(desc(products.id));
    }

    // Build the query with join
    let query = db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        description: products.description,
        categoryId: products.categoryId,
        categoryName: categories.name,
        qtyPerUnit: products.qtyPerUnit,
        unitPrice: products.unitPrice,
        //unitsInStock: products.unitsInStock,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId));

    // Add categoryName filter after join is established
    const allFilters = [...filters];
    if (req.query.categoryName) {
      allFilters.push(like(categories.name, `%${req.query.categoryName}%`));
    }

    if (allFilters.length > 0) {
      query = query.where(and(...allFilters)) as any;
    }

    // Get total count
    const countResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(products);

    // Build count query with same filters including categoryName
    let countQuery = db.select({ count: sql<number>`cast(count(*) as integer)` }).from(products);

    if (req.query.categoryName) {
      countQuery = countQuery.leftJoin(categories, eq(categories.id, products.categoryId)) as any;
    }

    const whereCondition = allFilters.length > 0 ? and(...allFilters) : undefined;
    const filteredCount = whereCondition
      ? (await (countQuery as any).where(whereCondition))[0].count
      : countResult[0].count;

    // Get paginated results
    const result = await (query as any)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset)
      .all();

    res.json({
      data: result,
      pagination: {
        limit,
        offset,
        total: filteredCount,
        page: pageNum ?? Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(filteredCount / limit),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

productsRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const product = await db.select().from(products).where(eq(products.id, id)).get();
  if (!product) return res.status(404).json({ error: req.i18n?.t('product.notFound') || 'Product not found' });

  res.json(product);
});

productsRouter.post('/', async (req, res) => {
  const { code, name, description, categoryId, qtyPerUnit, unitPrice, unitsInStock, isActive } = req.body;

  if (!code) return res.status(400).json({ error: 'Code is required' });
  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!categoryId) return res.status(400).json({ error: 'Category ID is required' });

  try {
    const product = await db
      .insert(products)
      .values({
        code,
        name,
        description,
        categoryId,
        qtyPerUnit,
        unitPrice: unitPrice?.toString(),
        //unitsInStock,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: req.i18n?.t('product.exists') || 'Product already exists',
    });
  }
});

productsRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { code, name, description, categoryId, qtyPerUnit, unitPrice, unitsInStock, isActive } = req.body;

  const product = await db.select().from(products).where(eq(products.id, id)).get();
  if (!product) return res.status(404).json({ error: req.i18n?.t('product.notFound') || 'Product not found' });

  if (code) product.code = code;
  if (name) product.name = name;
  if (description) product.description = description;
  if (categoryId) product.categoryId = categoryId;
  if (qtyPerUnit) product.qtyPerUnit = qtyPerUnit;
  if (unitPrice) product.unitPrice = unitPrice?.toString();
  // if (unitsInStock !== undefined) product.unitsInStock = unitsInStock;
  if (typeof isActive === 'boolean') product.isActive = isActive;

  await db
    .update(products)
    .set({
      code: product.code,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      qtyPerUnit: product.qtyPerUnit,
      unitPrice: product.unitPrice,
      // unitsInStock: product.unitsInStock,
      isActive: product.isActive,
    })
    .where(eq(products.id, id))
    .run();

  res.json(product);
});

productsRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const product = await db.select({ id: products.id }).from(products).where(eq(products.id, id)).get();
  if (!product) return res.status(404).json({ error: req.i18n?.t('product.notFound') || 'Product not found' });

  await db.delete(products).where(eq(products.id, id)).run();
  res.status(204).send();
});
