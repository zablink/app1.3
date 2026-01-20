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
    
    // Get base URL from environment variable or construct from request
    // Priority: TIKTOK_REDIRECT_URI > NEXT_PUBLIC_APP_URL > NEXTAUTH_URL > request headers
    let baseUrl = process.env.TIKTOK_REDIRECT_URI 
      ? process.env.TIKTOK_REDIRECT_URI.replace(/\/api\/auth\/tiktok\/callback\/?$/, '')
      : process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    
    // If not set, construct from request headers
    if (!baseUrl) {
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
      if (host) {
        baseUrl = `${protocol}://${host}`;
      }
    }
    
    // Ensure baseUrl doesn't have trailing slash
    baseUrl = (baseUrl || '').replace(/\/$/, '');
    const redirectUri = `${baseUrl}/api/auth/tiktok/callback`;
    
    // Log for debugging
    console.log('=== TikTok OAuth Configuration ===');
    console.log('TIKTOK_REDIRECT_URI:', process.env.TIKTOK_REDIRECT_URI || 'not set');
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'not set');
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'not set');
    console.log('Request Host:', request.headers.get('host'));
    console.log('Computed Base URL:', baseUrl);
    console.log('Final Redirect URI:', redirectUri);
    console.log('================================');
    
    if (!clientKey) {
      console.error('TikTok OAuth not configured: Missing TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_ID');
      return NextResponse.json(
        { error: 'TikTok OAuth not configured. Please set TIKTOK_CLIENT_KEY (or TIKTOK_CLIENT_ID) environment variable.' },
        { status: 500 }
      );
    }

    if (!baseUrl) {
      console.error('Could not determine base URL from environment variables or request headers');
      return NextResponse.json(
        { error: 'Could not determine application URL. Please set NEXT_PUBLIC_APP_URL or NEXTAUTH_URL environment variable.' },
        { status: 500 }
      );
    }

    // Get callbackUrl from query params
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Log redirect URI for debugging
    console.log('TikTok OAuth redirect URI:', redirectUri);
    console.log('Base URL:', baseUrl);
    
    // Build authorization URL
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    console.log('TikTok authorization URL:', authUrl.replace(/client_secret=[^&]+/, 'client_secret=***'));
    
    // Store state and callbackUrl in cookie for verification
    const response = NextResponse.redirect(authUrl);

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