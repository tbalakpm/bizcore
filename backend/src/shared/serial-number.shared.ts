import { db } from '../db';

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type SerialSequenceConfig = {
  prefix: string;
  length: number;
  start: number;
};

const pad = (value: number, length: number): string => value.toString().padStart(length, '0');

const julianDay = (date: Date): string => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const day = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  return pad(day, 3);
};

export const resolvePrefixTemplate = (template: string, date: Date): string => {
  const replacements: Record<string, string> = {
    YYYYMMDD: `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}`,
    YYMMDD: `${date.getFullYear().toString().slice(-2)}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}`,
    YYYY: `${date.getFullYear()}`,
    YY: date.getFullYear().toString().slice(-2),
    MM: pad(date.getMonth() + 1, 2),
    DD: pad(date.getDate(), 2),
    JJJ: julianDay(date),
  };

  return template.replace(/YYYYMMDD|YYMMDD|YYYY|YY|MM|DD|JJJ/g, (token) => replacements[token]);
};

export const formatSerialNumber = (prefix: string, value: number, length: number): string => {
  return `${prefix}${value.toString().padStart(length, '0')}`;
};
