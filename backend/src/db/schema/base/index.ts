import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';

export const keyFields = {
  id: integer('id')
    .primaryKey({ autoIncrement: true })
    .notNull(),

  code: text('code', { length: 20 })
    .notNull(),

  name: text('name', { length: 50 })
    .notNull(),
};

export const keyFieldsNoCode = {
  id: integer('id')
    .primaryKey({ autoIncrement: true })
    .notNull(),

  name: text('name', { length: 50 })
    .notNull(),
};

export const auditFields = {
  isActive: integer('is_active', { mode: 'boolean' })
    .notNull()
    .default(true),

  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),

  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
};
