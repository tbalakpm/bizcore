import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const taxRules = sqliteTable('tax_rules', {
    id: integer('id')
        .primaryKey({ autoIncrement: true })
        .notNull(),

    ruleGroupId: integer('rule_group_id')
        .notNull(),

    taxRateId: integer('tax_rate_id')
        .notNull(),

    hsnCodeStartsWith: text('hsn_code_starts_with', { length: 20 }),

    minPrice: integer('min_price')
        .default(0)
        .notNull(),

    maxPrice: integer('max_price')
        .default(0)
        .notNull(),

    isInterState: integer('is_inter_state', { mode: 'boolean' })
        .default(false)
        .notNull(),

    isIntraState: integer('is_intra_state', { mode: 'boolean' })
        .default(true)
        .notNull(),

    customerType: text('customer_type')
        .default('retail')
        .notNull(), // retail, b2b, export

    priority: integer('priority')
        .default(0)
        .notNull(),

    effectiveFrom: text('effective_from')
        .notNull(),

    effectiveTo: text('effective_to'),
}, (t) => [
    index('tax_rules_hsn_code_effective_from_unique').on(t.hsnCodeStartsWith, t.effectiveFrom),
]);

export type TaxRule = typeof taxRules.$inferSelect;
export type NewTaxRule = typeof taxRules.$inferInsert;
