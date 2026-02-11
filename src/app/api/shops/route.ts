// src/app/api/shops/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Safer implementation with LEFT JOIN and debug logging.
 * NOTE: SELECT includes s.image so frontend can render shop images.
 */

const KM = 1000;
const VALID_AREA_TABLES = ['th_subdistricts', 'th_districts', 'th_provinces'] as const;
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
  console.log('[api/shops] SQL (contains):', containsSql, pointLng, pointLat);
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
    console.log('[api/shops] SQL (near):', nearSql, pointLng, pointLat, r);
    const nearRes: Array<{ id: number; dist: number }> = await prisma.$queryRawUnsafe(nearSql, pointLng, pointLat, r);
    if (nearRes && nearRes.length > 0) return nearRes[0].id;
  }
  return null;
}

async function tableHasColumn(tableName: string, columnName: string) {
  try {
    const q = `SELECT 1 FROM information_schema.columns WHERE table_name ILIKE $1 AND column_name = $2 LIMIT 1;`;
    console.log('[api/shops] Checking column:', tableName, columnName);
    const res: any[] = await prisma.$queryRawUnsafe(q, tableName, columnName);
    const exists = Array.isArray(res) && res.length > 0;
    console.log('[api/shops] Column check result:', tableName, columnName, exists);
    return exists;
  } catch (error) {
    console.error(`[api/shops] Error checking column ${tableName}.${columnName}:`, error);
    // Return false if check fails (safer than crashing)
    return false;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[api/shops] ========== REQUEST STARTED ==========');
    
    // Check database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[api/shops] ✅ Database connection OK');
    } catch (dbError) {
      console.error('[api/shops] ❌ Database connection failed:', dbError);
      const elapsed = Date.now() - startTime;
      return NextResponse.json({
        success: false,
        shops: [],
        hasLocation: false,
        queryTime: elapsed,
        error: 'Database connection failed',
        errorType: dbError instanceof Error ? dbError.name : 'Unknown',
        errorDetails: dbError instanceof Error ? dbError.message : 'Unknown error',
        hint: 'Please check DATABASE_URL environment variable in Vercel'
      }, { status: 500 });
    }
    
    const sp = request.nextUrl.searchParams;
    const latStr = sp.get('lat');
    const lngStr = sp.get('lng');
    const limit = Math.min(Number(sp.get('limit') || 50), 100); // Max 100
    const offset = Math.max(Number(sp.get('offset') || 0), 0); // Min 0
    // categoryId removed - now using many-to-many categories
    const sortByParam = sp.get('sortBy');
    // Handle sortBy=distance:1 format (remove :1 part)
    const sortBy = (sortByParam?.split(':')[0] || 'createdAt') as 'distance' | 'name' | 'createdAt';
    const radiiMeters = [2 * KM, 5 * KM, 20 * KM, 50 * KM];
    
    console.log(`[api/shops] Request params - lat: ${latStr}, lng: ${lngStr}, limit: ${limit}, offset: ${offset}, sortBy: ${sortBy}`);
    
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
      // Only filter by status if column exists AND shop has status = 'APPROVED'
      // If status column doesn't exist or is null, include all shops
      if (hasStatusCol) {
        // Use COALESCE to include shops with NULL status as well
        whereParts.push(`(s.status = 'APPROVED' OR s.status IS NULL)`);
        console.log('[api/shops] Filtering by status: APPROVED or NULL');
      } else {
        console.log('[api/shops] No status column - including all shops');
      }
      // Category filter removed - now using many-to-many
      const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
      console.log('[api/shops] WHERE clause:', whereClause || 'NONE (all shops)');
      
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
              COALESCE(ss.is_og_subscription, false) as "isOG",
              COALESCE(u.og_badge_enabled, false) as "ogBadgeEnabled",
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
            LEFT JOIN th_subdistricts lt ON s.tambon_id = lt.id
            LEFT JOIN th_districts la ON s.amphure_id = la.id
            LEFT JOIN th_provinces lp ON s.province_id = lp.id
            LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
              AND ss.status = 'ACTIVE' 
              AND ss.end_date > NOW()
            LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
            LEFT JOIN users u ON s.owner_id = u.id
            ${whereClause}
            ORDER BY s.id, ss.start_date DESC NULLS LAST, ss.created_at DESC NULLS LAST
          )
          SELECT id, name, description, address, "createdAt", image, lat, lng, "isMockup",
                 subdistrict, district, province, "subscriptionTier", "isOG", "ogBadgeEnabled", categories
          FROM ranked_shops
          ORDER BY tier_rank ASC, "createdAt" DESC
          OFFSET $${params.length + 1}
          LIMIT $${params.length + 2};
        `;
        params.push(offset);
        params.push(limit);
        console.log('[api/shops] Executing main query...');
        console.log('[api/shops] SQL (random):', sql.substring(0, 500), '...', 'params:', params);
        
        let rows;
        try {
          rows = await prisma.$queryRawUnsafe(sql, ...params);
        } catch (queryError) {
          console.error('[api/shops] ❌ Query execution failed:', queryError);
          console.error('[api/shops] SQL:', sql.substring(0, 1000));
          console.error('[api/shops] Params:', params);
          throw queryError;
        }
        const elapsed = Date.now() - startTime;
        const shopsCount = Array.isArray(rows) ? rows.length : 0;
        console.log(`[api/shops] ✅ Query successful - rows: ${shopsCount}, offset: ${offset}, time: ${elapsed}ms`);
        if (shopsCount === 0) {
          console.log('[api/shops] ⚠️ WARNING: No shops returned! This might indicate:');
          console.log('[api/shops]   1. No shops in database');
          console.log('[api/shops]   2. All shops filtered out by WHERE clause');
          console.log('[api/shops]   3. Database connection issue');
        }
        return NextResponse.json({ success: true, shops: Array.isArray(rows) ? rows : [], hasLocation: false, queryTime: elapsed });
      } catch (sqlError) {
        console.error('[api/shops] ❌ SQL error in main query:', sqlError);
        console.error('[api/shops] Error details:', {
          message: sqlError instanceof Error ? sqlError.message : 'Unknown error',
          stack: sqlError instanceof Error ? sqlError.stack : undefined
        });
        
        // Fallback: try simple query without any filters
        try {
          console.log('[api/shops] Trying fallback query (no filters)...');
          const simpleSql = `
            SELECT s.id, s.name, s.description, s.address, s."createdAt", s.image, s.lat, s.lng, s.is_mockup as "isMockup",
              lt.name_th as subdistrict,
              la.name_th as district,
              lp.name_th as province,
              'FREE' as "subscriptionTier",
              false as "isOG",
              false as "ogBadgeEnabled",
              (
                SELECT JSON_AGG(JSON_BUILD_OBJECT('id', sc.id, 'name', sc.name, 'slug', sc.slug, 'icon', sc.icon))
                FROM shop_category_mapping scm
                JOIN "ShopCategory" sc ON scm.category_id = sc.id
                WHERE scm.shop_id = s.id
              ) as categories
            FROM "Shop" s
            LEFT JOIN th_subdistricts lt ON s.tambon_id = lt.id
            LEFT JOIN th_districts la ON s.amphure_id = la.id
            LEFT JOIN th_provinces lp ON s.province_id = lp.id
            ORDER BY s."createdAt" DESC
            LIMIT $1
            OFFSET $2;
          `;
          const fallbackParams = [limit, offset];
          console.log('[api/shops] Fallback SQL:', simpleSql.substring(0, 300), '...', 'params:', fallbackParams);
          const rows = await prisma.$queryRawUnsafe(simpleSql, ...fallbackParams);
          const elapsed = Date.now() - startTime;
          const shopsCount = Array.isArray(rows) ? rows.length : 0;
          console.log(`[api/shops] ✅ Fallback query successful - rows: ${shopsCount}, time: ${elapsed}ms`);
          return NextResponse.json({ success: true, shops: Array.isArray(rows) ? rows : [], hasLocation: false, queryTime: elapsed });
        } catch (fallbackError) {
          console.error('[api/shops] ❌ Fallback query also failed:', fallbackError);
          const elapsed = Date.now() - startTime;
          return NextResponse.json({
            success: false,
            error: 'Database query failed',
            message: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
            shops: [],
            hasLocation: false,
            queryTime: elapsed
          }, { status: 500 });
        }
      }
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // ⚡ เปลี่ยนเป็น distance-based query เท่านั้น (ไม่ต้องหา geometry area อีกต่อไป)
    // เพราะมี 52 ตำบลที่ไม่มี geometry ทำให้ GPS บางจุดหา area ไม่เจอ
    console.log('[api/shops] Using distance-based query (no geometry lookup)');

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
      // OG Campaign status
      `COALESCE(ss.is_og_subscription, false) as "isOG"`,
      `COALESCE(u.og_badge_enabled, false) as "ogBadgeEnabled"`,
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

    // ⚡ ใช้ Distance-based query เท่านั้น (ไม่ต้องหา area/geometry)
    // หาร้านที่ใกล้ที่สุดภายในรัศมีที่กำหนด
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
            LEFT JOIN th_subdistricts lt ON s.tambon_id = lt.id
            LEFT JOIN th_districts la ON s.amphure_id = la.id
            LEFT JOIN th_provinces lp ON s.province_id = lp.id
            LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
              AND ss.status = 'ACTIVE' 
              AND ss.end_date > NOW()
            LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
            LEFT JOIN users u ON s.owner_id = u.id
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
        console.log('[api/shops] SQL (distance):', sql, params);
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
    if (hasStatusCol) {
      // Include shops with NULL status as well
      whereFinal.push(`(s.status = 'APPROVED' OR s.status IS NULL)`);
    }
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
        LEFT JOIN th_subdistricts lt ON s.tambon_id = lt.id
        LEFT JOIN th_districts la ON s.amphure_id = la.id
        LEFT JOIN th_provinces lp ON s.province_id = lp.id
            LEFT JOIN shop_subscriptions ss ON ss.shop_id = s.id 
              AND ss.status = 'ACTIVE' 
              AND ss.end_date > NOW()
            LEFT JOIN subscription_packages sp ON ss.package_id = sp.id
            LEFT JOIN users u ON s.owner_id = u.id
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
    console.log('[api/shops] SQL (final fallback):', sqlFinal, paramsFinal);
    const fallbackRows = await prisma.$queryRawUnsafe(sqlFinal, ...paramsFinal);
    const elapsed = Date.now() - startTime;
    console.log(`[api/shops] fallback rows: ${fallbackRows.length}, time: ${elapsed}ms`);
    return NextResponse.json({ success: true, shops: fallbackRows, hasLocation: false, queryTime: elapsed });

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[api/shops] ❌❌❌ FATAL ERROR after ${elapsed}ms:`, error);
    if (typeof error === 'object' && error && 'query' in error) {
      // Prisma error object may have .query
      console.error('[api/shops] Last SQL:', (error as any).query);
    }
    console.error('[api/shops] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[api/shops] Error name:', error instanceof Error ? error.name : 'Unknown');
    
    // Return empty array instead of error to prevent page crash
    // Log error for debugging but don't break the page
    return NextResponse.json({
      success: false,
      shops: [],
      hasLocation: false,
      queryTime: elapsed,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'Unknown'
    }, { status: 500 });
  }
}