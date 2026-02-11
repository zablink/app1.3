// app/api/location/manual/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { LocationInfo } from '@/lib/location-service';

import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provinceId, amphureId, tambonId } = body;

    if (!provinceId || !amphureId || !tambonId) {
      return NextResponse.json(
        { error: 'Missing provinceId, amphureId, or tambonId' },
        { status: 400 }
      );
    }

    // ดึงข้อมูลตำบล พร้อม amphure และ province
    const tambon = await prisma.th_subdistricts.findUnique({
      where: { id: tambonId },
      include: {
        th_districts: {
          include: {
            th_provinces: true
          }
        }
      }
    });

    if (!tambon) {
      return NextResponse.json(
        { error: 'Tambon not found' },
        { status: 404 }
      );
    }

    // สร้าง LocationInfo object
    const locationInfo: LocationInfo = {
      coordinates: { lat: 0, lng: 0 }, // ไม่มี GPS จริง
      provinceId: tambon.th_districts.th_provinces.id,
      provinceName: tambon.th_districts.th_provinces.name_th,
      amphureId: tambon.th_districts.id,
      amphureName: tambon.th_districts.name_th,
      tambonId: tambon.id,
      tambonName: tambon.name_th
    };

    return NextResponse.json(locationInfo);
  } catch (error) {
    console.error('Manual location error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
