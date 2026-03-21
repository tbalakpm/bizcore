import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFields } from './base';
import { addresses } from './address.schema';
import { pricingCategories } from './pricing-category.schema';

export const customers = sqliteTable(
  'customers',
  {
    ...keyFields,
    type: text('type', { length: 25 }).notNull().default('retail'),
    gstin: text('gstin', { length: 25 }),
    pricingCategoryId: integer('pricing_category_id').references(() => pricingCategories.id),
    billingAddressId: integer('billing_address_id').references(() => addresses.id),
    shippingAddressId: integer('shipping_address_id').references(() => addresses.id),
    notes: text('notes', { length: 255 }),
    ...auditFields
  },
  (t) => [
    check('type_must_be_in_list', sql`${t.type} IN ('retail','wholesale')`),
    uniqueIndex('customers_code_unique').on(t.code),
    uniqueIndex('customers_name_unique').on(t.name),
    index('customers_billing_address_id_idx').on(t.billingAddressId),
    index('customers_shipping_address_id_idx').on(t.shippingAddressId),
    index('cusotomers_gstin_idx').on(t.gstin),
    index('customers_pricing_category_id_idx').on(t.pricingCategoryId)
  ]
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
