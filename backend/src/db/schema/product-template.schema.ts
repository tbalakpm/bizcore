import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFieldsNoCode } from './base';

export const productTemplates = sqliteTable('product_templates', {
  ...keyFieldsNoCode,
  description: text('description'),
  ...auditFields,
});

export type ProductTemplate = typeof productTemplates.$inferSelect;
export type NewProductTemplate = typeof productTemplates.$inferInsert;
