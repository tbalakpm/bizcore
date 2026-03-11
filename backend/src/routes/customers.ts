import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { customers, db } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';

export const customersRouter = express.Router();

customersRouter.get('/', async (req: Request, res: Response) => {
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
    const filterableFields = ['code', 'name', 'type', 'notes'] as const;
    const sortableFields = ['id', ...filterableFields, 'isActive', 'createdAt', 'updatedAt'] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    for (const field of filterableFields) {
      if (req.query[field]) {
        const column = customers[field];
        if (column) {
          filters.push(like(column, `%${req.query[field]}%`));
        }
      }
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === 'true';
      filters.push(eq(customers.isActive, isActive));
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

        const column = customers[field];
        if (column) {
          orderBy.push(dir(column));
        }
      }
    } else {
      orderBy.push(resolveSortDirection('desc')(customers.id));
    }

    // Build the query
    const baseQuery = db.select().from(customers);
    const query = filters.length > 0 ? baseQuery.where(and(...filters)) : baseQuery;

    // Get total count
    const countResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(customers);

    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const filteredCount = whereCondition
      ? (
          await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(customers)
            .where(whereCondition)
        )[0].count
      : countResult[0].count;

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
    console.error('Failed to fetch customers');
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

customersRouter.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Invalid customer ID' });
  }

  const customer = await db.select().from(customers).where(eq(customers.id, id)).get();
  if (!customer) {
    return res.status(404).json({
      error: req.i18n?.t('customer.notFound') || 'Customer not found',
    });
  }

  res.json(customer);
});

customersRouter.post('/', async (req, res) => {
  const { code, name, type, notes, isActive } = req.body;

  if (!name) return res.status(400).json({ error: 'Name is required' });
  if (!code) return res.status(400).json({ error: 'Code is required' });

  try {
    const customer = await db
      .insert(customers)
      .values({
        code,
        name,
        type: type || 'retail',
        notes,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    res.status(201).json(customer);
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: req.i18n?.t('customer.exists') || 'Customer already exists',
    });
  }
});

customersRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id as string, 10);

  const customer = await db.select().from(customers).where(eq(customers.id, id)).get();
  if (!customer)
    return res.status(404).json({
      error: req.i18n?.t('customer.notFound') || 'Customer not found',
    });

  const { code, name, type, notes, isActive } = req.body;
  if (code !== undefined) customer.code = code;
  if (name !== undefined) customer.name = name;
  if (type !== undefined) customer.type = type;
  if (notes !== undefined) customer.notes = notes;
  if (typeof isActive === 'boolean') customer.isActive = isActive;

  await db
    .update(customers)
    .set({
      code: customer.code,
      name: customer.name,
      type: customer.type,
      notes: customer.notes,
      isActive: customer.isActive,
    })
    .where(eq(customers.id, id))
    .run();

  res.json(customer);
});

customersRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id as string, 10);

  const customer = await db.select({ id: customers.id }).from(customers).where(eq(customers.id, id)).get();
  if (!customer)
    return res.status(404).json({
      error: req.i18n?.t('customer.notFound') || 'Customer not found',
    });

  await db.delete(customers).where(eq(customers.id, id)).run();
  res.status(204).send();
});
