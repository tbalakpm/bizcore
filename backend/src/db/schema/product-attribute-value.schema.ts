import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { auditFields } from './base';
import { products } from './product.schema';
import { attributes } from './attribute.schema';

export const productAttributeValues = sqliteTable('product_attribute_values', {
  id: integer('id')
    .primaryKey({ autoIncrement: true }),

  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),

  attributeId: integer('attribute_id')
    .notNull()
    .references(() => attributes.id),

  value: text('value')
    .notNull(), // JSON string for values

  ...auditFields,
}, (t) => [
  uniqueIndex('product_attrv_product_attribute_id_unique').on(t.productId, t.attributeId),
  // index('product_attrv_product_id_idx').on(t.productId),
  index('product_attrv_attribute_id_idx').on(t.attributeId),
]);

export type ProductAttributeValue = typeof productAttributeValues.$inferSelect;
export type NewProductAttributeValue = typeof productAttributeValues.$inferInsert;
