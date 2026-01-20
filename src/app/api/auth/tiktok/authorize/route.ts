// src/app/api/auth/tiktok/authorize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * GET /api/auth/tiktok/authorize
 * Initiate TikTok OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    // Support both TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_ID for flexibility
    const clientKey = process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;
    
    if (!clientKey) {
      console.error('TikTok OAuth not configured: Missing TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_ID');
      return NextResponse.json(
        { error: 'TikTok OAuth not configured. Please set TIKTOK_CLIENT_KEY (or TIKTOK_CLIENT_ID) environment variable.' },
        { status: 500 }
      );
    }

    // Get callbackUrl from query params
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state and callbackUrl in cookie for verification
    const response = NextResponse.redirect(
      `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    );

    response.cookies.set('tiktok_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    response.cookies.set('tiktok_callback_url', callbackUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('TikTok authorize error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate TikTok login' },
      { status: 500 }
    );
  }
}