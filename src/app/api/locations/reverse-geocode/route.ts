// src/app/api/locations/reverse-geocode/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

import prisma from '@/lib/prisma';

// ฟังก์ชันคำนวณระยะทางระหว่าง 2 จุด (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // รัศมีโลกเป็น km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

// ฟังก์ชันหาตำบลที่ใกล้ที่สุดจาก GPS
async function findNearestTambons(lat: number, lng: number, radiusKm: number = 5) {
  try {
    // เช็คว่ามี PostGIS หรือไม่
    const hasPostGIS = await checkPostGIS();
    
    if (hasPostGIS) {
      // ใช้ PostGIS query (ถ้ามี)
      const tambons = await prisma.$queryRaw<any[]>`
        SELECT 
          t.id,
          t.name_th,
          t.name_en,
          t.amphure_id,
          t.zip_code,
          a.name_th as amphure_name_th,
          a.province_id,
          p.name_th as province_name_th,
          ST_Y(ST_Centroid(t.geom)) as lat,
          ST_X(ST_Centroid(t.geom)) as lng
        FROM loc_tambons t
        INNER JOIN loc_amphures a ON t.amphure_id = a.id
        INNER JOIN loc_provinces p ON a.province_id = p.id
        WHERE t.geom IS NOT NULL
        AND ST_DWithin(
          t.geom::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusKm * 1000}
        )
        ORDER BY ST_Distance(
          t.geom::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        )
        LIMIT 10
      `;

      return tambons.map((t) => ({
        ...t,
        distance: calculateDistance(lat, lng, Number(t.lat), Number(t.lng)),
      }));
    } else {
      // Fallback: ไม่มี PostGIS ให้ใช้ Haversine formula
      return await findNearestTambonsFallback(lat, lng, radiusKm);
    }
  } catch (error) {
    console.error("Error in findNearestTambons:", error);
    // ถ้า PostGIS query error ให้ fallback
    return await findNearestTambonsFallback(lat, lng, radiusKm);
  }
}

// Fallback method: ไม่ใช้ PostGIS
async function findNearestTambonsFallback(lat: number, lng: number, radiusKm: number) {
  try {
    // ดึงตำบลทั้งหมดในจังหวัดใกล้เคียง (approximate)
    const allTambons = await prisma.loc_tambons.findMany({
      include: {
        loc_amphures: {
          include: {
            loc_provinces: true,
          },
        },
      },
      // จำกัดจำนวนเพื่อความเร็ว
      take: 500,
    });

    // คำนวณระยะทางแต่ละตำบล (ใช้ center ของจังหวัด)
    // Note: นี่เป็น approximation เพราะไม่มีพิกัดแน่นอนของตำบล
    const tambonsWithDistance = allTambons.map((tambon) => {
      // ใช้พิกัดประมาณของจังหวัด (ต้องมี mapping table)
      const provinceCoords = getProvinceCoords(tambon.loc_amphures.province_id);
      const distance = calculateDistance(lat, lng, provinceCoords.lat, provinceCoords.lng);

      return {
        id: tambon.id,
        name_th: tambon.name_th,
        name_en: tambon.name_en,
        amphure_id: tambon.amphure_id,
        zip_code: tambon.zip_code,
        amphure_name_th: tambon.loc_amphures.name_th,
        province_id: tambon.loc_amphures.province_id,
        province_name_th: tambon.loc_amphures.loc_provinces.name_th,
        distance,
      };
    });

    // เรียงตามระยะทางและกรองที่อยู่ในรัศมี
    return tambonsWithDistance
      .filter((t) => t.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);
  } catch (error) {
    console.error("Error in fallback method:", error);
    return [];
  }
}

