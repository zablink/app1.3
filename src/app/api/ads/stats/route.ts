// src/app/api/ads/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API สำหรับดู Analytics ของโฆษณา
 * 
 * Query Parameters:
 * - bannerId: string (optional) - ดูสถิติของโฆษณาเฉพาะ ID
 * - placement: string (optional) - ดูสถิติของ placement เฉพาะ
 * - startDate: string (optional) - วันที่เริ่มต้น (ISO format)
 * - endDate: string (optional) - วันที่สิ้นสุด (ISO format)
 * - groupBy: string (optional) - 'banner' | 'placement' | 'location' | 'date'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const bannerId = searchParams.get('bannerId');
    const placement = searchParams.get('placement');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'banner';

    // ถ้าระบุ bannerId ให้ดูสถิติของโฆษณานั้นโดยเฉพาะ
    if (bannerId) {
      const banner = await prisma.adBanner.findUnique({
        where: { id: bannerId }
      });

      if (!banner) {
        return NextResponse.json(
          { error: 'Banner not found' },
          { status: 404 }
        );
      }

      // นับ views และ clicks จาก ad_impressions
      const stats = await prisma.$queryRaw<Array<{
        total_views: number;
        total_clicks: number;
        unique_users: number;
        unique_sessions: number;
      }>>`
        SELECT 
          COUNT(*) FILTER (WHERE event_type = 'view') as total_views,
          COUNT(*) FILTER (WHERE event_type = 'click') as total_clicks,
          COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
          COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) as unique_sessions
        FROM ad_impressions
        WHERE banner_id = ${bannerId}
          ${startDate ? `AND created_at >= ${new Date(startDate)}` : ''}
          ${endDate ? `AND created_at <= ${new Date(endDate)}` : ''}
      `;

      const stat = stats[0];
      const ctr = stat.total_views > 0 
        ? ((Number(stat.total_clicks) / Number(stat.total_views)) * 100).toFixed(2)
        : '0.00';

      return NextResponse.json({
        success: true,
        banner: {
          id: banner.id,
          title: banner.title,
          placement: banner.placement,
          isActive: banner.isActive
        },
        stats: {
          views: Number(stat.total_views),
          clicks: Number(stat.total_clicks),
          uniqueUsers: Number(stat.unique_users),
          uniqueSessions: Number(stat.unique_sessions),
          ctr: parseFloat(ctr)
        }
      });
    }

    // ถ้าไม่ระบุ bannerId ให้ดูภาพรวม
    let whereConditions = [];
    if (placement) whereConditions.push(`ab.placement = '${placement}'`);
    if (startDate) whereConditions.push(`ai.created_at >= '${startDate}'`);
    if (endDate) whereConditions.push(`ai.created_at <= '${endDate}'`);
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Group by banner (default)
    if (groupBy === 'banner') {
      const stats = await prisma.$queryRaw<Array<{
        banner_id: string;
        banner_title: string;
        placement: string;
        total_views: number;
        total_clicks: number;
        ctr: number;
      }>>`
        SELECT 
          ab.id as banner_id,
          ab.title as banner_title,
          ab.placement,
          COUNT(*) FILTER (WHERE ai.event_type = 'view') as total_views,
          COUNT(*) FILTER (WHERE ai.event_type = 'click') as total_clicks,
          CASE 
            WHEN COUNT(*) FILTER (WHERE ai.event_type = 'view') > 0 
            THEN ROUND(
              (COUNT(*) FILTER (WHERE ai.event_type = 'click')::NUMERIC / 
               COUNT(*) FILTER (WHERE ai.event_type = 'view')::NUMERIC) * 100, 
              2
            )
            ELSE 0 
          END as ctr
        FROM ad_banners ab
        LEFT JOIN ad_impressions ai ON ai.banner_id = ab.id
        ${whereClause}
        GROUP BY ab.id, ab.title, ab.placement
        ORDER BY total_views DESC
      `;

      return NextResponse.json({
        success: true,
        groupBy: 'banner',
        data: stats.map(s => ({
          bannerId: s.banner_id,
          title: s.banner_title,
          placement: s.placement,
          views: Number(s.total_views),
          clicks: Number(s.total_clicks),
          ctr: Number(s.ctr)
        }))
      });
    }

    // Group by placement
    if (groupBy === 'placement') {
      const stats = await prisma.$queryRaw<Array<{
        placement: string;
        total_banners: number;
        total_views: number;
        total_clicks: number;
        ctr: number;
      }>>`
        SELECT 
          ab.placement,
          COUNT(DISTINCT ab.id) as total_banners,
          COUNT(*) FILTER (WHERE ai.event_type = 'view') as total_views,
          COUNT(*) FILTER (WHERE ai.event_type = 'click') as total_clicks,
          CASE 
            WHEN COUNT(*) FILTER (WHERE ai.event_type = 'view') > 0 
            THEN ROUND(
              (COUNT(*) FILTER (WHERE ai.event_type = 'click')::NUMERIC / 
               COUNT(*) FILTER (WHERE ai.event_type = 'view')::NUMERIC) * 100, 
              2
            )
            ELSE 0 
          END as ctr
        FROM ad_banners ab
        LEFT JOIN ad_impressions ai ON ai.banner_id = ab.id
        ${whereClause}
        GROUP BY ab.placement
        ORDER BY total_views DESC
      `;

      return NextResponse.json({
        success: true,
        groupBy: 'placement',
        data: stats.map(s => ({
          placement: s.placement,
          totalBanners: Number(s.total_banners),
          views: Number(s.total_views),
          clicks: Number(s.total_clicks),
          ctr: Number(s.ctr)
        }))
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Please specify groupBy parameter'
    });

  } catch (error) {
    console.error('[ads/stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
