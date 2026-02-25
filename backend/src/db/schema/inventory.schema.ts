import { index, integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { products } from './product.schema';

export const inventories = sqliteTable(
  'inventories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    productId: integer('product_id')
      .references(() => products.id)
      .notNull(),
    gtn: text('gtn', { length: 20 }),
    qtyPerUnit: text('qty_per_unit', { length: 20 }),
    hsnSac: text('hsn_sac', { length: 20 }),
    taxRate: numeric('tax_rate'),
    buyingPrice: numeric('buying_price'),
    sellingPrice: numeric('selling_price'),
    unitsInStock: integer('units_in_stock'),
    location: text('location', { length: 255 }),
  },
  (t) => [index('inventories_product_id').on(t.productId)],
);

export type Inventory = typeof inventories.$inferSelect;
export type NewInventory = typeof inventories.$inferInsert;
