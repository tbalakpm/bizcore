# Logging Implementation Plan (Node.js + Angular + Antigravity)

## Overview
This document defines a structured logging approach for a financial accounting and inventory system built using:

- Node.js (Backend)
- Angular (Frontend)
- PostgreSQL / SQLite
- Antigravity ERP framework

---

## 1. Logging Architecture

Frontend Logs → API Logs → Audit Logs → Central Storage

| Layer | Purpose | Storage |
|------|--------|--------|
| UI Logs | User/UI issues | Backend → ELK/Loki |
| API Logs | Technical logs | ELK / files |
| Audit Logs | Business/legal | PostgreSQL |

---

## 2. Backend Folder Structure

/src
  /core
    logger/
      logger.ts
      request-context.ts
      logger.service.ts
      audit.service.ts
  /middleware
      request-id.middleware.ts
      logging.middleware.ts
  /modules
      inventory/
      accounting/

---

## 3. Core Logger (Pino)

### logger.ts

```ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: null
});
```

---

## 4. Request Context (AsyncLocalStorage)

### request-context.ts

```ts
import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage();

export function getContext() {
  return asyncLocalStorage.getStore() || {};
}
```

---

### request-id.middleware.ts

```ts
import { v4 as uuidv4 } from 'uuid';
import { asyncLocalStorage } from '../core/logger/request-context';

export function requestContextMiddleware(req, res, next) {
  const context = {
    requestId: req.headers['x-request-id'] || uuidv4(),
    userId: req.user?.id || null,
    tenantId: req.user?.tenantId || null,
  };

  asyncLocalStorage.run(context, () => next());
}
```

---

## 5. Logger Service (Wrapper)

### logger.service.ts

```ts
import { logger } from './logger';
import { getContext } from './request-context';

export class LogService {
  static info(message: string, data = {}) {
    logger.info({ ...getContext(), ...data }, message);
  }

  static error(message: string, err: any, data = {}) {
    logger.error({ ...getContext(), err, ...data }, message);
  }

  static warn(message: string, data = {}) {
    logger.warn({ ...getContext(), ...data }, message);
  }
}
```

---

## 6. Audit Logging

### audit.service.ts

```ts
import db from '../db';
import { getContext } from './request-context';

export async function auditLog({
  action,
  entity,
  entityId,
  oldValue,
  newValue,
}) {
  const ctx = getContext();

  await db.query(`
    INSERT INTO audit_logs
    (user_id, tenant_id, action, entity, entity_id, old_value, new_value)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
  `, [
    ctx.userId,
    ctx.tenantId,
    action,
    entity,
    entityId,
    oldValue,
    newValue,
  ]);
}
```

---

### PostgreSQL Table

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  tenant_id INT,
  action TEXT,
  entity TEXT,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. Usage Example

```ts
import { LogService } from '@/core/logger/logger.service';
import { auditLog } from '@/core/logger/audit.service';

async function updateStock(productId, qty) {
  try {
    LogService.info("Updating stock", { productId, qty });

    const oldStock = await getStock(productId);
    const newStock = oldStock - qty;

    await saveStock(productId, newStock);

    await auditLog({
      action: 'UPDATE_STOCK',
      entity: 'PRODUCT',
      entityId: productId,
      oldValue: { stock: oldStock },
      newValue: { stock: newStock },
    });

  } catch (err) {
    LogService.error("Stock update failed", err, { productId });
    throw err;
  }
}
```

---

## 8. Angular Logging Service

```ts
@Injectable({ providedIn: 'root' })
export class LoggerService {
  constructor(private http: HttpClient) {}

  log(level: string, message: string, data?: any) {
    this.http.post('/api/logs', { level, message, data }).subscribe();
  }

  error(message: string, error: any) {
    this.log('ERROR', message, { error });
  }
}
```

---

## 9. Backend Endpoint

```ts
app.post('/api/logs', (req, res) => {
  const { level, message, data } = req.body;
  LogService[level.toLowerCase()](message, data);
  res.sendStatus(200);
});
```

---

## 10. Centralized Logging

Use ELK Stack or Grafana Loki for production logging.

---

## 11. Security Guidelines

- Never log passwords, OTPs
- Mask sensitive data

---

## 12. Retention Policy

| Type | Retention |
|------|----------|
| Error Logs | 90 days |
| Audit Logs | 7+ years |

---

## 13. Final Architecture

Angular → Node → Logger → ELK / PostgreSQL

---

## Summary

- Structured JSON logging
- Request-level context
- Separate audit logs
- Centralized monitoring
