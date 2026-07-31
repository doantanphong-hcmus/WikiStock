import { hash } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME?.trim();

  if (!email || !password || password.length < 12) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD with at least 12 characters are required',
    );
  }

  const prisma = new PrismaService();
  try {
    const existingUser = await prisma.appUser.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error(`User ${email} already exists`);
    }

    const [adminRole] = await Promise.all([
      prisma.userRole.upsert({
        where: { roleName: 'admin' },
        update: {},
        create: { roleName: 'admin' },
      }),
      prisma.userRole.upsert({
        where: { roleName: 'user' },
        update: {},
        create: { roleName: 'user' },
      }),
    ]);

    await prisma.appUser.create({
      data: {
        email,
        passwordHash: await hash(password, 12),
        fullName,
        roleId: adminRole.roleId,
      },
    });

    console.log(`Created admin user ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

void createAdmin().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Could not create admin',
  );
  process.exitCode = 1;
});
