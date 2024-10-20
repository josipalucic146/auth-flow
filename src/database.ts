import { PrismaClient, Role } from '@prisma/client';
import { encryptPassword } from './models/userModel';

export const prisma = new PrismaClient();

async function createFirstAdmin() {
  const user = await prisma.user.findUnique({
    where: {
      email: process.env.ADMIN_USER_EMAIL as string,
    },
  });

  if (!user) {
    const password = await encryptPassword(
      process.env.ADMIN_USER_PASSWORD as string,
    );
    await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Admin',
        email: process.env.ADMIN_USER_EMAIL as string,
        password,
        role: Role.ADMIN,
      },
    });
  }
}

export async function connect() {
  await prisma.$connect();

  await createFirstAdmin();

  console.log('Database connected');
}

export async function disconnect() {
  await prisma.$disconnect();
  console.log('Database disconnected');
}
