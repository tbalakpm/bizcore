// src/utils/date.util.ts

export function getLocalYYYYMMDD(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function getLocalDate(): string {
  const localDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const d = new Date(localDate);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function isValidDateString(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export const normalizeDate = (date?: string): string => {
  if (!date) {
    return new Date().toISOString().slice(0, 10);
  }

  return date;
};


export class DateUtil {
  /**
   * Current UTC ISO string
   */
  static nowISO(): string {
    return new Date().toISOString();
  }

  /**
   * Current epoch (ms)
   */
  static nowEpoch(): number {
    return Date.now();
  }

  /**
   * Convert ISO → JS Date
   */
  static toDate(value: string | number | Date): Date {
    return new Date(value);
  }

  /**
   * Format for UI (local timezone)
   */
  static toLocalString(value: string | number | Date): string {
    return new Date(value).toLocaleString();
  }

  /**
   * Business date (YYYY-MM-DD)
   */
  static toBusinessDate(value?: Date): string {
    const d = value || new Date();
    return d.toISOString().split("T")[0];
  }

  /**
   * Start of day (UTC)
   */
  static startOfDayISO(date: string | Date): string {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
  }

  /**
   * End of day (UTC)
   */
  static endOfDayISO(date: string | Date): string {
    const d = new Date(date);
    d.setUTCHours(23, 59, 59, 999);
    return d.toISOString();
  }

  /**
   * Safe parse (avoid invalid date crashes)
   */
  static safe(value: any): Date | null {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
}