import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const taxRates = sqliteTable('tax_rates', {
    id: integer('id')
        .primaryKey({ autoIncrement: true })
        .notNull(),

    rate: integer('rate')
        .notNull(),

    cgst_rate: integer('cgst_rate')
        .notNull(),

    sgst_rate: integer('sgst_rate')
        .notNull(),

    igst_rate: integer('igst_rate')
        .notNull(),

    cess_rate: integer('cess_rate')
        .notNull(),

    cess_amount: integer('cess_amount')
        .notNull(),

    effective_from: text('effective_from')
        .notNull(),
});

export type TaxRate = typeof taxRates.$inferSelect;
export type NewTaxRate = typeof taxRates.$inferInsert;
