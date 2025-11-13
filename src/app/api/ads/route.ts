// app/api/ads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdsForLocation, getLocationFromCoordinates } from '@/lib/location-service';
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
    const limit = searchParams.get('limit');

    let userLocation: {
      provinceId: number | null;
      amphureId: number | null;
      tambonId: number | null;
    };

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

      userLocation = {
        provinceId: locationInfo.provinceId,
        amphureId: locationInfo.amphureId,
        tambonId: locationInfo.tambonId
      };
    }
    // กรณีมีเฉพาะ location IDs (manual selection)
    else if (provinceId && amphureId && tambonId) {
      userLocation = {
        provinceId: parseInt(provinceId),
        amphureId: parseInt(amphureId),
        tambonId: parseInt(tambonId)
      };
    }
    // ไม่มี location parameter = แสดงเฉพาะ NATIONWIDE
    else {
      userLocation = {
        provinceId: null,
        amphureId: null,
        tambonId: null
      };
    }

    // ดึงโฆษณาที่ตรงกับ location
    const ads = await getAdsForLocation(
      userLocation,
      limit ? parseInt(limit) : 10
    );

    // แยกตาม scope เพื่อให้ง่ายต่อการแสดงผล
    const adsByScope = {
      NATIONWIDE: ads.filter(ad => ad.AdPackage?.scope === 'NATIONWIDE'),
      PROVINCE: ads.filter(ad => ad.AdPackage?.scope === 'PROVINCE'),
      DISTRICT: ads.filter(ad => ad.AdPackage?.scope === 'DISTRICT'),
      SUBDISTRICT: ads.filter(ad => ad.AdPackage?.scope === 'SUBDISTRICT')
    };

    return NextResponse.json({
      ads,
      adsByScope,
      total: ads.length,
      userLocation
    });

  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}
