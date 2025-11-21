// src/app/api/shops/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Safer implementation with LEFT JOIN and debug logging.
 * NOTE: SELECT includes s.image so frontend can render shop images.
 */

const KM = 1000;
const VALID_AREA_TABLES = ['loc_tambons', 'loc_amphures', 'loc_provinces'] as const;
type AreaTable = (typeof VALID_AREA_TABLES)[number];

function assertAreaTable(t: string): asserts t is AreaTable {
  if (!VALID_AREA_TABLES.includes(t as AreaTable)) {
    throw new Error(`Invalid area table: ${t}`);
  }
}

async function findAreaId(areaTable: AreaTable, pointLng: number, pointLat: number, radiiMeters: number[]) {
  assertAreaTable(areaTable);
  const containsSql = `SELECT id FROM "${areaTable}" WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) LIMIT 1;`;
  const containsRes: Array<{ id: number }> = await prisma.$queryRawUnsafe(containsSql, pointLng, pointLat);
  if (containsRes && containsRes.length > 0) return containsRes[0].id;

  for (const r of radiiMeters) {
    const nearSql = `
      SELECT id, ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS dist
      FROM "${areaTable}"
      WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY dist ASC
      LIMIT 1;
    `;
    const nearRes: Array<{ id: number; dist: number }> = await prisma.$queryRawUnsafe(nearSql, pointLng, pointLat, r);
    if (nearRes && nearRes.length > 0) return nearRes[0].id;
  }
  return null;
}

