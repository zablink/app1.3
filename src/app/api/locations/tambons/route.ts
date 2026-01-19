// app/api/locations/tambons/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amphureId = searchParams.get("amphureId");

    if (!amphureId) {
      return NextResponse.json(
        { error: "Amphure ID is required" },
        { status: 400 }
      );
    }

    const tambons = await prisma.th_subdistricts.findMany({
      where: {
        amphure_id: parseInt(amphureId),
        deleted_at: null,
      },
      select: {
        id: true,
        name_th: true,
        name_en: true,
        amphure_id: true,
        zip_code: true,
      },
      orderBy: {
        name_th: "asc",
      },
    });

    return NextResponse.json(tambons);
  } catch (error) {
    console.error("Error fetching tambons:", error);
    return NextResponse.json(
      { error: "Failed to fetch tambons" },
      { status: 500 }
    );
  }
}
