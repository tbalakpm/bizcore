import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { NewStockInvoiceItem, StockInvoiceItem } from './stock-invoice-items.schema';

export const stockInvoices = sqliteTable('stock_invoices', {
  id: integer('id')
    .primaryKey({ autoIncrement: true })
    .notNull(),

  invoiceNumber: text('invoice_number', { length: 20 })
    .notNull(),

  invoiceDate: text('invoice_date', { length: 20 })
    .notNull(),

  totalQty: real('total_qty')
    .notNull()
    .default(0.000),

  totalAmount: real('total_amount')
    .notNull()
    .default(0.00)
}, (t) => [
  uniqueIndex('stock_invoices_invoice_number_unique').on(t.invoiceNumber),
  index('stock_invoices_invoice_date_idx').on(t.invoiceDate)
]);

export type StockInvoice = typeof stockInvoices.$inferSelect;
export type NewStockInvoice = typeof stockInvoices.$inferInsert;
export type StockInvoiceWithItems = StockInvoice & { items: StockInvoiceItem[] };
export type NewStockInvoiceWithItems = NewStockInvoice & { items: NewStockInvoiceItem[] };
