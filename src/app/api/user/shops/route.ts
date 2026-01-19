// app/api/user/shops/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all shops owned by the user
    const shops = await prisma.shop.findMany({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        image: true,
        status: true,
        createdAt: true,
        categories: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ shops });
  } catch (error) {
    console.error("Error fetching user shops:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
