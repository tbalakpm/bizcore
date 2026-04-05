import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { auditFields } from './base';
import { taxRates } from './tax-rate.schema';

export const hsnSacCodes = sqliteTable(
  'hsn_sac_codes',
  {
    id: integer('id')
      .primaryKey({ autoIncrement: true })
      .notNull(),

    hsnSacCode: text('hsn_sac_code', { length: 25 }),

    taxRateId: integer('tax_rate_id')
      .notNull()
      .references(() => taxRates.id),

    ...auditFields

  },
  (t) => [
    index('hsn_sac_code_idx').on(t.hsnSacCode),
    index('hsn_sac_code_tax_rate_id_idx').on(t.taxRateId)
  ]
);

export type HsnSacCode = typeof hsnSacCodes.$inferSelect;
export type NewHsnSacCode = typeof hsnSacCodes.$inferInsert;
