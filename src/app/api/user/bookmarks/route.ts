// src/app/api/user/bookmarks/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: ดึงรายการ bookmarks ทั้งหมดของ user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const bookmarks = await prisma.userBookmark.findMany({
      where: { userId: user.id },
      include: {
        shop: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform data
    const transformedBookmarks = bookmarks.map((bookmark) => {
      const shop = bookmark.shop;
      const avgRating =
        shop.reviews.length > 0
          ? shop.reviews.reduce((sum, r) => sum + r.rating, 0) / shop.reviews.length
          : 0;

      return {
        id: shop.id,
        name: shop.name,
        category: shop.categories[0]?.category?.name || "ไม่ระบุหมวดหมู่",
        image: shop.image || "/placeholder-shop.jpg",
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: shop.reviews.length,
        address: shop.address || "ไม่ระบุที่อยู่",
        lat: shop.lat,
        lng: shop.lng,
        bookmarkedAt: bookmark.createdAt.toISOString(),
        notes: bookmark.notes,
        tags: bookmark.tags || [],
      };
    });

    return NextResponse.json({
      bookmarks: transformedBookmarks,
      total: transformedBookmarks.length,
    });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: เพิ่มร้านเข้า bookmark
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { shopId, notes, tags } = await request.json();

    if (!shopId) {
      return NextResponse.json(
        { error: "Shop ID is required" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าร้านมีอยู่จริง
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found" },
        { status: 404 }
      );
    }

    // สร้าง bookmark (upsert เพื่อป้องกัน duplicate)
    const bookmark = await prisma.userBookmark.upsert({
      where: {
        userId_shopId: {
          userId: user.id,
          shopId: shopId,
        },
      },
      update: {
        notes: notes || null,
        tags: tags || [],
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        shopId: shopId,
        notes: notes || null,
        tags: tags || [],
      },
    });

    return NextResponse.json({
      success: true,
      bookmark,
      message: "เพิ่มร้านเข้าบุ๊คมาร์คเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
