import { PrismaClient } from '@prisma/client';

declare global {
  // allow reuse of PrismaClient during hot-reloads in development
  // eslint-disable-next-line no-var
  var __prismaClient__: PrismaClient | undefined;
}

export const prisma: PrismaClient = global.__prismaClient__ ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prismaClient__ = prisma;
}
