// src/app/api/debug/env/route.ts
// Debug environment variables (safe - no sensitive data)

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NEXT_PHASE: process.env.NEXT_PHASE,
    },
    database: {
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_SAFE: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')
        : null,
      DATABASE_URL_TYPE: null as string | null,
      DATABASE_URL_PORT: null as string | null,
    },
    auth: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
      NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID_SET: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET_SET: !!process.env.GOOGLE_CLIENT_SECRET,
      FACEBOOK_CLIENT_ID_SET: !!process.env.FACEBOOK_CLIENT_ID,
      FACEBOOK_CLIENT_SECRET_SET: !!process.env.FACEBOOK_CLIENT_SECRET,
    },
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_SET: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY_SET: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    omise: {
      OMISE_PUBLIC_KEY_SET: !!process.env.OMISE_PUBLIC_KEY,
      OMISE_SECRET_KEY_SET: !!process.env.OMISE_SECRET_KEY,
    },
  };

  // Parse DATABASE_URL to extract connection type
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    
    // Extract port
    const portMatch = dbUrl.match(/:(\d+)\//);
    if (portMatch) {
      envInfo.database.DATABASE_URL_PORT = portMatch[1];
      
      if (portMatch[1] === '6543') {
        envInfo.database.DATABASE_URL_TYPE = 'connection-pooler';
      } else if (portMatch[1] === '5432') {
        envInfo.database.DATABASE_URL_TYPE = 'direct-connection';
      } else {
        envInfo.database.DATABASE_URL_TYPE = 'unknown';
      }
    }
    
    // Check for pooler subdomain
    if (dbUrl.includes('pooler')) {
      envInfo.database.DATABASE_URL_TYPE = 'connection-pooler';
    }
    
    // Extract hostname (safe)
    const hostMatch = dbUrl.match(/@([^:]+)/);
    if (hostMatch) {
      envInfo.database.DATABASE_URL_HOST = hostMatch[1];
    }
  }

  // Recommendations
  const recommendations: string[] = [];
  
  if (!envInfo.database.DATABASE_URL_SET) {
    recommendations.push('❌ DATABASE_URL is not set - Required for database connection');
  } else if (process.env.VERCEL && envInfo.database.DATABASE_URL_TYPE === 'direct-connection') {
    recommendations.push('⚠️ Using direct connection (port 5432) in Vercel');
    recommendations.push('💡 Recommendation: Use connection pooler (port 6543)');
    recommendations.push('📝 Update DATABASE_URL in Vercel environment variables');
  } else if (process.env.VERCEL && envInfo.database.DATABASE_URL_TYPE === 'connection-pooler') {
    recommendations.push('✅ Using connection pooler (port 6543) - Good for Vercel');
  }

  if (!envInfo.auth.NEXTAUTH_SECRET_SET) {
    recommendations.push('⚠️ NEXTAUTH_SECRET is not set - Required for authentication');
  }

  envInfo.recommendations = recommendations;

  return NextResponse.json(envInfo);
}
