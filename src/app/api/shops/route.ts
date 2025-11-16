// src/app/api/shops/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Safer implementation: build SQL strings + parameter arrays and call prisma.$queryRawUnsafe.
 * Table names for loc_* are validated against allowed list.
 */

const KM = 1000;
const VALID_AREA_TABLES = ['loc_tambons', 'loc_amphures', 'loc_provinces'] as const;
type AreaTable = (typeof VALID_AREA_TABLES)[number];

function assertAreaTable(t: string): asserts t is AreaTable {
  if (!VALID_AREA_TABLES.includes(t as AreaTable)) {
    throw new Error(`Invalid area table: ${t}`);
  }
}

async function findAreaId(
  areaTable: AreaTable,
  pointLng: number,
  pointLat: number,
  radiiMeters: number[]
) {
  // validate table name (safe)
  assertAreaTable(areaTable);

  // 1) try ST_Contains
  const containsSql = `SELECT id FROM "${areaTable}" WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) LIMIT 1;`;
  const containsRes: Array<{ id: number }> = await prisma.$queryRawUnsafe(containsSql, pointLng, pointLat);
  if (containsRes && containsRes.length > 0) return containsRes[0].id;

  // 2) progressive radii
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

    // Check which columns exist in DB (shop table)
    const hasStatusCol = await tableHasColumn('shop', 'status');
    const hasLocationCol = await tableHasColumn('shop', 'location');
    const hasTambonCol = await tableHasColumn('shop', 'tambon_id');
    const hasAmphureCol = await tableHasColumn('shop', 'amphure_id');
    const hasProvinceCol = await tableHasColumn('shop', 'province_id');

    // Helper: build SELECT list based on available columns
    const buildSelectList = (includeDistance = true) => {
      const cols = [
        's.id',
        's.name',
        's.description',
        's.address',
        's."categoryId"',
        'sc.name as category_name',
        's.has_physical_store',
        's."createdAt"'
      ];
      if (hasAmphureCol) cols.push('s.amphure_id');
      if (hasTambonCol) cols.push('s.tambon_id');
      if (hasProvinceCol) cols.push('s.province_id');
      if (includeDistance) {
        if (hasLocationCol) {
          cols.push(`CASE WHEN s.location IS NOT NULL THEN ST_Distance(s.location::geography, ST_SetSRID(ST_MakePoint($${'POINT_LNG_IDX'}, $${'POINT_LAT_IDX'}), 4326)::geography)/1000.0 ELSE NULL END as distance`);
          // NOTE: placeholder strings 'POINT_LNG_IDX'/'POINT_LAT_IDX' will be replaced when constructing final SQL
        } else {
          cols.push('NULL as distance');
        }
      }
      return cols.join(', ');
    };

    // No location: return random shops quickly
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
        SELECT s.id, s.name, s.description, s.address, s."categoryId", sc.name as category_name, s."createdAt"
        FROM "Shop" s
        INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
        ${whereClause}
        ORDER BY RANDOM()
        LIMIT $${params.length + 1};
      `;
      params.push(limit);
      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      return NextResponse.json({ success: true, shops: rows, hasLocation: false });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // find area ids via polygons
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

    // Build shop queries safely with parameter arrays
    // We'll replace POINT placeholders with actual parameter indexes below
    const baseSelect = buildSelectList(true);
    // Replace placeholder tokens with $n indexes later; we'll compute param order per-query.

    // If area found and DB has corresponding column, try area-based query
    if (areaId && chosenLevel) {
      const params: any[] = [];
      // We'll place longitude, latitude as the first two params for distance expression
      params.push(longitude, latitude); // param 1 & 2
      // distance expression uses $1/$2 in this query
      // Build select by replacing token placeholders
      const selectForQuery = baseSelect
        .replace(/\$POINT_LNG_IDX/g, '1')
        .replace(/\$POINT_LAT_IDX/g, '2')
        .replace(/\$'POINT_LNG_IDX'/g, '1') // safety for template mismatch
        .replace(/\$'POINT_LAT_IDX'/g, '2');

      const areaConditions: string[] = [];
      if (chosenLevel === 'tambon' && hasTambonCol) {
        params.push(areaId);
        areaConditions.push(`s.tambon_id = $${params.length}`);
      } else if (chosenLevel === 'amphure' && hasAmphureCol) {
        params.push(areaId);
        areaConditions.push(`s.amphure_id = $${params.length}`);
      } else if (chosenLevel === 'province' && hasProvinceCol) {
        params.push(areaId);
        areaConditions.push(`s.province_id = $${params.length}`);
      }
      // distance fallback within small radius if shop.location exists
      const smallRadius = 5 * KM;
      if (hasLocationCol) {
        params.push(smallRadius);
        // ST_DWithin uses params 1/2 for point, and this param is next ($n)
        const idx = params.length; // index of smallRadius
        areaConditions.push(`ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $${idx})`);
      }

      // where clause pieces
      const whereParts: string[] = [];
      if (hasStatusCol) whereParts.push(`s.status = 'APPROVED'`);
      if (areaConditions.length > 0) whereParts.push(`(${areaConditions.join(' OR ')})`);
      if (categoryId) {
        params.push(categoryId);
        whereParts.push(`s."categoryId" = $${params.length}`);
      }
      const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

      // ORDER BY
      let orderBy = `s."createdAt" DESC`;
      if (sortBy === 'name') orderBy = `s.name ASC`;
      else if (sortBy === 'distance' && hasLocationCol) orderBy = `distance ASC NULLS LAST`;

      // LIMIT param
      params.push(limit);

      // Construct final SQL
      const sql = `
        SELECT ${selectForQuery}
        FROM "Shop" s
        INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${params.length};
      `;
      // execute
      const shopsRes = await prisma.$queryRawUnsafe(sql, ...params);
      if (shopsRes && shopsRes.length > 0) {
        return NextResponse.json({
          success: true,
          shops: shopsRes.map((r: any) => ({ ...r, distance: r.distance != null ? parseFloat(Number(r.distance).toFixed(2)) : null })),
          hasLocation: hasLocationCol,
          area: { level: chosenLevel, id: areaId },
          userLocation: { lat: latitude, lng: longitude },
        });
      }
      // else fallthrough to distance-only search
    }

    // Distance-only progressive search (only if location exists)
    if (hasLocationCol) {
      for (const r of radiiMeters) {
        const params: any[] = [longitude, latitude, r, limit];
        const selectForQuery = baseSelect
          .replace(/\$POINT_LNG_IDX/g, '1')
          .replace(/\$POINT_LAT_IDX/g, '2')
          .replace(/\$'POINT_LNG_IDX'/g, '1')
          .replace(/\$'POINT_LAT_IDX'/g, '2');
        const whereParts: string[] = [`ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)`];
        if (hasStatusCol) whereParts.unshift(`s.status = 'APPROVED'`);
        if (categoryId) {
          params.splice(3, 0, categoryId); // insert category before limit
          // now params are [lng, lat, r, category, limit] - need to adjust placeholders below accordingly
          // We'll rebuild where clause to use $4 for category
          whereParts.push(`s."categoryId" = $4`);
          // limit is $5
        }
        // compute final order by and SQL
        const orderBy = `distance ASC`;
        // adjust limit param index:
        const limitIndex = params.length;
        const sql = `
          SELECT ${selectForQuery}
          FROM "Shop" s
          INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
          WHERE ${whereParts.join(' AND ')}
          ORDER BY ${orderBy}
          LIMIT $${limitIndex};
        `;
        const rows = await prisma.$queryRawUnsafe(sql, ...params);
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

    // Final fallback: random shops (no distance)
    const paramsFinal: any[] = [];
    const whereFinal: string[] = [];
    if (hasStatusCol) whereFinal.push(`s.status = 'APPROVED'`);
    if (categoryId) {
      paramsFinal.push(categoryId);
      whereFinal.push(`s."categoryId" = $${paramsFinal.length}`);
    }
    paramsFinal.push(limit);
    const whereClauseFinal = whereFinal.length > 0 ? `WHERE ${whereFinal.join(' AND ')}` : '';
    // build select list without distance (use baseSelect but replace distance with NULL)
    const selectNoDistance = buildSelectList(false);
    const selectNoDistanceFinal = selectNoDistance.replace(/\$POINT_LNG_IDX/g, '1').replace(/\$POINT_LAT_IDX/g, '2');
    const sqlFinal = `
      SELECT ${selectNoDistanceFinal}
      ${hasAmphureCol ? ', s.amphure_id' : ''}${hasTambonCol ? ', s.tambon_id' : ''}${hasProvinceCol ? ', s.province_id' : ''}
      FROM "Shop" s
      INNER JOIN "ShopCategory" sc ON s."categoryId" = sc.id
      ${whereClauseFinal}
      ORDER BY RANDOM()
      LIMIT $${paramsFinal.length};
    `;
    const fallbackRows = await prisma.$queryRawUnsafe(sqlFinal, ...paramsFinal);
    return NextResponse.json({ success: true, shops: fallbackRows, hasLocation: false });

  } catch (error) {
    console.error('Error fetching shops:', error);
    // For debugging, include error.message
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shops', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}