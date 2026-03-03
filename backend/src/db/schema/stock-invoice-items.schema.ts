import { integer, numeric, sqliteTable } from 'drizzle-orm/sqlite-core';
import { stockInvoices } from './stock-invoice.schema';
import { inventories } from './inventory.schema';

export const stockInvoiceItems = sqliteTable('stock_invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  invoiceId: integer('invoice_id')
    .references(() => stockInvoices.id)
    .notNull(),
  inventoryId: integer('inventory_id')
    .references(() => inventories.id)
    .notNull(),
  qty: numeric('qty'),
  unitPrice: numeric('unit_price'),
  totalAmount: numeric('total_amount'),
});

export type StockInvoiceItem = typeof stockInvoiceItems.$inferSelect;
export type NewStockInvoiceItem = typeof stockInvoiceItems.$inferInsert;
