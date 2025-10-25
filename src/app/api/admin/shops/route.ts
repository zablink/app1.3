// src/app/api/admin/shops/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/shops?status=PENDING_APPROVAL
 * ดึงรายการร้านสำหรับ admin
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: ตรวจสอบ admin authentication
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'PENDING_APPROVAL';

    // ใช้ function ที่สร้างไว้
    const shops = await prisma.$queryRaw<any[]>`
      SELECT * FROM get_pending_shops_for_admin()
    `;

    return NextResponse.json(shops);

  } catch (error) {
    console.error('Error fetching shops for admin:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch shops',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}