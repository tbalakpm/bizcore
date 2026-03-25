import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const serialNumbers = sqliteTable('serial_numbers', {
  id: integer('id')
    .primaryKey({ autoIncrement: true })
    .notNull(),

  key: text('key', { length: 25 })
    .notNull(),

  prefix: text('prefix', { length: 10 })
    .notNull()
    .default(''),

  current: integer('current')
    .notNull()
    .default(1),

  length: integer('length')
    .notNull()
    .default(10),
}, (t) => [
  uniqueIndex('serial_numbers_key_unique').on(t.key)
]);

export type SerialNumber = typeof serialNumbers.$inferSelect;
export type NewSerialNumber = typeof serialNumbers.$inferInsert;

/*
a. key: can be stock_invoice_number, purchase_invoice_number, sales_invoice_number, credit_note_number, debit_note_number, etc.
b. prefix: 
  1, ST, PU, INV, CN, DN, or
  2, YYYY, YY, or
  3, YYYY-MM, YYYYMM, YY-MM, YYMM, or 
  4, YYYY-MM-DD, YYYYMMDD, YY-MM-DD, YYMMDD or
  5, YYYY-JJJ, YYYYJJJ, YY-JJJ, YYJJJ or
  6, Combination of 1+2, 1+3, 1+4, 1+5 are allowed
  7, Combination of Alphabets and Special characters like hyphen(-), dot(.), colon(:), slash(/), underscore(_), backward slash(\\), hash(#), pipe(|) are allowed
    e.g. AA-BB-CC-0000000001
    and more imporatantly alphabets should be incremented once numbers are reached maximum
    e.g. AA-BB-CC-9999999999 ==> AA-BB-CD-0000000001
    e.g. AA-BB-ZZ-9999999999 ==> AA-BC-AA-0000000001
    e.g. AA-ZZ-ZZ-9999999999 ==> AB-AA-AA-0000000001
c. current: can be 1
d. length: can be 10
  current and length combinely generate zero-prefixed numbers
  e.g. prefix = ST, (current = 1, length = 10 => 0000000001) ==> ST-0000000001
    prefix = INV-YYYY, (current = 1, length = 10 => 0000000001) ==> INV-2026-0000000001
    prefix = INV-YYYY-MM, (current = 1, length = 10 => 0000000001) ==> INV-2026-03-0000000001
    prefix = INV-YYYY-MM-DD, (current = 1, length = 10 => 0000000001) ==> INV-2026-03-13-0000000001
    prefix = INV-YYYY-JJJ, (current = 1, length = 10 => 0000000001) ==> INV-2026-072-0000000001
    prefix = INV-YYYY-MM-JJJ, (current = 1, length = 10 => 0000000001) ==> INV-2026-03-13-072-0000000001
    prefix = ST-INV-YYYY-MM-DD, (current = 1, length = 10 => 0000000001) ==> ST-INV-2026-03-13-0000000001
*/
