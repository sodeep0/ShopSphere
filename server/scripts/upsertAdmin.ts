import dotenv from 'dotenv';
import { Logger } from '../utils/logger';

dotenv.config();

import bcrypt from 'bcrypt';

const logger = new Logger();

async function upsertAdmin() {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;

  if (!email || !password) {
    logger.error('EMAIL and PASSWORD must be set in the environment');
    process.exit(1);
  }

  try {
    const [{ db }, { users }, drizzle] = await Promise.all([
      import('../db'),
      import('@shared/schema'),
      import('drizzle-orm')
    ]);

    const { eq } = await import('drizzle-orm');

    const hashed = await bcrypt.hash(password, 10);

    // Try to find existing user
    const existing = await db.select().from(users).where(eq(users.email, email));

    if (existing.length > 0) {
      // Update password and role to admin
      const user = existing[0];
      await db.update(users).set({ password: hashed, role: 'admin', updatedAt: new Date() }).where(eq(users.id, user.id));
      logger.info(`Updated existing user (${email}) to admin and set new password.`);
      logger.info('userId:', { userId: user.id });
    } else {
      // Insert new admin user
      const [inserted] = await db.insert(users).values({
        email,
        password: hashed,
        name: 'Admin User',
        phone: null,
        role: 'admin',
      }).returning();

      logger.info(`Inserted new admin user (${email}).`);
      logger.info('userId:', { userId: inserted.id });
    }

    process.exit(0);
  } catch (err) {
    logger.error('Failed to upsert admin', err as Error);
    process.exit(1);
  }
}

upsertAdmin();
