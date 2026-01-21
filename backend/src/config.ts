import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = parseInt(process.env.PORT || '4000', 10);
export const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || undefined;
export const JWT_SECRET = process.env.JWT_SECRET || 'a5127b735bd1483599a6724aa49f7ec4';
export const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || 'http://127.0.0.1:8080';
export const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || '';

export const SUPPORTED_LANGS = ['en', 'ta'];
export const DEFAULT_LANG = 'en';
