import { db, auditLogs } from '../../db';
import { getContext } from './request-context';

export interface AuditLogParams {
  action: string;
  entity: string;
  entityId: string | number;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}

/**
 * Writes an audit log entry to the database.
 * The userId is automatically pulled from the current request context.
 */
export async function auditLog({
  action,
  entity,
  entityId,
  oldValue = null,
  newValue = null,
}: AuditLogParams): Promise<void> {
  const ctx = getContext();

  await db.insert(auditLogs).values({
    userId: ctx.userId ?? null,
    requestId: ctx.requestId ?? null,
    action,
    entity,
    entityId: String(entityId),
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
  });
}
