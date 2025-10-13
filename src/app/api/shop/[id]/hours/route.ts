// src/app/api/shop/[id]/hours/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'nodejs';

/**
 * GET /api/shop/[id]/hours
 * Get shop opening hours
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shopId } = await params;

    // Get main hours config
    const { data: hours, error: hoursError } = await supabase
      .from('shop_hours')
      .select('*')
      .eq('shop_id', shopId)
      .single();

    if (hoursError && hoursError.code !== 'PGRST116') {
      throw hoursError;
    }

    // Get daily hours
    const { data: dailyHours, error: dailyError } = await supabase
      .from('shop_daily_hours')
      .select('*')
      .eq('shop_id', shopId)
      .order('day_of_week');

    if (dailyError && dailyError.code !== 'PGRST116') {
      throw dailyError;
    }

    // Get special hours (upcoming)
    const { data: specialHours, error: specialError } = await supabase
      .from('shop_special_hours')
      .select('*')
      .eq('shop_id', shopId)
      .gte('special_date', new Date().toISOString().split('T')[0])
      .order('special_date')
      .limit(10);

    if (specialError && specialError.code !== 'PGRST116') {
      throw specialError;
    }

    return NextResponse.json({
      success: true,
      hours: hours || null,
      dailyHours: dailyHours || [],
      specialHours: specialHours || [],
    });
  } catch (error) {
    console.error('Get shop hours error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shop/[id]/hours
 * Save shop opening hours
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: shopId } = await params;
    const body = await request.json();

    const {
      is24Hours,
      isSameDaily,
      isClosed,
      defaultOpenTime,
      defaultCloseTime,
      dailyHours,
    } = body;

    // Upsert main hours config
    const { error: hoursError } = await supabase
      .from('shop_hours')
      .upsert({
        shop_id: shopId,
        is_24_hours: is24Hours,
        is_same_daily: isSameDaily,
        is_closed: isClosed,
        default_open_time: defaultOpenTime,
        default_close_time: defaultCloseTime,
      }, {
        onConflict: 'shop_id',
      });

    if (hoursError) throw hoursError;

    // Handle daily hours
    if (!isSameDaily && !is24Hours && dailyHours) {
      // Delete existing daily hours
      await supabase
        .from('shop_daily_hours')
        .delete()
        .eq('shop_id', shopId);

      interface DailyHoursInput {
        dayOfWeek: number;
        isClosed: boolean;
        openTime?: string | null;
        closeTime?: string | null;
        openTime2?: string | null;
        closeTime2?: string | null;
      }

      // แล้วเปลี่ยนตรง map เป็น:
      const dailyHoursToInsert = dailyHours.map((dh: DailyHoursInput) => ({
        
        shop_id: shopId,
        day_of_week: dh.dayOfWeek,
        is_closed: dh.isClosed,
        open_time: dh.openTime,
        close_time: dh.closeTime,
        open_time_2: dh.openTime2,
        close_time_2: dh.closeTime2,
      }));

      const { error: dailyError } = await supabase
        .from('shop_daily_hours')
        .insert(dailyHoursToInsert);

      if (dailyError) throw dailyError;
    }

    return NextResponse.json({
      success: true,
      message: 'Shop hours saved successfully',
    });
  } catch (error) {
    console.error('Save shop hours error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}