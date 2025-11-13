// app/api/shop/reviewers/route.ts
// ร้านค้าดึงรายการ Reviewer พร้อม filter ราคา

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อน" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    // Filters
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const provinceId = searchParams.get("provinceId");
    const amphureId = searchParams.get("amphureId");
    const tambonId = searchParams.get("tambonId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "price"; // price, rating, newest

    // Build where clause
    const where: any = {
      applicationStatus: "APPROVED", // เฉพาะที่อนุมัติแล้ว
    };

    // Price filter
    if (minPrice || maxPrice) {
      where.AND = [];

      if (minPrice) {
        where.AND.push({
          currentPriceMin: {
            gte: parseInt(minPrice),
          },
        });
      }

      if (maxPrice) {
        where.AND.push({
          currentPriceMax: {
            lte: parseInt(maxPrice),
          },
        });
      }
    }

    // Location filter
    if (provinceId) {
      where.provinceId = parseInt(provinceId);
    }
    if (amphureId) {
      where.amphureId = parseInt(amphureId);
    }
    if (tambonId) {
      where.tambonId = parseInt(tambonId);
    }

    // Search by name
    if (search) {
      where.displayName = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Sorting
    let orderBy: any = {};
    switch (sortBy) {
      case "price":
        orderBy = { currentPriceMin: "asc" };
        break;
      case "price_desc":
        orderBy = { currentPriceMax: "desc" };
        break;
      case "rating":
        // TODO: Add rating field
        orderBy = { createdAt: "desc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      default:
        orderBy = { currentPriceMin: "asc" };
    }

    const creators = await prisma.creator.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        // TODO: Include stats (total reviews, avg rating, etc.)
      },
      orderBy,
    });

    // Calculate average price for each creator
    const creatorsWithStats = creators.map((creator) => {
      const avgPrice =
        creator.currentPriceMin && creator.currentPriceMax
          ? (creator.currentPriceMin + creator.currentPriceMax) / 2
          : null;

      // Determine price tier
      let priceTier = "มือใหม่";
      if (avgPrice) {
        if (avgPrice >= 10000) priceTier = "มืออาชีพ";
        else if (avgPrice >= 5000) priceTier = "ระดับกลาง";
        else if (avgPrice >= 2000) priceTier = "ปานกลาง";
      }

      return {
        ...creator,
        avgPrice,
        priceTier,
      };
    });

    return NextResponse.json({
      success: true,
      data: creatorsWithStats,
      count: creatorsWithStats.length,
      filters: {
        minPrice: minPrice ? parseInt(minPrice) : null,
        maxPrice: maxPrice ? parseInt(maxPrice) : null,
        provinceId: provinceId ? parseInt(provinceId) : null,
        amphureId: amphureId ? parseInt(amphureId) : null,
        tambonId: tambonId ? parseInt(tambonId) : null,
        search,
        sortBy,
      },
    });
  } catch (error) {
    console.error("Error fetching reviewers:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}