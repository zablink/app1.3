// Test API to check if database connection works
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Try to connect to database
    const startTime = Date.now();
    await prisma.$connect();
    const connectTime = Date.now() - startTime;
    
    console.log(`Database connected in ${connectTime}ms`);
    
    // Try a simple query
    const queryStartTime = Date.now();
    const userCount = await prisma.user.count();
    const queryTime = Date.now() - queryStartTime;
    
    console.log(`Query executed in ${queryTime}ms`);
    
    return NextResponse.json({
      success: true,
      connectTime: `${connectTime}ms`,
      queryTime: `${queryTime}ms`,
      userCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
