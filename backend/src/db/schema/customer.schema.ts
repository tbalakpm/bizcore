import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const customers = sqliteTable(
  'customers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    code: text('code', { length: 16 }).unique().notNull(),
    name: text('name', { length: 50 }).unique().notNull(),
    type: text('type', { length: 16 }).notNull().default('retail'),
    notes: text('notes', { length: 255 }),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [check('type_must_be_listed', sql`${t.type} IN ('retail','wholesale')`)],
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
