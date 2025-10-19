import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Shop = {
  id: number;
  name: string;
  category: string | null;
  image: string | null;
  lat: number;
  lng: number;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  distance?: number;
  // packageType?: string; // เตรียมไว้สำหรับอนาคต
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const subdistrict = searchParams.get("subdistrict");
    const district = searchParams.get("district");
    const province = searchParams.get("province");

    console.log('Fetching shops with params:', { lat, lng, subdistrict, district, province });

    // ดึงร้านทั้งหมดจาก database
    const allShops = await prisma.simple_shops.findMany({
      orderBy: { created_at: 'desc' },
    });

    console.log('Total shops from DB:', allShops.length);

    // แปลง type ให้ตรงกับ Shop type
    let shops: Shop[] = allShops
      .filter(shop => shop.lat !== null && shop.lng !== null)
      .map(shop => ({
        id: shop.id,
        name: shop.name,
        category: shop.category,
        image: shop.image,
        lat: shop.lat!,
        lng: shop.lng!,
        subdistrict: shop.subdistrict,
        district: shop.district,
        province: shop.province,
      }));

    let filteredShops: Shop[] = [];

    // 1. ถ้ามี location → คำนวณหาร้านในระยะ 10 กม.
    if (!isNaN(lat) && !isNaN(lng)) {
      filteredShops = shops
        .map((shop) => {
          const distance = getDistanceFromLatLonInKm(lat, lng, shop.lat, shop.lng);
          return { ...shop, distance };
        })
        .filter((s) => (s.distance ?? 999) <= 10)
        .sort(sortByDistance);
      
      console.log(`Found ${filteredShops.length} shops within 10km`);
    }

    // 2. ถ้าไม่มีในระยะ → หา subdistrict
    if (filteredShops.length === 0 && subdistrict) {
      filteredShops = shops
        .filter((s) => s.subdistrict === subdistrict)
        .sort(sortByDistance);
      
      console.log(`Found ${filteredShops.length} shops in subdistrict: ${subdistrict}`);
    }

    // 3. ถ้าไม่มี → หา district
    if (filteredShops.length === 0 && district) {
      filteredShops = shops
        .filter((s) => s.district === district)
        .sort(sortByDistance);
      
      console.log(`Found ${filteredShops.length} shops in district: ${district}`);
    }

    // 4. ถ้าไม่มี → หา province
    if (filteredShops.length === 0 && province) {
      filteredShops = shops
        .filter((s) => s.province === province)
        .sort(sortByDistance);
      
      console.log(`Found ${filteredShops.length} shops in province: ${province}`);
    }

    // 5. ถ้ายังไม่มีเลย → ส่งทั้งหมด (random 20 ร้าน)
    if (filteredShops.length === 0) {
      filteredShops = [...shops]
        .sort(() => 0.5 - Math.random())
        .slice(0, 20);
      
      console.log(`No location match, returning ${filteredShops.length} random shops`);
    }

    return NextResponse.json(filteredShops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to fetch shops', detail: errorMessage },
      { status: 500 }
    );
  }
}

// Haversine formula คำนวณระยะทาง
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // รัศมีโลก km
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

// เรียงลำดับตามระยะทาง
function sortByDistance(a: Shop, b: Shop) {
  return (a.distance ?? 0) - (b.distance ?? 0);
}

// ⭐ เตรียมไว้สำหรับอนาคต เมื่อมี subscription
// function sortByPackageAndDistance(a: Shop, b: Shop) {
//   const rank: Record<string, number> = { 
//     PREMIUM: 5, 
//     PRO: 4, 
//     BASIC: 3, 
//     FREE: 1 
//   };
//   const pkgA = rank[a.packageType?.toUpperCase() || 'FREE'] || 0;
//   const pkgB = rank[b.packageType?.toUpperCase() || 'FREE'] || 0;
//   if (pkgA !== pkgB) return pkgB - pkgA;
//   return (a.distance ?? 0) - (b.distance ?? 0);
// }
```
