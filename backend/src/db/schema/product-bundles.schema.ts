import { index, integer, sqliteTable, uniqueIndex } from "drizzle-orm/sqlite-core";
import { products } from "./product.schema";

export const productBundles = sqliteTable("product_bundles", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    bundleProductId: integer("bundle_product_id")
        .notNull()
        .references(() => products.id),

    productId: integer("product_id")
        .notNull()
        .references(() => products.id),

    quantity: integer("quantity").notNull().default(1),
}, (t) => [
    uniqueIndex('product_bundles_bundle_product_id_product_id_unique').on(t.bundleProductId, t.productId),
    // index('product_bundles_bundle_product_id_idx').on(t.bundleProductId),
    index('product_bundles_product_id_idx').on(t.productId),
]);

export type ProductBundle = typeof productBundles.$inferSelect;
