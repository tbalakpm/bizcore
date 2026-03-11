import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { categories, db, products } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';

export const productsRouter = express.Router();

productsRouter.get('/', async (req: Request, res: Response) => {
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

    // Build filters dynamically
    const filters: SQL[] = [];
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
          filters.push(like(column, `%${req.query[field]}%`));
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
    const orderBy: SQL[] = [];
    if (req.query.sort) {
      const sortParams = (req.query.sort as string).split(',');

      for (const param of sortParams) {
        const [field, direction] = param.split(':');
        const dir = resolveSortDirection(direction);

        if (!field || !isSortableField(field)) {
          continue;
        }

        // Handle categoryName sorting (from joined categories table)
        if (field === 'categoryName') {
          orderBy.push(dir(categories.name));
        } else {
          const column = products[field];
          if (column) {
            orderBy.push(dir(column));
          }
        }
      }
    } else {
      orderBy.push(resolveSortDirection('desc')(products.id));
    }

    // Build the query with join
    const baseQuery = db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        description: products.description,
        categoryId: products.categoryId,
        categoryName: categories.name,
        qtyPerUnit: products.qtyPerUnit,
        unitPrice: products.unitPrice,
        hsnSac: products.hsnSac,
        taxRate: products.taxRate,
        gtnGeneration: products.gtnGeneration,
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

    const query = allFilters.length > 0 ? baseQuery.where(and(...allFilters)) : baseQuery;

    // Get total count
    const countResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(products);

    // Build count query with same filters including categoryName
    const countQuery = db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId));

    const whereCondition = allFilters.length > 0 ? and(...allFilters) : undefined;
    const filteredCount = whereCondition ? (await countQuery.where(whereCondition))[0].count : countResult[0].count;

    // Get paginated results
    const orderedQuery = query.orderBy(...orderBy);
    const result = pagination
      ? await orderedQuery.limit(pagination.limit).offset(pagination.offset).all()
      : await orderedQuery.all();

    res.json({
      data: result,
      pagination: pagination
        ? toPagination(pagination.limit, pagination.offset, filteredCount, pagination.pageNum)
        : {
            limit: result.length,
            offset: 0,
            total: filteredCount,
            page: 1,
            totalPages: 1,
          },
    });
  } catch (error) {
    console.error('Failed to fetch products');
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
  const {
    code,
    name,
    description,
    categoryId,
    qtyPerUnit,
    unitPrice,
    hsnSac,
    taxRate,
    gtnGeneration,
    unitsInStock,
    isActive,
  } = req.body;

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
        hsnSac,
        taxRate: taxRate?.toString(),
        gtnGeneration,
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
  const {
    code,
    name,
    description,
    categoryId,
    qtyPerUnit,
    unitPrice,
    hsnSac,
    taxRate,
    gtnGeneration,
    unitsInStock,
    isActive,
  } = req.body;

  const product = await db.select().from(products).where(eq(products.id, id)).get();
  if (!product) return res.status(404).json({ error: req.i18n?.t('product.notFound') || 'Product not found' });

  if (code) product.code = code;
  if (name) product.name = name;
  if (description) product.description = description;
  if (categoryId) product.categoryId = categoryId;
  if (qtyPerUnit) product.qtyPerUnit = qtyPerUnit;
  if (unitPrice) product.unitPrice = unitPrice?.toString();
  if (hsnSac !== undefined) product.hsnSac = hsnSac;
  if (taxRate !== undefined) product.taxRate = taxRate?.toString();
  if (gtnGeneration !== undefined) product.gtnGeneration = gtnGeneration;
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
      hsnSac: product.hsnSac,
      taxRate: product.taxRate,
      gtnGeneration: product.gtnGeneration,
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
