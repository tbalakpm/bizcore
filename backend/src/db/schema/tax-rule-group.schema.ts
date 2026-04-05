import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const taxRuleGroups = sqliteTable('tax_rule_groups', {
    id: integer('id')
        .primaryKey({ autoIncrement: true })
        .notNull(),

    name: text('name')
        .notNull(),

    priority: integer('priority')
        .default(0)
        .notNull(),

    description: text('description'),
});

export type TaxRuleGroup = typeof taxRuleGroups.$inferSelect;
export type NewTaxRuleGroup = typeof taxRuleGroups.$inferInsert;
