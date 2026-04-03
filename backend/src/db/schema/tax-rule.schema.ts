import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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

    tax_rate: integer('tax_rate')
        .notNull(),

    effective_from: text('effective_from')
        .notNull(),
});

export type TaxRule = typeof taxRules.$inferSelect;
export type NewTaxRule = typeof taxRules.$inferInsert;
