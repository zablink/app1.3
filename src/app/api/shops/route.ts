// src/app/api/shops/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/shops
 * 
 * Query Parameters:
 * - lat: latitude (optional)
 * - lng: longitude (optional)
 * - limit: number of shops to return (default: 50)
 * - sortBy: 'distance' | 'name' | 'createdAt' (default: 'createdAt')
 * - category: filter by category id
 * - province: filter by province id
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'distance' | 'name' | 'createdAt';
    const categoryId = searchParams.get('category');
    const provinceId = searchParams.get('province');

    // ============================================
    // กรณีที่ 1: ไม่มี Location (โหลดทั้งหมด)
    // ============================================
    if (!lat || !lng) {
      const shops = await prisma.shop.findMany({
        where: {
          status: 'APPROVED',
          ...(categoryId && { categoryId }),
          ...(provinceId && { province_id: provinceId ? parseInt(provinceId) : undefined }),
        },
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          categoryId: true,
          province_id: true,
          amphure_id: true,
          tambon_id: true,
          has_physical_store: true,
          createdAt: true,
          ShopCategory: {
            select: {
              name: true,
            },
          },
        },
        orderBy:
          sortBy === 'name'
            ? { name: 'asc' }
            : { createdAt: 'desc' },
        take: limit,
      });

      return NextResponse.json({
        success: true,
        shops: shops,
        hasLocation: false,
      });
    }

    // ============================================
    // กรณีที่ 2: มี Location (คำนวณ Distance)
    // ============================================
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Build parameterized WHERE conditions using Prisma.sql
    const conditions: Prisma.Sql[] = [Prisma.sql`s.status = 'APPROVED'`];

    if (categoryId) {
      conditions.push(Prisma.sql`s."categoryId" = ${categoryId}`);
    }
    if (provinceId) {
      const provNum = parseInt(provinceId);
      conditions.push(Prisma.sql`s.province_id = ${provNum}`);
    }

    // Distance expression (meters) - used in SELECT and ORDER BY when needed
    const distanceMetersExpr = Prisma.sql`
      ST_Distance(
        s.location::geography,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
      )
    `;

    // SELECT with distance (divide by 1000 -> km)
    // Use parameterized query via Prisma.sql to avoid placeholder mismatches.
    const shopsWithDistance = await prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        address: string | null;
        categoryId: string;
        category_name: string;
        province_id: number | null;
        amphure_id: number | null;
        tambon_id: number | null;
        has_physical_store: boolean;
        createdAt: Date;
        distance: number | null; // in kilometers
      }>
    >(Prisma.sql`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.address,
        s."categoryId",
        sc.name as category_name,
        s.province_id,
        s.amphure_id,
        s.tambon_id,
        s.has_physical_store,
        s."createdAt",
        CASE 
          WHEN s.location IS NOT NULL THEN (${distanceMetersExpr}) / 1000.0
          ELSE NULL
        END as distance
      FROM "Shop" s
      INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
      WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}
      ORDER BY
        ${
          sortBy === 'distance'
            ? Prisma.sql`${Prisma.sql`CASE WHEN s.location IS NOT NULL THEN (${distanceMetersExpr}) ELSE 999999999 END`} ASC`
            : sortBy === 'name'
            ? Prisma.sql`s.name ASC`
            : Prisma.sql`s."createdAt" DESC`
        }
      LIMIT ${limit}
    `);

    return NextResponse.json({
      success: true,
      shops: shopsWithDistance.map((shop) => ({
        ...shop,
        distance: shop.distance !== null && shop.distance !== undefined ? parseFloat((shop.distance as number).toFixed(2)) : null,
        ShopCategory: {
          name: shop.category_name,
        },
      })),
      hasLocation: true,
      userLocation: {
        lat: latitude,
        lng: longitude,
      },
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch shops',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Distance Calculation Explanation:
 * 
 * ST_Distance(geography1, geography2)
 * - Returns distance in meters between two points
 * - Uses WGS84 spheroid (accurate for Earth surface)
 * 
 * ST_MakePoint(longitude, latitude)
 * - Creates a point geometry
 * - Note: longitude first, then latitude!
 * 
 * ST_SetSRID(geometry, 4326)
 * - Sets coordinate reference system to WGS84 (lat/lng)
 * 
 * ::geography
 * - Casts to geography type for accurate distance on spheroid
 * 
 * / 1000.0
 * - Converts meters to kilometers
 */