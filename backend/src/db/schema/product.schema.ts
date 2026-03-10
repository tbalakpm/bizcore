import { integer, sqliteTable, text, numeric, unique } from 'drizzle-orm/sqlite-core';
import { categories } from './category.schema';
import { auditFields, keyFields } from './base';

export const products = sqliteTable(
  'products',
  {
    ...keyFields,
    description: text('description', { length: 255 }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    qtyPerUnit: text('qty_per_unit', { length: 20 }),
    unitPrice: numeric('unit_price'),
    hsnSac: text('hsn_sac', { length: 20 }),
    taxRate: numeric('tax_rate'),
    gtnGeneration: text('gtn_generation', { length: 20 }),
    // unitsInStock: integer('units_in_stock'),
    ...auditFields,
  },
  (t) => [unique('products_code_unique').on(t.code), unique('products_name_unique').on(t.name)],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
