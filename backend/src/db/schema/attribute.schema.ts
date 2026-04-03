import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFieldsNoCode } from './base';

export const attributes = sqliteTable('attributes', {
  ...keyFieldsNoCode,
  description: text('description'),
  type: text('type', { enum: ['single_select', 'multi_select', 'text', 'number', 'boolean'] }).notNull(),
  options: text('options'), // JSON string [ "S", "M", "L" ]
  defaultValue: text('default_value'), // JSON string [ "S" ]
  ...auditFields,
});

export type Attribute = typeof attributes.$inferSelect;
export type NewAttribute = typeof attributes.$inferInsert;
