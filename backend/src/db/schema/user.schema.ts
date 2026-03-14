import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { auditFields } from './base';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    username: text('username', { length: 20 }).notNull(),
    passwordHash: text('password_hash', { length: 255 }).notNull(),
    firstName: text('first_name', { length: 50 }),
    lastName: text('last_name', { length: 50 }),
    role: text('role', { length: 20 }).notNull().default('user'),
    ...auditFields
  },
  (t) => [
    uniqueIndex('users_username_unique').on(t.username),
    check('role_must_be_in_list', sql`${t.role} IN ('user', 'manager', 'admin')`)
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Runtime column selection object for use with db.select()
export const userPublicSelect = {
  id: users.id,
  username: users.username,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
};
export type UserPublicSelect = typeof userPublicSelect;
