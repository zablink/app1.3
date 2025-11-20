-- Migration: Add default site settings
-- Created: 2024-11-20

-- Insert default settings for each category

-- ============================================
-- BRANDING (แบรนด์)
-- ============================================

INSERT INTO site_settings (key, value, category, data_type, label, description, created_at, updated_at)
VALUES 
  -- Site Identity
  ('site_name', 'Zablink', 'branding', 'string', 'ชื่อเว็บไซต์', 'ชื่อเว็บไซต์ที่แสดงในหัวข้อและโลโก้', NOW(), NOW()),
  ('site_tagline', 'ค้นหาร้านอาหารและรีวิวที่ดีที่สุด', 'branding', 'string', 'คำขวัญ (Tagline)', 'คำอธิบายสั้นๆ เกี่ยวกับเว็บไซต์', NOW(), NOW()),
  
  -- Logos & Icons
  ('site_logo', '/images/logo.png', 'branding', 'image', 'โลโก้หลัก', 'โลโก้ที่แสดงใน navbar และ footer', NOW(), NOW()),
  ('site_logo_dark', '/images/logo-dark.png', 'branding', 'image', 'โลโก้ (โหมดมืด)', 'โลโก้สำหรับ dark mode', NOW(), NOW()),
  ('site_favicon', '/favicon.ico', 'branding', 'image', 'Favicon', 'ไอคอนที่แสดงในแท็บเบราว์เซอร์', NOW(), NOW()),
  ('site_icon_192', '/images/icon-192.png', 'branding', 'image', 'App Icon 192x192', 'ไอคอนสำหรับ PWA และ mobile', NOW(), NOW()),
  ('site_icon_512', '/images/icon-512.png', 'branding', 'image', 'App Icon 512x512', 'ไอคอนขนาดใหญ่สำหรับ PWA', NOW(), NOW()),
  
  -- Brand Colors
  ('brand_primary_color', '#ea580c', 'branding', 'color', 'สีหลัก (Primary)', 'สีหลักของแบรนด์ (Orange)', NOW(), NOW()),
  ('brand_secondary_color', '#dc2626', 'branding', 'color', 'สีรอง (Secondary)', 'สีรองของแบรนด์ (Red)', NOW(), NOW()),
  ('brand_accent_color', '#f97316', 'branding', 'color', 'สีเน้น (Accent)', 'สีเน้นสำหรับปุ่มและไฮไลท์', NOW(), NOW()),
  
  -- Social Media
  ('social_facebook', 'https://facebook.com/zablink', 'branding', 'string', 'Facebook URL', 'ลิงก์ Facebook Page', NOW(), NOW()),
  ('social_instagram', 'https://instagram.com/zablink', 'branding', 'string', 'Instagram URL', 'ลิงก์ Instagram', NOW(), NOW()),
  ('social_twitter', 'https://twitter.com/zablink', 'branding', 'string', 'Twitter/X URL', 'ลิงก์ Twitter/X', NOW(), NOW()),
  ('social_line', '', 'branding', 'string', 'LINE ID', 'LINE Official Account ID', NOW(), NOW()),
  ('social_tiktok', '', 'branding', 'string', 'TikTok URL', 'ลิงก์ TikTok', NOW(), NOW())

ON CONFLICT (key) DO UPDATE 
SET updated_at = NOW();

-- ============================================
-- SEO
-- ============================================

