// app/api/locations/amphures/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get("provinceId");

    if (!provinceId) {
      return NextResponse.json(
        { error: "Province ID is required" },
        { status: 400 }
      );
    }

    const amphures = await prisma.th_districts.findMany({
      where: {
        province_id: parseInt(provinceId),
        deleted_at: null,
      },
      select: {
        id: true,
        name_th: true,
        name_en: true,
        province_id: true,
      },
      orderBy: {
        name_th: "asc",
      },
    });

    return NextResponse.json(amphures);
  } catch (error) {
    console.error("Error fetching amphures:", error);
    return NextResponse.json(
      { error: "Failed to fetch amphures" },
      { status: 500 }
    );
  }
}
