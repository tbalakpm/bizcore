import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { products } from './product.schema';

export const productSerialNumbers = sqliteTable(
  'product_serial_numbers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    key: text('key', { length: 100 }).notNull(),
    serialType: text('serial_type', { length: 20 }).notNull(),
    mode: text('mode', { length: 30 }).notNull().default('global_product_serial'),
    productId: integer('product_id').references(() => products.id),
    prefix: text('prefix', { length: 50 }).notNull().default(''),
    current: integer('current').notNull().default(1),
    length: integer('length').notNull().default(6),
  },
  (t) => [
    unique('product_serial_numbers_key_unique').on(t.key),
    index('product_serial_numbers_product_id').on(t.productId),
    check('product_serial_numbers_serial_type_check', sql`${t.serialType} IN ('tag_number', 'batch_number')`),
    check(
      'product_serial_numbers_mode_check',
      sql`${t.mode} IN ('global_product_serial', 'each_product', 'product_code_as_tag_batch')`,
    ),
  ],
);

export type ProductSerialNumber = typeof productSerialNumbers.$inferSelect;
export type NewProductSerialNumber = typeof productSerialNumbers.$inferInsert;
