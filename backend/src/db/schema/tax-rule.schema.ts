import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const taxRules = sqliteTable('tax_rules', {
    id: integer('id')
        .primaryKey({ autoIncrement: true })
        .notNull(),

    hsnCodeStartsWith: text('hsn_code_starts_with', { length: 20 })
        .notNull(),

    minPrice: integer('min_price')
        .notNull(),

    maxPrice: integer('max_price')
        .notNull(),

    taxRate: integer('tax_rate')
        .notNull(),

    effectiveFrom: text('effective_from')
        .notNull(),
}, (t) => [
    index('tax_rules_hsn_code_effective_from_unique').on(t.hsnCodeStartsWith, t.effectiveFrom),
]);

export type TaxRule = typeof taxRules.$inferSelect;
export type NewTaxRule = typeof taxRules.$inferInsert;
