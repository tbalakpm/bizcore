import bcrypt from 'bcryptjs';
import { and, asc, desc, eq, like, sql } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { db, users } from '../db';

export const usersRouter = express.Router();

usersRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Pagination
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
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
    const filterableFields = ['username', 'firstName', 'lastName', 'role'] as const;
    const sortableFields = ['id', ...filterableFields, 'isActive', 'createdAt', 'updatedAt'] as const;
    type SortableField = (typeof sortableFields)[number];
    const isSortableField = (value: string): value is SortableField =>
      (sortableFields as readonly string[]).includes(value);

    for (const field of filterableFields) {
      if (req.query[field]) {
        const column = users[field];
        if (column && 'name' in column) {
          filters.push(like(column as any, `%${req.query[field]}%`));
        }
      }
    }
    // Always filter only Active records along with any filter params
    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === 'true';
      filters.push(eq(users.isActive, isActive));
    }

    // Build sort dynamically
    const orderBy: any[] = [];
    if (req.query.sort) {
      const sortParams = (req.query.sort as string).split(',');

      for (const param of sortParams) {
        const [field, direction] = param.split(':');
        const dir = direction?.toLowerCase() === 'desc' ? desc : asc;

        if (!field || !isSortableField(field)) {
          continue;
        }

        const column = users[field];
        if (column) {
          orderBy.push(dir(column));
        }
      }
    } else {
      orderBy.push(desc(users.id));
    }

    // Build the query
    let query = db.select().from(users);

    if (filters.length > 0) {
      query = query.where(and(...filters)) as any;
    }

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
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

usersRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const user = await db.select().from(users).where(eq(users.id, id)).get();
  if (!user) return res.status(404).json({ error: req.i18n?.t('user.notFound') });

  res.json(user);
});

usersRouter.post('/', async (req, res) => {
  const { username, password, firstName, lastName, role, isActive } = req.body;

  if (!username) return res.status(400).json({ error: 'Name is required' });
  if (!password) return res.status(400).json({ error: 'Password is required' });
  if (password.length < 4) {
    return res.status(400).json({ error: 'Password is less than 4 chars' });
  }

  try {
    const user = await db
      .insert(users)
      .values({
        username,
        passwordHash: await bcrypt.hash(password, 10),
        firstName,
        lastName,
        role,
        isActive: isActive !== false,
      })
      .returning()
      .get();

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: req.i18n?.t('user.exists') });
  }
});

usersRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { username, firstName, lastName, role, isActive } = req.body;

  const user = await db.select().from(users).where(eq(users.id, id)).get();
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

  res.json(user);
});

usersRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const user = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).get();
  if (!user) return res.status(404).json({ error: req.i18n?.t('user.notFound') });

  await db.delete(users).where(eq(users.id, id)).run();
  res.status(204).send();
});
