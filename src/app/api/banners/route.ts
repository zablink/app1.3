import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching banners...');

    const banners = await prisma.banners.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' },
    });

    console.log('Banners count:', banners.length);

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    
    // ⭐ เพิ่ม type guard
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { error: 'Failed to fetch banners', detail: errorMessage },
      { status: 500 }
    );
  }
}