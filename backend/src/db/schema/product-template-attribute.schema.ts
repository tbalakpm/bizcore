import { sqliteTable, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { productTemplates } from './product-template.schema';
import { attributes } from './attribute.schema';

export const productTemplateAttributes = sqliteTable('product_template_attributes', {
  id: integer('id')
    .primaryKey({ autoIncrement: true }),

  templateId: integer('template_id')
    .notNull()
    .references(() => productTemplates.id),

  attributeId: integer('attribute_id')
    .notNull()
    .references(() => attributes.id),

  isVariantDefining: integer('is_variant_defining', { mode: 'boolean' })
    .notNull()
    .default(false),
}, (t) => [
  uniqueIndex('product_template_attributes_template_id_attribute_id_unique').on(t.templateId, t.attributeId),
  // index('product_template_attributes_template_id_idx').on(t.templateId),
  index('product_template_attributes_attribute_id_idx').on(t.attributeId),
]);

export type ProductTemplateAttribute = typeof productTemplateAttributes.$inferSelect;
export type NewProductTemplateAttribute = typeof productTemplateAttributes.$inferInsert;