// เช็คว่ามี PostGIS extension หรือไม่
async function checkPostGIS(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT PostGIS_Version()`;
    return true;
  } catch {
    return false;
  }
}

// พิกัดประมาณของแต่ละจังหวัด (center point)
function getProvinceCoords(provinceId: number): { lat: number; lng: number } {
  // พิกัดจังหวัดหลักๆ (เพิ่มเติมได้)
  const provinceCoords: Record<number, { lat: number; lng: number }> = {
    1: { lat: 13.7563, lng: 100.5018 }, // กรุงเทพฯ
    2: { lat: 14.9930, lng: 102.0977 }, // สมุทรปราการ
    3: { lat: 13.5391, lng: 100.9271 }, // นนทบุรี
    10: { lat: 13.5282, lng: 100.2600 }, // สมุทรสาคร
    11: { lat: 13.4122, lng: 100.0021 }, // สมุทรสงคราม
    // ... เพิ่มจังหวัดอื่นๆ ได้
  };

  return provinceCoords[provinceId] || { lat: 13.7367, lng: 100.5231 }; // default
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng, accuracy } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Missing lat or lng" },
        { status: 400 }
      );
    }

    console.log('📍 Reverse Geocode Request:', { lat, lng, accuracy });

    // 1. หาตำบลที่ใกล้ที่สุดจาก GPS
    const nearestTambons = await findNearestTambons(lat, lng, 5); // หาในรัศมี 5 km

    console.log('📍 Found tambons:', nearestTambons.length);

    if (nearestTambons.length === 0) {
      // ถ้าไม่เจอในรัศมี 5 km ให้ขยายเป็น 10 km
      const widerSearch = await findNearestTambons(lat, lng, 10);

      if (widerSearch.length === 0) {
        return NextResponse.json(
          { error: "ไม่พบตำบลในบริเวณนี้" },
          { status: 404 }
        );
      }

      // ส่งตัวเลือกให้ user เลือก
      return NextResponse.json({
        location: {
          lat,
          lng,
          accuracy,
          province: {
            id: widerSearch[0].province_id,
            name_th: widerSearch[0].province_name_th,
          },
          amphure: {
            id: widerSearch[0].amphure_id,
            name_th: widerSearch[0].amphure_name_th,
          },
          possibleTambons: widerSearch.slice(0, 5).map((t) => ({
            id: t.id,
            name_th: t.name_th,
            name_en: t.name_en,
            amphure_id: t.amphure_id,
            zip_code: t.zip_code,
            distance: t.distance,
          })),
        },
      });
    }

    // 2. ถ้าเจอตำบลเดียว ให้ส่งกลับไปเลย
    if (nearestTambons.length === 1) {
      return NextResponse.json({
        location: {
          lat,
          lng,
          accuracy,
          province: {
            id: nearestTambons[0].province_id,
            name_th: nearestTambons[0].province_name_th,
          },
          amphure: {
            id: nearestTambons[0].amphure_id,
            name_th: nearestTambons[0].amphure_name_th,
          },
          tambon: {
            id: nearestTambons[0].id,
            name_th: nearestTambons[0].name_th,
            name_en: nearestTambons[0].name_en,
            amphure_id: nearestTambons[0].amphure_id,
            zip_code: nearestTambons[0].zip_code,
          },
        },
      });
    }

    // 3. ถ้าเจอหลายตำบล แต่ตำบลแรกห่างจากตำบลที่ 2 มากพอ (>1km)
    if (nearestTambons[0].distance < 1 && nearestTambons.length > 1) {
      const secondDistance = nearestTambons[1].distance;
      if (secondDistance - nearestTambons[0].distance > 1) {
        // เลือกตำบลแรกเลย
        return NextResponse.json({
          location: {
            lat,
            lng,
            accuracy,
            province: {
              id: nearestTambons[0].province_id,
              name_th: nearestTambons[0].province_name_th,
            },
            amphure: {
              id: nearestTambons[0].amphure_id,
              name_th: nearestTambons[0].amphure_name_th,
            },
            tambon: {
              id: nearestTambons[0].id,
              name_th: nearestTambons[0].name_th,
              name_en: nearestTambons[0].name_en,
              amphure_id: nearestTambons[0].amphure_id,
              zip_code: nearestTambons[0].zip_code,
            },
          },
        });
      }
    }

    // 4. ส่งตัวเลือกหลายตำบลให้ user เลือก
    return NextResponse.json({
      location: {
        lat,
        lng,
        accuracy,
        province: {
          id: nearestTambons[0].province_id,
          name_th: nearestTambons[0].province_name_th,
        },
        amphure: {
          id: nearestTambons[0].amphure_id,
          name_th: nearestTambons[0].amphure_name_th,
        },
        possibleTambons: nearestTambons.slice(0, 5).map((t) => ({
          id: t.id,
          name_th: t.name_th,
          name_en: t.name_en,
          amphure_id: t.amphure_id,
          zip_code: t.zip_code,
          distance: Math.round(t.distance * 10) / 10, // round to 1 decimal
        })),
      },
    });
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}