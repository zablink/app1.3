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
  logo_url: string;
  logo_dark_url: string;
  favicon_url: string;
  
  // Colors
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_primary: string;
  text_secondary: string;
  background_primary: string;
  background_secondary: string;
  
  // Homepage
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  cta_primary_text: string;
  cta_secondary_text: string;
  
  // Navigation
  nav_items: {
    items: Array<{ label: string; href: string }>;
  };
  
  // Footer
  footer_about: string;
  footer_copyright: string;
  social_facebook: string;
  social_instagram: string;
  social_line: string;
  contact_email: string;
  contact_phone: string;
  
  // SEO
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image_url: string;
  
  // Features
  enable_creator_signup: boolean;
  enable_shop_signup: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
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
    if (settings.primary_color) {
      root.style.setProperty('--color-primary', settings.primary_color);
    }
    if (settings.secondary_color) {
      root.style.setProperty('--color-secondary', settings.secondary_color);
    }
    if (settings.accent_color) {
      root.style.setProperty('--color-accent', settings.accent_color);
    }
    if (settings.text_primary) {
      root.style.setProperty('--color-text-primary', settings.text_primary);
    }
    if (settings.text_secondary) {
      root.style.setProperty('--color-text-secondary', settings.text_secondary);
    }
    if (settings.background_primary) {
      root.style.setProperty('--color-bg-primary', settings.background_primary);
    }
    if (settings.background_secondary) {
      root.style.setProperty('--color-bg-secondary', settings.background_secondary);
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
