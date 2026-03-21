import { sqliteTable, integer, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFields } from './base';

export const pricingCategories = sqliteTable(
  'pricing_categories',
  {
    ...keyFields,
    description: text('description', { length: 255 }),
    ...auditFields,
  },
  (t) => [
    uniqueIndex('pricing_categories_code_unique').on(t.code),
    uniqueIndex('pricing_categories_name_unique').on(t.name),
  ]
);

export type PricingCategory = typeof pricingCategories.$inferSelect;
export type NewPricingCategory = typeof pricingCategories.$inferInsert;
