import { SQL, sql } from 'drizzle-orm';
import { index, integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { purchaseInvoices } from './purchase-invoice.schema';
import { inventories } from './inventory.schema';

export const purchaseInvoiceItems = sqliteTable('purchase_invoice_items', {
    id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
    purchaseInvoiceId: integer('purchase_invoice_id')
        .references(() => purchaseInvoices.id)
        .notNull(),
    inventoryId: integer('inventory_id')
        .references(() => inventories.id)
        .notNull(),
    qty: numeric('qty').notNull().default('0.000'),
    unitPrice: numeric('unit_price').notNull().default('0.00'),
    discountType: text('discount_type', { length: 10 }).notNull().default('none'), // none, percent, amount
    discountPct: numeric('discount_pct').notNull().default('0.00'),
    discountAmount: numeric('discount_amount').notNull().default('0.00'),
    taxPct: numeric('tax_pct').notNull().default('0.00'),
    taxAmount: numeric('tax_amount').generatedAlwaysAs(
        (): SQL => sql`(ROUND((qty * unit_price - discount_amount) * tax_pct / 100, 2))`
    ),
    lineTotal: numeric('line_total').generatedAlwaysAs(
        (): SQL => sql`(ROUND((qty * unit_price - discount_amount) + tax_amount, 2))`),
    marginType: text('margin_type', { length: 25 }).notNull().default('none'),  // none, percent, amount
    marginPct: numeric('margin_pct').notNull().default('0'),
    marginAmount: numeric('margin_amount').notNull().default('0.00'),
    sellingPrice: numeric('selling_price').notNull().default('0.00')
}, (t) => [
    index('purchase_invoice_items_purchase_invoice_id_idx').on(t.purchaseInvoiceId),
    index('purchase_invoice_items_inventory_id_idx').on(t.inventoryId)
]);

export type PurchaseInvoiceItem = typeof purchaseInvoiceItems.$inferSelect;
export type NewPurchaseInvoiceItem = typeof purchaseInvoiceItems.$inferInsert;
