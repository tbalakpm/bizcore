import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFields } from './base';
import { addresses } from './address.schema';

export const suppliers = sqliteTable(
  'suppliers',
  {
    ...keyFields,
    notes: text('notes', { length: 255 }),
    gstin: text('gstin', { length: 20 }),
    billingAddressId: integer('billing_address_id').references(() => addresses.id),
    shippingAddressId: integer('shipping_address_id').references(() => addresses.id),
    ...auditFields,
  },
  (t) => [unique('suppliers_code_unique').on(t.code), unique('suppliers_name_unique').on(t.name)],
);

export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
