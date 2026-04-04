import { sqliteTable, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { brands } from './brand.schema';
import { categories } from './category.schema';

export const brandCategories = sqliteTable(
  'brand_categories',
  {
    id: integer('id')
      .primaryKey({ autoIncrement: true })
      .notNull(),

    brandId: integer('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),

    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [
    uniqueIndex('brand_categories_brand_id_category_id_unique').on(t.brandId, t.categoryId),
    // index('brand_categories_brand_id_idx').on(t.brandId),
    index('brand_categories_category_id_idx').on(t.categoryId),
  ]
);

export type BrandCategory = typeof brandCategories.$inferSelect;
export type NewBrandCategory = typeof brandCategories.$inferInsert;
