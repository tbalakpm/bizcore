import cors from 'cors';
import express, { type Request, type Response } from 'express';

import { PORT, CORS_ORIGINS } from './config';
import { initializeDatabase } from './db';
import { i18nMiddleware } from './middleware/i18n';

import { authRouter } from './routes/auth';
import { categoriesRouter } from './routes/categories';
import { entryRouter } from './routes/entries';
import { registersRouter } from './routes/registers';
import path from 'node:path';

console.log('Starting server...');

async function start() {
  await initializeDatabase();
  const app = express();

  app.use(
    cors({
      origin: CORS_ORIGINS!,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json());
  app.use(i18nMiddleware);

  // Serve the static files from the Angular dist directory
  // Replace 'my-angular-app' with your actual project name from the dist folder
  app.use(express.static(path.join(__dirname, '/public')));

  app.get('/api/health', (req: Request, res: Response): void => {
    res.json({ status: 'ok', lang: req.i18n?.lang || 'en' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/categories', categoriesRouter);
  app.use('/api/registers', registersRouter);
  app.use('/api/entries', entryRouter);

  // Handle any requests that don't match the static files by serving the index.html file
  app.get('/{*any}', (_req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html')); //
  });

  // await sequelize.sync();

  app.listen(PORT, () => {
    console.log(`Server (api) listening on http://localhost:${PORT}`);
  });
}

start()
  .then(() => {
    console.log('Server started successfully');
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });
