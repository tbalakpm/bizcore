import { SQL, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { salesInvoices } from './sales-invoice.schema';
import { inventories } from './inventory.schema';

export const salesInvoiceItems = sqliteTable('sales_invoice_items', {
  id: integer('id')
    .primaryKey({ autoIncrement: true })
    .notNull(),

  salesInvoiceId: integer('sales_invoice_id')
    .references(() => salesInvoices.id)
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

  sgstAmount: real('sgst_amount').notNull().default(0.00),

  cgstAmount: real('cgst_amount').notNull().default(0.00),

  igstAmount: real('igst_amount').notNull().default(0.00),

  lineTotal: real('line_total').generatedAlwaysAs(
    (): SQL => sql`(ROUND((qty * unit_price - discount_amount) + tax_amount, 2))`
  )
}, (t) => [
  index('sales_invoice_items_sales_invoice_id_idx').on(t.salesInvoiceId),

  index('sales_invoice_items_inventory_id_idx').on(t.inventoryId)
]);

export type SalesInvoiceItem = typeof salesInvoiceItems.$inferSelect;
export type NewSalesInvoiceItem = typeof salesInvoiceItems.$inferInsert;

/*
  Allow user to scan the barcode (gtn column) and fetch the inventories and show it as product, hsn/sac, tax, etc.
  After selection of the product from the dropdown, 'inventories' table should be updated as below:
    create: it should be deduct the qty in the 'inventories' table
    update: reverse the qty to its original state and deduct the qty
    delete: reverse the qty to its original state
*/
