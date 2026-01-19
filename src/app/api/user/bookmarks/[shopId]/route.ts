// src/app/api/user/bookmarks/[shopId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE: ลบร้านออกจาก bookmark
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
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

    const { shopId } = await params;

    // ลบ bookmark
    const deleted = await prisma.userBookmark.deleteMany({
      where: {
        userId: user.id,
        shopId: shopId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบร้านออกจากบุ๊คมาร์คเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: อัปเดต notes หรือ tags
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
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

    const { shopId } = await params;
    const { notes, tags } = await request.json();

    const bookmark = await prisma.userBookmark.updateMany({
      where: {
        userId: user.id,
        shopId: shopId,
      },
      data: {
        notes: notes !== undefined ? notes : undefined,
        tags: tags !== undefined ? tags : undefined,
      },
    });

    if (bookmark.count === 0) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "อัปเดตบุ๊คมาร์คเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Error updating bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: ตรวจสอบว่า bookmark ร้านนี้หรือยัง
export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ isBookmarked: false });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ isBookmarked: false });
    }

    const { shopId } = await params;

    const bookmark = await prisma.userBookmark.findUnique({
      where: {
        userId_shopId: {
          userId: user.id,
          shopId: shopId,
        },
      },
    });

    return NextResponse.json({
      isBookmarked: !!bookmark,
      bookmark: bookmark || null,
    });
  } catch (error) {
    console.error("Error checking bookmark:", error);
    return NextResponse.json({ isBookmarked: false });
  }
}
