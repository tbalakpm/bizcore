import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { salesInvoices } from './sales-invoice.schema';
import { products } from './product.schema';

export const salesInvoiceItems = sqliteTable('sales_invoice_items', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  salesInvoiceId: integer('sales_invoice_id')
    .references(() => salesInvoices.id)
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id)
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
