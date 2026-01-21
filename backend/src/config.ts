import dotenv from 'dotenv';

const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';
const dotenvConfigPath = isDevelopment ? './.env/.env.local' : './.env/.env.production';

dotenv.config({ path: dotenvConfigPath });

export const config = {
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
  jwtSecret: process.env.JWT_SECRET || 'a5127b735bd1483599a6724aa49f7ec4',
  tursoDatabaseUrl: process.env.TURSO_DATABASE_URL || 'file:bizcore.db',
  tursoAuthToken: process.env.TURSO_AUTH_TOKEN || '',
  supportedLangs: ['en', 'ta'],
  defaultLang: 'en',
};

// export const NODE_ENV = process.env.NODE_ENV || 'development';
// export const PORT = parseInt(process.env.PORT || '4000', 10);
// export const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || undefined;
// export const JWT_SECRET = process.env.JWT_SECRET || 'a5127b735bd1483599a6724aa49f7ec4';
// export const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || 'http://127.0.0.1:8080';
// export const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || '';
// export const SUPPORTED_LANGS = ['en', 'ta'];
// export const DEFAULT_LANG = 'en';
