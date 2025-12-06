// src/app/api/ads/banners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API สำหรับดึงโฆษณา (Ad Banners)
 * รองรับ multiple placements และ location-based targeting
 * 
 * Query Parameters:
 * - placement: string (required) - 'hero' | 'sidebar' | 'category_top' | etc.
 * - tambon_id: number (optional) - ตำบลที่ user อยู่
 * - amphure_id: number (optional) - อำเภอที่ user อยู่
 * - province_id: number (optional) - จังหวัดที่ user อยู่
 * - limit: number (optional) - จำนวนโฆษณาที่ต้องการ (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const placement = searchParams.get('placement') || 'hero';
    const tambonId = searchParams.get('tambon_id');
    const amphureId = searchParams.get('amphure_id');
    const provinceId = searchParams.get('province_id');
    const limit = parseInt(searchParams.get('limit') || '5');

    const now = new Date();
    
    // Query โฆษณาด้วย priority-based targeting
    const banners = await prisma.$queryRaw<Array<{
      id: string;
      title: string;
      description: string | null;
      image_url: string;
      link_url: string | null;
      placement: string;
      target_area_type: string | null;
      target_area_id: number | null;
      priority: number;
      view_count: number;
      click_count: number;
      relevance_score: number;
      ctr: number;
    }>>`
      SELECT 
        id,
        title,
        description,
        image_url,
        link_url,
        placement,
        target_area_type,
        target_area_id,
        priority,
        view_count,
        click_count,
        -- คำนวณ relevance score (ยิ่งเฉพาะเจาะจงยิ่งได้คะแนนสูง)
        CASE
          WHEN target_area_type = 'tambon' AND target_area_id = ${tambonId ? parseInt(tambonId) : null} THEN 100
          WHEN target_area_type = 'amphure' AND target_area_id = ${amphureId ? parseInt(amphureId) : null} THEN 75
          WHEN target_area_type = 'province' AND target_area_id = ${provinceId ? parseInt(provinceId) : null} THEN 50
          WHEN target_area_type = 'nationwide' OR target_area_type IS NULL THEN 25
          ELSE 0
        END as relevance_score,
        -- คำนวณ CTR (Click-Through Rate) สำหรับการจัดลำดับ
        CASE 
          WHEN view_count > 0 THEN ROUND((click_count::NUMERIC / view_count::NUMERIC) * 100, 2)
          ELSE 0 
        END as ctr
      FROM ad_banners
      WHERE is_active = true
        AND placement = ${placement}
        AND (start_date IS NULL OR start_date <= ${now})
        AND (end_date IS NULL OR end_date >= ${now})
        AND (
          -- แสดงเฉพาะโฆษณาที่เกี่ยวข้องกับ location ของ user
          (target_area_type = 'tambon' AND target_area_id = ${tambonId ? parseInt(tambonId) : null})
          OR (target_area_type = 'amphure' AND target_area_id = ${amphureId ? parseInt(amphureId) : null})
          OR (target_area_type = 'province' AND target_area_id = ${provinceId ? parseInt(provinceId) : null})
          OR target_area_type = 'nationwide'
          OR target_area_type IS NULL
        )
      ORDER BY 
        relevance_score DESC,  -- โฆษณาที่ตรงพื้นที่มากที่สุดก่อน
        priority DESC,         -- Priority สูงกว่าก่อน
        ctr DESC,              -- CTR สูงกว่าก่อน (โฆษณาที่คนคลิกเยอะ)
        RANDOM()               -- สุ่มเพื่อความยุติธรรม
      LIMIT ${limit}
    `;

    return NextResponse.json({
      success: true,
      banners: banners.map(b => ({
        id: b.id,
        title: b.title,
        description: b.description,
        imageUrl: b.image_url,
        linkUrl: b.link_url,
        placement: b.placement,
        targetArea: {
          type: b.target_area_type,
          id: b.target_area_id
        },
        stats: {
          views: b.view_count,
          clicks: b.click_count,
          ctr: b.ctr
        }
      })),
      metadata: {
        placement,
        userLocation: {
          tambonId: tambonId ? parseInt(tambonId) : null,
          amphureId: amphureId ? parseInt(amphureId) : null,
          provinceId: provinceId ? parseInt(provinceId) : null
        },
        count: banners.length
      }
    });

  } catch (error) {
    console.error('[ads/banners] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}
