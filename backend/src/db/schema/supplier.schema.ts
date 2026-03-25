import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFields } from './base';
import { addresses } from './address.schema';

export const suppliers = sqliteTable(
  'suppliers',
  {
    ...keyFields,
    type: text('type', { enum: ['weaver', 'supplier'] })
      .notNull()
      .default('supplier'),

    gstin: text('gstin', { length: 25 }),

    billingAddressId: integer('billing_address_id')
      .references(() => addresses.id),

    shippingAddressId: integer('shipping_address_id')
      .references(() => addresses.id),

    notes: text('notes', { length: 255 }),
    ...auditFields
  },
  (t) => [
    uniqueIndex('suppliers_code_unique').on(t.code),

    uniqueIndex('suppliers_name_unique').on(t.name),

    index('suppliers_billing_address_id_idx').on(t.billingAddressId),

    index('suppliers_shipping_address_id_idx').on(t.shippingAddressId),

    index('suppliers_gstin_idx').on(t.gstin)
  ]
);

// export const supplierRelations = relations(suppliers, ({ one }) => ({
//   billingAddress: one(addresses, {
//     fields: [suppliers.billingAddressId],
//     references: [addresses.id],
//   }),
//   shippingAddress: one(addresses, {
//     fields: [suppliers.shippingAddressId],
//     references: [addresses.id],
//   }),
// }));

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
