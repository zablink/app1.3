// src/app/api/debug/prisma/route.ts
// Debug Prisma client and connection details

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    prisma: {
      clientType: typeof prisma,
      isPrismaClient: prisma.constructor.name === 'PrismaClient',
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_SAFE: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')
        : null,
    },
    connection: {
      status: 'unknown',
      tests: [] as any[],
    },
  };

  // Test 1: Basic connection
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as current_time`;
    debugInfo.connection.tests.push({
      name: 'Basic Query',
      success: true,
      result: result,
    });
    debugInfo.connection.status = 'connected';
  } catch (error) {
    debugInfo.connection.tests.push({
      name: 'Basic Query',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown',
    });
    debugInfo.connection.status = 'failed';
  }

  // Test 2: Check database version
  if (debugInfo.connection.status === 'connected') {
    try {
      const version = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
      debugInfo.connection.tests.push({
        name: 'Database Version',
        success: true,
        version: version[0]?.version,
      });
    } catch (error) {
      debugInfo.connection.tests.push({
        name: 'Database Version',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Test 3: Check PostGIS extension
  if (debugInfo.connection.status === 'connected') {
    try {
      const postgis = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `SELECT EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'postgis'
        ) as exists`
      );
      debugInfo.connection.tests.push({
        name: 'PostGIS Extension',
        success: true,
        installed: postgis[0]?.exists || false,
      });
    } catch (error) {
      debugInfo.connection.tests.push({
        name: 'PostGIS Extension',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Test 4: List all tables
  if (debugInfo.connection.status === 'connected') {
    try {
      const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
        `SELECT table_name 
         FROM information_schema.tables 
         WHERE table_schema = 'public' 
         ORDER BY table_name`
      );
      debugInfo.connection.tests.push({
        name: 'List Tables',
        success: true,
        tables: tables.map(t => t.table_name),
        count: tables.length,
      });
    } catch (error) {
      debugInfo.connection.tests.push({
        name: 'List Tables',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Test 5: Check Shop table structure
  if (debugInfo.connection.status === 'connected') {
    try {
      const columns = await prisma.$queryRawUnsafe<Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>>(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_name = 'Shop' AND table_schema = 'public'
         ORDER BY ordinal_position`
      );
      debugInfo.connection.tests.push({
        name: 'Shop Table Structure',
        success: true,
        columns: columns,
        columnCount: columns.length,
      });
    } catch (error) {
      debugInfo.connection.tests.push({
        name: 'Shop Table Structure',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json(debugInfo, {
    status: debugInfo.connection.status === 'connected' ? 200 : 500,
  });
}