INSERT INTO site_settings (key, value, category, data_type, label, description, created_at, updated_at)
VALUES 
  -- Meta Tags
  ('seo_title', 'Zablink - ค้นหาร้านอาหารและรีวิวที่ดีที่สุด', 'seo', 'string', 'SEO Title', 'หัวข้อหลักสำหรับ search engines (50-60 ตัวอักษร)', NOW(), NOW()),
  ('seo_description', 'แพลตฟอร์มค้นหาร้านอาหาร รีวิว และแคมเปญโปรโมชั่น พบร้านอาหารที่ดีที่สุดใกล้คุณ', 'seo', 'string', 'SEO Description', 'คำอธิบายสำหรับ search results (150-160 ตัวอักษร)', NOW(), NOW()),
  ('seo_keywords', 'ร้านอาหาร, รีวิวร้านอาหาร, โปรโมชั่น, แคมเปญ, influencer, creator', 'seo', 'string', 'Keywords', 'คำสำคัญสำหรับ SEO (คั่นด้วย comma)', NOW(), NOW()),
  
  -- Open Graph (Facebook, LINE, etc.)
  ('og_title', 'Zablink - ค้นหาร้านอาหารและรีวิวที่ดีที่สุด', 'seo', 'string', 'OG Title', 'หัวข้อสำหรับ social media sharing', NOW(), NOW()),
  ('og_description', 'แพลตฟอร์มค้นหาร้านอาหาร รีวิว และแคมเปญโปรโมชั่น', 'seo', 'string', 'OG Description', 'คำอธิบายสำหรับ social sharing', NOW(), NOW()),
  ('og_image', '/images/og-image.jpg', 'seo', 'image', 'OG Image', 'รูปภาพสำหรับ social sharing (1200x630px)', NOW(), NOW()),
  ('og_type', 'website', 'seo', 'string', 'OG Type', 'ประเภทเว็บไซต์ (website, article, etc.)', NOW(), NOW()),
  
  -- Twitter Card
  ('twitter_card', 'summary_large_image', 'seo', 'string', 'Twitter Card Type', 'ประเภท Twitter Card', NOW(), NOW()),
  ('twitter_site', '@zablink', 'seo', 'string', 'Twitter @username', 'Twitter username ของเว็บไซต์', NOW(), NOW()),
  
  -- Schema.org
  ('schema_type', 'LocalBusiness', 'seo', 'string', 'Schema Type', 'ประเภท Schema.org (LocalBusiness, Restaurant)', NOW(), NOW()),
  ('schema_org_data', '{"@context":"https://schema.org","@type":"LocalBusiness","name":"Zablink"}', 'seo', 'json', 'Schema.org JSON-LD', 'ข้อมูล structured data สำหรับ Google', NOW(), NOW()),
  
  -- Indexing
  ('robots_meta', 'index, follow', 'seo', 'string', 'Robots Meta Tag', 'คำสั่งสำหรับ search engine crawlers', NOW(), NOW()),
  ('canonical_url', 'https://zablink.com', 'seo', 'string', 'Canonical URL', 'URL หลักของเว็บไซต์', NOW(), NOW())

ON CONFLICT (key) DO UPDATE 
SET updated_at = NOW();

-- ============================================
-- SITE (การตั้งค่าเว็บไซต์)
-- ============================================

INSERT INTO site_settings (key, value, category, data_type, label, description, created_at, updated_at)
VALUES 
  -- Contact Information
  ('contact_email', 'contact@zablink.com', 'site', 'string', 'อีเมลติดต่อ', 'อีเมลสำหรับติดต่อ support', NOW(), NOW()),
  ('contact_phone', '02-xxx-xxxx', 'site', 'string', 'เบอร์โทรศัพท์', 'เบอร์โทรติดต่อ', NOW(), NOW()),
  ('contact_address', 'กรุงเทพมหานคร ประเทศไทย', 'site', 'string', 'ที่อยู่', 'ที่อยู่บริษัท/สำนักงาน', NOW(), NOW()),
  ('support_hours', 'จันทร์-ศุกร์ 9:00-18:00', 'site', 'string', 'เวลาทำการ', 'เวลาให้บริการ support', NOW(), NOW()),
  
  -- Timezone & Locale
  ('site_timezone', 'Asia/Bangkok', 'site', 'string', 'Timezone', 'เขตเวลาของเว็บไซต์', NOW(), NOW()),
  ('site_locale', 'th-TH', 'site', 'string', 'Locale', 'ภาษาและรูปแบบการแสดงผล', NOW(), NOW()),
  ('site_currency', 'THB', 'site', 'string', 'สกุลเงิน', 'สกุลเงินที่ใช้ในระบบ', NOW(), NOW()),
  
  -- Legal Pages
  ('privacy_policy_url', '/privacy', 'site', 'string', 'Privacy Policy URL', 'ลิงก์นโยบายความเป็นส่วนตัว', NOW(), NOW()),
  ('terms_of_service_url', '/terms', 'site', 'string', 'Terms of Service URL', 'ลิงก์เงื่อนไขการใช้งาน', NOW(), NOW()),
  ('cookie_policy_url', '/cookies', 'site', 'string', 'Cookie Policy URL', 'ลิงก์นโยบายคุกกี้', NOW(), NOW()),
  
  -- Footer
  ('footer_copyright', '© 2024 Zablink. All rights reserved.', 'site', 'string', 'Copyright Text', 'ข้อความ copyright ใน footer', NOW(), NOW()),
  ('footer_description', 'แพลตฟอร์มค้นหาร้านอาหารและรีวิวที่ดีที่สุด เชื่อมต่อร้านอาหาร influencer และลูกค้า', 'site', 'string', 'Footer Description', 'คำอธิบายใน footer', NOW(), NOW()),
  
  -- Maintenance
  ('maintenance_mode', 'false', 'site', 'boolean', 'โหมดปิดปรับปรุง', 'เปิดใช้งานหน้า maintenance', NOW(), NOW()),
  ('maintenance_message', 'ระบบอยู่ระหว่างปรับปรุง กรุณากลับมาใหม่ในภายหลัง', 'site', 'string', 'ข้อความ Maintenance', 'ข้อความแสดงเมื่อเปิด maintenance mode', NOW(), NOW()),
  ('maintenance_end_time', '', 'site', 'string', 'เวลาเปิดใช้งานใหม่', 'เวลาที่คาดว่าจะเปิดระบบ', NOW(), NOW())

