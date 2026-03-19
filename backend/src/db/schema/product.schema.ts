import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, numeric, uniqueIndex, check, index } from 'drizzle-orm/sqlite-core';

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
    qtyPerUnit: text('qty_per_unit', { length: 25 }),
    unitPrice: numeric('unit_price'),
    hsnSac: text('hsn_sac', { length: 25 }),
    taxRate: numeric('tax_rate'),
    gtnMode: text('gtn_mode', { length: 25 }).notNull().default('auto'), // auto (default), manual
    gtnGeneration: text('gtn_generation', { length: 25 }).notNull().default('code'),  // code (default), batch, tag, manual
    gtnPrefix: text('gtn_prefix', { length: 50 }),
    gtnStartPos: integer('gtn_start_pos'),
    ...auditFields
  },
  (t) => [
    uniqueIndex('products_code_unique').on(t.code),
    uniqueIndex('products_name_unique').on(t.name),
    index('products_category_id_idx').on(t.categoryId),
    check('gtn_mode_must_be_in_list', sql`${t.gtnMode} IN ('auto','manual')`),
    check('gtn_generation_must_be_in_list', sql`${t.gtnGeneration} IN ('code','batch','tag','manual')`)
  ]
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

/*
gtnMode:
  if gtnMode == 'manual' then gtnGeneration can be 'manual'
  if gtnMode == 'auto' then gtnGeneration can be 'code','batch','tag'
gtnGeneration:
  if gtnGeneration == 'code' then use product code as gtn
  if gtnGeneration == 'batch' then generate gtn for each product as per configured in product_serial_numbers i.e. same gtn per LOT
  if gtnGeneration == 'tag' then generate gtn for each qty as per configured in product_serial_numbers i.e., unique gtn per item
  if gtnGeneration == 'manual' then get the input manually
*/
