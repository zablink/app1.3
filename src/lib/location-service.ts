// lib/location-service.ts
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number; // meters
}

export interface LocationInfo {
  coordinates: Coordinates;
  provinceId: number | null;
  provinceName?: string;
  amphureId: number | null;
  amphureName?: string;
  tambonId: number | null;
  tambonName?: string;
  possibleTambons?: any[]; // กรณีที่มีหลายตำบลที่ใกล้เคียง
}

// ========================================
// 1. DISTANCE CALCULATION (PostGIS)
// ========================================

/**
 * หาร้านค้าที่อยู่ใกล้ตำแหน่ง GPS ของผู้ใช้
 */
export async function getShopsNearby(
  userLat: number,
  userLng: number,
  radiusKm: number = 20,
  options: {
    limit?: number;
    status?: string;
    categoryId?: string;
  } = {}
) {
  const { limit = 100, status = 'APPROVED', categoryId } = options;

  const categoryFilter = categoryId ? `AND s."categoryId" = '${categoryId}'` : '';

  const shops = await prisma.$queryRaw<any[]>`
    SELECT 
      s.*,
      ST_Distance(
        s.location::geography,
        ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
      ) / 1000 as distance_km,
      ST_X(s.location::geometry) as lng,
      ST_Y(s.location::geometry) as lat
    FROM "Shop" s
    WHERE s.status = ${status}::text
      AND s.location IS NOT NULL
      ${categoryFilter}
      AND ST_DWithin(
        s.location::geography,
        ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography,
        ${radiusKm * 1000}
      )
    ORDER BY distance_km ASC
    LIMIT ${limit}
  `;

  return shops;
}

// ========================================
// 2. REVERSE GEOCODING (GPS -> ตำบล/อำเภอ/จังหวัด)
// ========================================

/**
 * แปลง GPS coordinates เป็นข้อมูลตำบล/อำเภอ/จังหวัด
 * ใช้ PostGIS ST_Contains เพื่อหา geometry ที่ครอบคลุมจุดนั้น
 */
