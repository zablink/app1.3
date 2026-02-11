// app/api/creator/check-name/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name || name.length < 3) {
      return NextResponse.json(
        { error: "Name must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Check if display name already exists
    const existing = await prisma.creator.findFirst({
      where: {
        displayName: {
          equals: name,
          mode: "insensitive", // Case-insensitive search
        },
      },
    });

    return NextResponse.json({
      available: !existing,
      name: name,
    });
  } catch (error) {
    console.error("Error checking name availability:", error);
    return NextResponse.json(
      { error: "Failed to check name availability" },
      { status: 500 }
    );
  }
}
