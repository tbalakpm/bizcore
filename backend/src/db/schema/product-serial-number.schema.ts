import { integer, sqliteTable, text, unique, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { products } from './product.schema';

export const productSerialNumbers = sqliteTable(
  'product_serial_numbers',
  {
    id: integer('id')
      .primaryKey({ autoIncrement: true })
      .notNull(),

    productId: integer('product_id')
      .notNull()
      .references(() => products.id),

    prefix: text('prefix', { length: 50 })
      .notNull()
      .default(''),

    current: integer('current')
      .notNull()
      .default(1),

    length: integer('length')
      .notNull()
      .default(10)
  },
  (t) => [
    uniqueIndex('product_serial_numbers_product_id_unique').on(t.productId)
  ],
);

export type ProductSerialNumber = typeof productSerialNumbers.$inferSelect;
export type NewProductSerialNumber = typeof productSerialNumbers.$inferInsert;

/*
 a. prefix: Combination of Alphabets and Special characters like hyphen(-), dot(.), colon(:), slash(/), underscore(_), backward slash(\), hash(#), pipe(|) are allowed
    e.g. AA-BB-CC-0000000001
    and more imporatantly alphabets should be incremented once numbers are reached maximum
    e.g. AA-BB-CC-9999999999 ==> AA-BB-CD-0000000001
    e.g. AA-BB-ZZ-9999999999 ==> AA-BC-AA-0000000001
    e.g. AA-ZZ-ZZ-9999999999 ==> AB-AA-AA-0000000001
 b. current: Numbers
 c. length: Numbers
*/
