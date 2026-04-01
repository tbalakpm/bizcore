import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { config } from '../config';
import { LogService } from '../core/logger/logger.service';

export * from './schema';

const client = createClient({
  url: config.tursoDatabaseUrl,
  authToken: config.tursoAuthToken,
});

export const db = drizzle(client, { logger: false /*config.isDevelopment*/, casing: 'snake_case' });

export const initializeDatabase = async () => {
  LogService.info('Initializing database');
  await db.run(`
    PRAGMA journal_mode=WAL;
    PRAGMA synchronous=NORMAL;
    PRAGMA foreign_keys=ON;
    PRAGMA busy_timeout=5000;`);
};

export const migrateDatabase = async () => {
  LogService.info('Migrating database');
  await migrate(db, { migrationsFolder: './drizzle' });
};
