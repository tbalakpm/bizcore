import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

// This table can be used to store application-wide settings or configurations. Each setting has a unique key and a corresponding value.
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  key: text('key', { length: 50 }).notNull(),
  value: text('value', { length: 255 }).notNull().default('')
}, (t) => [
  uniqueIndex('settings_key_unique').on(t.key)
]);

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

/*
  tz = 'Asia/Kolkata'
  tz_time_diff = +5.5 or +5:30 or -5.5 or -5:30
  sgst_sharing_rate =  50
  cgst_sharing_rate =  50
  igst_sharing_rate = 100
*/
