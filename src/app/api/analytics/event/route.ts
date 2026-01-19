// POST /api/analytics/event - Track custom events
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      eventType,
      eventData,
      shopId,
      tambonId,
      amphureId,
      provinceId,
    } = body;

    // Validate required fields
    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: 'sessionId and eventType are required' },
        { status: 400 }
      );
    }

    // If shopId provided, verify it exists
    if (shopId) {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { id: true },
      });

      if (!shop) {
        return NextResponse.json(
          { error: 'Shop not found' },
          { status: 404 }
        );
      }
    }

    // Create event record
    const event = await prisma.event.create({
      data: {
        sessionId,
        userId: userId || null,
        eventType,
        eventData: eventData || null,
        shopId: shopId || null,
        tambonId: tambonId || null,
        amphureId: amphureId || null,
        provinceId: provinceId || null,
      },
    });

    return NextResponse.json({
      success: true,
      id: event.id,
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