async function tableHasColumn(tableName: string, columnName: string) {
  const q = `SELECT 1 FROM information_schema.columns WHERE table_name ILIKE $1 AND column_name = $2 LIMIT 1;`;
  const res: any[] = await prisma.$queryRawUnsafe(q, tableName, columnName);
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

    const hasStatusCol = await tableHasColumn('shop', 'status');
    const hasLocationCol = await tableHasColumn('shop', 'location');
    const hasTambonCol = await tableHasColumn('shop', 'tambon_id');
    const hasAmphureCol = await tableHasColumn('shop', 'amphure_id');
    const hasProvinceCol = await tableHasColumn('shop', 'province_id');

    // No location => random
    if (!lat || !lng) {
      const whereParts: string[] = [];
      const params: any[] = [];
      if (hasStatusCol) whereParts.push(`s.status = 'APPROVED'`);
      if (categoryId) {
        params.push(categoryId);
        whereParts.push(`s."categoryId" = $${params.length}`);
      }
      const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
      const sql = `
        SELECT s.id, s.name, s.description, s.address, s."categoryId", sc.name as category_name, s."createdAt", s.image,
        (
          SELECT sp.tier
          FROM "shop_subscriptions" ss
          JOIN "subscription_packages" sp ON ss."planId" = sp.id
          WHERE ss."shopId" = s.id
            AND ss.status = 'ACTIVE'
            AND ss."expiresAt" > NOW()
          ORDER BY sp.tier DESC
          LIMIT 1
        ) as subscription_tier
        FROM "Shop" s
        LEFT JOIN "ShopCategory" sc ON s."categoryId" = sc.id
        ${whereClause}
        ORDER BY RANDOM()
        LIMIT $${params.length + 1};
      `;
      params.push(limit);
      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      console.log('[api/shops] random rows:', rows.length);
      return NextResponse.json({ success: true, shops: rows, hasLocation: false });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const tambonId = await findAreaId('loc_tambons', longitude, latitude, radiiMeters);
    let chosenLevel: 'tambon' | 'amphure' | 'province' | null = null;
    let areaId: number | null = null;
    if (tambonId) { chosenLevel = 'tambon'; areaId = tambonId; }
    else {
      const amphureId = await findAreaId('loc_amphures', longitude, latitude, radiiMeters);
      if (amphureId) { chosenLevel = 'amphure'; areaId = amphureId; }
      else {
        const provinceId = await findAreaId('loc_provinces', longitude, latitude, radiiMeters);
        if (provinceId) { chosenLevel = 'province'; areaId = provinceId; }
      }
    }

    const pointExprParams = [longitude, latitude];

    // Build SELECT columns
    const selectCols = [
      's.id','s.name','s.description','s.address','s."categoryId"','sc.name as category_name','s.has_physical_store','s."createdAt"',
      // Include s.image for frontend to render shop images
      's.image',
      // Include subscription tier (from active subscription)
      `(
        SELECT sp.tier
        FROM "shop_subscriptions" ss
        JOIN "subscription_packages" sp ON ss."planId" = sp.id
        WHERE ss."shopId" = s.id
          AND ss.status = 'ACTIVE'
          AND ss."expiresAt" > NOW()
        ORDER BY sp.tier DESC
        LIMIT 1
      ) as subscription_tier`
    ];
    if (hasAmphureCol) selectCols.push('s.amphure_id');
    if (hasTambonCol) selectCols.push('s.tambon_id');
    if (hasProvinceCol) selectCols.push('s.province_id');
    if (hasLocationCol) selectCols.push(`CASE WHEN s.location IS NOT NULL THEN ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography)/1000.0 ELSE NULL END as distance`);
    else selectCols.push('NULL as distance');
    const selectList = selectCols.join(', ');

    // Area-based query (use LEFT JOIN to not drop shops without category)
    if (areaId && chosenLevel) {
      const params: any[] = [longitude, latitude];
      const areaConditions: string[] = [];
      if (chosenLevel === 'tambon' && hasTambonCol) { params.push(areaId); areaConditions.push(`s.tambon_id = $${params.length}`); }
      else if (chosenLevel === 'amphure' && hasAmphureCol) { params.push(areaId); areaConditions.push(`s.amphure_id = $${params.length}`); }
      else if (chosenLevel === 'province' && hasProvinceCol) { params.push(areaId); areaConditions.push(`s.province_id = $${params.length}`); }

      const smallRadius = 5 * KM;
      if (hasLocationCol) { params.push(smallRadius); areaConditions.push(`ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $${params.length})`); }

      const whereParts: string[] = [];
      if (hasStatusCol) whereParts.push(`s.status = 'APPROVED'`);
      if (areaConditions.length > 0) whereParts.push(`(${areaConditions.join(' OR ')})`);
      if (categoryId) { params.push(categoryId); whereParts.push(`s."categoryId" = $${params.length}`); }
      params.push(limit);

      const sql = `
        SELECT ${selectList}
        FROM "Shop" s
        LEFT JOIN "ShopCategory" sc ON s."categoryId" = sc.id
        ${whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''}
        ORDER BY ${ (sortBy === 'distance' && hasLocationCol) ? 'distance ASC NULLS LAST' : (sortBy === 'name' ? 's.name ASC' : 's."createdAt" DESC') }
        LIMIT $${params.length};
      `;
      const shopsRes = await prisma.$queryRawUnsafe(sql, ...params);
      console.log('[api/shops] area query rows:', shopsRes.length, { chosenLevel, areaId });
      if (shopsRes && shopsRes.length > 0) {
        return NextResponse.json({
          success: true,
          shops: shopsRes.map((r: any) => ({ ...r, distance: r.distance != null ? parseFloat(Number(r.distance).toFixed(2)) : null })),
          hasLocation: hasLocationCol,
          area: { level: chosenLevel, id: areaId },
          userLocation: { lat: latitude, lng: longitude },
        });
      }
    }

    // Distance-only progressive
    if (hasLocationCol) {
      for (const r of radiiMeters) {
        const params = [longitude, latitude, r, limit];
        const whereClauseParts = [];
        if (hasStatusCol) whereClauseParts.push(`s.status = 'APPROVED'`);
        whereClauseParts.push(`ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, $3)`);
        if (categoryId) { params.splice(3,0,categoryId); whereClauseParts.push(`s."categoryId" = $4`); params.push(limit); }
        const sql = `
          SELECT ${selectList}
          FROM "Shop" s
          LEFT JOIN "ShopCategory" sc ON s."categoryId" = sc.id
          WHERE ${whereClauseParts.join(' AND ')}
          ORDER BY distance ASC
          LIMIT $${params.length};
        `;
        const rows = await prisma.$queryRawUnsafe(sql, ...params);
        console.log('[api/shops] distance r=', r, 'rows=', rows.length);
        if (rows && rows.length > 0) {
          return NextResponse.json({
            success: true,
            shops: rows.map((r: any) => ({ ...r, distance: r.distance != null ? parseFloat(Number(r.distance).toFixed(2)) : null })),
            hasLocation: true,
            userLocation: { lat: latitude, lng: longitude },
          });
        }
      }
    }

    // Final fallback random
    const paramsFinal: any[] = [];
    const whereFinal: string[] = [];
    if (hasStatusCol) whereFinal.push(`s.status = 'APPROVED'`);
    if (categoryId) { paramsFinal.push(categoryId); whereFinal.push(`s."categoryId" = $${paramsFinal.length}`); }
    paramsFinal.push(limit);
    const sqlFinal = `
      SELECT ${selectList.replace(/CASE WHEN s.location.*?END as distance/, 'NULL as distance')}
      FROM "Shop" s
      LEFT JOIN "ShopCategory" sc ON s."categoryId" = sc.id
      ${whereFinal.length > 0 ? `WHERE ${whereFinal.join(' AND ')}` : ''}
      ORDER BY RANDOM()
      LIMIT $${paramsFinal.length};
    `;
    const fallbackRows = await prisma.$queryRawUnsafe(sqlFinal, ...paramsFinal);
    console.log('[api/shops] fallback rows:', fallbackRows.length);
    return NextResponse.json({ success: true, shops: fallbackRows, hasLocation: false });

  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shops', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}