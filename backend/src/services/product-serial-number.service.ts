import { asc, eq, sql } from 'drizzle-orm';
import { db, productSerialNumbers, products } from '../db';
import {
  type DbTransaction,
  formatSerialNumber,
  resolvePrefixTemplate,
  incrementPrefixTemplate,
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

    const config = defaultConfigBySerialType[serialType];

    let [currentRecord] = await tx
      .select()
      .from(productSerialNumbers)
      .where(eq(productSerialNumbers.productId, productId))
      .orderBy(asc(productSerialNumbers.id))
      .limit(1);

    if (!currentRecord) {
      // Create a default one if not exists (though the product route should have created it)
      // Use the product's configured prefix and start position if available
      await tx.insert(productSerialNumbers).values({
        productId,
        prefix: product.gtnPrefix || config.prefix,
        current: product.gtnStartPos || config.start,
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
      throw new Error(`Unable to initialize product serial number for productId: ${productId}`);
    }

    let finalPrefix = currentRecord.prefix;
    let finalValue = currentRecord.current;
    
    // Check for overflow (numeric sequence exhaustion)
    const maxValue = Math.pow(10, currentRecord.length) - 1;
    if (finalValue > maxValue) {
      // Roll over prefix and reset current to 1
      finalPrefix = incrementPrefixTemplate(finalPrefix);
      finalValue = 1;
      
      await tx
        .update(productSerialNumbers)
        .set({ 
          prefix: finalPrefix,
          current: 2 // We are issuing 1 now, so next is 2
        })
        .where(eq(productSerialNumbers.id, currentRecord.id))
        .run();
    } else {
      await tx
        .update(productSerialNumbers)
        .set({ current: sql`${productSerialNumbers.current} + 1` })
        .where(eq(productSerialNumbers.id, currentRecord.id))
        .run();
    }

    const resolvedPrefix = resolvePrefixTemplate(finalPrefix, date);
    return formatSerialNumber(resolvedPrefix, finalValue, currentRecord.length);
  },
};
