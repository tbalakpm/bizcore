import { Server } from 'node:http';
import { app } from './app';

/* ✅ Graceful shutdown */
const shutdown = (server: Server) => {
  console.log('🛑 Shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

app()
  .then(({ express, port }) => {
    const server = express.listen(port, () => {
      console.log(`Server (api) listening on http://localhost:${port}`);
    });

    process.on('SIGINT', () => shutdown(server)); // Ctrl+C
    process.on('SIGTERM', () => shutdown(server)); // kill
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });
