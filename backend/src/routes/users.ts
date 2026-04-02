import bcrypt from 'bcryptjs';
import { and, eq, like, sql, type SQL } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';

import { db, users } from '../db';
import { parsePagination, resolveSortDirection, toPagination } from '../utils/list-query.util';
import { isStrongPassword } from '../utils/password.util';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';

export const usersRouter = express.Router();

const userPublicSelect = {
  id: users.id,
  username: users.username,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
  permissions: users.permissions,
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

    LogService.info('Fetched users list', { count: result.length, total: filteredCount });
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
    LogService.error('Failed to fetch users', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

usersRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  const user = await db.select(userPublicSelect).from(users).where(eq(users.id, id)).get();
  if (!user) {
    LogService.warn('User not found', { userId: id });
    return res.status(404).json({ error: req.i18n?.t('user.notFound') });
  }

  LogService.info('Fetched user details', { userId: id, username: user.username });
  res.json(user);
});

usersRouter.post('/', async (req, res) => {
  const { username, password, firstName, lastName, role, isActive, permissions } = req.body;
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
        permissions: permissions ? JSON.stringify(permissions) : '{}',
      })
      .returning(userPublicSelect)
      .get();

    await auditLog({
      action: 'CREATE_USER',
      entity: 'USER',
      entityId: user.id,
      newValue: user,
    });

    LogService.info('User created successfully', { userId: user.id, username: user.username });
    res.status(201).json(user);
  } catch (err) {
    LogService.warn('Failed to create user - likely already exists', { username });
    res.status(400).json({ error: req.i18n?.t('user.exists') });
  }
});

usersRouter.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { username, firstName, lastName, role, isActive, permissions } = req.body;

  const oldUser = await db.select(userPublicSelect).from(users).where(eq(users.id, id)).get();
  if (!oldUser) {
    LogService.warn('User not found for update', { userId: id });
    return res.status(404).json({ error: req.i18n?.t('user.notFound') });
  }

  const updateData: any = {};
  if (username) updateData.username = username;
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (role) updateData.role = role;
  if (typeof isActive === 'boolean') updateData.isActive = isActive;
  if (permissions) updateData.permissions = JSON.stringify(permissions);

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .run();

  const updatedUser = await db.select(userPublicSelect).from(users).where(eq(users.id, id)).get();

  await auditLog({
    action: 'UPDATE_USER',
    entity: 'USER',
    entityId: id,
    oldValue: oldUser,
    newValue: updatedUser,
  });

  LogService.info('User updated successfully', { userId: id, username: updatedUser?.username });
  res.json(updatedUser);
});

usersRouter.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const user = await db.select(userPublicSelect).from(users).where(eq(users.id, id)).get();
  if (!user) {
    LogService.warn('User not found for deletion', { userId: id });
    return res.status(404).json({ error: req.i18n?.t('user.notFound') });
  }

  await db.delete(users).where(eq(users.id, id)).run();

  await auditLog({
    action: 'DELETE_USER',
    entity: 'USER',
    entityId: id,
    oldValue: user,
  });

  LogService.info('User deleted successfully', { userId: id, username: user.username });
  res.status(204).send();
});

usersRouter.post('/:id/reset-password', async (req: Request, res: Response) => {
  const idStr = req.params.id as string;
  const id = parseInt(idStr, 10);
  const { newPassword } = req.body;

  if (!newPassword || !isStrongPassword(newPassword)) {
    return res.status(400).json({ error: 'New password is too weak' });
  }

  const user = await db.select().from(users).where(eq(users.id, id)).get();
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: true })
    .where(eq(users.id, id))
    .run();

  await auditLog({
    action: 'RESET_PASSWORD',
    entity: 'USER',
    entityId: id,
  });

  LogService.info('User password reset by admin', { userId: id });
  res.json({ message: 'Password reset successful. User must change it on next login.' });
});
