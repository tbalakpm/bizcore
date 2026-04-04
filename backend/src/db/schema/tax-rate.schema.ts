import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const taxRates = sqliteTable('tax_rates', {
    id: integer('id')
        .primaryKey({ autoIncrement: true })
        .notNull(),

    rate: integer('rate')
        .notNull(),

    cgstRate: integer('cgst_rate')
        .notNull(),

    sgstRate: integer('sgst_rate')
        .notNull(),

    igstRate: integer('igst_rate')
        .notNull(),

    cessRate: integer('cess_rate')
        .notNull(),

    cessAmount: integer('cess_amount')
        .notNull(),

    effectiveFrom: text('effective_from')
        .notNull(),
}, (t) => [
    uniqueIndex('tax_rates_rate_effective_from_unique').on(t.rate, t.effectiveFrom)
]);

export type TaxRate = typeof taxRates.$inferSelect;
export type NewTaxRate = typeof taxRates.$inferInsert;
