import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

//#region User Model
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),
  username: text('username', { length: 16 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: text('first_name', { length: 50 }),
  lastName: text('last_name', { length: 50 }),
  isActive: integer('is_active', { mode: 'boolean' }).default(true), // Using text to represent boolean (1/0)
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

//#endregion

//#region Category Model

export const categories = sqliteTable(
  'categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    code: text('code', { length: 15 }),
    name: text('name', { length: 100 }).notNull(),
    description: text('description', { length: 255 }),
    type: text('type', { length: 1 }).notNull(), // Income/Revenue, Expense, Asset (Investment), Liability (Loan - lending & borrowing), Capital/Equity, Document
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [unique('idx_user_id_name').on(table.userId, table.name)],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

//#endregion

//#region Register Model
export const registers = sqliteTable(
  'registers',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name', { length: 100 }).notNull(),
    description: text('description', { length: 255 }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    amount: integer('amount'),
    date: text('date'),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [unique('idx_user_id_name').on(table.userId, table.name), index('idx_category_id').on(table.categoryId)],
);

export type Register = typeof registers.$inferSelect;
export type NewRegister = typeof registers.$inferInsert;

//#endregion

//#region Entry Model
export const entries = sqliteTable(
  'entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    amount: integer('amount').notNull(),
    date: text('date').notNull(),
    description: text('description', { length: 255 }),
    registerId: integer('register_id')
      .notNull()
      .references(() => registers.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    index('idx_register_id').on(table.registerId),
    index('idx_user_date_register').on(table.userId, table.date, table.registerId),
  ],
);

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;

//#endregion
