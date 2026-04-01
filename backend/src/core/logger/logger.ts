import pino from 'pino';
import { config } from '../../config';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  base: null,
  // In development, use pretty-print transport if available
  transport: config.isDevelopment
    ? {
      target: 'pino/file',
      options: { destination: 1 }, // stdout
    }
    : {
      target: 'pino-elasticsearch',
      options: {
        node: 'http://localhost:9200'
      }
    }
});
