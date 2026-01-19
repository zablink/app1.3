// src/hooks/useAdBanner.ts
'use client';

import { useEffect, useState, useCallback } from 'react';

export interface AdBanner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
  targetArea: {
    type: string | null;
    id: number | null;
  };
  stats: {
    views: number;
    clicks: number;
    ctr: number;
  };
}

interface UseAdBannerOptions {
  placement: string;
  tambonId?: number | null;
  amphureId?: number | null;
  provinceId?: number | null;
  limit?: number;
  autoTrackView?: boolean; // อัตโนมัติบันทึก view เมื่อโหลดเสร็จ
}

/**
 * React Hook สำหรับดึงและติดตามโฆษณา
 * 
 * @example
 * ```tsx
 * const { banners, loading, trackView, trackClick } = useAdBanner({
 *   placement: 'hero',
 *   tambonId: 123,
 *   autoTrackView: true
 * });
 * ```
 */
export function useAdBanner(options: UseAdBannerOptions) {
  const {
    placement,
    tambonId,
    amphureId,
    provinceId,
    limit = 5,
    autoTrackView = true
  } = options;

  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Session ID สำหรับ anonymous users
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('ad_session_id');
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('ad_session_id', sid);
      }
      return sid;
    }
    return null;
  });

  // Fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          placement,
          limit: limit.toString()
        });
        
        if (tambonId) params.append('tambon_id', tambonId.toString());
        if (amphureId) params.append('amphure_id', amphureId.toString());
        if (provinceId) params.append('province_id', provinceId.toString());

        const response = await fetch(`/api/ads/banners?${params}`);
        const data = await response.json();

        if (data.success) {
          setBanners(data.banners);
          
          // Auto-track views
          if (autoTrackView && data.banners.length > 0) {
            data.banners.forEach((banner: AdBanner) => {
              trackView(banner.id, false); // silent = true (ไม่ต้องรอ response)
            });
          }
        } else {
          setError('Failed to load banners');
        }
      } catch (err) {
        setError('Failed to load banners');
        console.error('[useAdBanner] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [placement, tambonId, amphureId, provinceId, limit, autoTrackView]);

  // Track view
  const trackView = useCallback(async (bannerId: string, silent = true) => {
    try {
      const response = await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bannerId,
          eventType: 'view',
          sessionId,
          tambonId,
          amphureId,
          provinceId,
          page: typeof window !== 'undefined' ? window.location.pathname : null
        })
      });

      if (!silent && !response.ok) {
        console.error('[useAdBanner] Failed to track view');
      }
    } catch (err) {
      if (!silent) {
        console.error('[useAdBanner] Track view error:', err);
      }
    }
  }, [sessionId, tambonId, amphureId, provinceId]);

  // Track click
  const trackClick = useCallback(async (bannerId: string) => {
    try {
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bannerId,
          eventType: 'click',
          sessionId,
          tambonId,
          amphureId,
          provinceId,
          page: typeof window !== 'undefined' ? window.location.pathname : null
        })
      });
    } catch (err) {
      console.error('[useAdBanner] Track click error:', err);
    }
  }, [sessionId, tambonId, amphureId, provinceId]);

  return {
    banners,
    loading,
    error,
    trackView,
    trackClick
  };
}
