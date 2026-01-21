import { Config, defineConfig } from 'drizzle-kit';
import { config } from './src/config';

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: config.tursoDatabaseUrl,
  },
  migrations: {
    schema: 'public',
  },
  strict: true,
  verbose: true,
}) satisfies Config;
