// src/app/api/debug/facebook-redirect-uri/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/facebook-redirect-uri
 * Debug endpoint to show the Facebook redirect URI that should be configured
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl = url.origin;
    
    // NextAuth.js uses this format for Facebook callback
    const redirectUri = `${baseUrl}/api/auth/callback/facebook`;
    
    // Get NEXTAUTH_URL if set
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    // Calculate expected redirect URI based on NEXTAUTH_URL
    const expectedRedirectUri = nextAuthUrl 
      ? `${nextAuthUrl}/api/auth/callback/facebook`
      : redirectUri;

    // Check if running on Vercel preview
    const isVercel = !!process.env.VERCEL;
    const vercelEnv = process.env.VERCEL_ENV; // 'production', 'preview', 'development'
    const vercelUrl = process.env.VERCEL_URL; // Preview deployment URL (e.g., xxx.vercel.app)

    // Detect if this is a preview deployment
    const isPreview = isVercel && vercelEnv === 'preview';
    const isProduction = isVercel && vercelEnv === 'production';

    // Get all possible redirect URIs
    const allRedirectUris: string[] = [expectedRedirectUri];
    
    // If on Vercel preview, add the preview URL
    if (isPreview && vercelUrl) {
      allRedirectUris.push(`https://${vercelUrl}/api/auth/callback/facebook`);
    }

    // Check if baseUrl is different from expected
    if (baseUrl !== expectedRedirectUri.replace('/api/auth/callback/facebook', '')) {
      allRedirectUris.push(redirectUri);
    }

    // Remove duplicates
    const uniqueRedirectUris = [...new Set(allRedirectUris)];

    return NextResponse.json({
      current: {
        baseUrl,
        redirectUri,
        isVercel,
        vercelEnv: vercelEnv || 'not-vercel',
        vercelUrl: vercelUrl || 'not-available',
        isPreview,
        isProduction,
      },
      expected: {
        nextAuthUrl: nextAuthUrl || 'Not set (using request origin)',
        redirectUri: expectedRedirectUri,
      },
      allRedirectUris: uniqueRedirectUris,
      instructions: {
        step1: 'Go to Facebook Developers → Your App → Products → Facebook Login → Settings',
        step2: 'In "Valid OAuth Redirect URIs" section, add ALL of these URLs:',
        redirectUrisToAdd: uniqueRedirectUris,
        step3: 'Make sure "Client OAuth Login" and "Web OAuth Login" are both enabled',
        step4: 'Save changes and wait a few minutes for Facebook to update',
        ...(isPreview && {
          previewWarning: '⚠️ You are on a Vercel PREVIEW deployment. Make sure to add the preview URL to Facebook settings!',
          previewUrl: vercelUrl ? `https://${vercelUrl}/api/auth/callback/facebook` : 'N/A',
        }),
        ...(isVercel && !nextAuthUrl && {
          nextAuthUrlWarning: '⚠️ NEXTAUTH_URL is not set in Vercel. Set it to your production domain for production deployments.',
        }),
      },
      environment: {
        NEXTAUTH_URL: nextAuthUrl || '❌ Not set',
        FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID ? '✅ Set' : '❌ Not set',
        FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET ? '✅ Set' : '❌ Not set',
        VERCEL: isVercel ? '✅ Yes' : '❌ No',
        VERCEL_ENV: vercelEnv || 'N/A',
        VERCEL_URL: vercelUrl || 'N/A',
      },
      troubleshooting: {
        ...(isPreview && {
          previewIssue: 'If you see "URL blocked" error, it means the preview URL is not whitelisted in Facebook.',
          solution: `Add this URL to Facebook: https://${vercelUrl}/api/auth/callback/facebook`,
        }),
        appMode: 'Make sure your Facebook App is in "Development" mode to allow preview URLs. Live mode only allows production domains.',
      },
      note: 'If NEXTAUTH_URL is not set, NextAuth will use the request origin. Make sure to set NEXTAUTH_URL in production.',
    });
  } catch (error) {
    console.error('Debug redirect URI error:', error);
    return NextResponse.json(
      { error: 'Failed to generate redirect URI info' },
      { status: 500 }
    );
  }
}
