// src/app/api/shops/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/shops
 * Behavior:
 * 1) If no lat/lng -> return random shops (good UX)
 * 2) If lat/lng -> try to find tambon containing point, else nearest tambon within radii,
 *    else amphure, else province. When area found, query shops by that area or by distance within radius.
 */

const KM = 1000;

async function findAreaId(
  areaTable: 'loc_tambons' | 'loc_amphures' | 'loc_provinces',
  pointLng: number,
  pointLat: number,
  radiiMeters: number[]
) {
  // 1) try ST_Contains
  const containsQuery = Prisma.sql`
    SELECT id
    FROM ${Prisma.raw(`"${areaTable}"`)}
    WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${pointLng}, ${pointLat}), 4326))
    LIMIT 1
  `;
  const containsRes: Array<{ id: number }> = await prisma.$queryRaw(containsQuery);
  if (containsRes && containsRes.length > 0) return containsRes[0].id;

  // 2) try progressive radii (nearest within radius)
  for (const r of radiiMeters) {
    const nearQuery = Prisma.sql`
      SELECT id, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(${pointLng}, ${pointLat}), 4326)::geography) AS dist
      FROM ${Prisma.raw(`"${areaTable}"`)}
      WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(${pointLng}, ${pointLat}), 4326)::geography, ${r})
      ORDER BY dist ASC
      LIMIT 1
    `;
    const nearRes: Array<{ id: number; dist: number }> = await prisma.$queryRaw(nearQuery);
    if (nearRes && nearRes.length > 0) return nearRes[0].id;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const lat = sp.get('lat');
    const lng = sp.get('lng');
    const limit = Number(sp.get('limit') || 50);
    const categoryId = sp.get('category') || null;
    const sortBy = (sp.get('sortBy') || 'createdAt') as 'distance' | 'name' | 'createdAt';

    // default radii (meters) to expand search area
    const radiiMeters = [2 * KM, 5 * KM, 20 * KM, 50 * KM];

    // ------------- No location: return random shops -------------
    if (!lat || !lng) {
      // Use parameterized raw query for ORDER BY RANDOM()
      const randomQuery = Prisma.sql`
        SELECT s.id, s.name, s.description, s.address, s."categoryId", sc.name as category_name, s.amphure_id, s.tambon_id, s.has_physical_store, s."createdAt"
        FROM "Shop" s
        INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
        WHERE s.status = 'APPROVED'
        ${categoryId ? Prisma.sql`AND s."categoryId" = ${categoryId}` : Prisma.sql``}
        ORDER BY RANDOM()
        LIMIT ${limit}
      `;
      const rows = await prisma.$queryRaw(randomQuery);
      return NextResponse.json({ success: true, shops: rows, hasLocation: false });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // ------------- Find area (tambon -> amphure -> province) -------------
    // try tambon
    const tambonId = await findAreaId('loc_tambons', longitude, latitude, radiiMeters);
    let chosenLevel: 'tambon' | 'amphure' | 'province' | null = null;
    let areaId: number | null = null;

    if (tambonId) {
      chosenLevel = 'tambon';
      areaId = tambonId;
    } else {
      const amphureId = await findAreaId('loc_amphures', longitude, latitude, radiiMeters);
      if (amphureId) {
        chosenLevel = 'amphure';
        areaId = amphureId;
      } else {
        const provinceId = await findAreaId('loc_provinces', longitude, latitude, radiiMeters);
        if (provinceId) {
          chosenLevel = 'province';
          areaId = provinceId;
        }
      }
    }

    // ------------- If area found -> query shops by area or distance -------------
    const pointExpr = Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;

    if (areaId && chosenLevel) {
      // Decide which shop field to compare based on level
      const shopField =
        chosenLevel === 'tambon' ? Prisma.raw(`s.tambon_id`) :
        chosenLevel === 'amphure' ? Prisma.raw(`s.amphure_id`) :
        Prisma.raw(`s.province_id`);

      // Prefer shops in same area first (exact match), but also include nearby shops within small radius
      const smallRadius = 5 * KM; // e.g., 5km fallback
      const shopsQuery = Prisma.sql`
        SELECT
          s.id, s.name, s.description, s.address, s."categoryId", sc.name as category_name,
          s.amphure_id, s.tambon_id, s.has_physical_store, s."createdAt",
          CASE WHEN s.location IS NOT NULL THEN ST_Distance(s.location::geography, ${pointExpr})/1000.0 ELSE NULL END as distance
        FROM "Shop" s
        INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
        WHERE s.status = 'APPROVED' AND (${Prisma.join([
          Prisma.sql`${shopField} = ${areaId}`,
          Prisma.sql`ST_DWithin(s.location::geography, ${pointExpr}, ${smallRadius})`
        ], Prisma.sql` OR `)})
        ${categoryId ? Prisma.sql`AND s."categoryId" = ${categoryId}` : Prisma.sql``}
        ORDER BY
          ${sortBy === 'distance' ? Prisma.sql`distance ASC NULLS LAST` : sortBy === 'name' ? Prisma.sql`s.name ASC` : Prisma.sql`s."createdAt" DESC`}
        LIMIT ${limit}
      `;
      const shopsRes = await prisma.$queryRaw(shopsQuery);
      if (shopsRes && shopsRes.length > 0) {
        return NextResponse.json({
          success: true,
          shops: shopsRes.map((r: any) => ({ ...r, distance: r.distance !== null ? parseFloat(Number(r.distance).toFixed(2)) : null })),
          hasLocation: true,
          area: { level: chosenLevel, id: areaId },
          userLocation: { lat: latitude, lng: longitude },
        });
      }
      // else fallthrough to distance-only query
    }

    // ------------- Distance-only fallback search -------------
    // Expand radii until we find shops
    for (const r of radiiMeters) {
      const q = Prisma.sql`
        SELECT
          s.id, s.name, s.description, s.address, s."categoryId", sc.name as category_name,
          s.amphure_id, s.tambon_id, s.has_physical_store, s."createdAt",
          CASE WHEN s.location IS NOT NULL THEN ST_Distance(s.location::geography, ${pointExpr})/1000.0 ELSE NULL END as distance
        FROM "Shop" s
        INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
        WHERE s.status = 'APPROVED' AND ST_DWithin(s.location::geography, ${pointExpr}, ${r})
        ${categoryId ? Prisma.sql`AND s."categoryId" = ${categoryId}` : Prisma.sql``}
        ORDER BY ${Prisma.sql`distance ASC`}
        LIMIT ${limit}
      `;
      const rows = await prisma.$queryRaw(q);
      if (rows && rows.length > 0) {
        return NextResponse.json({
          success: true,
          shops: rows.map((r: any) => ({ ...r, distance: r.distance !== null ? parseFloat(Number(r.distance).toFixed(2)) : null })),
          hasLocation: true,
          userLocation: { lat: latitude, lng: longitude },
        });
      }
    }

    // ------------- Final fallback: return random shops (the initial set) -------------
    const fallbackQuery = Prisma.sql`
      SELECT s.id, s.name, s.description, s.address, s."categoryId", sc.name as category_name, s.amphure_id, s.tambon_id, s.has_physical_store, s."createdAt"
      FROM "Shop" s
      INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
      WHERE s.status = 'APPROVED'
      ${categoryId ? Prisma.sql`AND s."categoryId" = ${categoryId}` : Prisma.sql``}
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
    const fallbackRows = await prisma.$queryRaw(fallbackQuery);
    return NextResponse.json({ success: true, shops: fallbackRows, hasLocation: false });
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shops', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}