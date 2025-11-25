// src/app/api/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, slug, icon, description } = body;

    // Check if slug is already used by another category
    const existingCategory = await prisma.shopCategory.findFirst({
      where: {
        slug,
        NOT: {
          id
        }
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const updatedCategory = await prisma.shopCategory.update({
      where: { id },
      data: {
        name,
        slug,
        icon,
        description
      }
    });

    return NextResponse.json({
      success: true,
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if category has shops
    const category = await prisma.shopCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { shops: true }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    if (category._count.shops > 0) {
      return NextResponse.json(
        { error: `ไม่สามารถลบได้ เนื่องจากมีร้านค้า ${category._count.shops} รายในหมวดหมู่นี้` },
        { status: 400 }
      );
    }

    await prisma.shopCategory.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
