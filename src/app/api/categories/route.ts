// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  console.log('🚀 GET /api/categories called');
  try {
    console.log('📊 Start GET categories');
    
    // Bypass database for testing
    return NextResponse.json({
      success: true,
      categories: [
        { id: '1', name: 'Test Category', slug: 'test', icon: '🍔' }
      ],
    });
    
    /* Original code - temporarily disabled
    const categories = await prisma.shopCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    console.log('✅ Found categories:', categories.length);

    return NextResponse.json({
      success: true,
      categories,
    });
    */
  } catch (error) {
    console.error('💥 Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, slug, icon, description } = body;

    // Check if slug already exists
    const existingCategory = await prisma.shopCategory.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const newCategory = await prisma.shopCategory.create({
      data: {
        name,
        slug,
        icon,
        description
      }
    });

    return NextResponse.json({
      success: true,
      category: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
