-- Migration: Add Site Settings and Hero Banners
-- Created: 2025-11-19

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL,
  data_type TEXT DEFAULT 'string',
  label TEXT NOT NULL,
  description TEXT,
  updated_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create site_setting_history table
CREATE TABLE IF NOT EXISTS site_setting_history (
  id TEXT PRIMARY KEY,
  setting_key TEXT NOT NULL REFERENCES site_settings(key),
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create hero_banners table
CREATE TABLE IF NOT EXISTS hero_banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  cta_label TEXT,
  cta_link TEXT,
  image_url TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default site settings
INSERT INTO site_settings (id, key, value, category, data_type, label, description) VALUES
  -- Branding Settings
  ('st_001', 'site.name', 'Zablink', 'branding', 'string', 'ชื่อเว็บไซต์', 'ชื่อหลักของเว็บไซต์'),
  ('st_002', 'site.logo', '/logo.png', 'branding', 'image', 'โลโก้', 'โลโก้ของเว็บไซต์'),
  ('st_003', 'site.favicon', '/favicon.ico', 'branding', 'image', 'Favicon', 'ไอคอนที่แสดงบน browser tab'),
  ('st_004', 'site.primary_color', '#ea580c', 'branding', 'color', 'สีหลัก', 'สีหลักของธีม (Orange)'),
  
  -- SEO Settings
  ('st_005', 'seo.title', 'Zablink - ค้นหาร้านค้าและบริการในพื้นที่ของคุณ', 'seo', 'string', 'SEO Title', 'Title สำหรับ SEO'),
  ('st_006', 'seo.description', 'แพลตฟอร์มค้นหาร้านค้า ร้านอาหาร และบริการต่างๆ ในพื้นที่ใกล้คุณ พร้อมรีวิวและโปรโมชั่นพิเศษ', 'seo', 'string', 'SEO Description', 'คำอธิบายสำหรับ SEO'),
  ('st_007', 'seo.keywords', 'ร้านค้า, ร้านอาหาร, บริการ, รีวิว, โปรโมชั่น', 'seo', 'string', 'SEO Keywords', 'คำสำคัญสำหรับ SEO'),
  ('st_008', 'seo.og_image', '/og-image.jpg', 'seo', 'image', 'OG Image', 'รูปภาพสำหรับแชร์บน Social Media'),
  
  -- Site Settings
  ('st_009', 'site.contact_email', 'contact@zablink.com', 'site', 'string', 'อีเมลติดต่อ', 'อีเมลสำหรับติดต่อ'),
  ('st_010', 'site.contact_phone', '02-XXX-XXXX', 'site', 'string', 'เบอร์โทรติดต่อ', 'เบอร์โทรศัพท์สำหรับติดต่อ'),
  ('st_011', 'site.facebook_url', 'https://facebook.com/zablink', 'site', 'string', 'Facebook URL', 'ลิงก์ไปยังเพจ Facebook'),
  ('st_012', 'site.line_url', 'https://line.me/ti/p/@zablink', 'site', 'string', 'LINE URL', 'ลิงก์ไปยัง LINE Official'),
  
  -- Features
  ('st_013', 'features.enable_reviews', 'true', 'features', 'boolean', 'เปิดใช้งานรีวิว', 'เปิด/ปิด ระบบรีวิว'),
  ('st_014', 'features.enable_bookmarks', 'true', 'features', 'boolean', 'เปิดใช้งาน Bookmarks', 'เปิด/ปิด ระบบบุ๊กมาร์ก'),
  ('st_015', 'features.max_upload_size', '5', 'features', 'string', 'ขนาดไฟล์สูงสุด (MB)', 'ขนาดไฟล์สูงสุดที่อัปโหลดได้')
ON CONFLICT (key) DO NOTHING;

-- Insert default hero banners
INSERT INTO hero_banners (id, title, subtitle, cta_label, cta_link, image_url, priority, is_active) VALUES
  ('hb_001', 'ยินดีต้อนรับสู่ Zablink', 'ค้นหาร้านค้าและบริการที่คุณชื่นชอบได้ง่ายๆ ในพื้นที่ใกล้คุณ', 'เริ่มค้นหา', '/search', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=600&fit=crop', 100, true),
  ('hb_002', 'ค้นพบร้านอาหารใกล้คุณ', 'รีวิวจากผู้ใช้งานจริง พร้อมโปรโมชั่นพิเศษ', 'ดูร้านอาหาร', '/search?category=food', 90, true),
  ('hb_003', 'ลงทะเบียนร้านค้าของคุณ', 'เพิ่มโอกาสทางธุรกิจด้วยการลงทะเบียนร้านค้าฟรี', 'เริ่มต้นเลย', '/shop/register', 80, true)
ON CONFLICT (id) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_hero_banners_active ON hero_banners(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_hero_banners_dates ON hero_banners(start_date, end_date);
