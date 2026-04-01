import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { categories, db } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';

export const categoriesRouter = express.Router();

categoriesRouter.get('/', async (req: Request, res: Response) => {
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
        const column = categories[field];
        if (column) {
          filters.push(like(column, `%${req.query[field]}%`));
        }
      }
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === 'true';
      filters.push(eq(categories.isActive, isActive));
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

        const column = categories[field];
        if (column) {
          orderBy.push(dir(column));
        }
      }
    } else {
      orderBy.push(resolveSortDirection('desc')(categories.id));
    }

    // Build the query
    const baseQuery = db.select().from(categories);
    const query = filters.length > 0 ? baseQuery.where(and(...filters)) : baseQuery;

    // Get total count
    const countResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(categories);

    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const filteredCount = whereCondition
      ? (
          await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(categories)
            .where(whereCondition)
        )[0].count
      : countResult[0].count;

    // Get paginated results
    const orderedQuery = query.orderBy(...orderBy);
    const result = pagination
      ? await orderedQuery.limit(pagination.limit).offset(pagination.offset).all()
      : await orderedQuery.all();

    LogService.info('Fetched categories list', { count: result.length, total: filteredCount });
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
    LogService.error('Failed to fetch categories', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

categoriesRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  const category = await db.select().from(categories).where(eq(categories.id, id)).get();
  if (!category) {
    LogService.warn('Category not found', { categoryId: id });
    return res.status(404).json({
      error: req.i18n?.t('category.notFound') || 'Category not found',
    });
  }

  LogService.info('Fetched category details', { categoryId: id, categoryName: category.name });
  res.json(category);
});

categoriesRouter.post('/', async (req, res) => {
  const { code, name, description, isActive } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const category = await db
      .insert(categories)
      .values({
        code,
        name,
        description,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    await auditLog({
      action: 'CREATE_CATEGORY',
      entity: 'CATEGORY',
      entityId: category.id,
      newValue: category,
    });

    LogService.info('Category created successfully', { categoryId: category.id, categoryName: category.name });
    res.status(201).json(category);
  } catch (err) {
    LogService.error('Failed to create category', err, { code, name });
    res.status(400).json({
      error: req.i18n?.t('category.exists') || 'Category already exists',
    });
  }
});

categoriesRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const oldCategory = await db.select().from(categories).where(eq(categories.id, id)).get();
  if (!oldCategory) {
    LogService.warn('Category not found for update', { categoryId: id });
    return res.status(404).json({
      error: req.i18n?.t('category.notFound') || 'Category not found',
    });
  }

  const { code, name, description, isActive } = req.body;
  const updateData: any = {};
  if (code !== undefined) updateData.code = code;
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;

  await db
    .update(categories)
    .set(updateData)
    .where(eq(categories.id, id))
    .run();

  const updatedCategory = await db.select().from(categories).where(eq(categories.id, id)).get();

  await auditLog({
    action: 'UPDATE_CATEGORY',
    entity: 'CATEGORY',
    entityId: id,
    oldValue: oldCategory,
    newValue: updatedCategory,
  });

  LogService.info('Category updated successfully', { categoryId: id, categoryName: updatedCategory?.name });
  res.json(updatedCategory);
});

categoriesRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const category = await db.select().from(categories).where(eq(categories.id, id)).get();
  if (!category) {
    LogService.warn('Category not found for deletion', { categoryId: id });
    return res.status(404).json({
      error: req.i18n?.t('category.notFound') || 'Category not found',
    });
  }

  await db.delete(categories).where(eq(categories.id, id)).run();

  await auditLog({
    action: 'DELETE_CATEGORY',
    entity: 'CATEGORY',
    entityId: id,
    oldValue: category,
  });

  LogService.info('Category deleted successfully', { categoryId: id, categoryName: category.name });
  res.status(204).send();
});
