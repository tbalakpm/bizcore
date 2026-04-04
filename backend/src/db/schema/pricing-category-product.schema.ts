import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';
import { pricingCategories } from './pricing-category.schema';
import { products } from './product.schema';

export const pricingCategoryProducts = sqliteTable(
  'pricing_category_products',
  {
    id: integer('id')
      .primaryKey({ autoIncrement: true })
      .notNull(),

    pricingCategoryId: integer('pricing_category_id')
      .notNull()
      .references(() => pricingCategories.id, { onDelete: 'cascade' }),

    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    marginType: text('margin_type', { length: 25, enum: ['none', 'percent', 'amount', 'selling_price'] })
      .notNull()
      .default('none'), // none, percent, amount, selling_price

    marginPct: real('margin_pct')
      .notNull()
      .default(0),

    marginAmount: real('margin_amount')
      .notNull()
      .default(0.00),
  },
  (t) => [
    index('pcp_pricing_category_id_idx').on(t.pricingCategoryId),
    index('pcp_product_id_idx').on(t.productId),
  ]
);

export type PricingCategoryProduct = typeof pricingCategoryProducts.$inferSelect;
export type NewPricingCategoryProduct = typeof pricingCategoryProducts.$inferInsert;
