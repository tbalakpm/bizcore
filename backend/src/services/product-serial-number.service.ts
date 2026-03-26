import { asc, eq, sql } from 'drizzle-orm';
import { db, productSerialNumbers, products, settings } from '../db';
import { serialNumberService } from './serial-number.service';
import {
  type DbTransaction,
  formatSerialNumber,
  resolvePrefixTemplate,
  incrementPrefixTemplate,
  type SerialSequenceConfig,
} from '../shared/serial-number.shared';

const MODES = {
  manual: 'manual',
  auto: 'auto'
} as const;

const SERIAL_TYPES = {
  code: 'code',
  batch: 'batch',
  tag: 'tag',
  manual: 'manual'
} as const;

export type ProductSerialMode = (typeof MODES)[keyof typeof MODES];
export type ProductSerialType = (typeof SERIAL_TYPES)[keyof typeof SERIAL_TYPES];

type GenerateProductSerialParams = {
  productId: number;
  mode: ProductSerialMode;
  serialType: ProductSerialType;
  date?: Date;
  tx?: DbTransaction;
};

// const defaultConfigBySerialType: Record<ProductSerialType, SerialSequenceConfig> = {
//   [SERIAL_TYPES.tagNumber]: { prefix: 'TAG-', length: 10, start: 1 },
//   [SERIAL_TYPES.batchNumber]: { prefix: 'BAT-', length: 10, start: 1 },
// };

const requiresCounter = (mode: ProductSerialMode, serialType: ProductSerialType): boolean =>
  mode === MODES.auto &&
  (serialType === SERIAL_TYPES.tag || serialType === SERIAL_TYPES.batch);

export const productSerialNumberService = {
  modes: MODES,
  serialTypes: SERIAL_TYPES,

  resolveGtnConfiguration: async (productId: number, tx: DbTransaction): Promise<{ mode: ProductSerialMode, generation: ProductSerialType }> => {
    const product = await tx.select().from(products).where(eq(products.id, productId)).get();
    if (!product) throw new Error(`Product not found: ${productId}`);

    let useGlobal = product.useGlobal;
    let gtnMode = product.gtnMode;
    let gtnGeneration = product.gtnGeneration;

    if (useGlobal) {
      const globalSettings = await tx.select().from(settings).all();
      const settingsMap = new Map(globalSettings.map(s => [s.key, s.value]));

      const globalUseGtn = settingsMap.get('use_global_gtn');
      if (globalUseGtn === 'false') {
        return { mode: 'manual', generation: 'manual' };
      }

      gtnMode = (settingsMap.get('gtn_mode') || 'auto') as ProductSerialMode;
      gtnGeneration = (settingsMap.get('gtn_generation') || 'code') as ProductSerialType;
    }

    // Map 'global' value to actual defaults if necessary, though the logic above should have handled it if useGlobal is true.
    // However, if useGlobal is false but the product fields are still 'global' (unlikely but possible), we should handle it.
    if (gtnMode === 'global') gtnMode = 'auto';
    if (gtnGeneration === 'global') gtnGeneration = 'code';

    return {
      mode: gtnMode as ProductSerialMode,
      generation: gtnGeneration as ProductSerialType
    };
  },

  generateGtn: async (productId: number, tx: DbTransaction): Promise<string> => {
    const config = await productSerialNumberService.resolveGtnConfiguration(productId, tx);

    if (config.mode === 'manual') return '';

    const genType = config.generation.toLowerCase();

    if (genType === 'code') {
      const product = await tx.select().from(products).where(eq(products.id, productId)).get();
      return product?.code || '';
    }

    if (genType === 'batch' || genType === 'tag') {
      const product = await tx.select().from(products).where(eq(products.id, productId)).get();
      if (!product) throw new Error(`Product not found: ${productId}`);

      if (product.useGlobal) {
        // Use global sequence 'gtn' from serial_numbers table
        return await serialNumberService.generateNextNumberInTransaction('gtn', tx);
      } else {
        // Use product specific sequence from product_serial_numbers table
        return await productSerialNumberService.generateInTransaction({
          productId,
          mode: config.mode,
          serialType: genType as ProductSerialType,
          tx: tx,
          date: new Date()
        });
      }
    }

    return '';
  },

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
      serialType: SERIAL_TYPES.tag,
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
      serialType: SERIAL_TYPES.batch,
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
    const [product] = await tx.select({
      id: products.id,
      code: products.code,
      prefix: productSerialNumbers.prefix,
      current: productSerialNumbers.current,
      length: productSerialNumbers.length,
    }).from(products)
      .leftJoin(productSerialNumbers, eq(productSerialNumbers.productId, products.id))
      .where(eq(products.id, productId)).limit(1);

    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    if (!requiresCounter(mode, serialType)) {
      return product.code;
    }

    // const config = defaultConfigBySerialType[serialType];

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
        prefix: product.prefix || 'AA',
        current: product.current || 1,
        length: product.length || 10,
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
