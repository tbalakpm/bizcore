import { eq, sql } from 'drizzle-orm';
import { serialNumbers } from '../db';

export const serialNumberService = {
  //   testTran: async () => {
  //     await db.transaction(async (tx) => {
  //         await tx.insert
  //       // Example usage of the generateSerialNumber function
  //       const serialNumber = serialNumberService.generateSerialNumber('product123', tx);
  //       console.log('Generated Serial Number:', serialNumber);
  //     });
  //   },

  incrementSerialNumber: (key: string, tx: any): string => {
    // Generate a unique serial number based on the key and current timestamp
    tx.update(serialNumbers)
      .set({ current: sql`${serialNumbers.current} + 1` })
      .where(eq(serialNumbers.key, key))
      .run();

    const currentRecord = tx.select().from(serialNumbers).where(eq(serialNumbers.key, key)).get();

    const serialNumber = `${currentRecord.prefix}${currentRecord.current.toString().padStart(currentRecord.length, '0')}`;
    return serialNumber;

    // const timestamp = Date.now();
    // const randomPart = Math.floor(Math.random() * 10000); // Random number for extra uniqueness
    // return `${key}-${timestamp}-${randomPart}`;
  },
};
