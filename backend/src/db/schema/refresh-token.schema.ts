import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './user.schema';

export const refreshTokens = sqliteTable('refresh_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),

  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /** SHA-256 hash of the raw token — never store raw tokens */
  tokenHash: text('token_hash', { length: 64 }).notNull().unique(),

  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),

  revokedAt: integer('revoked_at', { mode: 'timestamp' }),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
