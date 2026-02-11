// app/api/locations/reverse-geocode/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Create a PostGIS point from lat/lng
    const point = `SRID=4326;POINT(${lng} ${lat})`;

    // Query to find tambons within a certain distance (using PostGIS)
    // We'll search for tambons within 5km radius
    const query = `
      SELECT 
        t.id,
        t.name_th,
        t.name_en,
        t.amphure_id,
        t.zip_code,
        a.id as amphure_id_full,
        a.name_th as amphure_name_th,
        a.name_en as amphure_name_en,
        a.province_id,
        p.id as province_id_full,
        p.name_th as province_name_th,
        p.name_en as province_name_en,
        ST_Distance(
          t.geom::geography,
          ST_GeomFromText($1, 4326)::geography
        ) as distance
      FROM th_subdistricts t
      JOIN th_districts a ON t.amphure_id = a.id
      JOIN th_provinces p ON a.province_id = p.id
      WHERE t.deleted_at IS NULL
        AND a.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND t.geom IS NOT NULL
        AND ST_DWithin(
          t.geom::geography,
          ST_GeomFromText($1, 4326)::geography,
          5000
        )
      ORDER BY distance ASC
      LIMIT 5
    `;

    const result: any[] = await prisma.$queryRawUnsafe(query, point);

    if (result.length === 0) {
      return NextResponse.json({
        possibleTambons: [],
        message: "No tambons found within 5km radius",
      });
    }

    // Group results
    const province = {
      id: result[0].province_id_full,
      name_th: result[0].province_name_th,
      name_en: result[0].province_name_en,
    };

    const amphure = {
      id: result[0].amphure_id_full,
      name_th: result[0].amphure_name_th,
      name_en: result[0].amphure_name_en,
      province_id: result[0].province_id,
    };

    const possibleTambons = result.map((row) => ({
      id: row.id,
      name_th: row.name_th,
      name_en: row.name_en,
      amphure_id: row.amphure_id,
      zip_code: row.zip_code,
      distance: parseFloat(row.distance),
    }));

    return NextResponse.json({
      province,
      amphure,
      possibleTambons,
    });
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return NextResponse.json(
      { error: "Failed to reverse geocode location" },
      { status: 500 }
    );
  }
}
