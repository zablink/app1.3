// src/app/api/banners/route.ts
// Public API สำหรับดึง Active Hero Banners

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

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
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Error fetching banners:', error);
    // Return empty array instead of error to prevent page crash
    return NextResponse.json({
      success: true,
      banners: []
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}