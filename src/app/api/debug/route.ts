// src/app/api/debug/route.ts
// Debug endpoints index - lists all available debug endpoints

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const debugEndpoints = {
    timestamp: new Date().toISOString(),
    description: 'Database Connection Debug Endpoints',
    endpoints: [
      {
        path: '/api/debug/connection',
        method: 'GET',
        description: 'Comprehensive database connection test',
        tests: [
          'Basic database connection',
          'Prisma client initialization',
          'Table existence check',
          'Shop count',
          'Settings count',
        ],
        example: 'https://dev.zablink.com/api/debug/connection',
      },
      {
        path: '/api/debug/prisma',
        method: 'GET',
        description: 'Prisma client and database details',
        tests: [
          'Prisma client type',
          'Database version',
          'PostGIS extension',
          'List all tables',
          'Shop table structure',
        ],
        example: 'https://dev.zablink.com/api/debug/prisma',
      },
      {
        path: '/api/debug/env',
        method: 'GET',
        description: 'Environment variables check (safe - no sensitive data)',
        checks: [
          'DATABASE_URL configuration',
          'Auth variables',
          'Supabase variables',
          'Omise variables',
          'Connection type recommendations',
        ],
        example: 'https://dev.zablink.com/api/debug/env',
      },
      {
        path: '/api/shops/test-connection',
        method: 'GET',
        description: 'Simple shops connection test',
        tests: [
          'Database connection',
          'Shop table existence',
          'Shop count',
          'Status column check',
        ],
        example: 'https://dev.zablink.com/api/shops/test-connection',
      },
      {
        path: '/api/shops/debug',
        method: 'GET',
        description: 'Shops-specific debug information',
        tests: [
          'Database connection',
          'Total shops count',
          'Shops by status',
          'Sample shops',
        ],
        example: 'https://dev.zablink.com/api/shops/debug',
      },
      {
        path: '/api/debug/network',
        method: 'GET',
        description: 'Network connectivity test for database server',
        tests: [
          'Prisma client creation',
          'Database connection with timeout',
          'Error analysis',
        ],
        example: 'https://dev.zablink.com/api/debug/network',
      },
    ],
    quickStart: {
      step1: 'Check environment variables: /api/debug/env',
      step2: 'Test database connection: /api/debug/connection',
      step3: 'Check Prisma client: /api/debug/prisma',
      step4: 'Test shops API: /api/shops/test-connection',
    },
    troubleshooting: {
      connectionFailed: 'Check /api/debug/env → DATABASE_URL_SET should be true',
      wrongPort: 'Check /api/debug/env → DATABASE_URL_TYPE should be "connection-pooler" for Vercel',
      noShops: 'Check /api/debug/connection → tests.shopCount.count',
      buildError: 'Check /api/debug/env → Ensure DATABASE_URL is set in Vercel',
    },
  };

  return NextResponse.json(debugEndpoints);
}
