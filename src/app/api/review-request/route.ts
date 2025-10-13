// src/app/api/review-request/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'nodejs';

/**
 * POST /api/review-request
 * Create new review request from shop owner
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, title, description, budget, deadline } = body;

    if (!shopId || !title || !description || !budget || !deadline) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get shop location
    const { data: shop, error: shopError } = await supabase
      .from('Shop')
      .select('*, location')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Parse location (POINT geometry)
    let provinceId, amphureId, tambonId;
    
    // You'll need to reverse geocode or have location IDs stored
    // For now, we'll require them to be sent in the request
    provinceId = body.provinceId;
    amphureId = body.amphureId;
    tambonId = body.tambonId;

    if (!provinceId || !amphureId || !tambonId) {
      return NextResponse.json(
        { success: false, error: 'Location IDs required' },
        { status: 400 }
      );
    }

// src/app/api/review-request/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'nodejs';

/**
 * POST /api/review-request
 * Create new review request from shop owner
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, title, description, budget, deadline, provinceId, amphureId, tambonId } = body;

    if (!shopId || !title || !description || !budget || !deadline) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!provinceId || !amphureId || !tambonId) {
      return NextResponse.json(
        { success: false, error: 'Location IDs required' },
        { status: 400 }
      );
    }

    // Verify shop exists
    const { data: shop, error: shopError } = await supabase
      .from('Shop')
      .select('id, name')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { success: false, error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Create review request
    const { data: reviewRequest, error } = await supabase
      .from('review_requests')
      .insert({
        shop_id: shopId,
        title,
        description,
        budget,
        deadline,
        province_id: provinceId,
        amphure_id: amphureId,
        tambon_id: tambonId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Find nearby creators
    const { data: nearbyCreators } = await supabase
      .from('creators')
      .select('id, display_name, phone, line_id')
      .eq('status', 'active')
      .or(`province_id.eq.${provinceId},amphure_id.eq.${amphureId},tambon_id.eq.${tambonId}`)
      .limit(10);

    return NextResponse.json({
      success: true,
      reviewRequest,
      nearbyCreators: nearbyCreators || [],
      message: 'Review request created. We will notify nearby creators.',
    });
  } catch (error) {
    console.error('Review request error:', error);
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
 * PUT /api/review-request
 * Assign creator to review request
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, creatorId, action } = body;

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Request ID required' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'assign':
        if (!creatorId) {
          return NextResponse.json(
            { success: false, error: 'Creator ID required for assignment' },
            { status: 400 }
          );
        }
        updateData = {
          creator_id: creatorId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
        };
        break;

      case 'start':
        updateData = { status: 'in_progress' };
        break;

      case 'complete':
        const { videoUrl, notes } = body;
        updateData = {
          status: 'completed',
          completed_at: new Date().toISOString(),
          video_url: videoUrl,
          notes,
        };
        
        // Add earning for creator
        const { data: request } = await supabase
          .from('review_requests')
          .select('creator_id, budget')
          .eq('id', requestId)
          .single();

        if (request && request.creator_id) {
          await supabase.from('creator_earnings').insert({
            creator_id: request.creator_id,
            review_request_id: requestId,
            amount: request.budget,
            description: 'Review completion payment',
          });

          // Update creator stats
          await supabase.rpc('increment_creator_reviews', {
            creator_id: request.creator_id,
          });
        }
        break;

      case 'cancel':
        updateData = { status: 'cancelled' };
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    const { data: updated, error } = await supabase
      .from('review_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reviewRequest: updated,
    });
  } catch (error) {
    console.error('Update review request error:', error);
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
 * GET /api/review-request?shopId=xxx
 * Get review requests for a shop
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const creatorId = searchParams.get('creatorId');

    let query = supabase
      .from('review_requests')
      .select(`
        *,
        Shop (name, address),
        creators (display_name, phone)
      `)
      .order('requested_at', { ascending: false });

    if (shopId) {
      query = query.eq('shop_id', shopId);
    } else if (creatorId) {
      query = query.eq('creator_id', creatorId);
    } else {
      return NextResponse.json(
        { success: false, error: 'Shop ID or Creator ID required' },
        { status: 400 }
      );
    }

    const { data: requests, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      requests: requests || [],
    });
  } catch (error) {
    console.error('Get review requests error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}