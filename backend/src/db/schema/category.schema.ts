import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFields } from './base';

export const categories = sqliteTable(
  'categories',
  {
    ...keyFields,
    description: text('description', { length: 255 }),
    ...auditFields
  },
  (t) => [
    uniqueIndex('categories_code_unique').on(t.code),
    uniqueIndex('categories_name_unique').on(t.name)
  ]
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