ON CONFLICT (key) DO UPDATE 
SET updated_at = NOW();

-- ============================================
-- FEATURES (ฟีเจอร์)
-- ============================================

INSERT INTO site_settings (key, value, category, data_type, label, description, created_at, updated_at)
VALUES 
  -- User Features
  ('enable_user_registration', 'true', 'features', 'boolean', 'เปิดการสมัครสมาชิก', 'อนุญาตให้ผู้ใช้สมัครสมาชิกใหม่', NOW(), NOW()),
  ('enable_social_login', 'true', 'features', 'boolean', 'เปิด Social Login', 'อนุญาต login ด้วย Google, Facebook, etc.', NOW(), NOW()),
  ('enable_email_verification', 'true', 'features', 'boolean', 'ยืนยันอีเมล', 'ต้องยืนยันอีเมลก่อนใช้งาน', NOW(), NOW()),
  
  -- Review & Rating
  ('enable_reviews', 'true', 'features', 'boolean', 'เปิดรีวิว', 'อนุญาตให้ผู้ใช้เขียนรีวิว', NOW(), NOW()),
  ('enable_ratings', 'true', 'features', 'boolean', 'เปิดให้คะแนน', 'อนุญาตให้ผู้ใช้ให้คะแนนร้านอาหาร', NOW(), NOW()),
  ('min_review_length', '10', 'features', 'string', 'ความยาวรีวิวขั้นต่ำ', 'จำนวนตัวอักษรขั้นต่ำของรีวิว', NOW(), NOW()),
  ('max_review_length', '2000', 'features', 'string', 'ความยาวรีวิวสูงสุด', 'จำนวนตัวอักษรสูงสุดของรีวิว', NOW(), NOW()),
  ('review_moderation', 'false', 'features', 'boolean', 'ตรวจสอบรีวิว', 'รีวิวต้องได้รับการอนุมัติก่อนแสดง', NOW(), NOW()),
  
  -- Bookmarks & Favorites
  ('enable_bookmarks', 'true', 'features', 'boolean', 'เปิด Bookmarks', 'อนุญาตให้ผู้ใช้บันทึกร้านโปรด', NOW(), NOW()),
  ('enable_favorites', 'true', 'features', 'boolean', 'เปิด Favorites', 'อนุญาตให้ผู้ใช้ชอบร้านอาหาร', NOW(), NOW()),
  
  -- Search & Discovery
  ('enable_location_search', 'true', 'features', 'boolean', 'ค้นหาตามตำแหน่ง', 'เปิดใช้งานการค้นหาด้วย GPS', NOW(), NOW()),
  ('enable_advanced_filters', 'true', 'features', 'boolean', 'ฟิลเตอร์ขั้นสูง', 'เปิดใช้งานตัวกรองขั้นสูง', NOW(), NOW()),
  ('search_radius_km', '10', 'features', 'string', 'รัศมีการค้นหา (km)', 'รัศมีการค้นหาร้านอาหารรอบๆ (กิโลเมตร)', NOW(), NOW()),
  
  -- Campaign System
  ('enable_campaigns', 'true', 'features', 'boolean', 'เปิดระบบแคมเปญ', 'อนุญาตให้ร้านค้าสร้างแคมเปญ', NOW(), NOW()),
  ('enable_campaign_approval', 'true', 'features', 'boolean', 'อนุมัติแคมเปญ', 'แคมเปญต้องได้รับการอนุมัติจาก admin', NOW(), NOW()),
  ('max_campaigns_per_shop', '5', 'features', 'string', 'แคมเปญสูงสุดต่อร้าน', 'จำนวนแคมเปญที่ร้านสามารถสร้างได้พร้อมกัน', NOW(), NOW()),
  
  -- Creator/Influencer Features
  ('enable_creator_program', 'true', 'features', 'boolean', 'โปรแกรม Creator', 'เปิดใช้งานระบบ creator/influencer', NOW(), NOW()),
  ('min_followers_creator', '1000', 'features', 'string', 'Followers ขั้นต่ำ (Creator)', 'จำนวน followers ขั้นต่ำเพื่อสมัคร creator', NOW(), NOW()),
  ('creator_commission_rate', '10', 'features', 'string', 'ค่าคอมมิชชั่น Creator (%)', 'เปอร์เซ็นต์ค่าคอมมิชชั่นสำหรับ creator', NOW(), NOW()),
  
  -- Notifications
  ('enable_push_notifications', 'true', 'features', 'boolean', 'Push Notifications', 'เปิดการแจ้งเตือนแบบ push', NOW(), NOW()),
  ('enable_email_notifications', 'true', 'features', 'boolean', 'Email Notifications', 'ส่งการแจ้งเตือนทาง email', NOW(), NOW()),
  ('enable_sms_notifications', 'false', 'features', 'boolean', 'SMS Notifications', 'ส่งการแจ้งเตือนทาง SMS', NOW(), NOW()),
  
  -- Payment & Subscriptions
  ('enable_subscriptions', 'true', 'features', 'boolean', 'ระบบ Subscription', 'เปิดใช้งานระบบสมาชิกแบบเสียเงิน', NOW(), NOW()),
  ('enable_payments', 'true', 'features', 'boolean', 'ระบบชำระเงิน', 'เปิดใช้งานการชำระเงินออนไลน์', NOW(), NOW()),
  ('payment_gateway', 'omise', 'features', 'string', 'Payment Gateway', 'ระบบชำระเงิน (omise, stripe, promptpay)', NOW(), NOW()),
  
  -- Content Moderation
  ('enable_content_moderation', 'true', 'features', 'boolean', 'ตรวจสอบเนื้อหา', 'เปิดระบบตรวจสอบเนื้อหาอัตโนมัติ', NOW(), NOW()),
  ('enable_spam_filter', 'true', 'features', 'boolean', 'กรอง Spam', 'เปิดการกรองข้อความ spam', NOW(), NOW()),
  ('enable_profanity_filter', 'true', 'features', 'boolean', 'กรองคำหยาบ', 'เปิดการกรองคำหยาบคาย', NOW(), NOW()),
  
  -- Analytics & Tracking
  ('enable_analytics', 'true', 'features', 'boolean', 'Google Analytics', 'เปิดใช้งาน Google Analytics', NOW(), NOW()),
  ('google_analytics_id', '', 'features', 'string', 'GA Tracking ID', 'Google Analytics Tracking ID (GA4)', NOW(), NOW()),
  ('enable_facebook_pixel', 'false', 'features', 'boolean', 'Facebook Pixel', 'เปิดใช้งาน Facebook Pixel', NOW(), NOW()),
  ('facebook_pixel_id', '', 'features', 'string', 'Facebook Pixel ID', 'Facebook Pixel ID', NOW(), NOW()),
  
  -- API & Integrations
  ('enable_api', 'true', 'features', 'boolean', 'Public API', 'เปิดใช้งาน public API', NOW(), NOW()),
  ('api_rate_limit', '100', 'features', 'string', 'API Rate Limit', 'จำนวน requests ต่อชั่วโมง', NOW(), NOW()),
  
  -- Performance
  ('enable_image_optimization', 'true', 'features', 'boolean', 'ปรับรูปภาพอัตโนมัติ', 'บีบอัดและปรับขนาดรูปภาพ', NOW(), NOW()),
  ('enable_caching', 'true', 'features', 'boolean', 'เปิด Cache', 'เปิดใช้งานระบบ cache', NOW(), NOW()),
  ('cache_duration_minutes', '60', 'features', 'string', 'ระยะเวลา Cache (นาที)', 'ระยะเวลาเก็บ cache', NOW(), NOW())

ON CONFLICT (key) DO UPDATE 
SET updated_at = NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
