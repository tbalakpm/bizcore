import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, numeric } from 'drizzle-orm/sqlite-core';
import { categories } from './category.schema';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  code: text('code', { length: 16 }).unique().notNull(),
  name: text('name', { length: 50 }).unique().notNull(),
  description: text('description', { length: 255 }),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  qtyPerUnit: text('qty_per_unit', { length: 20 }),
  unitPrice: numeric('unit_price'),
  unitsInStock: integer('units_in_stock'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
