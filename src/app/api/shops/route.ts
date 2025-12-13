import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Shop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  packageType: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  distance?: number;
};

// mock data สำหรับกรณีที่ไม่มี database connection
const mockShops: Shop[] = [
  {
    id: "1",
    name: "Test Shop A",
    latitude: 13.7563,
    longitude: 100.5018,
    packageType: "pro1",
    province: "Bangkok",
  },
  {
    id: "2",
    name: "Test Shop B",
    latitude: 13.75,
    longitude: 100.5,
    packageType: "free",
    province: "Bangkok",
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const subdistrict = searchParams.get("subdistrict");
    const district = searchParams.get("district");
    const province = searchParams.get("province");

    let shops: Shop[] = [];

    // ตรวจสอบว่ามี DATABASE_URL หรือไม่
    const isDatabaseConfigured = process.env.DATABASE_URL !== undefined;

    if (isDatabaseConfigured) {
      // ใช้ database จริง
      try {
        const dbShops = await prisma.shop.findMany({
          where: {
            AND: [
              lat && lng && !isNaN(lat) && !isNaN(lng)
                ? {
                    lat: { not: null },
                    lng: { not: null },
                  }
                : {},
            ],
          },
          include: {
            category: true,
            adPackage: true,
          },
          take: 100, // จำกัดจำนวนร้านเพื่อประสิทธิภาพ
        });

        // แปลงข้อมูลจาก database
        shops = dbShops
          .filter((shop) => shop.lat !== null && shop.lng !== null)
          .map((shop) => {
            const distance =
              !isNaN(lat) && !isNaN(lng)
                ? getDistanceFromLatLonInKm(lat, lng, shop.lat!, shop.lng!)
                : undefined;

            return {
              id: shop.id,
              name: shop.name,
              latitude: shop.lat!,
              longitude: shop.lng!,
              packageType: shop.adPackage?.name.toLowerCase() || "free",
              subdistrict: undefined, // TODO: เชื่อมกับ Tambon model
              district: undefined, // TODO: เชื่อมกับ Amphure model
              province: undefined, // TODO: เชื่อมกับ Province model
              distance,
            };
          })
          .filter((s) => !s.distance || s.distance <= 10) // กรองเฉพาะในระยะ 10 กม.
          .sort(sortByPackageAndDistance);
      } catch (dbError) {
        console.error("Database error, falling back to mock data:", dbError);
        // ถ้า database error ให้ใช้ mock data แทน
        shops = getMockShops(lat, lng, subdistrict, district, province);
      }
    } else {
      // ใช้ mock data
      shops = getMockShops(lat, lng, subdistrict, district, province);
    }

    return NextResponse.json(shops);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}

// ฟังก์ชันสำหรับดึง mock data
function getMockShops(
  lat: number,
  lng: number,
  subdistrict?: string | null,
  district?: string | null,
  province?: string | null
): Shop[] {
  let shops: Shop[] = [];

  // 1. ถ้ามี location → คำนวณหาร้านในระยะ 10 กม.
  if (!isNaN(lat) && !isNaN(lng)) {
    shops = mockShops
      .map((shop) => {
        const distance = getDistanceFromLatLonInKm(lat, lng, shop.latitude, shop.longitude);
        return { ...shop, distance };
      })
      .filter((s) => (s.distance ?? 999) <= 10)
      .sort(sortByPackageAndDistance);
  }

  // 2. ถ้าไม่มีในระยะ → หา subdistrict
  if (shops.length === 0 && subdistrict) {
    shops = mockShops.filter((s) => s.subdistrict === subdistrict).sort(sortByPackageAndDistance);
  }

  // 3. ถ้าไม่มี → หา district
  if (shops.length === 0 && district) {
    shops = mockShops.filter((s) => s.district === district).sort(sortByPackageAndDistance);
  }

  // 4. ถ้าไม่มี → หา province
  if (shops.length === 0 && province) {
    shops = mockShops.filter((s) => s.province === province).sort(sortByPackageAndDistance);
  }

  return shops;
}

// Haversine formula คำนวณระยะทาง
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// เรียงลำดับร้าน: Pro package → Free → ตามระยะ
function sortByPackageAndDistance(a: Shop, b: Shop) {
  const rank: Record<string, number> = { special: 5, pro3: 4, pro2: 3, pro1: 2, free: 1 };
  const pkgA = rank[a.packageType.toLowerCase()] || 0;
  const pkgB = rank[b.packageType.toLowerCase()] || 0;
  if (pkgA !== pkgB) return pkgB - pkgA;
  return (a.distance ?? 0) - (b.distance ?? 0);
}
