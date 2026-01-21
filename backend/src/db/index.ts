import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { config } from '../config';

const client = createClient({
  url: config.tursoDatabaseUrl,
  authToken: config.tursoAuthToken,
});

export const db = drizzle(client, { logger: true, casing: 'snake_case' });

export const initializeDatabase = async () => {
  console.log('Initializing database');
  await db.run(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys=ON;`);
};

export const migrateDatabase = async () => {
  console.log('Migrating database');
  await migrate(db, { migrationsFolder: './drizzle' });
};
