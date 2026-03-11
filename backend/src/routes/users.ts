import bcrypt from 'bcryptjs';
import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { db, users } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { isStrongPassword } from '../utils/password.util';

export const usersRouter = express.Router();

const userPublicSelect = {
  id: users.id,
  username: users.username,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
  isActive: users.isActive,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

usersRouter.get('/', async (req: Request, res: Response) => {
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
    const filterableFields = ['username', 'firstName', 'lastName', 'role'] as const;
    const sortableFields = ['id', ...filterableFields, 'isActive', 'createdAt', 'updatedAt'] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    for (const field of filterableFields) {
      if (req.query[field]) {
        const column = users[field];
        if (column && 'name' in column) {
          filters.push(like(column, `%${req.query[field]}%`));
        }
      }
    }
    // Always filter only Active records along with any filter params
    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === 'true';
      filters.push(eq(users.isActive, isActive));
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

        const column = users[field];
        if (column) {
          orderBy.push(dir(column));
        }
      }
    } else {
      orderBy.push(resolveSortDirection('desc')(users.id));
    }

    // Build the query
    const baseQuery = db.select(userPublicSelect).from(users);
    const query = filters.length > 0 ? baseQuery.where(and(...filters)) : baseQuery;

    // Get total count
    const countResult = await db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users);

    const whereCondition = filters.length > 0 ? and(...filters) : undefined;
    const filteredCount = whereCondition
      ? (
          await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(users)
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
    console.error('Failed to fetch users');
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

usersRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const user = await db.select(userPublicSelect).from(users).where(eq(users.id, id)).get();
  if (!user) return res.status(404).json({ error: req.i18n?.t('user.notFound') });

  res.json(user);
});

usersRouter.post('/', async (req, res) => {
  const { username, password, firstName, lastName, role, isActive } = req.body;
  const pwd: string = password;

  if (!username) return res.status(400).json({ error: 'Name is required' });
  if (!pwd) return res.status(400).json({ error: 'Password is required' });
  if (!isStrongPassword(pwd)) {
    return res.status(400).json({ error: 'Password must be at least 8 chars with upper, lower and number' });
  }

  try {
    const user = await db
      .insert(users)
      .values({
        username,
        passwordHash: await bcrypt.hash(pwd, 10),
        firstName,
        lastName,
        role: role || 'user',
        isActive: isActive !== false,
      })
      .returning(userPublicSelect)
      .get();

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: req.i18n?.t('user.exists') });
  }
});

usersRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { username, firstName, lastName, role, isActive } = req.body;

  const user = await db.select(userPublicSelect).from(users).where(eq(users.id, id)).get();
  if (!user) return res.status(404).json({ error: req.i18n?.t('user.notFound') });

  if (username) user.username = username;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (role) user.role = role;
  if (typeof isActive === 'boolean') user.isActive = isActive;

  await db
    .update(users)
    .set({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    })
    .where(eq(users.id, id))
    .run();

  const updatedUser = await db.select(userPublicSelect).from(users).where(eq(users.id, id)).get();
  res.json(updatedUser);
});

usersRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const user = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).get();
  if (!user) return res.status(404).json({ error: req.i18n?.t('user.notFound') });

  await db.delete(users).where(eq(users.id, id)).run();
  res.status(204).send();
});
