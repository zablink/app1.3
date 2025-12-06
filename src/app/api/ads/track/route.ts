// src/app/api/ads/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API สำหรับบันทึกการแสดง/คลิกโฆษณา
 * 
 * Method: POST
 * Body: {
 *   bannerId: string,
 *   eventType: 'view' | 'click',
 *   userId?: string,
 *   sessionId?: string,
 *   tambonId?: number,
 *   amphureId?: number,
 *   provinceId?: number,
 *   page?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bannerId,
      eventType,
      userId,
      sessionId,
      tambonId,
      amphureId,
      provinceId,
      page
    } = body;

    if (!bannerId || !eventType) {
      return NextResponse.json(
        { error: 'bannerId and eventType are required' },
        { status: 400 }
      );
    }

    if (!['view', 'click'].includes(eventType)) {
      return NextResponse.json(
        { error: 'eventType must be "view" or "click"' },
        { status: 400 }
      );
    }

    // Get user agent and IP
    const userAgent = request.headers.get('user-agent');
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // 1. บันทึก impression/click
    await prisma.adImpression.create({
      data: {
        bannerId,
        eventType,
        userId: userId || null,
        sessionId: sessionId || null,
        tambonId: tambonId ? parseInt(tambonId) : null,
        amphureId: amphureId ? parseInt(amphureId) : null,
        provinceId: provinceId ? parseInt(provinceId) : null,
        page: page || null,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
      }
    });

    // 2. อัพเดต counter ใน ad_banners
    if (eventType === 'view') {
      await prisma.adBanner.update({
        where: { id: bannerId },
        data: { viewCount: { increment: 1 } }
      });
    } else if (eventType === 'click') {
      await prisma.adBanner.update({
        where: { id: bannerId },
        data: { clickCount: { increment: 1 } }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[ads/track] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track ad event' },
      { status: 500 }
    );
  }
}
