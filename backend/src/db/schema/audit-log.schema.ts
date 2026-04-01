import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }).notNull(),

  userId: integer('user_id'),

  requestId: text('request_id', { length: 36 }),

  action: text('action', { length: 100 }).notNull(),

  entity: text('entity', { length: 100 }).notNull(),

  entityId: text('entity_id', { length: 100 }).notNull(),

  /** JSON string of the previous state */
  oldValue: text('old_value'),

  /** JSON string of the new state */
  newValue: text('new_value'),

  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
