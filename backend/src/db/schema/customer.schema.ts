import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFields } from './base';
import { addresses } from './address.schema';

export const customers = sqliteTable(
  'customers',
  {
    ...keyFields,
    type: text('type', { length: 20 }).notNull().default('retail'),
    notes: text('notes', { length: 255 }),
    gstin: text('gstin', { length: 20 }),
    billingAddressId: integer('billing_address_id').references(() => addresses.id),
    shippingAddressId: integer('shipping_address_id').references(() => addresses.id),
    ...auditFields,
  },
  (t) => [
    check('type_must_be_in_list', sql`${t.type} IN ('retail','wholesale')`),
    unique('customers_code_unique').on(t.code),
    unique('customers_name_unique').on(t.name),
  ],
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
