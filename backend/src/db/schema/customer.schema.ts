import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFields } from './base';
import { addresses } from './address.schema';

export const customers = sqliteTable(
  'customers',
  {
    ...keyFields,
    type: text('type', { length: 25 }).notNull().default('retail'),
    gstin: text('gstin', { length: 25 }),
    billingAddressId: integer('billing_address_id').references(() => addresses.id),
    shippingAddressId: integer('shipping_address_id').references(() => addresses.id),
    notes: text('notes', { length: 255 }),
    ...auditFields
  },
  (t) => [
    check('type_must_be_in_list', sql`${t.type} IN ('retail','wholesale')`),
    uniqueIndex('customers_code_unique').on(t.code),
    uniqueIndex('customers_name_unique').on(t.name)
  ]
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
