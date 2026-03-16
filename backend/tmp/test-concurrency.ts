
import { db, initializeDatabase } from '../src/db';
import { users } from '../src/db/schema';
import { eq, like } from 'drizzle-orm';

async function runTest() {
  await initializeDatabase();

  console.log('Starting concurrency test...');
  const concurrentWrites = 20;
  const promises = [];

  for (let i = 0; i < concurrentWrites; i++) {
    promises.push(
      (async () => {
        try {
          // Simulate a write operation
          const timestamp = Date.now().toString().slice(-8);
          await db.insert(users).values({
            username: `u_${timestamp}_${i}`.substring(0, 20),
            passwordHash: 'hashed_password',
            firstName: 'Test',
            lastName: `User ${i}`,
            role: 'user'
          });
          console.log(`Write ${i} successful`);
        } catch (error: any) {
          console.error(`Write ${i} failed:`, error.message);
        }
      })()
    );
  }

  await Promise.all(promises);
  console.log('Concurrency test completed.');

  // Cleanup
  await db.delete(users).where(like(users.username, 'u_%'));
}

runTest().catch(console.error);
