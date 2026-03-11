import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Running manual SQLite migration...');
  
  try {
    await db.run(sql`ALTER TABLE sales_invoices ADD COLUMN \`irn\` text(64)`);
    console.log('Added irn column.');
  } catch (e) {
    console.log('irn column might already exist:', (e as Error).message);
  }

  try {
    await db.run(sql`ALTER TABLE sales_invoices ADD COLUMN \`ack_no\` text(20)`);
    console.log('Added ack_no column.');
  } catch (e) {
    console.log('ack_no column might already exist:', (e as Error).message);
  }

  try {
    await db.run(sql`ALTER TABLE sales_invoices ADD COLUMN \`ack_date\` text(50)`);
    console.log('Added ack_date column.');
  } catch (e) {
    console.log('ack_date column might already exist:', (e as Error).message);
  }

  try {
    await db.run(sql`ALTER TABLE sales_invoices ADD COLUMN \`signed_qr_code\` text`);
    console.log('Added signed_qr_code column.');
  } catch (e) {
    console.log('signed_qr_code column might already exist:', (e as Error).message);
  }

  console.log('Migration complete!');
  process.exit(0);
}

runMigration().catch(console.error);
