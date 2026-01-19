// app/api/creator/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user already has a creator profile
    const existingCreator = await prisma.creators.findUnique({
      where: { userId },
    });

    if (existingCreator) {
      return NextResponse.json(
        { error: "You have already applied to be a creator" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      displayName,
      bio,
      phone,
      coverageAreas,
      hasExperience,
      priceRangeMin,
      priceRangeMax,
      socialMedia,
      portfolioLinks,
    } = body;

    // Validation
    if (!displayName || displayName.length < 3) {
      return NextResponse.json(
        { error: "Display name must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (!bio || bio.length < 20) {
      return NextResponse.json(
        { error: "Bio must be at least 20 characters" },
        { status: 400 }
      );
    }

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: "Phone number must be at least 10 digits" },
        { status: 400 }
      );
    }

    if (!coverageAreas || coverageAreas.length === 0) {
      return NextResponse.json(
        { error: "At least one coverage area is required" },
        { status: 400 }
      );
    }

    // Check display name uniqueness
    const nameExists = await prisma.creators.findFirst({
      where: {
        displayName: {
          equals: displayName,
          mode: "insensitive",
        },
      },
    });

    if (nameExists) {
      return NextResponse.json(
        { error: "Display name is already taken" },
        { status: 400 }
      );
    }

    // Prepare coverage area data
    // We'll store the primary area in the main fields
    // and additional areas in a separate relation if needed
    const primaryArea = coverageAreas[0];

    // Create creator profile and update user role in transaction
    const creator = await prisma.$transaction(async (tx) => {
      // Create creator profile first
      const newCreator = await tx.creators.create({
        data: {
          id: `creator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          displayName,
          bio,
          phone,
          coverageLevel: primaryArea.level,
          hasExperience,
          priceRangeMin: hasExperience && priceRangeMin ? parseInt(priceRangeMin) : null,
          priceRangeMax: hasExperience && priceRangeMax ? parseInt(priceRangeMax) : null,
          applicationStatus: "PENDING",
          appliedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update user role to CREATOR only after creator profile is created successfully
      await tx.user.update({
        where: { id: userId },
        data: { role: 'CREATOR' }
      });

      return newCreator;
    });

    // TODO: If you want to store multiple coverage areas,
    // create a separate table and insert them here

    // TODO: Send notification email to admin

    return NextResponse.json({
      success: true,
      creator: {
        id: creator.id,
        displayName: creator.displayName,
        applicationStatus: creator.applicationStatus,
      },
    });
  } catch (error) {
    console.error("Error creating creator profile:", error);
    return NextResponse.json(
      { error: "Failed to create creator profile" },
      { status: 500 }
    );
  }
}
