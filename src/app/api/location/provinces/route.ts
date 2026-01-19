// app/api/location/provinces/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const provinces = await prisma.th_provinces.findMany({
      where: { deleted_at: null },
      orderBy: { name_th: 'asc' },
      select: {
        id: true,
        name_th: true,
        name_en: true,
        geography_id: true
      }
    });

    return NextResponse.json(provinces);
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provinces' },
      { status: 500 }
    );
  }
}
