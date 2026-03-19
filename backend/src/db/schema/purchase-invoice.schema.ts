import { SQL, sql } from 'drizzle-orm';
import { index, integer, numeric, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { suppliers } from './supplier.schema';
import type { NewPurchaseInvoiceItem, PurchaseInvoiceItem } from './purchase-invoice-items.schema';

export const purchaseInvoices = sqliteTable('purchase_invoices', {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    invoiceNumber: text('invoice_number', { length: 25 }).notNull(),
    invoiceDate: text('invoice_date', { length: 25 }).notNull(),
    supplierId: integer('supplier_id')
        .notNull()
        .references(() => suppliers.id),
    refNumber: text('ref_number', { length: 25 }),
    refDate: text('ref_date', { length: 25 }),
    totalQty: numeric('total_qty').notNull().default('0.000'),
    subtotal: numeric('subtotal').notNull().default('0.00'),
    discountType: text('discount_type', { length: 20 }).notNull().default('none'), // none, percent, amount
    discountPct: numeric('discount_pct').notNull().default('0.00'),
    discountAmount: numeric('discount_amount').notNull().default('0.00'),
    totalTaxAmount: numeric('total_tax_amount').notNull().default('0.00'),  // total tax amount from the line-items - calculated field
    roundOff: numeric('round_off').notNull().default('0.00'),
    netAmount: numeric('net_amount').generatedAlwaysAs(
        (): SQL => sql`(ROUND(subtotal - discount_amount + total_tax_amount + round_off, 2))`
    )
}, (t) => [
    uniqueIndex('purchase_invoices_invoice_number_unique').on(t.invoiceNumber),
    index('purchase_invoices_supplier_id_idx').on(t.supplierId),
    index('purchase_invoices_invoice_date_idx').on(t.invoiceDate),
    index('purchase_invoices_ref_number_idx').on(t.refNumber)
]);

export type PurchaseInvoice = typeof purchaseInvoices.$inferSelect;
export type NewPurchaseInvoice = typeof purchaseInvoices.$inferInsert;
export type PurchaseInvoiceWithItems = PurchaseInvoice & { items: PurchaseInvoiceItem[] };
export type NewPurchaseInvoiceWithItems = NewPurchaseInvoice & { items: NewPurchaseInvoiceItem[] };
