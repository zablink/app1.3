// src/app/api/locations/districts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('provinceId');

    if (!provinceId) {
      return NextResponse.json(
        { success: false, error: 'provinceId is required' },
        { status: 400 }
      );
    }

    const districts = await prisma.$queryRawUnsafe<Array<{ id: number; name_th: string; name_en: string }>>(
      `SELECT id, name_th, name_en FROM loc_amphures WHERE province_id = $1 ORDER BY name_th ASC`,
      parseInt(provinceId)
    );

    return NextResponse.json({
      success: true,
      districts: districts.map(d => ({
        id: d.id,
        name: d.name_th,
        nameEn: d.name_en,
      })),
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch districts' },
      { status: 500 }
    );
  }
}
