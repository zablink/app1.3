// src/app/api/locations/reverse-geocode/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    // ดึงข้อมูลตำบลทั้งหมดที่มี coordinates (จาก geom)
    // สำหรับตอนนี้ใช้วิธีง่ายๆ คือดึงตำบลในรัศมีที่กำหนด
    // ถ้ามี PostGIS สามารถใช้ ST_Distance ได้
    
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
    `;

    // คำนวณระยะทางและจัดเรียง
    const tambonsWithDistance = tambons
      .map((tambon) => ({
        ...tambon,
        distance: calculateDistance(lat, lng, tambon.lat, tambon.lng),
      }))
      .filter((t) => t.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return tambonsWithDistance;
  } catch (error) {
    console.error("Error finding nearest tambons:", error);
    // ถ้า database ไม่มี geom หรือ PostGIS ให้ใช้วิธีอื่น
    return [];
  }
}

// ฟังก์ชันหาตำบลจากชื่อที่คล้ายกัน (fuzzy matching)
function fuzzyMatch(str1: string, str2: string): number {
  // Simple similarity score (Levenshtein distance)
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen; // Return similarity score (0-1)
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Missing lat or lng" },
        { status: 400 }
      );
    }

    // 1. หาตำบลที่ใกล้ที่สุดจาก GPS
    const nearestTambons = await findNearestTambons(lat, lng, 5); // หาในรัศมี 5 km

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

    // 3. ถ้าเจอหลายตำบล (อยู่ใกล้กัน) ให้ส่งตัวเลือกทั้งหมด
    // แต่ถ้าตำบลแรกห่างจากตำบลที่ 2 มากพอ (>1km) ให้เลือกตำบลแรก
    if (nearestTambons[0].distance < 1 && nearestTambons.length > 1) {
      const secondDistance = nearestTambons[1].distance;
      if (secondDistance - nearestTambons[0].distance > 1) {
        // ถ้าตำบลที่ 2 ห่างจากตำบลแรกมากกว่า 1 km ให้เลือกตำบลแรกเลย
        return NextResponse.json({
          location: {
            lat,
            lng,
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
          distance: t.distance,
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