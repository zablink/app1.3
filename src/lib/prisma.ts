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

// Lazy initialization function for Prisma client
function createPrismaClient(): PrismaClient {
  try {
    const prismaClientOptions = {
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    };
    
    // Check DATABASE_URL but don't throw if missing during build
    const dbUrl = process.env.DATABASE_URL;
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production';
    
    if (!dbUrl && isBuildTime) {
      // During build, return a client that won't connect to database
      // This prevents build failures when DATABASE_URL is not set
      console.warn('[prisma] ⚠️ DATABASE_URL not set during build - using fallback');
      return new PrismaClient(prismaClientOptions);
    }
    
    // Validate DATABASE_URL before creating client (only in runtime)
    if (!dbUrl) {
      console.error('[prisma] ❌ DATABASE_URL is not set!');
      throw new Error('DATABASE_URL environment variable is not set. Please configure it in Vercel environment variables.');
    }
    
    getDatabaseUrl(); // This will log connection info
    
    const client = new PrismaClient(prismaClientOptions);
    console.log('[prisma] ✅ Prisma Client initialized');
    return client;
  } catch (error) {
    console.error('[prisma] ❌ Failed to initialize Prisma Client:', error);
    // During build, don't throw - return a client that might fail later
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production';
    if (isBuildTime) {
      console.warn('[prisma] ⚠️ Continuing build with fallback client');
      return new PrismaClient({ log: ['error'] });
    }
    throw error;
  }
}

// Lazy initialization - only create when accessed
function getPrismaClient(): PrismaClient {
  if (globalThis.prisma) {
    return globalThis.prisma;
  }
  
  const client = createPrismaClient();
  
  // Cache on global in dev
  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = client;
  }
  
  return client;
}

// named export (existing code in repo expects `prisma`)
export const prisma = getPrismaClient();

// cache on global in dev
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// default export
export default prisma;
