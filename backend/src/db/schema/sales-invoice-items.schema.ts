import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { stockInvoices } from './stock-invoice.schema';
import { inventories } from './inventory.schema';

export const salesInvoiceItems = sqliteTable('stock_invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  invoiceId: integer('invoice_id')
    .references(() => stockInvoices.id)
    .notNull(),
  inventoryId: integer('inventory_id')
    .references(() => inventories.id)
    .notNull(),
  qty: numeric('qty'),
  unitPrice: numeric('unit_price'),
  discountBy: text('discount_by', { length: 20 }), // pct or amt
  discountPct: numeric('discount_pct'),
  discountAmount: numeric('discount_amount'),
  taxPct: numeric('tax_pct'),
  taxAmount: numeric('tax_amount'),
  lineTotal: numeric('line_total'),
});

export type SalesInvoiceItem = typeof salesInvoiceItems.$inferSelect;
export type NewSalesInvoiceItem = typeof salesInvoiceItems.$inferInsert;
