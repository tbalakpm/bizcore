import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// export const userSchema = `CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     username TEXT NOT NULL UNIQUE,
//     password_hash TEXT NOT NULL,
//     first_name TEXT,
//     last_name TEXT,
//     role TEXT NOT NULL DEFAULT 'user' CHECK(role IN('user', 'manager', 'admin')),
//     is_active INTEGER DEFAULT 1,
//     created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//     updated_at TEXT DEFAULT CURRENT_TIMESTAMP
//   );`;

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  username: text('username', { length: 16 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name', { length: 50 }),
  lastName: text('last_name', { length: 50 }),
  role: text('role', { length: 16 }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
