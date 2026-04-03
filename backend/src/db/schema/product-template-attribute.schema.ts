import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';
import { productTemplates } from './product-template.schema';
import { attributes } from './attribute.schema';

export const productTemplateAttributes = sqliteTable('product_template_attributes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id').notNull().references(() => productTemplates.id),
  attributeId: integer('attribute_id').notNull().references(() => attributes.id),
  isVariantDefining: integer('is_variant_defining', { mode: 'boolean' }).notNull().default(false),
});

export type ProductTemplateAttribute = typeof productTemplateAttributes.$inferSelect;
export type NewProductTemplateAttribute = typeof productTemplateAttributes.$inferInsert;
