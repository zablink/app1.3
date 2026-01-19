// app/api/location/reverse-geocode/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getLocationFromCoordinates } from '@/lib/location-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, accuracy } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing lat or lng' },
        { status: 400 }
      );
    }

    // แปลง GPS coordinates เป็น location info
    const locationInfo = await getLocationFromCoordinates(lat, lng, accuracy);

    if (!locationInfo) {
      return NextResponse.json(
        { error: 'Could not determine location from coordinates' },
        { status: 404 }
      );
    }

    return NextResponse.json(locationInfo);
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
