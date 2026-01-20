// src/app/api/auth/tiktok/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { encode } from 'next-auth/jwt';

export const runtime = 'nodejs';

/**
 * GET /api/auth/tiktok/callback
 * Handle TikTok OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Get base URL for redirects (will be set later if not available)
    let baseUrlForRedirect = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    if (!baseUrlForRedirect) {
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
      if (host) {
        baseUrlForRedirect = `${protocol}://${host}`;
      }
    }
    baseUrlForRedirect = (baseUrlForRedirect || '').replace(/\/$/, '');

    // Check for errors from TikTok
    if (error) {
      console.error('TikTok OAuth error:', error);
      // Map TikTok specific errors to our error codes
      let errorCode = 'OAuthSignin';
      if (error === 'non_sandbox_target') {
        errorCode = 'non_sandbox_target';
      }
      return NextResponse.redirect(
        `${baseUrlForRedirect}/signin?error=${errorCode}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrlForRedirect}/signin?error=OAuthCallback`
      );
    }

    // Verify state from cookie
    const storedState = request.cookies.get('tiktok_oauth_state')?.value;
    const callbackUrl = request.cookies.get('tiktok_callback_url')?.value || '/dashboard';

    if (!storedState || storedState !== state) {
      console.error('State mismatch in TikTok OAuth callback');
      return NextResponse.redirect(
        `${baseUrlForRedirect}/signin?error=OAuthCallback`
      );
    }

    // Support both TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_ID for flexibility
    const clientKey = process.env.TIKTOK_CLIENT_KEY || process.env.TIKTOK_CLIENT_ID;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    
    // Get redirect URI - use TIKTOK_REDIRECT_URI directly if set, otherwise construct
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
    }
    
    // Ensure redirectUri doesn't have trailing slash
    redirectUri = redirectUri.replace(/\/$/, '');
    
    console.log('=== TikTok Callback Configuration ===');
    console.log('TIKTOK_REDIRECT_URI (env):', process.env.TIKTOK_REDIRECT_URI || 'not set');
    console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'not set');
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'not set');
    console.log('Request Host:', request.headers.get('host'));
    console.log('Final Redirect URI:', redirectUri);
    console.log('=====================================');

    if (!clientKey || !clientSecret) {
      console.error('TikTok OAuth credentials not configured:', {
        hasClientKey: !!process.env.TIKTOK_CLIENT_KEY,
        hasClientId: !!process.env.TIKTOK_CLIENT_ID,
        hasClientSecret: !!process.env.TIKTOK_CLIENT_SECRET,
      });
      return NextResponse.redirect(
        `${baseUrlForRedirect}/signin?error=OAuthSignin`
      );
    }

    // Exchange code for access token
    // TikTok OAuth API requires specific format
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error('TikTok token exchange error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        redirectUri,
        hasClientKey: !!clientKey,
        hasClientSecret: !!clientSecret,
      });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=OAuthCallback&message=${encodeURIComponent(errorData.error_description || errorData.error || 'Token exchange failed')}`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('No access token received from TikTok');
      return NextResponse.redirect(
        `${baseUrlForRedirect}/signin?error=OAuthCallback`
      );
    }

    // Get user info from TikTok
    // TikTok API requires fields parameter in query string
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error('TikTok user info error:', {
        status: userInfoResponse.status,
        statusText: userInfoResponse.statusText,
        error: errorData,
        hasAccessToken: !!accessToken,
      });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=OAuthCallback&message=${encodeURIComponent(errorData.error_description || errorData.error || 'Failed to get user info')}`
      );
    }

    const userInfo = await userInfoResponse.json();
    const tiktokUser = userInfo.data?.user;

    if (!tiktokUser || !tiktokUser.open_id) {
      console.error('Invalid user data from TikTok');
      return NextResponse.redirect(
        `${baseUrlForRedirect}/signin?error=OAuthCallback`
      );
    }

    // Create or update user in database
    const email = `${tiktokUser.open_id}@tiktok.local`;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    let user;
    if (existingUser) {
      // Update existing user
      user = await prisma.user.update({
        where: { email },
        data: {
          name: tiktokUser.display_name || existingUser.name || 'TikTok User',
          image: tiktokUser.avatar_url || existingUser.image,
        },
      });

      // Update or create account
      const existingAccount = existingUser.accounts.find(
        (acc) => acc.provider === 'tiktok' && acc.providerAccountId === tiktokUser.open_id
      );

      if (existingAccount) {
        await prisma.account.update({
          where: { id: existingAccount.id },
          data: {
            access_token: accessToken,
            token_type: 'Bearer',
          },
        });
      } else {
        await prisma.account.create({
          data: {
            userId: user.id,
            provider: 'tiktok',
            providerAccountId: tiktokUser.open_id,
            type: 'oauth',
            access_token: accessToken,
            token_type: 'Bearer',
          },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: tiktokUser.display_name || 'TikTok User',
          image: tiktokUser.avatar_url || null,
          role: 'USER',
          accounts: {
            create: {
              provider: 'tiktok',
              providerAccountId: tiktokUser.open_id,
              type: 'oauth',
              access_token: accessToken,
              token_type: 'Bearer',
            },
          },
        },
      });
    }

    // Create NextAuth session token
    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        picture: user.image,
        role: user.role || 'USER',
      },
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set session cookie
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';

    const response = NextResponse.redirect(
      `${baseUrlForRedirect}${callbackUrl}`
    );

    // Set session cookie
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Clear OAuth cookies
    response.cookies.delete('tiktok_oauth_state');
    response.cookies.delete('tiktok_callback_url');

    return response;
  } catch (error) {
    console.error('TikTok callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/signin?error=OAuthCallback`
    );
  }
}
