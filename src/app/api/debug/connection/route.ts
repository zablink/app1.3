// src/app/api/debug/connection/route.ts
// Comprehensive database connection debug endpoint

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const recommendations: string[] = [];
    
    if (process.env.VERCEL && debugInfo.database.urlType === 'direct-connection') {
      recommendations.push('⚠️ Using direct connection (port 5432) in Vercel production');
      recommendations.push('💡 Recommendation: Use connection pooler (port 6543)');
      recommendations.push('📝 Update DATABASE_URL in Vercel to use port 6543');
    }
    
    // 9. If connection failed with pooler, suggest alternatives
    if (debugInfo.database.connectionStatus === 'failed' && debugInfo.database.urlType === 'connection-pooler') {
      if (!process.env.VERCEL) {
        recommendations.push('⚠️ Connection failed with pooler (port 6543)');
        recommendations.push('💡 For local development, try direct connection (port 5432)');
        recommendations.push('📝 Update DATABASE_URL to use port 5432 instead of 6543');
      } else {
        recommendations.push('⚠️ Connection failed with pooler (port 6543)');
        recommendations.push('💡 Check Supabase Dashboard → Settings → Database → Connection Pooling');
        recommendations.push('💡 Verify Supabase project is not paused or suspended');
        recommendations.push('💡 Check network connectivity and firewall settings');
        recommendations.push('💡 Try using pooler subdomain: pooler.gysckclnnitkgafvdkno.supabase.co:5432');
      }
    }
    
    if (recommendations.length > 0) {
      debugInfo.recommendations = recommendations;
    }
    
    // 10. Add troubleshooting info
    if (debugInfo.database.connectionStatus === 'failed') {
      debugInfo.troubleshooting = {
        isVercel: !!process.env.VERCEL,
        isLocal: !process.env.VERCEL,
        urlType: debugInfo.database.urlType,
        suggestedActions: [
          '1. Check Supabase Dashboard → Project status (not paused)',
          '2. Verify DATABASE_URL password is correct',
          '3. Test connection from Supabase SQL Editor',
          '4. Check network/firewall settings',
          !process.env.VERCEL 
            ? '5. For local dev, try direct connection (port 5432)'
            : '5. For Vercel, ensure using pooler (port 6543)',
        ],
      };
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
