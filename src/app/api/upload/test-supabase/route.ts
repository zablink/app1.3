// src/app/api/upload/test-supabase/route.ts
// Test Supabase connection
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key exists:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase credentials',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('Buckets error:', bucketsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to list buckets',
        details: bucketsError,
      }, { status: 500 });
    }

    console.log('Available buckets:', buckets);

    // Check shop-images bucket
    const shopImagesBucket = buckets?.find(b => b.name === 'shop-images');

    return NextResponse.json({
      success: true,
      supabaseUrl,
      buckets: buckets?.map(b => b.name) || [],
      hasShopImagesBucket: !!shopImagesBucket,
      shopImagesBucket,
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
    }, { status: 500 });
  }
}
