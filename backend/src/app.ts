import path from 'node:path';
import cors from 'cors';
import express, { NextFunction, type Request, type Response } from 'express';

import { config } from './config';
import { initializeDatabase, migrateDatabase } from './db';
import { i18nMiddleware } from './middleware/i18n';

import { authRouter } from './routes/auth';
import { categoriesRouter } from './routes/categories';
import { authRequired } from './middleware/auth';
import { usersRouter } from './routes/users';
import { productsRouter } from './routes/products';
import { customersRouter } from './routes/customers';

export async function app() {
  console.log(`Environment: ${config.environment}`);
  await initializeDatabase();
  await migrateDatabase();

  const app = express();
  app.use(
    cors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(i18nMiddleware);

  // Serve the static files from the Angular dist directory
  // Replace 'my-angular-app' with your actual project name from the dist folder
  app.use(express.static(path.join(__dirname, '/public')));

  app.get('/api/health', (req: Request, res: Response, next: NextFunction): void => {
    res.json({ status: 'ok', username: req.user?.username || '', lang: req.i18n?.lang || 'en' });
    // next();
  });
  app.use('/api/auth', authRouter);
  app.use('/api/users', authRequired, usersRouter);
  app.use('/api/categories', authRequired, categoriesRouter);
  app.use('/api/products', authRequired, productsRouter);
  app.use('/api/customers', authRequired, customersRouter);

  // Handle any requests that don't match the static files by serving the index.html file
  app.get('/{*any}', (_req, res, next) => {
    res.sendFile(path.join(__dirname, '/public/index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });

  return { express: app, port: config.port };
}
