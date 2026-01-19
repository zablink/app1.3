// Custom Hook for Analytics Tracking
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Generate or get session ID from localStorage
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Get browser name
const getBrowser = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Trident')) return 'IE';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'unknown';
};

// Get OS name
const getOS = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('X11') || ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'unknown';
};

interface AnalyticsOptions {
  trackPageViews?: boolean;
  trackSessions?: boolean;
}

export function useAnalytics(options: AnalyticsOptions = {}) {
  const { trackPageViews = true, trackSessions = true } = options;
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sessionId] = useState(getSessionId);
  const pageStartTime = useRef<number>(Date.now());
  const isInitialized = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    if (!trackSessions || isInitialized.current) return;

    const initSession = async () => {
      try {
        // Get URL params for UTM tracking
        const params = new URLSearchParams(window.location.search);
        const utmSource = params.get('utm_source');
        const utmMedium = params.get('utm_medium');
        const utmCampaign = params.get('utm_campaign');

        await fetch('/api/analytics/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: session?.user?.id || null,
            deviceType: getDeviceType(),
            browser: getBrowser(),
            os: getOS(),
            utmSource,
            utmMedium,
            utmCampaign,
          }),
        });

        isInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize analytics session:', error);
      }
    };

    initSession();
  }, [sessionId, session?.user?.id, trackSessions]);

  // Track page views
  useEffect(() => {
    if (!trackPageViews) return;

    const trackPageView = async () => {
      try {
        pageStartTime.current = Date.now();

        await fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: session?.user?.id || null,
            pagePath: pathname,
            pageTitle: document.title,
            referrer: document.referrer || null,
            userAgent: navigator.userAgent,
            deviceType: getDeviceType(),
            browser: getBrowser(),
            os: getOS(),
          }),
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    };

    trackPageView();

    // Track page duration on unmount
    return () => {
      const duration = Math.round((Date.now() - pageStartTime.current) / 1000);
      if (duration > 0) {
        fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: session?.user?.id || null,
            pagePath: pathname,
            pageTitle: document.title,
            duration,
            deviceType: getDeviceType(),
          }),
        }).catch(console.error);
      }
    };
  }, [pathname, sessionId, session?.user?.id, trackPageViews]);

  // Track shop view
  const trackShopView = useCallback(
    async (shopId: string, sourceType?: string, sourceId?: string) => {
      try {
        await fetch('/api/analytics/shop-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: session?.user?.id || null,
            shopId,
            sourceType: sourceType || null,
            sourceId: sourceId || null,
            userAgent: navigator.userAgent,
            deviceType: getDeviceType(),
          }),
        });
      } catch (error) {
        console.error('Failed to track shop view:', error);
      }
    },
    [sessionId, session?.user?.id]
  );

  // Track custom event
  const trackEvent = useCallback(
    async (eventType: string, eventData?: any, shopId?: string) => {
      try {
        await fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userId: session?.user?.id || null,
            eventType,
            eventData: eventData || null,
            shopId: shopId || null,
          }),
        });
      } catch (error) {
        console.error('Failed to track event:', error);
      }
    },
    [sessionId, session?.user?.id]
  );

  return {
    sessionId,
    trackShopView,
    trackEvent,
  };
}
