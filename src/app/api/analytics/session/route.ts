// POST /api/analytics/session - Create or update user session
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      deviceType,
      browser,
      os,
      tambonId,
      amphureId,
      provinceId,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Get IP address from headers
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      null;

    // Check if session exists
    const existingSession = await prisma.userSession.findUnique({
      where: { sessionId },
    });

    if (existingSession) {
      // Update existing session
      const updated = await prisma.userSession.update({
        where: { sessionId },
        data: {
          lastActivity: new Date(),
          pageCount: { increment: 1 },
        },
      });

      return NextResponse.json({
        success: true,
        session: updated,
        isNew: false,
      });
    } else {
      // Create new session
      const newSession = await prisma.userSession.create({
        data: {
          sessionId,
          userId: userId || null,
          deviceType: deviceType || null,
          browser: browser || null,
          os: os || null,
          ipAddress,
          tambonId: tambonId || null,
          amphureId: amphureId || null,
          provinceId: provinceId || null,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          pageCount: 1,
        },
      });

      return NextResponse.json({
        success: true,
        session: newSession,
        isNew: true,
      });
    }
  } catch (error) {
    console.error('Error managing session:', error);
    return NextResponse.json(
      { error: 'Failed to manage session' },
      { status: 500 }
    );
  }
}

// PUT /api/analytics/session - End session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const updated = await prisma.userSession.update({
      where: { sessionId },
      data: {
        endTime: new Date(),
        lastActivity: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      session: updated,
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
