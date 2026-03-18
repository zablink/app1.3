// src/app/api/auth/tiktok/authorize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

function sanitizeCallbackPath(input: string | null) {
  if (!input) return '/dashboard';
  if (!input.startsWith('/')) return '/dashboard';
  if (input.startsWith('//')) return '/dashboard';
  return input;
}

/**
 * GET /api/auth/tiktok/authorize
 * Initiate TikTok OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    // Support both TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_ID for flexibility
    const clientKey = process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID;
    
    // Get redirect URI - use TIKTOK_REDIRECT_URI exactly as provided (do NOT normalize),
    // otherwise construct a sensible default.
    let redirectUri = process.env.TIKTOK_REDIRECT_URI;
    
    if (!redirectUri) {
      // Construct from base URL
      let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
      
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
      redirectUri = `${baseUrl}/api/auth/tiktok/callback`;
      // When we construct it ourselves, keep it normalized (no trailing slash)
      redirectUri = redirectUri.replace(/\/$/, '');
    }
    
    if (!clientKey) {
      console.error('TikTok OAuth not configured: Missing TIKTOK_CLIENT_KEY or TIKTOK_CLIENT_ID');
      return NextResponse.json(
        { error: 'TikTok OAuth not configured. Please set TIKTOK_CLIENT_KEY (or TIKTOK_CLIENT_ID) environment variable.' },
        { status: 500 }
      );
    }

    if (!redirectUri) {
      console.error('Could not determine redirect URI from environment variables or request headers');
      return NextResponse.json(
        { error: 'Could not determine redirect URI. Please set TIKTOK_REDIRECT_URI or NEXT_PUBLIC_APP_URL environment variable.' },
        { status: 500 }
      );
    }

    // Get callbackUrl from query params
    const { searchParams } = new URL(request.url);
    const callbackUrl = sanitizeCallbackPath(searchParams.get('callbackUrl'));

    // Generate state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Build authorization URL with proper encoding
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=user.info.basic&response_type=code&redirect_uri=${encodedRedirectUri}&state=${state}`;
    
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