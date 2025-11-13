// app/api/location/tambons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const amphureId = searchParams.get('amphureId');

    if (!amphureId) {
      return NextResponse.json(
        { error: 'amphureId is required' },
        { status: 400 }
      );
    }

    const tambons = await prisma.loc_tambons.findMany({
      where: {
        amphure_id: parseInt(amphureId),
        deleted_at: null
      },
      orderBy: { name_th: 'asc' },
      select: {
        id: true,
        name_th: true,
        name_en: true,
        amphure_id: true,
        zip_code: true
      }
    });

    return NextResponse.json(tambons);
  } catch (error) {
    console.error('Error fetching tambons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tambons' },
      { status: 500 }
    );
  }
}
