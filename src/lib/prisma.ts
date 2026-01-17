// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Keep prisma client cached across hot-reloads in development
  // to prevent exhausting database connections
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Helper function to get database URL and log connection info
function getDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('[prisma] ❌ DATABASE_URL is not set!');
    throw new Error('DATABASE_URL environment variable is not set. Please configure it in Vercel environment variables.');
  }
  
  // Log connection info (without password)
  const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  const hasPooler = dbUrl.includes(':6543') || dbUrl.includes('pooler');
  const hasDirect = dbUrl.includes(':5432') && !hasPooler;
  
  console.log('[prisma] Database URL (safe):', safeUrl);
  if (process.env.VERCEL) {
    if (hasPooler) {
      console.log('[prisma] ✅ Using connection pooler (port 6543)');
    } else if (hasDirect) {
      console.warn('[prisma] ⚠️ Using direct connection (port 5432) - May not work in Vercel production!');
      console.warn('[prisma] 💡 Recommendation: Use connection pooler (port 6543) in Vercel environment variables');
    }
  }
  
  return dbUrl;
}

// Create Prisma client with connection pooling configuration
let prismaClient: PrismaClient;

try {
  const prismaClientOptions = {
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  };
  
  // Validate DATABASE_URL before creating client
  getDatabaseUrl(); // This will throw if DATABASE_URL is not set
  
  prismaClient = new PrismaClient(prismaClientOptions);
  console.log('[prisma] ✅ Prisma Client initialized');
} catch (error) {
  console.error('[prisma] ❌ Failed to initialize Prisma Client:', error);
  throw error;
}

// named export (existing code in repo expects `prisma`)
export const prisma = globalThis.prisma ?? prismaClient;

// cache on global in dev
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// default export added so files that do `import prisma from "@/lib/prisma"` also work
export default prisma;