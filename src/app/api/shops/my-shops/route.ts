// app/api/shops/my-shops/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shops = await prisma.shop.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        adPackage: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map to match frontend interface
    const formattedShops = shops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      status: "APPROVED", // TODO: Add status field to Shop model
      packageType: shop.adPackage?.name || "FREE",
      image: shop.image,
      createdAt: shop.createdAt.toISOString(),
    }));

    return NextResponse.json({ shops: formattedShops });
  } catch (error) {
    console.error("Error fetching my shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}