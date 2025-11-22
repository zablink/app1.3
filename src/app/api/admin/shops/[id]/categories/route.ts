// src/app/api/admin/shops/[id]/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: ดูหมวดหมู่ของร้าน
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: shopId } = params;

    const mappings = await prisma.shopCategoryMapping.findMany({
      where: { shopId },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      categories: mappings.map((m) => m.category),
    });
  } catch (error) {
    console.error('Error fetching shop categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// PUT: อัพเดทหมวดหมู่ของร้าน (replace all)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: shopId } = params;
    const body = await request.json();
    const { categoryIds } = body as { categoryIds: string[] };

    if (!Array.isArray(categoryIds)) {
      return NextResponse.json(
        { success: false, error: 'categoryIds must be an array' },
        { status: 400 }
      );
    }

    // ลบหมวดหมู่เก่าทั้งหมด
    await prisma.shopCategoryMapping.deleteMany({
      where: { shopId },
    });

    // เพิ่มหมวดหมู่ใหม่
    if (categoryIds.length > 0) {
      await prisma.shopCategoryMapping.createMany({
        data: categoryIds.map((categoryId) => ({
          shopId,
          categoryId,
        })),
        skipDuplicates: true,
      });
    }

    // ดึงข้อมูลหมวดหมู่ที่อัพเดทแล้ว
    const updatedMappings = await prisma.shopCategoryMapping.findMany({
      where: { shopId },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      categories: updatedMappings.map((m) => m.category),
    });
  } catch (error) {
    console.error('Error updating shop categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update categories' },
      { status: 500 }
    );
  }
}

// POST: เพิ่มหมวดหมู่ให้ร้าน (add without removing existing)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: shopId } = params;
    const body = await request.json();
    const { categoryId } = body as { categoryId: string };

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'categoryId is required' },
        { status: 400 }
      );
    }

    await prisma.shopCategoryMapping.create({
      data: {
        shopId,
        categoryId,
      },
    });

    const mappings = await prisma.shopCategoryMapping.findMany({
      where: { shopId },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      categories: mappings.map((m) => m.category),
    });
  } catch (error) {
    console.error('Error adding shop category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add category' },
      { status: 500 }
    );
  }
}

// DELETE: ลบหมวดหมู่ออกจากร้าน
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: shopId } = params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'categoryId is required' },
        { status: 400 }
      );
    }

    await prisma.shopCategoryMapping.deleteMany({
      where: {
        shopId,
        categoryId,
      },
    });

    const mappings = await prisma.shopCategoryMapping.findMany({
      where: { shopId },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      categories: mappings.map((m) => m.category),
    });
  } catch (error) {
    console.error('Error deleting shop category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
