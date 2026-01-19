// src/app/api/locations/subdistricts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const districtId = searchParams.get('districtId');

    if (!districtId) {
      return NextResponse.json(
        { success: false, error: 'districtId is required' },
        { status: 400 }
      );
    }

    const subdistricts = await prisma.$queryRawUnsafe<Array<{ id: number; name_th: string; name_en: string }>>(
      `SELECT id, name_th, name_en FROM th_subdistricts WHERE amphure_id = $1 ORDER BY name_th ASC`,
      parseInt(districtId)
    );

    return NextResponse.json({
      success: true,
      subdistricts: subdistricts.map(s => ({
        id: s.id,
        name: s.name_th,
        nameEn: s.name_en,
      })),
    });
  } catch (error) {
    console.error('Error fetching subdistricts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subdistricts' },
      { status: 500 }
    );
  }
}
