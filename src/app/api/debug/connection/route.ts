// src/app/api/debug/connection/route.ts
// Comprehensive database connection debug endpoint

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      NEXT_PHASE: process.env.NEXT_PHASE,
    },
    database: {
      urlConfigured: !!process.env.DATABASE_URL,
      urlSafe: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')
        : null,
      urlType: null as string | null,
      connectionStatus: 'unknown' as string,
      error: null as string | null,
    },
    prisma: {
      initialized: false,
      error: null as string | null,
    },
    tests: {
      basicQuery: null as any,
      tableCheck: null as any,
      shopCount: null as any,
    },
  };

  try {
    // 1. Check DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      debugInfo.database.connectionStatus = 'failed';
      debugInfo.database.error = 'DATABASE_URL is not set';
      return NextResponse.json(debugInfo, { status: 500 });
    }

    // 2. Determine connection type
    if (dbUrl.includes(':6543') || dbUrl.includes('pooler')) {
      debugInfo.database.urlType = 'connection-pooler';
    } else if (dbUrl.includes(':5432')) {
      debugInfo.database.urlType = 'direct-connection';
    } else {
      debugInfo.database.urlType = 'unknown';
    }

    // 3. Test Prisma Client initialization
    try {
      debugInfo.prisma.initialized = true;
    } catch (error) {
      debugInfo.prisma.initialized = false;
      debugInfo.prisma.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 4. Test basic database connection
    try {
      const basicResult = await prisma.$queryRaw`SELECT 1 as test`;
      debugInfo.tests.basicQuery = {
        success: true,
        result: basicResult,
      };
      debugInfo.database.connectionStatus = 'connected';
    } catch (error) {
      debugInfo.tests.basicQuery = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.name : 'Unknown',
      };
      debugInfo.database.connectionStatus = 'failed';
      debugInfo.database.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // 5. Test table existence
    try {
      const tableCheck = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'Shop'
        ) as exists`
      );
      debugInfo.tests.tableCheck = {
        success: true,
        shopTableExists: tableCheck[0]?.exists || false,
      };
    } catch (error) {
      debugInfo.tests.tableCheck = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // 6. Test shop count (only if connection works)
    if (debugInfo.database.connectionStatus === 'connected') {
      try {
        const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          'SELECT COUNT(*) as count FROM "Shop"'
        );
        debugInfo.tests.shopCount = {
          success: true,
          count: Number(countResult[0]?.count || 0),
        };
      } catch (error) {
        debugInfo.tests.shopCount = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // 7. Test SiteSetting table
    if (debugInfo.database.connectionStatus === 'connected') {
      try {
        const settingsCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          'SELECT COUNT(*) as count FROM "SiteSetting"'
        );
        debugInfo.tests.settingsCount = {
          success: true,
          count: Number(settingsCount[0]?.count || 0),
        };
      } catch (error) {
        debugInfo.tests.settingsCount = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // 8. Check connection pooler recommendation
    if (process.env.VERCEL && debugInfo.database.urlType === 'direct-connection') {
      debugInfo.recommendations = [
        '⚠️ Using direct connection (port 5432) in Vercel production',
        '💡 Recommendation: Use connection pooler (port 6543)',
        '📝 Update DATABASE_URL in Vercel to use port 6543',
      ];
    }

    return NextResponse.json(debugInfo, {
      status: debugInfo.database.connectionStatus === 'connected' ? 200 : 500,
    });
  } catch (error) {
    debugInfo.error = {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    };
    return NextResponse.json(debugInfo, { status: 500 });
  }
}
