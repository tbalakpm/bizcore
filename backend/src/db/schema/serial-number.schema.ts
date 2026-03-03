import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const serialNumbers = sqliteTable('serial_numbers', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  key: text('key', { length: 20 }).notNull(),
  prefix: text('prefix', { length: 20 }),
  current: integer('current').notNull().default(1),
  length: integer('length').notNull().default(10),
});

export type SerialNumber = typeof serialNumbers.$inferSelect;
export type NewSerialNumber = typeof serialNumbers.$inferInsert;
