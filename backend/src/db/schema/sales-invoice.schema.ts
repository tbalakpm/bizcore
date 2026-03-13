import { SQL, sql } from 'drizzle-orm';
import { index, integer, numeric, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { customers } from './customer.schema';
import type { NewSalesInvoiceItem, SalesInvoiceItem } from './sales-invoice-items.schema';

export const salesInvoices = sqliteTable('sales_invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  invoiceNumber: text('invoice_number', { length: 25 }).notNull(),
  invoiceDate: text('invoice_date', { length: 25 }).notNull(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id),
  refNumber: text('ref_number', { length: 25 }),
  refDate: text('ref_date', { length: 25 }),
  totalQty: numeric('total_qty').notNull().default('0.000'),
  subtotal: numeric('subtotal').notNull().default('0.00'),
  discountType: text('discount_type', { length: 20 }).notNull().default('none'), // none, percent, amount
  discountPct: numeric('discount_pct').notNull().default('0.00'),
  discountAmount: numeric('discount_amount').notNull().default('0.00'),
  taxPct: numeric('tax_pct').notNull().default('0.00'),
  taxAmount: numeric('tax_amount').generatedAlwaysAs(
    (): SQL => sql`(ROUND((subtotal - discount_amount) * tax_pct / 100, 2))`
  ),
  roundOff: numeric('round_off').notNull().default('0.00'),
  netAmount: numeric('net_amount').generatedAlwaysAs(
    (): SQL => sql`(ROUND(subtotal - discount_amount + tax_amount + round_off, 2))`
  ),

  // E-Invoice Metadata
  irn: text('irn', { length: 64 }), // 64-character hash
  ackNo: text('ack_no', { length: 20 }), // 15-digit Ack No
  ackDate: text('ack_date', { length: 50 }), // ISO Date String
  signedQrCode: text('signed_qr_code') // Large payload string
}, (t) => [
  uniqueIndex('sales_invoices_invoice_number_unique').on(t.invoiceNumber),
  index('sales_invoices_invoice_date').on(t.invoiceDate),
  index('sales_invoices_ref_number').on(t.refNumber),
  index('sales_invoices_irn').on(t.irn),
  index('sales_invoices_ack_no').on(t.ackNo)
]);

export type SalesInvoice = typeof salesInvoices.$inferSelect;
export type NewSalesInvoice = typeof salesInvoices.$inferInsert;
export type SalesInvoiceWithItems = SalesInvoice & { items: SalesInvoiceItem[] };
export type NewSalesInvoiceWithItems = NewSalesInvoice & { items: NewSalesInvoiceItem[] };
