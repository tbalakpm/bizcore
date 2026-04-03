import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, real, uniqueIndex, check, index } from 'drizzle-orm/sqlite-core';

import { categories } from './category.schema';
import { brands } from './brand.schema';
import { auditFields, keyFields } from './base';
import { productTemplates } from './product-template.schema';

export const products = sqliteTable(
  'products',
  {
    ...keyFields,

    description: text('description', { length: 255 }),

    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),

    brandId: integer('brand_id')
      .references(() => brands.id),

    productType: text("product_type", { length: 25, enum: ["simple", "bundle", "variant"] })
      .notNull()
      .default('simple'),

    parentId: integer('parent_id')
      .references((): any => products.id),

    templateId: integer('template_id')
      .references(() => productTemplates.id),

    qtyPerUnit: text('qty_per_unit', { length: 25 })
      .notNull()
      .default('1'),

    unitPrice: real('unit_price')
      .notNull()
      .default(0.00),

    hsnSac: text('hsn_sac', { length: 25 })
      .notNull()
      .default(''),

    taxRate: real('tax_rate')
      .notNull()
      .default(0.00),

    useGlobal: integer('use_global', { mode: 'boolean' })
      .notNull()
      .default(true), // true - use global settings from gtn key of serial_numbers table, false - use product specific settings

    trackBundleGtn: integer('track_bundle_gtn', { mode: 'boolean' })
      .default(true), // true - generate GTN for bundle, false - track bundle components

    gtnMode: text('gtn_mode', { length: 25, enum: ['global', 'auto', 'manual'] })
      .notNull()
      .default('global'), // global (default), auto, manual

    gtnGeneration: text('gtn_generation', { length: 25, enum: ['global', 'code', 'batch', 'tag', 'manual'] })
      .notNull()
      .default('global'),  // global (default), code, batch, tag, manual

    ...auditFields
  },
  (t) => [
    uniqueIndex('products_code_unique').on(t.code),

    uniqueIndex('products_name_unique').on(t.name),

    index('products_category_id_idx').on(t.categoryId),

    // check('gtn_mode_must_be_in_list', sql`${t.gtnMode} IN ('auto','manual')`),

    // check('gtn_generation_must_be_in_list', sql`${t.gtnGeneration} IN ('code','batch','tag','manual')`)
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
