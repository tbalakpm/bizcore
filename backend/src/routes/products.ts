import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { categories, db, products, productSerialNumbers, productBundles } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';

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
    const filterableFields = ['code', 'name', 'description', 'qtyPerUnit', 'hsnSac'] as const;
    const sortableFields = [
      'id',
      ...filterableFields,
      'categoryName',
      'unitPrice',
      // 'unitsInStock',
      'isActive',
      // 'createdAt',
      // 'updatedAt',
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
        gtnMode: products.gtnMode,
        gtnGeneration: products.gtnGeneration,
        useGlobal: products.useGlobal,
        //unitsInStock: products.unitsInStock,
        isActive: products.isActive,
        productType: products.productType,
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

    LogService.info('Fetched products list', { count: result.length, total: filteredCount });
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
    LogService.error('Failed to fetch products', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

productsRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const product = await db.select().from(products).where(eq(products.id, id)).get();
  if (!product) {
    LogService.warn('Product not found', { productId: id });
    return res.status(404).json({ error: req.i18n?.t('product.notFound') || 'Product not found' });
  }

  LogService.info('Fetched product details', { productId: id, productName: product.name });
  // Also fetch serial number config so the frontend can pre-populate gtnPrefix/gtnStartPos/gtnLength
  const serial = await db.select().from(productSerialNumbers).where(eq(productSerialNumbers.productId, id)).get();

  // Fetch bundle items if productType is 'bundle'
  let bundleItems: { id: number; productId: number; quantity: number }[] = [];
  if (product.productType === 'bundle') {
    bundleItems = await db.select({
      id: productBundles.id,
      productId: productBundles.productId,
      quantity: productBundles.quantity,
    })
      .from(productBundles)
      .where(eq(productBundles.bundleProductId, id))
      .all();
  }

  res.json({
    ...product,
    gtnPrefix: serial?.prefix ?? '',
    gtnStartPos: serial?.current ?? 1,
    gtnLength: serial?.length ?? 10,
    bundleItems,
  });
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
    gtnMode,
    gtnGeneration,
    gtnPrefix,
    gtnStartPos,
    gtnLength,
    useGlobal,
    isActive,
    productType,
    bundleItems, // Array of { productId, quantity }
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
        gtnMode: gtnMode as any,
        gtnGeneration: gtnGeneration as any,
        productType: (productType || 'simple') as any,
        useGlobal: useGlobal !== false,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    if (product.productType === 'bundle' && Array.isArray(bundleItems)) {
      for (const item of bundleItems) {
        await db.insert(productBundles).values({
          bundleProductId: product.id,
          productId: item.productId,
          quantity: item.quantity,
        }).run();
      }
    }

    if (gtnMode !== 'manual' && (gtnGeneration === 'batch' || gtnGeneration === 'tag')) {
      // Ensure starting pos is valid
      const nextPos = parseInt(gtnStartPos, 10);
      const startPos = Number.isNaN(nextPos) ? 1 : nextPos;

      await db.insert(productSerialNumbers).values({
        productId: product.id,
        prefix: gtnPrefix || '',
        current: startPos,
        length: parseInt(gtnLength, 10) || 10,
      }).run();
    }

    const finalSerial = await db.select().from(productSerialNumbers).where(eq(productSerialNumbers.productId, product.id)).get();
    const finalBundle = await db.select().from(productBundles).where(eq(productBundles.bundleProductId, product.id)).all();

    const fullProduct = { ...product, serial: finalSerial, bundleItems: finalBundle };

    await auditLog({
      action: 'CREATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: product.id,
      newValue: fullProduct,
    });

    LogService.info('Product created successfully', { productId: product.id, productName: product.name });
    res.status(201).json(product);
  } catch (err) {
    LogService.error('Failed to create product', err, { code, name });
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
    gtnMode,
    gtnGeneration,
    gtnPrefix,
    gtnStartPos,
    gtnLength,
    useGlobal,
    isActive,
    productType,
    bundleItems,
  } = req.body;

  const product = await db.select().from(products).where(eq(products.id, id)).get();
  if (!product) return res.status(404).json({ error: req.i18n?.t('product.notFound') || 'Product not found' });

  try {
    const oldSerial = await db.select().from(productSerialNumbers).where(eq(productSerialNumbers.productId, id)).get();
    const oldBundle = await db.select().from(productBundles).where(eq(productBundles.bundleProductId, id)).all();
    const oldProduct = { ...product, serial: oldSerial, bundleItems: oldBundle };

    // Update product entity
    const updateData: any = {};
    if (code) updateData.code = code;
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (categoryId) updateData.categoryId = categoryId;
    if (qtyPerUnit !== undefined) updateData.qtyPerUnit = qtyPerUnit;
    if (unitPrice !== undefined) updateData.unitPrice = unitPrice?.toString();
    if (hsnSac !== undefined) updateData.hsnSac = hsnSac;
    if (taxRate !== undefined) updateData.taxRate = taxRate?.toString();
    if (gtnMode !== undefined) updateData.gtnMode = gtnMode;
    if (gtnGeneration !== undefined) updateData.gtnGeneration = gtnGeneration;
    if (useGlobal !== undefined) updateData.useGlobal = useGlobal;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (productType) updateData.productType = productType;

    await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .run();

    if ((productType || product.productType) === 'bundle' && Array.isArray(bundleItems)) {
      await db.delete(productBundles).where(eq(productBundles.bundleProductId, id)).run();
      for (const item of bundleItems) {
        await db.insert(productBundles).values({
          bundleProductId: id,
          productId: item.productId,
          quantity: item.quantity,
        }).run();
      }
    } else if ((productType || product.productType) === 'simple') {
      await db.delete(productBundles).where(eq(productBundles.bundleProductId, id)).run();
    }

    const currentGtnMode = gtnMode !== undefined ? gtnMode : product.gtnMode;
    const currentGtnGeneration = gtnGeneration !== undefined ? gtnGeneration : product.gtnGeneration;

    if (currentGtnMode !== 'manual' && (currentGtnGeneration === 'batch' || currentGtnGeneration === 'tag')) {
      const nextPos = parseInt(gtnStartPos, 10);
      const startPos = Number.isNaN(nextPos) ? 1 : nextPos;

      const existingSerial = await db.select().from(productSerialNumbers).where(eq(productSerialNumbers.productId, id)).get();
      if (existingSerial) {
        await db.update(productSerialNumbers).set({
          prefix: gtnPrefix || '',
          current: startPos,
          length: parseInt(gtnLength, 10) || 10,
        }).where(eq(productSerialNumbers.id, existingSerial.id)).run();
      } else {
        await db.insert(productSerialNumbers).values({
          productId: id,
          prefix: gtnPrefix || '',
          current: startPos,
          length: parseInt(gtnLength, 10) || 10,
        }).run();
      }
    } else {
      await db.delete(productSerialNumbers).where(eq(productSerialNumbers.productId, id)).run();
    }

    const updatedProductEntity = await db.select().from(products).where(eq(products.id, id)).get();
    const updatedSerial = await db.select().from(productSerialNumbers).where(eq(productSerialNumbers.productId, id)).get();
    const updatedBundle = await db.select().from(productBundles).where(eq(productBundles.bundleProductId, id)).all();
    const updatedProduct = { ...updatedProductEntity, serial: updatedSerial, bundleItems: updatedBundle };

    await auditLog({
      action: 'UPDATE_PRODUCT',
      entity: 'PRODUCT',
      entityId: id,
      oldValue: oldProduct,
      newValue: updatedProduct,
    });

    LogService.info('Product updated successfully', { productId: id, productName: updatedProductEntity?.name });
    res.json(updatedProductEntity);
  } catch (err) {
    LogService.error('Failed to update product', err, { productId: id });
    res.status(400).json({ error: 'Failed to update product' });
  }
});

productsRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const product = await db.select().from(products).where(eq(products.id, id)).get();
  if (!product) {
    LogService.warn('Product not found for deletion', { productId: id });
    return res.status(404).json({ error: req.i18n?.t('product.notFound') || 'Product not found' });
  }

  const serial = await db.select().from(productSerialNumbers).where(eq(productSerialNumbers.productId, id)).get();
  const bundleItems = await db.select().from(productBundles).where(eq(productBundles.bundleProductId, id)).all();

  await db.delete(products).where(eq(products.id, id)).run();

  await auditLog({
    action: 'DELETE_PRODUCT',
    entity: 'PRODUCT',
    entityId: id,
    oldValue: { ...product, serial, bundleItems },
  });

  LogService.info('Product deleted successfully', { productId: id, productName: product.name });
  res.status(204).send();
});
