// src/app/api/locations/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const provinceId = searchParams.get("provinceId");
    const amphureId = searchParams.get("amphureId");

    // 1. Get Provinces
    if (type === "provinces") {
      const provinces = await prisma.loc_provinces.findMany({
        orderBy: {
          name_th: "asc",
        },
      });
      return NextResponse.json({ data: provinces });
    }

    // 2. Get Amphures by Province
    if (type === "amphures" && provinceId) {
      const amphures = await prisma.loc_amphures.findMany({
        where: {
          province_id: parseInt(provinceId),
        },
        orderBy: {
          name_th: "asc",
        },
      });
      return NextResponse.json({ data: amphures });
    }

    // 3. Get Tambons by Amphure
    if (type === "tambons" && amphureId) {
      const tambons = await prisma.loc_tambons.findMany({
        where: {
          amphure_id: parseInt(amphureId),
        },
        orderBy: {
          name_th: "asc",
        },
      });
      return NextResponse.json({ data: tambons });
    }

    return NextResponse.json(
      { error: "Invalid parameters. Use type=provinces|amphures|tambons" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 }
    );
  }
}