// src/app/api/debug/network/route.ts
// Network connectivity test for database server

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      isLocal: !process.env.VERCEL,
    },
    database: {
      urlConfigured: !!process.env.DATABASE_URL,
      urlSafe: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')
        : null,
      host: null as string | null,
      port: null as string | null,
    },
    network: {
      connectivity: 'unknown' as string,
      tests: [] as any[],
    },
    recommendations: [] as string[],
  };

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      debugInfo.network.connectivity = 'failed';
      debugInfo.network.tests.push({
        name: 'DATABASE_URL Check',
        success: false,
        error: 'DATABASE_URL is not set',
      });
      return NextResponse.json(debugInfo, { status: 500 });
    }

    // Extract host and port from DATABASE_URL
    const hostMatch = dbUrl.match(/@([^:]+):(\d+)/);
    if (hostMatch) {
      debugInfo.database.host = hostMatch[1];
      debugInfo.database.port = hostMatch[2];
    }

    // Test 1: Check if we can create a Prisma client
    debugInfo.network.tests.push({
      name: 'Prisma Client Creation',
      success: true,
      note: 'Client can be created (does not test connection)',
    });

    // Test 2: Try to connect with a timeout
    try {
      const testClient = new PrismaClient({
        log: ['error'],
        datasources: {
          db: {
            url: dbUrl,
          },
        },
      });

      // Set a timeout for connection test
      const connectionPromise = testClient.$queryRaw`SELECT 1 as test`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      );

      const result = await Promise.race([connectionPromise, timeoutPromise]);
      
      debugInfo.network.tests.push({
        name: 'Database Connection Test',
        success: true,
        result: result,
        note: 'Successfully connected to database',
      });
      
      debugInfo.network.connectivity = 'connected';
      
      await testClient.$disconnect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorType = error instanceof Error ? error.name : 'Unknown';
      
      debugInfo.network.tests.push({
        name: 'Database Connection Test',
        success: false,
        error: errorMessage,
        errorType: errorType,
      });
      
      debugInfo.network.connectivity = 'failed';
      
      // Analyze error type
      if (errorMessage.includes('timeout')) {
        debugInfo.recommendations.push('⏱️ Connection timeout - Database server may be unreachable');
        debugInfo.recommendations.push('💡 Check Supabase project status (not paused)');
        debugInfo.recommendations.push('💡 Check network/firewall settings');
      } else if (errorMessage.includes("Can't reach")) {
        debugInfo.recommendations.push('🌐 Cannot reach database server');
        debugInfo.recommendations.push('💡 Verify hostname: ' + debugInfo.database.host);
        debugInfo.recommendations.push('💡 Verify port: ' + debugInfo.database.port);
        debugInfo.recommendations.push('💡 Check Supabase Dashboard → Project status');
      } else if (errorMessage.includes('authentication')) {
        debugInfo.recommendations.push('🔐 Authentication failed');
        debugInfo.recommendations.push('💡 Verify DATABASE_URL password is correct');
        debugInfo.recommendations.push('💡 Check Supabase Dashboard → Settings → Database → Connection string');
      }
    }

    // Add environment-specific recommendations
    if (debugInfo.network.connectivity === 'failed') {
      if (!process.env.VERCEL) {
        debugInfo.recommendations.push('💻 Local Development Tips:');
        debugInfo.recommendations.push('   1. Try direct connection (port 5432) instead of pooler (6543)');
        debugInfo.recommendations.push('   2. Check if VPN or firewall is blocking connection');
        debugInfo.recommendations.push('   3. Verify .env file has correct DATABASE_URL');
      } else {
        debugInfo.recommendations.push('☁️ Vercel Production Tips:');
        debugInfo.recommendations.push('   1. Ensure using connection pooler (port 6543)');
        debugInfo.recommendations.push('   2. Check Vercel Environment Variables → DATABASE_URL');
        debugInfo.recommendations.push('   3. Verify Supabase project is active (not paused)');
        debugInfo.recommendations.push('   4. Try redeploying after updating DATABASE_URL');
      }
    }

    return NextResponse.json(debugInfo, {
      status: debugInfo.network.connectivity === 'connected' ? 200 : 500,
    });
  } catch (error) {
    debugInfo.error = {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'Unknown',
    };
    return NextResponse.json(debugInfo, { status: 500 });
  }
}
