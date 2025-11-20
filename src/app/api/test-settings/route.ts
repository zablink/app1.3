// app/api/test-settings/route.ts
// ทดสอบว่าดึง settings ได้ไหม

import { NextResponse } from 'next/server';
import { getSettings, getSetting } from '@/lib/settings';

export async function GET() {
  try {
    const settings = await getSettings();
    const favicon = await getSetting('site_favicon');
    
    return NextResponse.json({
      success: true,
      totalSettings: Object.keys(settings).length,
      favicon,
      sampleSettings: {
        site_name: settings.site_name,
        site_tagline: settings.site_tagline,
        site_favicon: settings.site_favicon,
        site_logo: settings.site_logo,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
