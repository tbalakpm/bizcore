import { index, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFieldsNoCode } from './base';

export const productTemplates = sqliteTable('product_templates', {
  ...keyFieldsNoCode,

  description: text('description', { length: 255 }),

  ...auditFields,
}, (t) => [
  uniqueIndex('product_templates_name_unique').on(t.name),
]);

export type ProductTemplate = typeof productTemplates.$inferSelect;
export type NewProductTemplate = typeof productTemplates.$inferInsert;
