// import express from 'express';
// import 'express-serve-static-core';

// declare module 'express-serve-static-core' {
//   interface Request {
//     user?: {
//       id: number;
//       username: string;
//       isActive: boolean | null;
//     };

//     i18n?: {
//       lang: string;
//       locale: string;
//       // simple translator signature
//       t: (key: string, ...args: any[]) => string;
//     };
//   }
// }

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

// to make the file a module and avoid the TypeScript error
export {};
