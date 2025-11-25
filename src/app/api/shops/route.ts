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

// Helper: Validate Thailand coordinates
function isValidThailandCoordinates(lat: number, lng: number): boolean {
  if (lat === 0 && lng === 0) return false; // Default GPS error
  // Thailand boundaries (approximate): 5.5°N to 21°N, 97°E to 106°E
  return lat >= 5.5 && lat <= 21 && lng >= 97 && lng <= 106;
}

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
  const startTime = Date.now();
  
  try {
    const sp = request.nextUrl.searchParams;
    const latStr = sp.get('lat');
    const lngStr = sp.get('lng');
    const limit = Number(sp.get('limit') || 50);
    const offset = Number(sp.get('offset') || 0);
    // categoryId removed - now using many-to-many categories
    const sortBy = (sp.get('sortBy') || 'createdAt') as 'distance' | 'name' | 'createdAt';
    const radiiMeters = [2 * KM, 5 * KM, 20 * KM, 50 * KM];
    
    console.log(`[api/shops] Request started - lat: ${latStr}, lng: ${lngStr}, limit: ${limit}, offset: ${offset}`);
    
    // Validate and parse lat/lng
    let lat: string | null = null;
    let lng: string | null = null;
    
    if (latStr && lngStr) {
      const latNum = parseFloat(latStr);
      const lngNum = parseFloat(lngStr);
      
      if (isValidThailandCoordinates(latNum, lngNum)) {
        lat = latStr;
        lng = lngStr;
      } else {
        console.log(`⚠️ Invalid coordinates ignored: (${latNum}, ${lngNum})`);
        // Set to null to use random fallback instead
        lat = null;
        lng = null;
      }
    }

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
      // Category filter removed - now using many-to-many
      const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
      
      try {
        // Optimized query using window function to get latest subscription per shop
        const sql = `
          WITH ranked_shops AS (
            SELECT DISTINCT ON (s.id)
              s.id, s.name, s.description, s.address, s."createdAt", s.image, s.lat, s.lng, s.is_mockup as "isMockup",
              lt.name_th as subdistrict,
              la.name_th as district,
              lp.name_th as province,
              COALESCE(sp.tier, 'FREE') as "subscriptionTier",
              (
                SELECT JSON_AGG(JSON_BUILD_OBJECT('id', sc.id, 'name', sc.name, 'slug', sc.slug, 'icon', sc.icon))
                FROM shop_category_mapping scm
                JOIN "ShopCategory" sc ON scm.category_id = sc.id
                WHERE scm.shop_id = s.id
              ) as categories,
              CASE sp.tier
                WHEN 'PREMIUM' THEN 1
                WHEN 'PRO' THEN 2
                WHEN 'BASIC' THEN 3
                ELSE 4
              END as tier_rank
            FROM "Shop" s
            LEFT JOIN loc_tambons lt ON s.tambon_id = lt.id
            LEFT JOIN loc_amphures la ON s.amphure_id = la.id
            LEFT JOIN loc_provinces lp ON s.province_id = lp.id
            LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
              AND ss.status = 'ACTIVE' 
              AND ss.end_date > NOW()
            LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
            ${whereClause}
            ORDER BY s.id, ss.start_date DESC NULLS LAST, ss.created_at DESC NULLS LAST
          )
          SELECT id, name, description, address, "createdAt", image, lat, lng, "isMockup",
                 subdistrict, district, province, "subscriptionTier", categories
          FROM ranked_shops
          ORDER BY tier_rank ASC, "createdAt" DESC
          OFFSET $${params.length + 1}
          LIMIT $${params.length + 2};
        `;
        params.push(offset);
        params.push(limit);
        const rows = await prisma.$queryRawUnsafe(sql, ...params);
        const elapsed = Date.now() - startTime;
        console.log(`[api/shops] random rows: ${Array.isArray(rows) ? rows.length : 'not array'}, offset: ${offset}, time: ${elapsed}ms`);
        return NextResponse.json({ success: true, shops: Array.isArray(rows) ? rows : [], hasLocation: false, queryTime: elapsed });
      } catch (sqlError) {
        console.error('[api/shops] SQL error:', sqlError);
        // Fallback: try without subscriptionTier
        const simpleSql = `
          SELECT s.id, s.name, s.description, s.address, s."createdAt", s.image, s.lat, s.lng,
            lt.name_th as subdistrict,
            la.name_th as district,
            lp.name_th as province,
            'FREE' as "subscriptionTier",
            (
              SELECT JSON_AGG(JSON_BUILD_OBJECT('id', sc.id, 'name', sc.name, 'slug', sc.slug, 'icon', sc.icon))
              FROM shop_category_mapping scm
              JOIN "ShopCategory" sc ON scm.category_id = sc.id
              WHERE scm.shop_id = s.id
            ) as categories
          FROM "Shop" s
          LEFT JOIN loc_tambons lt ON s.tambon_id = lt.id
          LEFT JOIN loc_amphures la ON s.amphure_id = la.id
          LEFT JOIN loc_provinces lp ON s.province_id = lp.id
          ${whereClause}
          ORDER BY RANDOM()
          LIMIT $${params.length};
        `;
        const fallbackParams = params.slice(0, -1); // Remove the last param (limit) that was already added
        fallbackParams.push(limit); // Add limit again
        const rows = await prisma.$queryRawUnsafe(simpleSql, ...fallbackParams);
        const elapsed = Date.now() - startTime;
        console.log(`[api/shops] fallback random rows: ${Array.isArray(rows) ? rows.length : 0}, time: ${elapsed}ms`);
        return NextResponse.json({ success: true, shops: Array.isArray(rows) ? rows : [], hasLocation: false, queryTime: elapsed });
      }
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

    // Build SELECT columns with optimized subscription tier query
    const selectCols = [
      's.id','s.name','s.description','s.address','s.has_physical_store','s."createdAt"',
      // Include s.image for frontend to render shop images
      's.image',
      // Include is_mockup flag
      's.is_mockup as "isMockup"',
      // Include lat, lng for map display
      's.lat', 's.lng',
      // Include location fields
      'lt.name_th as subdistrict',
      'la.name_th as district', 
      'lp.name_th as province',
      // Use LEFT JOIN result instead of subquery for better performance
      `COALESCE(sp.tier, 'FREE') as "subscriptionTier"`,
      // Include categories as JSON array
      `(
        SELECT JSON_AGG(JSON_BUILD_OBJECT('id', sc.id, 'name', sc.name, 'slug', sc.slug, 'icon', sc.icon))
        FROM shop_category_mapping scm
        JOIN "ShopCategory" sc ON scm.category_id = sc.id
        WHERE scm.shop_id = s.id
      ) as categories`
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
      // categoryId filter removed
      params.push(limit);

      const sql = `
        WITH ranked_shops AS (
          SELECT DISTINCT ON (s.id) ${selectList},
            CASE sp.tier
              WHEN 'PREMIUM' THEN 1
              WHEN 'PRO' THEN 2
              WHEN 'BASIC' THEN 3
              ELSE 4
            END as tier_rank
          FROM "Shop" s
          LEFT JOIN loc_tambons lt ON s.tambon_id = lt.id
          LEFT JOIN loc_amphures la ON s.amphure_id = la.id
          LEFT JOIN loc_provinces lp ON s.province_id = lp.id
          LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
            AND ss.status = 'ACTIVE' 
            AND ss.end_date > NOW()
          LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
          ${whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''}
          ORDER BY s.id, ss.start_date DESC NULLS LAST, ss.created_at DESC NULLS LAST
        )
        SELECT ${selectList.split(',').map(col => {
          const match = col.trim().match(/as\s+"?(\w+)"?$/i);
          return match ? match[1] : col.trim().split('.').pop()?.replace(/^"/, '').replace(/"$/, '') || col;
        }).join(', ')}
        FROM ranked_shops
        ORDER BY tier_rank ASC,
          ${ (sortBy === 'distance' && hasLocationCol) ? 'distance ASC NULLS LAST' : (sortBy === 'name' ? 'name ASC' : '"createdAt" DESC') }
        LIMIT $${params.length};
      `;
      const shopsRes = await prisma.$queryRawUnsafe(sql, ...params);
      const elapsed = Date.now() - startTime;
      console.log(`[api/shops] area query rows: ${shopsRes.length}, chosenLevel: ${chosenLevel}, areaId: ${areaId}, time: ${elapsed}ms`);
      if (shopsRes && shopsRes.length > 0) {
        return NextResponse.json({
          success: true,
          shops: shopsRes.map((r: any) => ({ ...r, distance: r.distance != null ? parseFloat(Number(r.distance).toFixed(2)) : null })),
          hasLocation: hasLocationCol,
          area: { level: chosenLevel, id: areaId },
          userLocation: { lat: latitude, lng: longitude },
          queryTime: elapsed,
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
        // categoryId filter removed
        const sql = `
          WITH ranked_shops AS (
            SELECT DISTINCT ON (s.id) ${selectList},
              CASE sp.tier
                WHEN 'PREMIUM' THEN 1
                WHEN 'PRO' THEN 2
                WHEN 'BASIC' THEN 3
                ELSE 4
              END as tier_rank
            FROM "Shop" s
            LEFT JOIN loc_tambons lt ON s.tambon_id = lt.id
            LEFT JOIN loc_amphures la ON s.amphure_id = la.id
            LEFT JOIN loc_provinces lp ON s.province_id = lp.id
            LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
              AND ss.status = 'ACTIVE' 
              AND ss.end_date > NOW()
            LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
            WHERE ${whereClauseParts.join(' AND ')}
            ORDER BY s.id, ss.start_date DESC NULLS LAST, ss.created_at DESC NULLS LAST
          )
          SELECT ${selectList.split(',').map(col => {
            const match = col.trim().match(/as\s+"?(\w+)"?$/i);
            return match ? match[1] : col.trim().split('.').pop()?.replace(/^"/, '').replace(/"$/, '') || col;
          }).join(', ')}
          FROM ranked_shops
          ORDER BY tier_rank ASC, distance ASC
          LIMIT $${params.length};
        `;
        const rows = await prisma.$queryRawUnsafe(sql, ...params);
        const elapsed = Date.now() - startTime;
        console.log(`[api/shops] distance r=${r}m, rows=${rows.length}, time=${elapsed}ms`);
        if (rows && rows.length > 0) {
          return NextResponse.json({
            success: true,
            shops: rows.map((r: any) => ({ ...r, distance: r.distance != null ? parseFloat(Number(r.distance).toFixed(2)) : null })),
            hasLocation: true,
            userLocation: { lat: latitude, lng: longitude },
            queryTime: elapsed,
          });
        }
      }
    }

    // Final fallback random
    const paramsFinal: any[] = [];
    const whereFinal: string[] = [];
    if (hasStatusCol) whereFinal.push(`s.status = 'APPROVED'`);
    // categoryId filter removed
    paramsFinal.push(limit);
    const sqlFinal = `
      WITH ranked_shops AS (
        SELECT DISTINCT ON (s.id) ${selectList.replace(/CASE WHEN s.location.*?END as distance/, 'NULL as distance')},
          CASE sp.tier
            WHEN 'PREMIUM' THEN 1
            WHEN 'PRO' THEN 2
            WHEN 'BASIC' THEN 3
            ELSE 4
          END as tier_rank
        FROM "Shop" s
        LEFT JOIN loc_tambons lt ON s.tambon_id = lt.id
        LEFT JOIN loc_amphures la ON s.amphure_id = la.id
        LEFT JOIN loc_provinces lp ON s.province_id = lp.id
        LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
          AND ss.status = 'ACTIVE' 
          AND ss.end_date > NOW()
        LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
        ${whereFinal.length > 0 ? `WHERE ${whereFinal.join(' AND ')}` : ''}
        ORDER BY s.id, ss.start_date DESC NULLS LAST, ss.created_at DESC NULLS LAST
      )
      SELECT ${selectList.replace(/CASE WHEN s.location.*?END as distance/, 'NULL as distance').split(',').map(col => {
        const match = col.trim().match(/as\s+"?(\w+)"?$/i);
        return match ? match[1] : col.trim().split('.').pop()?.replace(/^"/, '').replace(/"$/, '') || col;
      }).join(', ')}
      FROM ranked_shops
      ORDER BY tier_rank ASC, RANDOM()
      LIMIT $${paramsFinal.length};
    `;
    const fallbackRows = await prisma.$queryRawUnsafe(sqlFinal, ...paramsFinal);
    const elapsed = Date.now() - startTime;
    console.log(`[api/shops] fallback rows: ${fallbackRows.length}, time: ${elapsed}ms`);
    return NextResponse.json({ success: true, shops: fallbackRows, hasLocation: false, queryTime: elapsed });

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[api/shops] Error after ${elapsed}ms:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shops', message: error instanceof Error ? error.message : 'Unknown', queryTime: elapsed },
      { status: 500 }
    );
  }
}