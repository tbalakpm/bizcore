import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { stockInvoices } from './stock-invoice.schema';
import { inventories } from './inventory.schema';
import { sql, SQL } from 'drizzle-orm';

export const stockInvoiceItems = sqliteTable('stock_invoice_items', {
  id: integer('id')
    .primaryKey({ autoIncrement: true })
    .notNull(),

  stockInvoiceId: integer('stock_invoice_id')
    .references(() => stockInvoices.id)
    .notNull(),

  inventoryId: integer('inventory_id')
    .references(() => inventories.id)
    .notNull(),

  qty: real('qty')
    .notNull()
    .default(1),

  unitPrice: real('unit_price')
    .notNull()
    .default(0.00),

  lineTotal: real('line_total')
    .generatedAlwaysAs(
      (): SQL => sql`(ROUND(qty * unit_price, 2))`
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
  index('stock_invoice_items_stock_invoice_id_idx').on(t.stockInvoiceId),

  index('stock_invoice_items_inventory_id_idx').on(t.inventoryId)
]);

export type StockInvoiceItem = typeof stockInvoiceItems.$inferSelect;
export type NewStockInvoiceItem = typeof stockInvoiceItems.$inferInsert;

/*
  Allow user to create product on the fly with GTN, HSN/SAC, Tax, etc.
  If product is created on the fly, then it should be added to the 'products' table
  If product is selected from the dropdown, then it should be created/updated in the 'inventories' table 
*/
