import { db, customers, salesInvoices } from './src/db';
import { eq, desc, asc } from 'drizzle-orm';

async function test() {
  console.log("Running query...");
  const data = await db.select({
      id: salesInvoices.id,
      customerName: customers.name
    })
    .from(salesInvoices)
    .leftJoin(customers, eq(customers.id, salesInvoices.customerId))
    .orderBy(asc(customers.name))
    .limit(5)
    .all();
  console.log("Result:", data);
}
test().catch(console.error);
