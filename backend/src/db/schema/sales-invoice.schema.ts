import { SQL, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { customers } from './customer.schema';
import type { NewSalesInvoiceItem, SalesInvoiceItem } from './sales-invoice-items.schema';

export const salesInvoices = sqliteTable('sales_invoices', {
  id: integer('id')
    .primaryKey({ autoIncrement: true })
    .notNull(),

  invoiceNumber: text('invoice_number', { length: 25 })
    .notNull(),

  invoiceDate: text('invoice_date', { length: 25 })
    .notNull(),

  type: text('type', { length: 20, enum: ['invoice', 'estimate'] })
    .notNull()
    .default('invoice'), // invoice, estimate

  customerId: integer('customer_id')
    .notNull()
    .references(() => customers.id),

  refNumber: text('ref_number', { length: 25 }),

  refDate: text('ref_date', { length: 25 }),

  isTaxInclusive: integer('is_tax_inclusive', { mode: 'boolean' }),

  totalQty: real('total_qty')
    .notNull()
    .default(0.000),

  subtotal: real('subtotal')
    .notNull()
    .default(0.00),

  discountType: text('discount_type', { length: 20, enum: ['none', 'percent', 'amount'] })
    .notNull()
    .default('none'), // none, percent, amount

  discountPct: real('discount_pct')
    .notNull()
    .default(0.00),

  discountAmount: real('discount_amount')
    .notNull()
    .default(0.00),

  // taxPct: real('tax_pct').notNull().default('0.00'),
  totalTaxAmount: real('total_tax_amount')
    .notNull()
    .default(0.00),

  roundOff: real('round_off')
    .notNull()
    .default(0.00),

  netAmount: real('net_amount')
    .generatedAlwaysAs(
      (): SQL => sql`(ROUND(subtotal - discount_amount + total_tax_amount + round_off, 2))`
    ),

  // E-Invoice Metadata
  irn: text('irn', { length: 64 }), // 64-character hash

  ackNo: text('ack_no', { length: 20 }), // 15-digit Ack No

  ackDate: text('ack_date', { length: 50 }), // ISO Date String

  signedQrCode: text('signed_qr_code') // Large payload string
}, (t) => [
  uniqueIndex('sales_invoices_invoice_number_unique').on(t.invoiceNumber),
  index('sales_invoices_invoice_date_idx').on(t.invoiceDate),
  index('sales_invoices_customer_id_idx').on(t.customerId),
  index('sales_invoices_ref_number_idx').on(t.refNumber),
  index('sales_invoices_irn_idx').on(t.irn),
  index('sales_invoices_ack_no_idx').on(t.ackNo)
]);

export type SalesInvoice = typeof salesInvoices.$inferSelect;
export type NewSalesInvoice = typeof salesInvoices.$inferInsert;
export type SalesInvoiceWithItems = SalesInvoice & { items: SalesInvoiceItem[] };
export type NewSalesInvoiceWithItems = NewSalesInvoice & { items: NewSalesInvoiceItem[] };
