import { integer, numeric, sqliteTable } from 'drizzle-orm/sqlite-core';
import { stockInvoices } from './stock-invoice.schema';
import { inventories } from './inventory.schema';

export const stockInvoiceItems = sqliteTable('stock_invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  stockInvoiceId: integer('stock_invoice_id')
    .references(() => stockInvoices.id)
    .notNull(),
  inventoryId: integer('inventory_id')
    .references(() => inventories.id)
    .notNull(),
  qty: numeric('qty'),
  unitPrice: numeric('unit_price'),
  lineTotal: numeric('line_total')
});

export type StockInvoiceItem = typeof stockInvoiceItems.$inferSelect;
export type NewStockInvoiceItem = typeof stockInvoiceItems.$inferInsert;

/*
  Allow user to create product on the fly with GTN, HSN/SAC, Tax, etc.
  If product is created on the fly, then it should be added to the 'products' table
  If product is selected from the dropdown, then it should be created/updated in the 'inventories' table 
*/
