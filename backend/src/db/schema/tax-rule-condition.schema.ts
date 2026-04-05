import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const taxRuleConditions = sqliteTable('tax_rule_conditions', {
    id: integer('id')
        .primaryKey({ autoIncrement: true })
        .notNull(),

    taxRuleId: integer('tax_rule_id')
        .notNull(),

    field: text('field')
        .notNull(),

    operator: text('operator')
        .notNull(),

    value: text('value')
        .notNull(),
});

export type TaxRuleCondition = typeof taxRuleConditions.$inferSelect;
export type NewTaxRuleCondition = typeof taxRuleConditions.$inferInsert;
