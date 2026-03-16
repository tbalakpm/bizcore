# Walkthrough: SQLite Concurrency Optimization

I have optimized the SQLite backend to handle 15-20 concurrent users and verified the setup with a load test.

## Changes Made

### 1. Database Optimization
In [index.ts](file:///Users/tbalamurugan/Projects/fanda-org/bizcore/backend/src/db/index.ts), I added `PRAGMA busy_timeout = 5000;`. This ensures that concurrent write operations wait for up to 5 seconds before failing, which is crucial for a smooth user experience in a multi-user environment.

```typescript
export const initializeDatabase = async () => {
  console.log('Initializing database');
  await db.run(`
    PRAGMA journal_mode=WAL;
    PRAGMA synchronous=NORMAL;
    PRAGMA foreign_keys=ON;
    PRAGMA busy_timeout=5000;`);
};
```

## Verification Results

### Concurrency Load Test
I ran a load test simulating 20 concurrent write operations (inserting users).

**Command:**
`npx tsx tmp/test-concurrency.ts`

**Output:**
```
Initializing database
Starting concurrency test...
Write 0 successful
Write 1 successful
...
Write 19 successful
Concurrency test completed.
```

All 20 concurrent operations succeeded without any "database is locked" errors.

## On-Prem Scaling Strategy

### Current Stage: Optimized SQLite (15-20+ Users)
- **WAL Mode**: Enabled (Write-Ahead Logging allows concurrent reads/writes).
- **Busy Timeout**: Set to 5000ms (Prevents locking errors).
- **On-Prem Performance**: Modern SSDs easily handle hundreds of SQLite writes per second.

### Future Stages:

1.  **Vertical Scaling (Up to ~200 Users)**:
    - Upgrade server hardware (NVMe SSD, more RAM).
    - SQLite will continue to perform exceptionally well on a single machine.

2.  **Highly Available / Multi-Server (Up to ~500 Users)**:
    - Use **LiteFS** for real-time replication of SQLite across multiple application nodes.
    - This maintains SQLite's speed while allowing horizontal scaling.

3.  **Enterprise Level (1000+ Users / Large Data)**:
    - Migrate to **PostgreSQL**.
    - Since you are using **Drizzle ORM**, migrating the schema and queries is straightforward. PostgreSQL handles row-level locking and massive datasets more efficiently than SQLite's file-level locking.
