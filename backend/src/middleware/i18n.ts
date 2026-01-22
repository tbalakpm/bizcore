import fs from 'node:fs';
import path from 'node:path';
import { NextFunction, Request, Response } from 'express';
import { config } from '../config';

// console.log('i18n-dirname', __dirname);

const translations: any = {};

for (const lang of config.supportedLangs) {
  const filePath = path.join(__dirname, '..', 'i18n', `${lang}.json`);
  translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function i18nMiddleware(req: Request, _res: Response, next: NextFunction) {
  const headerLang = req.headers['accept-language'];
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
