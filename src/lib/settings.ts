// lib/settings.ts
// Server-side Settings Utilities with Caching

import { prisma } from '@/lib/prisma';
import { unstable_cache, revalidateTag } from 'next/cache';

// In-memory cache
let settingsCache: Record<string, any> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all settings as an object (with caching)
 * ใช้ใน Server Components, API Routes, Server Actions
 */
export const getSettings = unstable_cache(
  async (): Promise<Record<string, any>> => {
    const now = Date.now();
    
    // Return cached data if still valid
    if (settingsCache && (now - cacheTimestamp) < CACHE_TTL) {
      return settingsCache;
    }

    // Fetch from database
    const settings = await prisma.siteSetting.findMany({
      select: {
        key: true,
        value: true,
        dataType: true
      }
    });

    // Convert to object with proper type conversion
    const settingsObj = settings.reduce((acc: Record<string, any>, setting: any) => {
      let value: any = setting.value;

      // Type conversion based on dataType
      if (setting.dataType === 'json') {
        try {
          value = JSON.parse(setting.value);
        } catch {
          value = setting.value;
        }
      } else if (setting.dataType === 'boolean') {
        value = setting.value === 'true';
      } else if (setting.dataType === 'number') {
        value = parseFloat(setting.value);
      }

      acc[setting.key] = value;
      return acc;
    }, {} as Record<string, any>);

    // Update cache
    settingsCache = settingsObj;
    cacheTimestamp = now;

    return settingsObj;
  },
  ['site-settings'],
  {
    revalidate: 300, // 5 minutes
    tags: ['settings']
  }
);

/**
 * Get a single setting value (with caching)
 */
export async function getSetting(key: string, defaultValue: any = null): Promise<any> {
  const settings = await getSettings();
  return settings[key] ?? defaultValue;
}

/**
 * Clear settings cache (call this after updating settings)
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = 0;
  // Revalidate Next.js cache
  revalidateTag('settings');
}

/**
 * Get metadata for SEO (title, description, etc.)
 */
export async function getSiteMetadata() {
  const settings = await getSettings();

  return {
    title: settings.seo_title || settings.site_name || 'Zablink',
    description: settings.seo_description || settings.site_tagline || 'แพลตฟอร์มเชื่อมต่อร้านอาหารและนักรีวิว',
    keywords: settings.seo_keywords || '',
    openGraph: {
      title: settings.og_title || settings.seo_title || settings.site_name,
      description: settings.og_description || settings.seo_description,
      images: settings.og_image ? [settings.og_image] : [],
      type: settings.og_type || 'website',
    },
    twitter: {
      card: settings.twitter_card || 'summary_large_image',
      site: settings.twitter_site || '',
    },
    icons: {
      icon: settings.site_favicon || '/favicon.ico',
      apple: settings.site_icon_192 || '/apple-touch-icon.png',
    },
    robots: settings.robots_meta || 'index, follow',
  };
}
