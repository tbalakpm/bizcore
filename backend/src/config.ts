import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';
const dotenvConfigPath = isDevelopment ? './.env/.env.local' : './.env/.env.production';

dotenv.config({ path: dotenvConfigPath });

const jwtSecretFromEnv = process.env.JWT_SECRET;
if (!jwtSecretFromEnv && !isDevelopment) {
  throw new Error('JWT_SECRET is required in non-development environments');
}

export const config = {
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
  jwtSecret: jwtSecretFromEnv || 'dev-only-insecure-jwt-secret',
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || 'file:bizcore.db',
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
  supportedLangs: ['en', 'ta'],
  defaultLang: 'en',
  isDevelopment,
  autoMigrateOnStartup: process.env.AUTO_MIGRATE_ON_STARTUP === 'true',
};
