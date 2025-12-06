import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'provinces') {
      const provinces = await prisma.th_provinces.findMany({
        orderBy: { name_th: 'asc' },
      });
      return NextResponse.json(provinces);
    }

    if (type === 'amphures') {
      const provinceId = searchParams.get('province_id');
      const amphures = await prisma.th_districts.findMany({
        where: provinceId ? { province_id: parseInt(provinceId) } : undefined,
        orderBy: { name_th: 'asc' },
      });
      return NextResponse.json(amphures);
    }

    if (type === 'tambons') {
      const amphureId = searchParams.get('amphure_id');
      const tambons = await prisma.th_subdistricts.findMany({
        where: amphureId ? { amphure_id: parseInt(amphureId) } : undefined,
        orderBy: { name_th: 'asc' },
      });
      return NextResponse.json(tambons);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
