import { and, eq, like, sql, type SQL, inArray } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { brands, db, brandCategories } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';

export const brandsRouter = express.Router();

brandsRouter.get('/', async (req: Request, res: Response) => {
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
    const filterableFields = ['code', 'name', 'description'] as const;
    const sortableFields = ['id', ...filterableFields, 'isActive', 'createdAt', 'updatedAt'] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    for (const field of filterableFields) {
      if (req.query[field]) {
        const column = brands[field];
        if (column) {
          filters.push(like(column, `%${req.query[field]}%`));
        }
      }
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === 'true';
      filters.push(eq(brands.isActive, isActive));
    }

    // Filter by category
    if (req.query.categoryId) {
      const catId = parseInt(req.query.categoryId as string, 10);
      if (!Number.isNaN(catId)) {
        const brandIdsInCat = await db
          .select({ id: brandCategories.brandId })
          .from(brandCategories)
          .where(eq(brandCategories.categoryId, catId))
          .all();

        const ids = brandIdsInCat.map((b) => b.id);
        if (ids.length > 0) {
          filters.push(inArray(brands.id, ids));
        } else {
          // If no brands match the category, push a filter that returns nothing
          filters.push(eq(brands.id, -1));
        }
      }
    }

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

        const column = brands[field];
        if (column) {
          orderBy.push(dir(column));
        }
      }
    } else {
      orderBy.push(resolveSortDirection('desc')(brands.id));
    }

    // Build the query
    const baseQuery = db.select({
      id: brands.id,
      code: brands.code,
      name: brands.name,
      description: brands.description,
      
      isActive: brands.isActive,
      createdAt: brands.createdAt,
      updatedAt: brands.updatedAt
    }).from(brands);
    const query = filters.length > 0 ? baseQuery.where(and(...filters)) : baseQuery;

    // Get total count
    const countResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(brands);

    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const filteredCount = whereCondition
      ? (
          await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(brands)
            .where(whereCondition)
        )[0].count
      : countResult[0].count;

    // Get paginated results
    const orderedQuery = query.orderBy(...orderBy);
    const result = pagination
      ? await orderedQuery.limit(pagination.limit).offset(pagination.offset).all()
      : await orderedQuery.all();

    // Fetch mappings for the fetched brands
    const brandIds = result.map((b) => b.id);
    let brandsWithCats = result.map(b => ({ ...b, categoryIds: [] as number[] }));
    
    if (brandIds.length > 0) {
      const mappings = await db
        .select()
        .from(brandCategories)
        .where(inArray(brandCategories.brandId, brandIds))
        .all();
      
      brandsWithCats = result.map((b) => ({
        ...b,
        categoryIds: mappings
          .filter((m) => m.brandId === b.id)
          .map((m) => m.categoryId),
      }));
    }

    LogService.info('Fetched brands list', { count: brandsWithCats.length, total: filteredCount });
    res.json({
      data: brandsWithCats,
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
    LogService.error('Failed to fetch brands', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

brandsRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid brand ID' });
  }

  const brand = await db.select().from(brands).where(eq(brands.id, id)).get();
  if (!brand) {
    LogService.warn('Brand not found', { brandId: id });
    return res.status(404).json({
      error: req.i18n?.t('brand.notFound') || 'Brand not found',
    });
  }

  const brandCategoriesList = await db
    .select({ categoryId: brandCategories.categoryId })
    .from(brandCategories)
    .where(eq(brandCategories.brandId, id))
    .all();

  const categoryIds = brandCategoriesList.map((cb) => cb.categoryId);

  LogService.info('Fetched brand details', { brandId: id, brandName: brand.name, categoryIds });
  res.json({ ...brand, categoryIds });
});

brandsRouter.post('/', async (req, res) => {
  LogService.info('Creating brand', { body: req.body });
  const { code, name, description, isActive, categoryIds } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const result = await db.transaction(async (tx) => {
      const brand = await tx
        .insert(brands)
        .values({
          code,
          name,
          description,
          isActive: isActive !== false,
        })
        .returning()
        .get();

      if (categoryIds && Array.isArray(categoryIds)) {
        for (const catId of categoryIds) {
          await tx.insert(brandCategories).values({
            brandId: brand.id,
            categoryId: catId,
          }).run();
        }
      }

      return brand;
    });

    await auditLog({
      action: 'CREATE_BRAND',
      entity: 'BRAND',
      entityId: result.id,
      newValue: { ...result, categoryIds },
    });

    LogService.info('Brand created successfully', { brandId: result.id, brandName: result.name });
    res.status(201).json({ ...result, categoryIds });
  } catch (err) {
    LogService.error('Failed to create brand', err, { code, name });
    res.status(400).json({
      error: req.i18n?.t('brand.exists') || 'Brand already exists',
    });
  }
});

brandsRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  LogService.info('Updating brand', { brandId: id, body: req.body });

  const oldBrand = await db.select().from(brands).where(eq(brands.id, id)).get();
  if (!oldBrand) {
    LogService.warn('Brand not found for update', { brandId: id });
    return res.status(404).json({
      error: req.i18n?.t('brand.notFound') || 'Brand not found',
    });
  }

  const oldCategories = await db
    .select({ categoryId: brandCategories.categoryId })
    .from(brandCategories)
    .where(eq(brandCategories.brandId, id))
    .all();
  const oldCategoryIds = oldCategories.map((c) => c.categoryId);

  const { code, name, description, isActive, categoryIds } = req.body;
  const updateData: any = {};
  if (code !== undefined) updateData.code = code;
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;

  const result = await db.transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.update(brands).set(updateData).where(eq(brands.id, id)).run();
    }

    if (categoryIds !== undefined && Array.isArray(categoryIds)) {
      // Refresh categories
      await tx.delete(brandCategories).where(eq(brandCategories.brandId, id)).run();
      for (const catId of categoryIds) {
        await tx.insert(brandCategories).values({
          brandId: id,
          categoryId: catId,
        }).run();
      }
    }

    const updatedBrand = await tx.select().from(brands).where(eq(brands.id, id)).get();
    return updatedBrand;
  });

  await auditLog({
    action: 'UPDATE_BRAND',
    entity: 'BRAND',
    entityId: id,
    oldValue: { ...oldBrand, categoryIds: oldCategoryIds },
    newValue: { ...result, categoryIds },
  });

  LogService.info('Brand updated successfully', { brandId: id, brandName: result?.name });
  res.json({ ...result, categoryIds });
});

brandsRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const brand = await db.select().from(brands).where(eq(brands.id, id)).get();
  if (!brand) {
    LogService.warn('Brand not found for deletion', { brandId: id });
    return res.status(404).json({
      error: req.i18n?.t('brand.notFound') || 'Brand not found',
    });
  }

  await db.delete(brands).where(eq(brands.id, id)).run();

  await auditLog({
    action: 'DELETE_BRAND',
    entity: 'BRAND',
    entityId: id,
    oldValue: brand,
  });

  LogService.info('Brand deleted successfully', { brandId: id, brandName: brand.name });
  res.status(204).send();
});
