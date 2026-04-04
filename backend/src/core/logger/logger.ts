import pino from 'pino';
import * as rfs from 'rotating-file-stream';
import path from 'path';
import fs from 'fs';
import { config } from '../../config';

let loggerInstance;

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const fileStream = rfs.createStream((date, index) => {
  if (!date) date = new Date();
  const d = (date as Date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `bizcore-${yyyy}${mm}${dd}${index ? `-${index}` : ""}.log`;
}, {
  interval: '1d',
  path: logDir
});

if (config.isDevelopment) {
  const consolePrettyStream = require('pino-pretty')({
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  });

  const filePrettyStream = require('pino-pretty')({
    colorize: false,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
    destination: fileStream
  });

  loggerInstance = pino(
    {
      level: config.logLevel,
      timestamp: pino.stdTimeFunctions.isoTime,
      base: null,
    },
    pino.multistream([
      { stream: consolePrettyStream },
      { stream: filePrettyStream }
    ])
  );
} else {
  loggerInstance = pino({
    level: config.logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    base: null,
    transport: {
      target: 'pino-elasticsearch',
      options: {
        node: 'http://localhost:9200'
      }
    }
  }, pino.multistream([
    { stream: fileStream }
  ]));
}

export const logger = loggerInstance;
