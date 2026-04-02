import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import express, { type Request, type Response } from 'express';
import { db, users } from '../db';
import { isStrongPassword } from '../utils/password.util';
import { LogService } from '../core/logger/logger.service';
import { auditLog } from '../core/logger/audit.service';

export const profileRouter = express.Router();

const userProfileSelect = {
  id: users.id,
  username: users.username,
  firstName: users.firstName,
  lastName: users.lastName,
  role: users.role,
  permissions: users.permissions,
  isActive: users.isActive,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

profileRouter.get('/', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await db
    .select(userProfileSelect)
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json(user);
});

profileRouter.put('/', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { firstName, lastName } = req.body;

  const oldUser = await db
    .select(userProfileSelect)
    .from(users)
    .where(eq(users.id, userId))
    .get();

  await db
    .update(users)
    .set({ firstName, lastName })
    .where(eq(users.id, userId))
    .run();

  const updatedUser = await db
    .select(userProfileSelect)
    .from(users)
    .where(eq(users.id, userId))
    .get();

  await auditLog({
    action: 'UPDATE_PROFILE',
    entity: 'USER',
    entityId: userId,
    oldValue: oldUser,
    newValue: updatedUser,
  });

  res.json(updatedUser);
});

profileRouter.post('/change-password', async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body;

  const user = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ error: 'Current password incorrect' });

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: 'New password is too weak' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: false })
    .where(eq(users.id, userId))
    .run();

  await auditLog({
    action: 'CHANGE_PASSWORD',
    entity: 'USER',
    entityId: userId,
  });

  res.json({ message: 'Password changed successfully' });
});
