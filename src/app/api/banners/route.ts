// src/app/api/banners/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching banners...'); // ⭐ เพิ่ม log

    const banners = await prisma.banners.findMany({
      where: { is_active: true },
      orderBy: { order: 'asc' },
    });

    console.log('Banners count:', banners.length); // ⭐ เพิ่ม log

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error); // ⭐ แสดง error detail
    return NextResponse.json(
      { error: 'Failed to fetch banners', detail: error.message }, // ⭐ แก้ message + เพิ่ม detail
      { status: 500 }
    );
  }
}