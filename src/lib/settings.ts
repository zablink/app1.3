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
    try {
      // During build, return empty object to prevent build failures
      if (process.env.NEXT_PHASE === 'phase-production-build' && !process.env.DATABASE_URL) {
        console.warn('[settings] ⚠️ DATABASE_URL not set during build - returning empty settings');
        return {};
      }
      
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
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Return cached data if available, otherwise empty object
      return settingsCache || {};
    }
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
 * Helper function to add cache-busting query string to URLs
 */
function addCacheBuster(url: string): string {
  if (!url) return url;
  // If URL already has query params, append with &
  const separator = url.includes('?') ? '&' : '?';
  // Use timestamp of last update or current timestamp
  const timestamp = Date.now();
  return `${url}${separator}v=${timestamp}`;
}

/**
 * Get metadata for SEO (title, description, etc.)
 */
export async function getSiteMetadata() {
  try {
    const settings = await getSettings();

    // Get timestamp for cache-busting (use updatedAt if available, otherwise current time)
    const timestamp = Date.now();

    return {
      title: settings.seo_title || settings.site_name || 'Zablink',
      description: settings.seo_description || settings.site_tagline || 'แพลตฟอร์มเชื่อมต่อร้านอาหารและนักรีวิว',
      keywords: settings.seo_keywords || '',
      openGraph: {
        title: settings.og_title || settings.seo_title || settings.site_name,
        description: settings.og_description || settings.seo_description,
        images: settings.og_image ? [addCacheBuster(settings.og_image)] : [],
        type: settings.og_type || 'website',
      },
      twitter: {
        card: settings.twitter_card || 'summary_large_image',
        site: settings.twitter_site || '',
      },
      icons: {
        icon: [
          {
            url: addCacheBuster(settings.site_favicon_16 || settings.site_favicon || '/favicon-16x16.png'),
            sizes: '16x16',
            type: 'image/png',
          },
          {
            url: addCacheBuster(settings.site_favicon_32 || settings.site_favicon || '/favicon-32x32.png'),
            sizes: '32x32',
            type: 'image/png',
          },
        ],
        apple: addCacheBuster(settings.site_apple_touch_icon || '/apple-touch-icon.png'),
        other: [
          {
            rel: 'icon',
            url: addCacheBuster(settings.site_favicon || '/favicon.ico'),
          },
          {
            rel: 'icon',
            url: addCacheBuster(settings.site_icon_192 || '/icon-192x192.png'),
            sizes: '192x192',
            type: 'image/png',
          },
          {
            rel: 'icon',
            url: addCacheBuster(settings.site_icon_512 || '/icon-512x512.png'),
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      manifest: settings.site_manifest_json || '/site.webmanifest',
      robots: settings.robots_meta || 'index, follow',
    };
  } catch (error) {
    console.error('Error getting site metadata:', error);
    // Return default metadata if database fails
    return {
      title: 'Zablink',
      description: 'แพลตฟอร์มเชื่อมต่อร้านอาหารและนักรีวิว',
      keywords: '',
      openGraph: {
        title: 'Zablink',
        description: 'แพลตฟอร์มเชื่อมต่อร้านอาหารและนักรีวิว',
        images: [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        site: '',
      },
      icons: {
        icon: [
          {
            url: '/favicon-16x16.png',
            sizes: '16x16',
            type: 'image/png',
          },
          {
            url: '/favicon-32x32.png',
            sizes: '32x32',
            type: 'image/png',
          },
        ],
        apple: '/apple-touch-icon.png',
        other: [
          {
            rel: 'icon',
            url: '/favicon.ico',
          },
          {
            rel: 'icon',
            url: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            rel: 'icon',
            url: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      manifest: '/site.webmanifest',
      robots: 'index, follow',
    };
  }
}
