// app/api/creator/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Adjust path as needed

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const creator = await prisma.creator.findUnique({
      where: { userId },
      select: {
        id: true,
        displayName: true,
        bio: true,
        phone: true,
        coverageLevel: true,
        provinceId: true,
        amphureId: true,
        tambonId: true,
        hasExperience: true,
        priceRangeMin: true,
        priceRangeMax: true,
        currentPriceMin: true,
        currentPriceMax: true,
        socialMedia: true,
        portfolioLinks: true,
        totalReviews: true,
        completedReviews: true,
        rating: true,
        totalEarnings: true,
        availableBalance: true,
        totalWithdrawn: true,
        applicationStatus: true,
        rejectReason: true,
        appliedAt: true,
        approvedAt: true,
        rejectedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(creator);
  } catch (error) {
    console.error("Error fetching creator profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator profile" },
      { status: 500 }
    );
  }
}
