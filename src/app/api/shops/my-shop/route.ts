// app/api/shops/my-shop/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Shop belongs to User via ownerId → relation field is `owner`, not `user`
    const shop = await prisma.shop.findFirst({
      where: {
        owner: {
          email: session.user.email,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ shop });
  } catch (error) {
    console.error("Error checking shop:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
