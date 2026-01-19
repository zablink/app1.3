-- Migration: Add multiple favicon settings
-- Created: 2024-11-23
-- Description: Add favicon fields for different sizes and devices

-- เพิ่ม favicon settings สำหรับขนาดต่างๆ
INSERT INTO site_settings (key, value, category, data_type, label, description, created_at, updated_at)
VALUES
  -- Favicon พื้นฐาน
  ('site_favicon_16', '/favicon-16x16.png', 'branding', 'image', 'Favicon 16x16', 'ไอคอนสำหรับแท็บเบราว์เซอร์ (16x16 พิกเซล)', NOW(), NOW()),
  ('site_favicon_32', '/favicon-32x32.png', 'branding', 'image', 'Favicon 32x32', 'ไอคอนสำหรับแท็บเบราว์เซอร์ (32x32 พิกเซล)', NOW(), NOW()),
  
  -- Apple Touch Icon
  ('site_apple_touch_icon', '/apple-touch-icon.png', 'branding', 'image', 'Apple Touch Icon', 'ไอคอนสำหรับอุปกรณ์ Apple (180x180 พิกเซล)', NOW(), NOW()),
  
  -- PWA Icons
  ('site_icon_192', '/icon-192x192.png', 'branding', 'image', 'PWA Icon 192x192', 'ไอคอนสำหรับ Progressive Web App (192x192 พิกเซล)', NOW(), NOW()),
  ('site_icon_512', '/icon-512x512.png', 'branding', 'image', 'PWA Icon 512x512', 'ไอคอนสำหรับ Progressive Web App (512x512 พิกเซล)', NOW(), NOW()),
  
  -- Web App Manifest
  ('site_manifest_json', '/site.webmanifest', 'branding', 'string', 'Web App Manifest', 'URL ของไฟล์ manifest.json', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- เพิ่ม index ถ้ายังไม่มี
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_site_settings_branding'
  ) THEN
    CREATE INDEX idx_site_settings_branding ON site_settings(category) WHERE category = 'branding';
  END IF;
END $$;
