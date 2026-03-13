import { asc, eq, sql } from 'drizzle-orm';
import { db, productSerialNumbers, products } from '../db';
import {
  type DbTransaction,
  formatSerialNumber,
  resolvePrefixTemplate,
  type SerialSequenceConfig,
} from '../shared/serial-number.shared';

const MODES = {
  globalProductSerial: 'global_product_serial',
  eachProduct: 'each_product',
  productCodeAsTagBatch: 'product_code_as_tag_batch',
} as const;

const SERIAL_TYPES = {
  tagNumber: 'tag_number',
  batchNumber: 'batch_number',
} as const;

type ProductSerialMode = (typeof MODES)[keyof typeof MODES];
type ProductSerialType = (typeof SERIAL_TYPES)[keyof typeof SERIAL_TYPES];

type GenerateProductSerialParams = {
  productId: number;
  mode: ProductSerialMode;
  serialType: ProductSerialType;
  date?: Date;
  tx?: DbTransaction;
};

const defaultConfigBySerialType: Record<ProductSerialType, SerialSequenceConfig> = {
  [SERIAL_TYPES.tagNumber]: { prefix: 'TAG-', length: 10, start: 1 },
  [SERIAL_TYPES.batchNumber]: { prefix: 'BAT-', length: 10, start: 1 },
};

const resolveCounterKey = (mode: ProductSerialMode, serialType: ProductSerialType, productId: number): string => {
  if (mode === MODES.globalProductSerial) {
    return `${serialType}:global`;
  }

  if (mode === MODES.eachProduct) {
    return `${serialType}:product:${productId}`;
  }

  return `${serialType}:product_code:${productId}`;
};

const requiresCounter = (mode: ProductSerialMode): boolean => mode !== MODES.productCodeAsTagBatch;

export const productSerialNumberService = {
  modes: MODES,
  serialTypes: SERIAL_TYPES,

  generate: async ({
    productId,
    mode,
    serialType,
    date = new Date(),
    tx,
  }: GenerateProductSerialParams): Promise<string> => {
    if (tx) {
      return productSerialNumberService.generateInTransaction({ productId, mode, serialType, date, tx });
    }

    return db.transaction(async (transaction) => {
      return productSerialNumberService.generateInTransaction({
        productId,
        mode,
        serialType,
        date,
        tx: transaction,
      });
    });
  },

  generateTagNumber: async (
    productId: number,
    mode: ProductSerialMode,
    tx?: DbTransaction,
    date: Date = new Date(),
  ): Promise<string> => {
    return productSerialNumberService.generate({
      productId,
      mode,
      serialType: SERIAL_TYPES.tagNumber,
      tx,
      date,
    });
  },

  generateBatchNumber: async (
    productId: number,
    mode: ProductSerialMode,
    tx?: DbTransaction,
    date: Date = new Date(),
  ): Promise<string> => {
    return productSerialNumberService.generate({
      productId,
      mode,
      serialType: SERIAL_TYPES.batchNumber,
      tx,
      date,
    });
  },

  generateInTransaction: async ({
    productId,
    mode,
    serialType,
    date,
    tx,
  }: GenerateProductSerialParams & { tx: DbTransaction; date: Date }): Promise<string> => {
    const [product] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    if (!requiresCounter(mode)) {
      return product.code;
    }

    const key = resolveCounterKey(mode, serialType, productId);
    const config = defaultConfigBySerialType[serialType];

    let [currentRecord] = await tx
      .select()
      .from(productSerialNumbers)
      .where(eq(productSerialNumbers.productId, productId))
      .orderBy(asc(productSerialNumbers.id))
      .limit(1);

    if (!currentRecord) {
      await tx.insert(productSerialNumbers).values({
        productId: mode === MODES.eachProduct ? productId : null,
        prefix: config.prefix,
        current: config.start,
        length: config.length,
      });

      [currentRecord] = await tx
        .select()
        .from(productSerialNumbers)
        .where(eq(productSerialNumbers.productId, productId))
        .orderBy(asc(productSerialNumbers.id))
        .limit(1);
    }

    if (!currentRecord) {
      throw new Error(`Unable to initialize product serial number for key: ${key}`);
    }

    const [updatedRecord] = await tx
      .update(productSerialNumbers)
      .set({ current: sql`${productSerialNumbers.current} + 1` })
      .where(eq(productSerialNumbers.id, currentRecord.id))
      .returning({ current: productSerialNumbers.current });

    if (!updatedRecord) {
      throw new Error(`Unable to increment product serial number for key: ${key}`);
    }

    const serialValue = updatedRecord.current - 1;
    const prefix = resolvePrefixTemplate(currentRecord.prefix, date);

    return formatSerialNumber(prefix, serialValue, currentRecord.length);
  },
};
