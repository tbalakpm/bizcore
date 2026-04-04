import { SQL, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { purchaseInvoices } from './purchase-invoice.schema';
import { inventories } from './inventory.schema';

export const purchaseInvoiceItems = sqliteTable('purchase_invoice_items', {
    id: integer('id')
        .primaryKey({ autoIncrement: true })
        .notNull(),

    purchaseInvoiceId: integer('purchase_invoice_id')
        .references(() => purchaseInvoices.id)
        .notNull(),

    inventoryId: integer('inventory_id')
        .references(() => inventories.id)
        .notNull(),

    qty: real('qty')
        .notNull()
        .default(0.000),

    unitPrice: real('unit_price')
        .notNull()
        .default(0.00),

    discountType: text('discount_type', { length: 10, enum: ['none', 'percent', 'amount'] })
        .notNull()
        .default('none'), // none, percent, amount

    discountPct: real('discount_pct')
        .notNull()
        .default(0.00),

    discountAmount: real('discount_amount')
        .notNull()
        .default(0.00),

    taxPct: real('tax_pct')
        .notNull()
        .default(0.00),

    taxAmount: real('tax_amount').generatedAlwaysAs(
        (): SQL => sql`(ROUND((qty * unit_price - discount_amount) * tax_pct / 100, 2))`
    ),

    sgstAmount: real('sgst_amount')
        .notNull()
        .default(0.00),

    cgstAmount: real('cgst_amount')
        .notNull()
        .default(0.00),

    igstAmount: real('igst_amount')
        .notNull()
        .default(0.00),

    lineTotal: real('line_total').generatedAlwaysAs(
        (): SQL => sql`(ROUND((qty * unit_price - discount_amount) + tax_amount, 2))`
    ),

    marginType: text('margin_type', { length: 25, enum: ['none', 'percent', 'amount'] })
        .notNull()
        .default('none'),  // none, percent, amount

    marginPct: real('margin_pct')
        .notNull()
        .default(0),

    marginAmount: real('margin_amount')
        .notNull()
        .default(0.00),

    sellingPrice: real('selling_price')
        .notNull()
        .default(0.00)
}, (t) => [
    index('purchase_invoice_items_purchase_invoice_id_idx').on(t.purchaseInvoiceId),
    index('purchase_invoice_items_inventory_id_idx').on(t.inventoryId)
]);

export type PurchaseInvoiceItem = typeof purchaseInvoiceItems.$inferSelect;
export type NewPurchaseInvoiceItem = typeof purchaseInvoiceItems.$inferInsert;
