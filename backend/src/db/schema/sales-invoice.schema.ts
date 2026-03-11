import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { customers } from './customer.schema';
import type { NewSalesInvoiceItem, SalesInvoiceItem } from './sales-invoice-items.schema';

export const salesInvoices = sqliteTable('sales_invoices', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  invoiceNumber: text('invoice_number', { length: 20 }).notNull(),
  invoiceDate: text('invoice_date', { length: 20 }).notNull(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id),
  refNumber: text('ref_number', { length: 20 }),
  refDate: text('ref_date', { length: 20 }),
  totalQty: numeric('total_qty'),
  subtotal: numeric('subtotal'),
  discountBy: text('discount_by', { length: 20 }), // pct or amt
  discountPct: numeric('discount_pct'),
  discountAmount: numeric('discount_amount'),
  taxPct: numeric('tax_pct'),
  taxAmount: numeric('tax_amount'),
  netAmount: numeric('net_amount'),
  
  // E-Invoice Metadata
  irn: text('irn', { length: 64 }), // 64-character hash
  ackNo: text('ack_no', { length: 20 }), // 15-digit Ack No
  ackDate: text('ack_date', { length: 50 }), // ISO Date String
  signedQrCode: text('signed_qr_code'), // Large payload string
});

export type SalesInvoice = typeof salesInvoices.$inferSelect;
export type NewSalesInvoice = typeof salesInvoices.$inferInsert;
export type SalesInvoiceWithItems = SalesInvoice & { items: SalesInvoiceItem[] };
export type NewSalesInvoiceWithItems = NewSalesInvoice & { items: NewSalesInvoiceItem[] };
