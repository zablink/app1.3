// src/app/api/shops/debug/route.ts
// Debug endpoint to check database connection and shop count

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[api/shops/debug] Starting debug check...');
    
    // 1. Test database connection
    let dbConnected = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      console.log('[api/shops/debug] ✅ Database connection OK');
    } catch (error) {
      console.error('[api/shops/debug] ❌ Database connection failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // 2. Check total shop count
    const totalShops = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      'SELECT COUNT(*) as count FROM "Shop"'
    );
    const totalCount = Number(totalShops[0]?.count || 0);
    console.log(`[api/shops/debug] Total shops in database: ${totalCount}`);
    
    // 3. Check shops by status
    const shopsByStatus = await prisma.$queryRawUnsafe<Array<{ status: string | null; count: bigint }>>(
      'SELECT status, COUNT(*) as count FROM "Shop" GROUP BY status'
    );
    console.log('[api/shops/debug] Shops by status:', shopsByStatus.map(s => ({
      status: s.status || 'NULL',
      count: Number(s.count)
    })));
    
    // 4. Check if status column exists
    const hasStatusCol = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Shop' AND column_name = 'status'
      ) as exists`
    );
    const statusColExists = hasStatusCol[0]?.exists || false;
    console.log(`[api/shops/debug] Status column exists: ${statusColExists}`);
    
    // 5. Get sample shops (first 5)
    const sampleShops = await prisma.$queryRawUnsafe<Array<any>>(
      'SELECT id, name, status, "createdAt" FROM "Shop" ORDER BY "createdAt" DESC LIMIT 5'
    );
    console.log('[api/shops/debug] Sample shops:', sampleShops);
    
    return NextResponse.json({
      success: true,
      database: {
        connected: dbConnected,
        totalShops: totalCount,
        shopsByStatus: shopsByStatus.map(s => ({
          status: s.status || 'NULL',
          count: Number(s.count)
        })),
        statusColumnExists: statusColExists,
        sampleShops: sampleShops.map(s => ({
          id: s.id,
          name: s.name,
          status: s.status,
          createdAt: s.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('[api/shops/debug] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
