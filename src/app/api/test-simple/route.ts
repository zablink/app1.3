// Simple test API without any dependencies
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    serverTime: Date.now(),
  });
}
