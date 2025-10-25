// src/app/api/cron/process-subscriptions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/cron/process-subscriptions
 * 
 * Cron Job ที่รันทุกวัน เพื่อ:
 * 1. Process scheduled downgrades
 * 2. Expire old subscriptions
 * 3. Send renewal reminders
 * 
 * ตั้งค่าใน Vercel Cron Jobs หรือใช้ external service เช่น:
 * - Vercel Cron: ตั้งค่าใน vercel.json
 * - Uptime Robot: Ping URL นี้ทุกวัน
 * - GitHub Actions: Scheduled workflow
 */
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ authorization (ควรมี secret key)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'change-this-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Processing subscription changes...');

    // 1. Process scheduled changes (downgrades)
    const processedChanges = await processScheduledChanges();

    // 2. Expire old subscriptions
    const expiredCount = await expireOldSubscriptions();

    // 3. Get upcoming renewals (within 7 days)
    const upcomingRenewals = await getUpcomingRenewals();

    console.log('[CRON] Completed:', {
      processed: processedChanges.length,
      expired: expiredCount,
      renewals: upcomingRenewals.length
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        processed_changes: processedChanges,
        expired_subscriptions: expiredCount,
        upcoming_renewals: upcomingRenewals
      }
    });

  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json(
      { 
        error: 'Cron job failed',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Process scheduled changes (downgrades)
async function processScheduledChanges() {
  const results