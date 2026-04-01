import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';
const dotenvConfigPath = isDevelopment ? './.env/.env.local' : './.env/.env.production';

dotenv.config({ path: dotenvConfigPath });

const jwtSecretFromEnv = process.env.JWT_SECRET;
const jwtRefreshSecretFromEnv = process.env.JWT_REFRESH_SECRET;

if (!jwtSecretFromEnv && !isDevelopment) {
  throw new Error('JWT_SECRET is required in non-development environments');
}
if (!jwtRefreshSecretFromEnv && !isDevelopment) {
  throw new Error('JWT_REFRESH_SECRET is required in non-development environments');
}

export const config = {
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
  jwtSecret: jwtSecretFromEnv || 'dev-only-insecure-jwt-secret',
  jwtRefreshSecret: jwtRefreshSecretFromEnv || 'dev-only-insecure-refresh-secret',
  /** Access token lifetime in seconds */
  accessTokenExpirySeconds: parseInt(process.env.ACCESS_TOKEN_EXPIRY_SECONDS || '900', 10), // 15 min
  /** Refresh token lifetime in days */
  refreshTokenExpiryDays: parseInt(process.env.REFRESH_TOKEN_EXPIRY_DAYS || '7', 10),
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || 'file:bizcore.db',
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
  supportedLangs: ['en', 'ta'],
  defaultLang: 'en',
  isDevelopment,
  autoMigrateOnStartup: process.env.AUTO_MIGRATE_ON_STARTUP === 'true',
};
