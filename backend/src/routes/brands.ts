import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { brands, db } from '../db';
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

    LogService.info('Fetched brands list', { count: result.length, total: filteredCount });
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

  LogService.info('Fetched brand details', { brandId: id, brandName: brand.name });
  res.json(brand);
});

brandsRouter.post('/', async (req, res) => {
  const { code, name, description, isActive } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const brand = await db
      .insert(brands)
      .values({
        code,
        name,
        description,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    await auditLog({
      action: 'CREATE_BRAND',
      entity: 'BRAND',
      entityId: brand.id,
      newValue: brand,
    });

    LogService.info('Brand created successfully', { brandId: brand.id, brandName: brand.name });
    res.status(201).json(brand);
  } catch (err) {
    LogService.error('Failed to create brand', err, { code, name });
    res.status(400).json({
      error: req.i18n?.t('brand.exists') || 'Brand already exists',
    });
  }
});

brandsRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const oldBrand = await db.select().from(brands).where(eq(brands.id, id)).get();
  if (!oldBrand) {
    LogService.warn('Brand not found for update', { brandId: id });
    return res.status(404).json({
      error: req.i18n?.t('brand.notFound') || 'Brand not found',
    });
  }

  const { code, name, description, isActive } = req.body;
  const updateData: any = {};
  if (code !== undefined) updateData.code = code;
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;

  await db
    .update(brands)
    .set(updateData)
    .where(eq(brands.id, id))
    .run();

  const updatedBrand = await db.select().from(brands).where(eq(brands.id, id)).get();

  await auditLog({
    action: 'UPDATE_BRAND',
    entity: 'BRAND',
    entityId: id,
    oldValue: oldBrand,
    newValue: updatedBrand,
  });

  LogService.info('Brand updated successfully', { brandId: id, brandName: updatedBrand?.name });
  res.json(updatedBrand);
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
