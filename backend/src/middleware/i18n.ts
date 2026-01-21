/** biome-ignore-all lint/suspicious/noExplicitAny: Ignore */
/** biome-ignore-all lint/style/useImportType: Ignore */
import fs from 'node:fs';
import path from 'node:path';
// import { fileURLToPath } from "node:url";
import { NextFunction, Request, Response } from 'express';
import { config } from '../config';

// const __filename = "./src"; //fileURLToPath(import.meta.url);
// const __dirname = ".src/middleware/"; //path.dirname(__filename);

const translations: any = {};

for (const lang of config.supportedLangs) {
  const filePath = path.join(__dirname, '..', 'i18n', `${lang}.json`);
  translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function i18nMiddleware(req: Request, _res: Response, next: NextFunction) {
  const headerLang = req.headers['accept-language']; // || req.headers["Accept-Language"];
  let lang = config.defaultLang;

  if (headerLang) {
    const short = headerLang.split(',')[0].split('-')[0];
    if (config.supportedLangs.includes(short)) lang = short;
  }

  // req.i118n.lang = lang;
  req.i18n = {
    lang,
    locale: lang, // for compatibility
    t: (key: string) => translations[lang][key] || translations[config.defaultLang][key] || key,
  };

  next();
}
