// app/api/creators/my-creator/route.ts
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

    // Find creator by user email
    const creator = await prisma.creator.findFirst({
      where: {
        user: {
          email: session.user.email,
        },
      },
      select: {
        id: true,
        display_name: true,
      },
    });

    return NextResponse.json({ creator });
  } catch (error) {
    console.error("Error checking creator:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
