import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// This table can be used to store application-wide settings or configurations. Each setting has a unique key and a corresponding value.
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  key: text('key', { length: 50 }).unique().notNull(),
  value: text('value', { length: 255 }),
});

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

/*
  sgst_sharing_rate =  50
  cgst_sharing_rate =  50
  igst_sharing_rate = 100
*/
