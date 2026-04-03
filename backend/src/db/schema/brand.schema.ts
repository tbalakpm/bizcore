import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFields } from './base';

export const brands = sqliteTable(
  'brands',
  {
    ...keyFields,

    description: text('description', { length: 255 }),

    ...auditFields
  },
  (t) => [
    uniqueIndex('brands_code_unique').on(t.code),
    uniqueIndex('brands_name_unique').on(t.name)
  ]
);

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
