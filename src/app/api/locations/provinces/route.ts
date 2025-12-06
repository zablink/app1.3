// app/api/locations/provinces/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const provinces = await prisma.th_provinces.findMany({
      select: {
        id: true,
        name_th: true,
        name_en: true,
      },
      where: {
        deleted_at: null,
      },
      orderBy: {
        name_th: "asc",
      },
    });

    return NextResponse.json(provinces);
  } catch (error) {
    console.error("Error fetching provinces:", error);
    return NextResponse.json(
      { error: "Failed to fetch provinces" },
      { status: 500 }
    );
  }
}
