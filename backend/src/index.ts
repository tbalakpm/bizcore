import { Server } from 'node:http';
import { app } from './app';
import { LogService } from './core/logger/logger.service';

/* ✅ Graceful shutdown */
const shutdown = (server: Server) => {
  LogService.info('🛑 Shutting down...');

  server.close(() => {
    LogService.info('✅ Server closed');
    process.exit(0);
  });
};

app()
  .then(({ express, port }) => {
    const server = express.listen(port, () => {
      LogService.info(`Server (api) listening on http://localhost:${port}`);
    });

    process.on('SIGINT', () => shutdown(server)); // Ctrl+C
    process.on('SIGTERM', () => shutdown(server)); // kill
  })
  .catch((err) => {
    LogService.error('Failed to start server:', err);
    process.exit(1);
  });
