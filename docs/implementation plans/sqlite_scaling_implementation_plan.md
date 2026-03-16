# SQLite Scaling and Concurrency Optimization

The current backend uses `libsql` with SQLite in WAL (Write-Ahead Logging) mode. This setup is highly efficient and easily handles 15-20 concurrent users in an on-prem environment.

SQLite can handle thousands of reads and hundreds of writes per second when properly configured. For 20 users, the primary bottleneck is typically disk I/O, which is easily managed by modern SSDs.

## Proposed Changes

### Database Optimization

#### [MODIFY] [index.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/db/index.ts)

Add `PRAGMA busy_timeout = 5000;` to the database initialization. This ensures that if one process is writing, others will wait up to 5 seconds for the lock to release instead of failing immediately with a "database is locked" error.

```typescript
export const initializeDatabase = async () => {
  console.log('Initializing database');
  await db.run(`
    PRAGMA journal_mode=WAL;
    PRAGMA synchronous=NORMAL;
    PRAGMA foreign_keys=ON;
    PRAGMA busy_timeout=5000; -- Add this line
  `);
};
```

## Scaling Strategy

For an on-prem deployment aiming to scale beyond 15-20 users:

### Phase 1: Vertical Scaling (Up to ~100-200 users)
- **Disk**: Use high-performance NVMe SSDs.
- **CPU/RAM**: Increase resources on the host machine.
- **SQLite Configuration**: Ensure WAL mode and indexing are optimized.

### Phase 2: Horizontal Scaling with SQLite (Up to ~500+ users)
- **LiteFS**: If you need multiple application servers, use [LiteFS](https://fly.io/docs/litefs/) to replicate the SQLite database across nodes.
- **LibSQL/Turso**: Continue using `libsql` which supports remote/replicated configurations if you move away from a single on-prem server.

### Phase 3: Migration to PostgreSQL
- If the application reaches a point where row-level locking or high-volume complex analytical queries are the bottleneck, migrate to PostgreSQL. Drizzle ORM makes this transition relatively straightforward as the schema definitions can be reused with minimal changes.

## Verification Plan

### Automated Verification
- **Load Test Script**: Create a temporary script to simulate 20 concurrent write operations and verify that they all succeed without "database locked" errors.

### Manual Verification
- Deploy the change to the dev environment and monitor the `npm run dev` logs during multi-user testing.
