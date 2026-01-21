// src/types/express.d.ts
/** biome-ignore-all lint/correctness/noUnusedImports: Ignore */
/** biome-ignore-all lint/suspicious/noExplicitAny: Ignore */
import express from 'express';

declare module 'cors';

declare global {
  namespace Express {
    interface Request {
      // optional user set by auth middleware
      user?: {
        id: number;
        username?: string;
        isActive?: boolean | null;
        // add anything else you need
      };

      // i18n helper set by i18n middleware
      i18n?: {
        lang: string;
        locale: string;
        // simple translator signature
        t: (key: string, ...args: any[]) => string;
      };
    }
  }
}
