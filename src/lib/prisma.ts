// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // Keep prisma client cached across hot-reloads in development
  // to prevent exhausting database connections
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Helper function to get database URL with connection pooling for production
function getDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // In production (Vercel), use connection pooler if available
  // Supabase connection pooler uses port 6543 or pooler subdomain
  if (process.env.VERCEL && dbUrl.includes('supabase.co')) {
    // Check if already using pooler
    if (dbUrl.includes(':6543') || dbUrl.includes('pooler')) {
      return dbUrl;
    }
    
    // Convert direct connection to pooler connection
    // Replace port 5432 with 6543 for connection pooler
    const poolerUrl = dbUrl.replace(':5432/', ':6543/');
    console.log('[prisma] Using connection pooler for production');
    return poolerUrl;
  }
  
  return dbUrl;
}

// Create Prisma client with connection pooling configuration
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
};

// named export (existing code in repo expects `prisma`)
export const prisma = globalThis.prisma ?? new PrismaClient(prismaClientOptions);

// cache on global in dev
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// default export added so files that do `import prisma from "@/lib/prisma"` also work
export default prisma;