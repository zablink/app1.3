import { NextResponse } from 'next/server';
import { supabase, LocationInfo } from '@/lib/supabase';

// Define the handler for GET requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing lat or lng parameters' }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
       return NextResponse.json({ error: 'Invalid lat or lng format' }, { status: 400 });
    }

    // แก้ไข: เพิ่ม Type Argument ที่สองสำหรับ Parameters ของ RPC
    const { data, error } = await supabase.rpc<LocationInfo[], { lat: number, lng: number }>('find_location', {
      lat: latitude,
      lng: longitude,
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      // ตรวจสอบว่า Error เป็น JSON ได้หรือไม่ก่อนส่งกลับ
      const errorDetail = error.message || 'Unknown database error';
      return NextResponse.json({ error: 'Failed to query database', details: errorDetail }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Location not found in the database.' }, { status: 404 });
    }

    // Return the first found result (Tambon, Amphure, Province)
    return NextResponse.json(data[0]);

  } catch (error) {
    console.error('API Handler Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
