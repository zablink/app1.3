// src/app/api/banners/route.ts
// Public API สำหรับดึง Active Hero Banners

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();

    // Check if HeroBanner model exists
    const banners = await prisma.heroBanner.findMany({
      where: {
        isActive: true,
        OR: [
          // ไม่มีวันที่กำหนด
          { startDate: null, endDate: null },
          // อยู่ในช่วงวันที่
          { 
            startDate: { lte: now }, 
            endDate: { gte: now } 
          },
          // มีแต่ startDate (ไม่มี endDate)
          { 
            startDate: { lte: now }, 
            endDate: null 
          },
          // มีแต่ endDate (ไม่มี startDate)
          { 
            startDate: null, 
            endDate: { gte: now } 
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      banners: banners || []
    });
    
  } catch (error) {
    console.error('Error fetching banners:', error);
    // Return empty array instead of error to prevent page crash
    return NextResponse.json({
      success: true,
      banners: []
    });
  }
}