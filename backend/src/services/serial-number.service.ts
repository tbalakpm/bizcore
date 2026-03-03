import { asc, eq, sql } from 'drizzle-orm';
import { db, serialNumbers } from '../db';
import {
  type DbTransaction,
  formatSerialNumber,
  resolvePrefixTemplate,
  type SerialSequenceConfig,
} from '../shared/serial-number.shared';

const SERIAL_KEYS = {
  stockInvoice: 'stock_invoice',
  salesInvoice: 'sales_invoice',
  purchaseInvoice: 'purchase_invoice',
} as const;

type InvoiceSerialType = keyof typeof SERIAL_KEYS;

const defaultSerialConfig: Record<string, SerialSequenceConfig> = {
  [SERIAL_KEYS.stockInvoice]: { prefix: 'STK-', length: 6, start: 1 },
  [SERIAL_KEYS.salesInvoice]: { prefix: 'INV-', length: 6, start: 1 },
  [SERIAL_KEYS.purchaseInvoice]: { prefix: 'PUR-', length: 6, start: 1 },
};

export const serialNumberService = {
  keys: SERIAL_KEYS,

  generateInvoiceNumber: async (
    type: InvoiceSerialType,
    tx?: DbTransaction,
    date: Date = new Date(),
  ): Promise<string> => {
    const key = SERIAL_KEYS[type];
    if (!key) {
      throw new Error(`Unsupported serial number type: ${type}`);
    }

    if (tx) {
      return serialNumberService.generateNextNumberInTransaction(key, tx, date);
    }

    return db.transaction(async (transaction) => {
      return serialNumberService.generateNextNumberInTransaction(key, transaction, date);
    });
  },

  generateNextNumberInTransaction: async (key: string, tx: DbTransaction, date: Date = new Date()): Promise<string> => {
    const config = defaultSerialConfig[key] ?? {
      prefix: `${key.toUpperCase()}-`,
      length: 6,
      start: 1,
    };

    let [currentRecord] = await tx
      .select()
      .from(serialNumbers)
      .where(eq(serialNumbers.key, key))
      .orderBy(asc(serialNumbers.id))
      .limit(1);

    if (!currentRecord) {
      await tx.insert(serialNumbers).values({
        key,
        prefix: config.prefix,
        current: config.start,
        length: config.length,
      });

      [currentRecord] = await tx
        .select()
        .from(serialNumbers)
        .where(eq(serialNumbers.key, key))
        .orderBy(asc(serialNumbers.id))
        .limit(1);
    }

    if (!currentRecord) {
      throw new Error(`Unable to initialize serial number configuration for key: ${key}`);
    }

    const [updatedRecord] = await tx
      .update(serialNumbers)
      .set({ current: sql`${serialNumbers.current} + 1` })
      .where(eq(serialNumbers.id, currentRecord.id))
      .returning({ current: serialNumbers.current });

    if (!updatedRecord) {
      throw new Error(`Unable to increment serial number for key: ${key}`);
    }

    const serialValue = updatedRecord.current - 1;
    const prefix = resolvePrefixTemplate(currentRecord.prefix ?? config.prefix, date);

    return formatSerialNumber(prefix, serialValue, currentRecord.length);
  },
};
