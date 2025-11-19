// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Keep prisma client cached across hot-reloads in development
  // to prevent exhausting database connections
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// named export (existing code in repo expects `prisma`)
export const prisma = globalThis.prisma ?? new PrismaClient();

// cache on global in dev
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// default export added so files that do `import prisma from "@/lib/prisma"` also work
export default prisma;