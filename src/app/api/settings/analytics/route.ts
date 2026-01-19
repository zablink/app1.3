// src/app/api/settings/analytics/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: {
        category: 'analytics',
        key: {
          in: ['google_analytics_id', 'google_tag_manager_id']
        }
      },
      select: {
        key: true,
        value: true
      }
    });

    const result = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching analytics settings:', error);
    return NextResponse.json(
      { google_analytics_id: '', google_tag_manager_id: '' },
      { status: 200 } // Return empty values instead of error
    );
  }
}

// Update analytics settings (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { google_analytics_id, google_tag_manager_id } = body;

    const updates = [];

    if (google_analytics_id !== undefined) {
      updates.push(
        prisma.siteSetting.upsert({
          where: { key: 'google_analytics_id' },
          create: {
            key: 'google_analytics_id',
            value: google_analytics_id,
            category: 'analytics',
            dataType: 'string',
            label: 'Google Analytics Tracking ID',
            description: 'Google Analytics Measurement ID (G-XXXXXXXXXX)'
          },
          update: {
            value: google_analytics_id,
            updatedAt: new Date()
          }
        })
      );
    }

    if (google_tag_manager_id !== undefined) {
      updates.push(
        prisma.siteSetting.upsert({
          where: { key: 'google_tag_manager_id' },
          create: {
            key: 'google_tag_manager_id',
            value: google_tag_manager_id,
            category: 'analytics',
            dataType: 'string',
            label: 'Google Tag Manager ID',
            description: 'Google Tag Manager Container ID (GTM-XXXXXXX)'
          },
          update: {
            value: google_tag_manager_id,
            updatedAt: new Date()
          }
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating analytics settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
