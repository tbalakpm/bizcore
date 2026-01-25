import { sql } from 'drizzle-orm';
import { check, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { auditFields, keyFields } from './base';

export const customers = sqliteTable(
  'customers',
  {
    ...keyFields,
    type: text('type', { length: 16 }).notNull().default('retail'),
    notes: text('notes', { length: 255 }),
    ...auditFields,
  },
  (t) => [
    check('type_must_be_listed', sql`${t.type} IN ('retail','wholesale')`),
    unique('customers_code_unique').on(t.code),
    unique('customers_name_unique').on(t.name),
  ],
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
