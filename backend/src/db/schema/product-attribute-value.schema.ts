import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { auditFields } from './base';
import { products } from './product.schema';
import { attributes } from './attribute.schema';

export const productAttributeValues = sqliteTable('product_attribute_values', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  attributeId: integer('attribute_id').notNull().references(() => attributes.id),
  value: text('value').notNull(), // JSON string for values
  ...auditFields,
});

export type ProductAttributeValue = typeof productAttributeValues.$inferSelect;
export type NewProductAttributeValue = typeof productAttributeValues.$inferInsert;
