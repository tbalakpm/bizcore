import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { products } from "./product.schema";
import { sql } from "drizzle-orm";

export const inventoryLogs = sqliteTable("inventory_logs", {
    id: integer("id")
        .primaryKey({ autoIncrement: true }),

    productId: integer("product_id")
        .notNull()
        .references(() => products.id),

    gtn: text('gtn', { length: 25 })
        .notNull()
        .default(''),

    changeQty: real("change_qty")
        .notNull()
        .default(0.00),

    direction: text("direction", { length: 10, enum: ["in", "out"] })
        .notNull(),

    type: text("type", { length: 25, enum: ["stock", "purchase", "sale", "debit_note", "credit_note", "adjustment"] })
        .notNull(),

    refId: integer("ref_id")
        .notNull(), // sale_id

    createdAt: text("created_at")
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`)
}, (t) => [
    index('inventory_logs_product_id_idx').on(t.productId),

    uniqueIndex('inventory_logs_gtn_idx').on(t.gtn),
]);

export type InventoryLog = typeof inventoryLogs.$inferSelect;
