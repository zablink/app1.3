// src/app/api/banners/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ⬅️ เปลี่ยนจาก new PrismaClient()

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const banners = await prisma.banners.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        display_order: 'asc',
      },
    });

    return NextResponse.json(banners);
    
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch banners',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}