export async function getLocationFromCoordinates(
  lat: number,
  lng: number,
  accuracy?: number
): Promise<LocationInfo | null> {
  try {
    // ถ้า accuracy แย่มาก (>500m) ให้เตือนแต่ยังลองหาให้
    const isLowAccuracy = accuracy && accuracy > 500;

    // ลอง ST_Contains ก่อน (แม่นยำ)
    let result = await prisma.$queryRaw<any[]>`
      SELECT 
        t.id as tambon_id,
        t.name_th as tambon_name,
        t.zip_code,
        a.id as amphure_id,
        a.name_th as amphure_name,
        p.id as province_id,
        p.name_th as province_name,
        ST_Distance(
          t.geom::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) as distance_meters
      FROM loc_tambons t
      JOIN loc_amphures a ON t.amphure_id = a.id
      JOIN loc_provinces p ON a.province_id = p.id
      WHERE t.geom IS NOT NULL
        AND ST_Contains(
          t.geom,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        )
      LIMIT 1
    `;

    // ถ้าไม่เจอ (อาจจะอยู่นอก polygon) ให้หาตำบลที่ใกล้ที่สุด
    if (result.length === 0) {
      result = await prisma.$queryRaw<any[]>`
        SELECT 
          t.id as tambon_id,
          t.name_th as tambon_name,
          t.zip_code,
          a.id as amphure_id,
          a.name_th as amphure_name,
          p.id as province_id,
          p.name_th as province_name,
          ST_Distance(
            t.geom::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          ) as distance_meters
        FROM loc_tambons t
        JOIN loc_amphures a ON t.amphure_id = a.id
        JOIN loc_provinces p ON a.province_id = p.id
        WHERE t.geom IS NOT NULL
        ORDER BY t.geom <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        LIMIT 1
      `;
    }

    if (result.length === 0) {
      return null;
    }

    const location = result[0];

    // ถ้า accuracy แย่ ให้หาตำบลใกล้เคียงด้วย (เผื่อเลือก)
    let possibleTambons = undefined;
    if (isLowAccuracy) {
      possibleTambons = await prisma.$queryRaw<any[]>`
        SELECT 
          t.id as tambon_id,
          t.name_th as tambon_name,
          a.name_th as amphure_name,
          p.name_th as province_name,
          ST_Distance(
            t.geom::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          ) as distance_meters
        FROM loc_tambons t
        JOIN loc_amphures a ON t.amphure_id = a.id
        JOIN loc_provinces p ON a.province_id = p.id
        WHERE t.geom IS NOT NULL
          AND a.id = ${location.amphure_id}
        ORDER BY t.geom <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        LIMIT 5
      `;
    }

    return {
      coordinates: { lat, lng, accuracy },
      provinceId: location.province_id,
      provinceName: location.province_name,
      amphureId: location.amphure_id,
      amphureName: location.amphure_name,
      tambonId: location.tambon_id,
      tambonName: location.tambon_name,
      possibleTambons
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

// ========================================
// 3. LOCATION HIERARCHY MATCHING
// ========================================

/**
 * เช็คว่าร้านค้าตรงกับ location filter ที่กำหนดไหม
 */
export function matchesLocationFilter(
  shopLocation: {
    province_id: number | null;
    amphure_id: number | null;
    tambon_id: number | null;
  },
  userLocation: {
    provinceId: number | null;
    amphureId: number | null;
    tambonId: number | null;
  },
  filterLevel: 'tambon' | 'amphure' | 'province' | 'all' = 'all'
): boolean {
  if (filterLevel === 'all') return true;

  if (filterLevel === 'tambon') {
    return shopLocation.tambon_id === userLocation.tambonId;
  }

  if (filterLevel === 'amphure') {
    return shopLocation.amphure_id === userLocation.amphureId;
  }

  if (filterLevel === 'province') {
    return shopLocation.province_id === userLocation.provinceId;
  }

  return false;
}

// ========================================
// 4. AD SCOPE MATCHING
// ========================================

/**
 * เช็คว่าโฆษณาควรแสดงให้ user ที่อยู่ใน location นี้ไหม
 * ตาม scope ที่ร้านซื้อ (SUBDISTRICT/DISTRICT/PROVINCE/NATIONWIDE)
 */
export function matchesAdScope(
  adScope: string,
  shopLocation: {
    province_id?: number | null;
    amphure_id?: number | null;
    tambon_id?: number | null;
  },
  userLocation: {
    provinceId: number | null;
    amphureId: number | null;
    tambonId: number | null;
  }
): boolean {
  // Nationwide = แสดงทุกที่
  if (adScope === 'NATIONWIDE') return true;

  // Province = แสดงถ้าจังหวัดเดียวกัน
  if (adScope === 'PROVINCE') {
    return shopLocation.province_id === userLocation.provinceId;
  }

  // District = แสดงถ้าอำเภอเดียวกัน
  if (adScope === 'DISTRICT') {
    return shopLocation.amphure_id === userLocation.amphureId;
  }

  // Subdistrict = แสดงถ้าตำบลเดียวกัน
  if (adScope === 'SUBDISTRICT') {
    return shopLocation.tambon_id === userLocation.tambonId;
  }

  return false;
}

/**
 * ดึงโฆษณาที่ควรแสดงตาม user location
 */
export async function getAdsForLocation(
  userLocation: {
    provinceId: number | null;
    amphureId: number | null;
    tambonId: number | null;
  },
  limit: number = 10
) {
  // ดึงร้านทั้งหมดที่มี adPackage
  const shopsWithAds = await prisma.shop.findMany({
    where: {
      adPackageId: { not: null },
      status: 'APPROVED'
    },
    include: {
      AdPackage: true
    },
    take: limit * 3 // เอาเยอะๆ แล้วค่อย filter
  });

  // Filter ตาม scope
  const matchedAds = shopsWithAds.filter(shop => {
    if (!shop.AdPackage) return false;

    return matchesAdScope(
      shop.AdPackage.scope,
      {
        province_id: shop.province_id,
        amphure_id: shop.amphure_id,
        tambon_id: shop.tambon_id
      },
      userLocation
    );
  });

  // Sort by priority (higher = better placement)
  matchedAds.sort((a, b) => {
    const priorityA = a.AdPackage?.priority || 0;
    const priorityB = b.AdPackage?.priority || 0;
    return priorityB - priorityA;
  });

  return matchedAds.slice(0, limit);
}

// ========================================
// 5. COMBINED SHOP QUERY (Distance + Location + Ads)
// ========================================

/**
 * ดึงร้านค้าแบบครบถ้วน: ใช้ทั้ง GPS distance และ location hierarchy
 */
export async function getShopsForHomePage(
  userLocation: LocationInfo,
  options: {
    radiusKm?: number;
    filterLevel?: 'tambon' | 'amphure' | 'province' | 'all';
    categoryId?: string;
    limit?: number;
  } = {}
) {
  const {
    radiusKm = 20,
    filterLevel = 'all',
    categoryId,
    limit = 50
  } = options;

  // 1. หาร้านใกล้ๆ ตาม GPS
  let shops = await getShopsNearby(
    userLocation.coordinates.lat,
    userLocation.coordinates.lng,
    radiusKm,
    { limit: limit * 2, categoryId }
  );

  // 2. Filter ตาม location hierarchy ถ้าต้องการ
  if (filterLevel !== 'all') {
    shops = shops.filter(shop =>
      matchesLocationFilter(
        {
          province_id: shop.province_id,
          amphure_id: shop.amphure_id,
          tambon_id: shop.tambon_id
        },
        userLocation,
        filterLevel
      )
    );
  }

  // 3. ดึง subscription info
  const shopsWithSubscription = await Promise.all(
    shops.slice(0, limit).map(async (shop) => {
      const activeSubscription = await prisma.shopSubscription.findFirst({
        where: {
          shop_id: shop.id,
          status: 'ACTIVE',
          start_date: { lte: new Date() },
          end_date: { gte: new Date() }
        },
        include: {
          subscription_packages: true
        },
        orderBy: {
          subscription_packages: {
            display_weight: 'desc'
          }
        }
      });

      return {
        ...shop,
        activeSubscription
      };
    })
  );

  return shopsWithSubscription;
}

// ========================================
// 6. GPS VALIDATION & ERROR HANDLING
// ========================================

export interface GPSValidation {
  isValid: boolean;
  accuracy: number;
  warning?: string;
  shouldRetry?: boolean;
}

/**
 * ตรวจสอบคุณภาพของ GPS signal
 */
export function validateGPSAccuracy(
  coords: GeolocationCoordinates
): GPSValidation {
  const accuracy = coords.accuracy;

  // ดีมาก (0-50m)
  if (accuracy <= 50) {
    return { isValid: true, accuracy };
  }

  // พอใช้ได้ (50-200m)
  if (accuracy <= 200) {
    return {
      isValid: true,
      accuracy,
      warning: 'ตำแหน่ง GPS ไม่แม่นยำมาก (±' + Math.round(accuracy) + 'ม.)'
    };
  }

  // แย่ (200-500m)
  if (accuracy <= 500) {
    return {
      isValid: true,
      accuracy,
      warning: 'ตำแหน่ง GPS ไม่แม่นยำ (±' + Math.round(accuracy) + 'ม.) แนะนำให้ลองใหม่',
      shouldRetry: true
    };
  }

  // แย่มาก (>500m)
  return {
    isValid: false,
    accuracy,
    warning: 'ตำแหน่ง GPS ไม่แม่นยำมาก (±' + Math.round(accuracy) + 'ม.) กรุณาเลือกตำแหน่งด้วยตนเอง',
    shouldRetry: true
  };
}

/**
 * Default location (กรุงเทพฯ) - ใช้เฉพาะเมื่อ GPS ล้มเหลวสนิท
 */
export const DEFAULT_LOCATION: Coordinates = {
  lat: 13.7367,
  lng: 100.5231,
  accuracy: 999999 // บอกว่านี่เป็น default
};

export default {
  getShopsNearby,
  getLocationFromCoordinates,
  matchesLocationFilter,
  matchesAdScope,
  getAdsForLocation,
  getShopsForHomePage,
  validateGPSAccuracy,
  DEFAULT_LOCATION
};
