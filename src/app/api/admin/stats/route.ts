// src/app/api/admin/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * ดึงสถิติสำหรับ admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: ตรวจสอบ admin authentication

    // 1. สถิติวันนี้
    const todayStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) FILTER (WHERE submitted_at::date = CURRENT_DATE AND rejection_count = 0) as today_submissions,
        COUNT(*) FILTER (WHERE resubmitted_at::date = CURRENT_DATE) as today_resubmissions,
        COUNT(*) FILTER (WHERE approved_at::date = CURRENT_DATE) as today_approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED' AND updated_at::date = CURRENT_DATE) as today_rejected
      FROM simple_shops
    `;

    // 2. สถิติรวม
    const totalStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL') as pending_count,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as active_count,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
        COUNT(*) as total_shops
      FROM simple_shops
    `;

    // 3. แยกตาม package
    const packageStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(ss.current_package_tier, 'FREE') as package_tier,
        COUNT(*) as count
      FROM simple_shops s
      LEFT JOIN shop_subscriptions ss ON (
        s.id = ss.shop_id 
        AND ss.status = 'ACTIVE'
        AND ss.end_date > NOW()
      )
      WHERE s.status = 'APPROVED'
      GROUP BY COALESCE(ss.current_package_tier, 'FREE')
      ORDER BY 
        CASE COALESCE(ss.current_package_tier, 'FREE')
          WHEN 'PREMIUM' THEN 1
          WHEN 'PRO' THEN 2
          WHEN 'BASIC' THEN 3
          WHEN 'FREE' THEN 4
        END
    `;

    // 4. สถิติ 30 วันล่าสุด
    const dailyStats = await prisma.$queryRaw<any[]>`
      SELECT 
        date,
        new_submissions,
        approved,
        rejected,
        pending_count
      FROM shop_daily_stats
      ORDER BY date DESC
      LIMIT 30
    `;

    // 5. รายได้ประจำเดือน (จาก subscriptions)
    const revenueStats = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE_TRUNC('month', ss.start_date) as month,
        SUM(ss.final_price) as revenue,
        COUNT(*) as subscription_count
      FROM shop_subscriptions ss
      WHERE ss.payment_status = 'PAID'
        AND ss.start_date >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
      GROUP BY DATE_TRUNC('month', ss.start_date)
      ORDER BY month DESC
    `;

    // 6. ร้านที่ active มากที่สุด (top performers)
    const topShops = await prisma.$queryRaw<any[]>`
      SELECT 
        s.id,
        s.name,
        s.province,
        COALESCE(ss.current_package_tier, 'FREE') as package_tier,
        s.created_at
      FROM simple_shops s
      LEFT JOIN shop_subscriptions ss ON (
        s.id = ss.shop_id 
        AND ss.status = 'ACTIVE'
      )
      WHERE s.status = 'APPROVED'
      ORDER BY s.created_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      today: todayStats[0],
      total: totalStats[0],
      byPackage: packageStats.map(p => ({
        package: p.package_tier,
        count: Number(p.count)
      })),
      daily: dailyStats.reverse(), // เรียงจากเก่า → ใหม่ สำหรับ chart
      revenue: revenueStats.map(r => ({
        month: r.month,
        revenue: Number(r.revenue),
        count: Number(r.subscription_count)
      })),
      topShops: topShops.map(s => ({
        ...s,
        id: Number(s.id)
      }))
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        detail: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}