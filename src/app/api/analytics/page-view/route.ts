// POST /api/analytics/page-view - Track page views
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      pagePath,
      pageTitle,
      referrer,
      userAgent,
      deviceType,
      browser,
      os,
      tambonId,
      amphureId,
      provinceId,
      duration,
    } = body;

    // Validate required fields
    if (!sessionId || !pagePath) {
      return NextResponse.json(
        { error: 'sessionId and pagePath are required' },
        { status: 400 }
      );
    }

    // Get IP address from headers
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      null;

    // Create page view record
    const pageView = await prisma.pageView.create({
      data: {
        sessionId,
        userId: userId || null,
        pagePath,
        pageTitle: pageTitle || null,
        referrer: referrer || null,
        userAgent: userAgent || null,
        ipAddress,
        deviceType: deviceType || null,
        browser: browser || null,
        os: os || null,
        tambonId: tambonId || null,
        amphureId: amphureId || null,
        provinceId: provinceId || null,
        duration: duration || null,
      },
    });

    return NextResponse.json({
      success: true,
      id: pageView.id,
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}
