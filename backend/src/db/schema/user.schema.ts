import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditFields } from './base';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    username: text('username', { length: 16 }).unique().notNull(),
    passwordHash: text('password_hash', { length: 255 }).notNull(),
    firstName: text('first_name', { length: 50 }),
    lastName: text('last_name', { length: 50 }),
    role: text('role', { length: 16 }).notNull().default('user'),
    ...auditFields,
  },
  (t) => [check('role_must_be_listed', sql`${t.role} IN ('user', 'manager', 'admin')`)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
