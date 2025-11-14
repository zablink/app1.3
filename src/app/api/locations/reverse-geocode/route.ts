import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();

    const result = await prisma.$queryRaw`
      SELECT t.id, t.name_th, t.name_en, a.name_th as amphure_name, p.name_th as province_name
      FROM loc_tambons t
      JOIN loc_amphures a ON t.amphure_id = a.id
      JOIN loc_provinces p ON a.province_id = p.id
      WHERE ST_Contains(t.geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
      LIMIT 1
    `;

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reverse geocode' }, { status: 500 });
  }
}
