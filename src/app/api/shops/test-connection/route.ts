// src/app/api/shops/test-connection/route.ts
// Test endpoint to check database connection and Prisma query

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[test-connection] Starting connection test...');
    
    // 1. Check if DATABASE_URL is set
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL is not set',
        hint: 'Please configure DATABASE_URL in Vercel environment variables'
      }, { status: 500 });
    }
    
    // Safe URL for logging (without password)
    const safeUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log('[test-connection] DATABASE_URL (safe):', safeUrl);
    
    // 2. Test basic Prisma connection
    let connectionTest = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      connectionTest = true;
      console.log('[test-connection] ✅ Basic connection test passed');
    } catch (error) {
      console.error('[test-connection] ❌ Basic connection test failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        databaseUrl: safeUrl,
        hint: 'Check DATABASE_URL in Vercel environment variables. Use port 6543 for connection pooler.'
      }, { status: 500 });
    }
    
    // 3. Test table existence check
    let tableCheck = false;
    try {
      const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'Shop'
        ) as exists`
      );
      tableCheck = result[0]?.exists || false;
      console.log('[test-connection] Shop table exists:', tableCheck);
    } catch (error) {
      console.error('[test-connection] ❌ Table check failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Table check failed',
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // 4. Test simple query
    let shopCount = 0;
    try {
      const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        'SELECT COUNT(*) as count FROM "Shop"'
      );
      shopCount = Number(result[0]?.count || 0);
      console.log('[test-connection] Shop count:', shopCount);
    } catch (error) {
      console.error('[test-connection] ❌ Count query failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Count query failed',
        errorType: error instanceof Error ? error.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // 5. Test column check
    let columnCheck = false;
    try {
      const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Shop' AND column_name = 'status'
        ) as exists`
      );
      columnCheck = result[0]?.exists || false;
      console.log('[test-connection] Status column exists:', columnCheck);
    } catch (error) {
      console.error('[test-connection] ❌ Column check failed:', error);
    }
    
    return NextResponse.json({
      success: true,
      connection: {
        connected: connectionTest,
        tableExists: tableCheck,
        shopCount,
        statusColumnExists: columnCheck,
        databaseUrl: safeUrl,
        environment: process.env.NODE_ENV,
        isVercel: !!process.env.VERCEL
      }
    });
    
  } catch (error) {
    console.error('[test-connection] ❌ Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Fatal error',
      errorType: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
