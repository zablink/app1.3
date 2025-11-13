// app/api/shops/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getShopsForHomePage, getLocationFromCoordinates } from '@/lib/location-service';
import type { LocationInfo } from '@/lib/location-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // ดึงพารามิเตอร์
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const provinceId = searchParams.get('provinceId');
    const amphureId = searchParams.get('amphureId');
    const tambonId = searchParams.get('tambonId');
    const radiusKm = searchParams.get('radiusKm');
    const filterLevel = searchParams.get('filterLevel');
    const categoryId = searchParams.get('categoryId');
    const limit = searchParams.get('limit');

    let userLocation: LocationInfo;

    // กรณีมี GPS coordinates
    if (lat && lng) {
      const locationInfo = await getLocationFromCoordinates(
        parseFloat(lat),
        parseFloat(lng)
      );

      if (!locationInfo) {
        return NextResponse.json(
          { error: 'Could not determine location from coordinates' },
          { status: 400 }
        );
      }

      userLocation = locationInfo;
    }
    // กรณีมีเฉพาะ location IDs (manual selection)
    else if (provinceId && amphureId && tambonId) {
      userLocation = {
        coordinates: { lat: 0, lng: 0 }, // ไม่มี GPS จริง
        provinceId: parseInt(provinceId),
        amphureId: parseInt(amphureId),
        tambonId: parseInt(tambonId)
      };
    }
    // ไม่มี location parameter
    else {
      return NextResponse.json(
        { error: 'Either GPS coordinates (lat, lng) or location IDs (provinceId, amphureId, tambonId) required' },
        { status: 400 }
      );
    }

    // ดึงร้านค้า
    const shops = await getShopsForHomePage(userLocation, {
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
      filterLevel: filterLevel as any || 'all',
      categoryId: categoryId || undefined,
      limit: limit ? parseInt(limit) : undefined
    });

    // แยกตาม tier
    const shopsByTier = {
      PREMIUM: shops.filter(s => s.activeSubscription?.subscription_packages.tier === 'PREMIUM'),
      PRO: shops.filter(s => s.activeSubscription?.subscription_packages.tier === 'PRO'),
      BASIC: shops.filter(s => s.activeSubscription?.subscription_packages.tier === 'BASIC'),
      FREE: shops.filter(s => !s.activeSubscription || s.activeSubscription?.subscription_packages.tier === 'FREE')
    };

    return NextResponse.json({
      shops,
      shopsByTier,
      userLocation: {
        provinceName: userLocation.provinceName,
        amphureName: userLocation.amphureName,
        tambonName: userLocation.tambonName
      },
      total: shops.length
    });

  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shops' },
      { status: 500 }
    );
  }
}
