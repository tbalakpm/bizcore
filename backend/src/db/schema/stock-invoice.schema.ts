import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const stockInvoices = sqliteTable('stock_invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  invoiceNumber: text('invoice_number', { length: 20 }).notNull(),
  invoiceDate: text('invoice_date', { length: 20 }).notNull(),
  totalQty: numeric('total_qty'),
  totalAmount: numeric('total_amount'),
});

export type StockInvoice = typeof stockInvoices.$inferSelect;
export type NewStockInvoice = typeof stockInvoices.$inferInsert;
