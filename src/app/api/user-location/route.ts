// src/app/api/user-location/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API สำหรับหาตำบล/อำเภอ/จังหวัด ของ user จาก GPS
 * ใช้สำหรับกรองโฆษณาที่ระบุพื้นที่
 * 
 * Method: GET
 * Query params:
 *  - lat: latitude
 *  - lng: longitude
 * 
 * Response:
 * {
 *   tambon_id: number | null,
 *   tambon_name: string | null,
 *   amphure_id: number | null,
 *   amphure_name: string | null,
 *   province_id: number | null,
 *   province_name: string | null,
 *   method: 'contains' | 'nearest' | 'none'  // วิธีที่ใช้หา
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Missing lat or lng parameter' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // 1. ลองใช้ ST_Contains (แม่นยำที่สุด) - จะได้ผลถ้าจุดอยู่ภายใน geometry
    const containsResult = await prisma.$queryRaw<Array<{
      tambon_id: number;
      tambon_name: string;
      amphure_id: number;
      amphure_name: string;
      province_id: number;
      province_name: string;
    }>>`
      SELECT 
        t.id as tambon_id,
        t.name_th as tambon_name,
        a.id as amphure_id,
        a.name_th as amphure_name,
        p.id as province_id,
        p.name_th as province_name
      FROM th_subdistricts t
      JOIN th_districts a ON t.amphure_id = a.id
      JOIN th_provinces p ON a.province_id = p.id
      WHERE t.geom IS NOT NULL
        AND ST_Contains(t.geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
      LIMIT 1
    `;

    if (containsResult && containsResult.length > 0) {
      return NextResponse.json({
        ...containsResult[0],
        method: 'contains' // หาได้จาก geometry ตรงๆ
      });
    }

    // 2. ถ้าไม่เจอ (GPS ไม่ตรง หรือ geometry ไม่มี) → หาตำบลที่ใกล้ที่สุด
    console.log(`[user-location] GPS (${lat}, ${lng}) ไม่อยู่ใน geometry ใดๆ → หาตำบลที่ใกล้ที่สุด`);
    
    const nearestResult = await prisma.$queryRaw<Array<{
      tambon_id: number;
      tambon_name: string;
      amphure_id: number;
      amphure_name: string;
      province_id: number;
      province_name: string;
      distance_meters: number;
    }>>`
      SELECT 
        t.id as tambon_id,
        t.name_th as tambon_name,
        a.id as amphure_id,
        a.name_th as amphure_name,
        p.id as province_id,
        p.name_th as province_name,
        ST_Distance(
          COALESCE(t.geom, a.geom, p.geom)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) as distance_meters
      FROM th_subdistricts t
      JOIN th_districts a ON t.amphure_id = a.id
      JOIN th_provinces p ON a.province_id = p.id
      WHERE COALESCE(t.geom, a.geom, p.geom) IS NOT NULL
      ORDER BY COALESCE(t.geom, a.geom, p.geom) <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      LIMIT 1
    `;

    if (nearestResult && nearestResult.length > 0) {
      const result = nearestResult[0];
      console.log(`[user-location] หาตำบลที่ใกล้ที่สุด: ${result.tambon_name} (ห่าง ${(result.distance_meters / 1000).toFixed(2)} km)`);
      
      return NextResponse.json({
        tambon_id: result.tambon_id,
        tambon_name: result.tambon_name,
        amphure_id: result.amphure_id,
        amphure_name: result.amphure_name,
        province_id: result.province_id,
        province_name: result.province_name,
        distance_km: parseFloat((result.distance_meters / 1000).toFixed(2)),
        method: 'nearest' // หาได้จากตำบลที่ใกล้ที่สุด
      });
    }

    // 3. ถ้ายังหาไม่เจอเลย (ไม่น่าจะเกิด)
    return NextResponse.json({
      tambon_id: null,
      tambon_name: null,
      amphure_id: null,
      amphure_name: null,
      province_id: null,
      province_name: null,
      method: 'none'
    });

  } catch (error) {
    console.error('[user-location] Error:', error);
    return NextResponse.json(
      { error: 'Failed to determine user location' },
      { status: 500 }
    );
  }
}
