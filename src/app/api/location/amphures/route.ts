// app/api/location/amphures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provinceId = searchParams.get('provinceId');

    if (!provinceId) {
      return NextResponse.json(
        { error: 'provinceId is required' },
        { status: 400 }
      );
    }

    const amphures = await prisma.loc_amphures.findMany({
      where: {
        province_id: parseInt(provinceId),
        deleted_at: null
      },
      orderBy: { name_th: 'asc' },
      select: {
        id: true,
        name_th: true,
        name_en: true,
        province_id: true
      }
    });

    return NextResponse.json(amphures);
  } catch (error) {
    console.error('Error fetching amphures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch amphures' },
      { status: 500 }
    );
  }
}
