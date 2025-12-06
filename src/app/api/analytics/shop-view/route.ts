// POST /api/analytics/shop-view - Track shop views
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      shopId,
      viewDuration,
      sourceType,
      sourceId,
      userAgent,
      deviceType,
      tambonId,
      amphureId,
      provinceId,
    } = body;

    // Validate required fields
    if (!sessionId || !shopId) {
      return NextResponse.json(
        { error: 'sessionId and shopId are required' },
        { status: 400 }
      );
    }

    // Verify shop exists
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Create shop view record
    const shopView = await prisma.shopView.create({
      data: {
        sessionId,
        userId: userId || null,
        shopId,
        viewDuration: viewDuration || null,
        sourceType: sourceType || null,
        sourceId: sourceId || null,
        userAgent: userAgent || null,
        deviceType: deviceType || null,
        tambonId: tambonId || null,
        amphureId: amphureId || null,
        provinceId: provinceId || null,
      },
    });

    return NextResponse.json({
      success: true,
      id: shopView.id,
    });
  } catch (error) {
    console.error('Error tracking shop view:', error);
    return NextResponse.json(
      { error: 'Failed to track shop view' },
      { status: 500 }
    );
  }
}
