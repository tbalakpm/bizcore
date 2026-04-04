import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { products } from './product.schema';
import { sql } from 'drizzle-orm';

export const inventories = sqliteTable(
  'inventories',
  {
    id: integer('id')
      .primaryKey({ autoIncrement: true })
      .notNull(),

    productId: integer('product_id')
      .references(() => products.id)
      .notNull(),

    gtn: text('gtn', { length: 25 })
      .notNull()
      .default(''),

    qtyPerUnit: text('qty_per_unit', { length: 25 })
      .notNull()
      .default('1'),

    hsnSac: text('hsn_sac', { length: 25 })
      .notNull()
      .default(''),

    taxRate: real('tax_rate')
      .notNull()
      .default(0),

    buyingPrice: real('buying_price')
      .notNull()
      .default(0.00),

    sellingPrice: real('selling_price')
      .notNull()
      .default(0.00),

    unitsInStock: integer('units_in_stock')
      .notNull()
      .default(0),

    location: text('location', { length: 255 })
      .notNull()
      .default(''),

    createdAt: text('created_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`),

    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
  },
  (t) => [
    uniqueIndex('inventories_gtn_unique').on(t.gtn),
    index('inventories_product_id_idx').on(t.productId),
  ]
);

export type Inventory = typeof inventories.$inferSelect;
export type NewInventory = typeof inventories.$inferInsert;
