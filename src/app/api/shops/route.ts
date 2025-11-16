// src/app/api/shops/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const KM = 1000;

async function findAreaId(
  areaTable: 'loc_tambons' | 'loc_amphures' | 'loc_provinces',
  pointLng: number,
  pointLat: number,
  radiiMeters: number[]
) {
  const containsQuery = Prisma.sql`
    SELECT id
    FROM ${Prisma.raw(`"${areaTable}"`)}
    WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${pointLng}, ${pointLat}), 4326))
    LIMIT 1
  `;
  const containsRes: Array<{ id: number }> = await prisma.$queryRaw(containsQuery);
  if (containsRes && containsRes.length > 0) return containsRes[0].id;

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

async function hasColumn(columnName: string) {
  const q = Prisma.sql`
    SELECT 1
    FROM information_schema.columns
    WHERE table_name ILIKE 'shop' AND column_name = ${columnName}
    LIMIT 1
  `;
  const res: any[] = await prisma.$queryRaw(q);
  return Array.isArray(res) && res.length > 0;
}

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const lat = sp.get('lat');
    const lng = sp.get('lng');
    const limit = Number(sp.get('limit') || 50);
    const categoryId = sp.get('category') || null;
    const sortBy = (sp.get('sortBy') || 'createdAt') as 'distance' | 'name' | 'createdAt';
    const radiiMeters = [2 * KM, 5 * KM, 20 * KM, 50 * KM];

    // No location -> random shops (fast)
    if (!lat || !lng) {
      const randomQuery = Prisma.sql`
        SELECT s.id, s.name, s.description, s.address, s."categoryId", sc.name as category_name, s."createdAt"
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

    // find area ids via loc_* polygons
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

    // check which shop columns exist in DB
    const hasTambonCol = await hasColumn('tambon_id');
    const hasAmphureCol = await hasColumn('amphure_id');
    const hasProvinceCol = await hasColumn('province_id');

    const pointExpr = Prisma.sql`ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography`;

    const buildSelect = (includeDistance = true) => {
      const parts: Prisma.Sql[] = [
        Prisma.sql`s.id`,
        Prisma.sql`s.name`,
        Prisma.sql`s.description`,
        Prisma.sql`s.address`,
        Prisma.sql`s."categoryId"`,
        Prisma.sql`sc.name as category_name`,
        Prisma.sql`s.has_physical_store`,
        Prisma.sql`s."createdAt"`
      ];
      if (hasAmphureCol) parts.push(Prisma.sql`s.amphure_id`);
      if (hasTambonCol) parts.push(Prisma.sql`s.tambon_id`);
      if (hasProvinceCol) parts.push(Prisma.sql`s.province_id`);
      if (includeDistance) {
        parts.push(Prisma.sql`CASE WHEN s.location IS NOT NULL THEN ST_Distance(s.location::geography, ${pointExpr})/1000.0 ELSE NULL END as distance`);
      }
      return Prisma.join(parts, Prisma.sql`, `);
    };

    // Area-based query if area found and DB supports columns
    if (areaId && chosenLevel) {
      const areaFragments: Prisma.Sql[] = [];
      if (chosenLevel === 'tambon' && hasTambonCol) {
        areaFragments.push(Prisma.sql`s.tambon_id = ${areaId}`);
      } else if (chosenLevel === 'amphure' && hasAmphureCol) {
        areaFragments.push(Prisma.sql`s.amphure_id = ${areaId}`);
      } else if (chosenLevel === 'province' && hasProvinceCol) {
        areaFragments.push(Prisma.sql`s.province_id = ${areaId}`);
      }

      // Always include a distance-based fallback condition
      const smallRadius = 5 * KM;
      areaFragments.push(Prisma.sql`ST_DWithin(s.location::geography, ${pointExpr}, ${smallRadius})`);

      const shopsQuery = Prisma.sql`
        SELECT ${buildSelect(true)}
        FROM "Shop" s
        INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
        WHERE s.status = 'APPROVED' AND (${Prisma.join(areaFragments, Prisma.sql` OR `)})
        ${categoryId ? Prisma.sql`AND s."categoryId" = ${categoryId}` : Prisma.sql``}
        ORDER BY ${sortBy === 'distance' ? Prisma.sql`distance ASC NULLS LAST` : sortBy === 'name' ? Prisma.sql`s.name ASC` : Prisma.sql`s."createdAt" DESC`}
        LIMIT ${limit}
      `;
      const shopsRes = await prisma.$queryRaw(shopsQuery);
      if (shopsRes && shopsRes.length > 0) {
        return NextResponse.json({
          success: true,
          shops: shopsRes.map((r: any) => ({ ...r, distance: r.distance != null ? parseFloat(Number(r.distance).toFixed(2)) : null })),
          hasLocation: true,
          area: { level: chosenLevel, id: areaId },
          userLocation: { lat: latitude, lng: longitude },
        });
      }
      // else fallthrough
    }

    // Distance-only progressive search
    for (const r of radiiMeters) {
      const q = Prisma.sql`
        SELECT ${buildSelect(true)}
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
          shops: rows.map((r: any) => ({ ...r, distance: r.distance != null ? parseFloat(Number(r.distance).toFixed(2)) : null })),
          hasLocation: true,
          userLocation: { lat: latitude, lng: longitude },
        });
      }
    }

    // Final fallback: random shops (no distance)
    const fallbackQuery = Prisma.sql`
      SELECT ${Prisma.join([
        Prisma.sql`s.id`,
        Prisma.sql`s.name`,
        Prisma.sql`s.description`,
        Prisma.sql`s.address`,
        Prisma.sql`s."categoryId"`,
        Prisma.sql`sc.name as category_name`,
        Prisma.sql`s.has_physical_store`,
        Prisma.sql`s."createdAt"`
      ], Prisma.sql`, `)}
      ${hasAmphureCol ? Prisma.sql`, s.amphure_id` : Prisma.sql``}
      ${hasTambonCol ? Prisma.sql`, s.tambon_id` : Prisma.sql``}
      ${hasProvinceCol ? Prisma.sql`, s.province_id` : Prisma.sql``}
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