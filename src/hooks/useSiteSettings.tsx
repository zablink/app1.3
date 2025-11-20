// hooks/useSiteSettings.tsx

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================
// Types
// ============================================

interface SiteSettings {
  // Branding
  site_name: string;
  site_tagline: string;
  site_logo: string;
  site_logo_dark: string;
  site_favicon: string;
  site_icon_192: string;
  site_icon_512: string;
  
  // Colors
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_accent_color: string;
  
  // Social
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_line: string;
  social_tiktok: string;
  
  // SEO
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_type: string;
  twitter_card: string;
  twitter_site: string;
  schema_type: string;
  robots_meta: string;
  canonical_url: string;
  
  // Contact
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  support_hours: string;
  
  // Site Config
  site_timezone: string;
  site_locale: string;
  site_currency: string;
  privacy_policy_url: string;
  terms_of_service_url: string;
  cookie_policy_url: string;
  footer_copyright: string;
  footer_description: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  
  // Features
  enable_user_registration: boolean;
  enable_social_login: boolean;
  enable_email_verification: boolean;
  enable_reviews: boolean;
  enable_ratings: boolean;
  enable_bookmarks: boolean;
  enable_campaigns: boolean;
  enable_creator_program: boolean;
  enable_subscriptions: boolean;
  enable_payments: boolean;
  enable_analytics: boolean;
  
  // Other dynamic keys
  [key: string]: any;
}

interface SiteSettingsContextType {
  settings: Partial<SiteSettings>;
  loading: boolean;
  reload: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: {},
  loading: true,
  reload: async () => {}
});

// ============================================
// Provider Component
// ============================================

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      // เรียก Public API (ไม่ต้อง auth)
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data.success) {
        // แปลงจาก Array เป็น Object
        const settingsObj = data.settings.reduce((acc: any, setting: any) => {
          // Parse JSON values
          if (setting.dataType === 'json') {
            try {
              acc[setting.key] = JSON.parse(setting.value);
            } catch {
              acc[setting.key] = setting.value;
            }
          } else if (setting.dataType === 'boolean') {
            acc[setting.key] = setting.value === 'true';
          } else {
            acc[setting.key] = setting.value;
          }
          return acc;
        }, {});
        
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const reload = async () => {
    setLoading(true);
    await loadSettings();
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, reload }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  
  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }
  
  return context;
}

// ============================================
// Helper Hooks
// ============================================

/**
 * ดึงสีจาก Settings และสร้าง CSS Variables
 */
export function useThemeColors() {
  const { settings } = useSiteSettings();
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    // Set CSS Variables
    if (settings.brand_primary_color) {
      root.style.setProperty('--color-primary', settings.brand_primary_color);
    }
    if (settings.brand_secondary_color) {
      root.style.setProperty('--color-secondary', settings.brand_secondary_color);
    }
    if (settings.brand_accent_color) {
      root.style.setProperty('--color-accent', settings.brand_accent_color);
    }
  }, [settings]);
  
  return settings;
}

/**
 * ตรวจสอบว่าเว็บไซต์อยู่ใน Maintenance Mode หรือไม่
 */
export function useMaintenanceMode() {
  const { settings } = useSiteSettings();
  
  return {
    isMaintenanceMode: settings.maintenance_mode === true,
    message: settings.maintenance_message || 'เว็บไซต์กำลังปรับปรุง'
  };
}

/**
 * ตรวจสอบว่าฟีเจอร์เปิดอยู่หรือไม่
 */
export function useFeatureFlag(featureName: keyof SiteSettings) {
  const { settings } = useSiteSettings();
  return settings[featureName] === true;
}
