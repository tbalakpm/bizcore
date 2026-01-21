import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import { config } from '../config';

const client = createClient({
  url: config.tursoDatabaseUrl,
  authToken: config.tursoAuthToken,
});

export const db = drizzle(client, { logger: true, casing: 'snake_case' });

export const migrateDatabase = async () => {
  await migrate(db, { migrationsFolder: './drizzle' });
};
