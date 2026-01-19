-- Migration: สร้างระบบโฆษณาใหม่
-- File: prisma/migrations/XXXXXX_create_ad_system/migration.sql

-- 1. สร้างตาราง ad_banners
CREATE TABLE ad_banners (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- ข้อมูลพื้นฐาน
  title           TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT NOT NULL,
  link_url        TEXT,
  
  -- Placement
  placement       TEXT NOT NULL DEFAULT 'hero',
  
  -- Location Targeting
  target_area_type TEXT,  -- 'nationwide' | 'province' | 'amphure' | 'tambon'
  target_area_id   INTEGER,
  
  -- Priority & Scheduling
  priority        INTEGER NOT NULL DEFAULT 0,
  start_date      TIMESTAMP WITH TIME ZONE,
  end_date        TIMESTAMP WITH TIME ZONE,
  
  -- Status & Performance
  is_active       BOOLEAN NOT NULL DEFAULT true,
  view_count      INTEGER NOT NULL DEFAULT 0,
  click_count     INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  created_by      TEXT,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. สร้างตาราง ad_impressions
CREATE TABLE ad_impressions (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  banner_id   TEXT NOT NULL,
  
  -- User Info
  user_id     TEXT,
  session_id  TEXT,
  tambon_id   INTEGER,
  amphure_id  INTEGER,
  province_id INTEGER,
  
  -- Event Info
  event_type  TEXT NOT NULL DEFAULT 'view',  -- 'view' | 'click'
  page        TEXT,
  user_agent  TEXT,
  ip_address  TEXT,
  
  -- Timestamp
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. สร้าง Indexes สำหรับ ad_banners
CREATE INDEX idx_ad_banners_placement_active ON ad_banners(placement, is_active);
CREATE INDEX idx_ad_banners_target_area ON ad_banners(target_area_type, target_area_id);
CREATE INDEX idx_ad_banners_priority ON ad_banners(priority DESC);
CREATE INDEX idx_ad_banners_schedule ON ad_banners(start_date, end_date);
CREATE INDEX idx_ad_banners_active ON ad_banners(is_active) WHERE is_active = true;

-- 4. สร้าง Indexes สำหรับ ad_impressions
CREATE INDEX idx_ad_impressions_banner_event ON ad_impressions(banner_id, event_type);
CREATE INDEX idx_ad_impressions_created_at ON ad_impressions(created_at);
CREATE INDEX idx_ad_impressions_tambon ON ad_impressions(tambon_id);
CREATE INDEX idx_ad_impressions_session ON ad_impressions(session_id);

-- 5. Foreign Key Constraints (optional - เพื่อความสมบูรณ์)
-- Note: ถ้าต้องการ strict referential integrity ให้เปิดใช้
-- ALTER TABLE ad_impressions 
-- ADD CONSTRAINT fk_ad_impressions_banner 
-- FOREIGN KEY (banner_id) REFERENCES ad_banners(id) ON DELETE CASCADE;

-- 6. สร้าง Function สำหรับ auto-update updated_at
CREATE OR REPLACE FUNCTION update_ad_banner_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ad_banner_updated_at
BEFORE UPDATE ON ad_banners
FOR EACH ROW
EXECUTE FUNCTION update_ad_banner_updated_at();

-- 7. สร้าง View สำหรับ Analytics (optional)
CREATE OR REPLACE VIEW ad_performance AS
SELECT 
  ab.id,
  ab.title,
  ab.placement,
  ab.target_area_type,
  ab.target_area_id,
  ab.view_count,
  ab.click_count,
  CASE 
    WHEN ab.view_count > 0 
    THEN ROUND((ab.click_count::NUMERIC / ab.view_count::NUMERIC) * 100, 2)
    ELSE 0 
  END as ctr,
  COUNT(DISTINCT ai.user_id) FILTER (WHERE ai.user_id IS NOT NULL) as unique_users,
  COUNT(DISTINCT ai.session_id) FILTER (WHERE ai.session_id IS NOT NULL) as unique_sessions,
  ab.is_active,
  ab.created_at
FROM ad_banners ab
LEFT JOIN ad_impressions ai ON ai.banner_id = ab.id
GROUP BY ab.id, ab.title, ab.placement, ab.target_area_type, ab.target_area_id, 
         ab.view_count, ab.click_count, ab.is_active, ab.created_at;

-- 8. สร้างข้อมูลตัวอย่าง (optional - สำหรับทดสอบ)
-- INSERT INTO ad_banners (title, description, image_url, link_url, placement, target_area_type, priority) VALUES
-- ('โปรโมชั่นพิเศษ', 'ลดราคา 50% ทั่วประเทศ', 'https://example.com/banner1.jpg', 'https://example.com/promo', 'hero', 'nationwide', 10),
-- ('ร้านอาหารกรุงเทพฯ', 'ร้านอาหารในกรุงเทพฯ', 'https://example.com/banner2.jpg', 'https://example.com/bkk', 'sidebar', 'province', 8);

-- 9. Comments สำหรับเอกสาร
COMMENT ON TABLE ad_banners IS 'ตารางเก็บข้อมูลโฆษณา/แบนเนอร์ รองรับหลาย placement และ location-based targeting';
COMMENT ON TABLE ad_impressions IS 'ตารางบันทึกการแสดง (view) และการคลิก (click) โฆษณา สำหรับ analytics';

COMMENT ON COLUMN ad_banners.placement IS 'ตำแหน่งแสดงโฆษณา: hero, sidebar, category_top, etc.';
COMMENT ON COLUMN ad_banners.target_area_type IS 'ระดับพื้นที่เป้าหมาย: nationwide, province, amphure, tambon';
COMMENT ON COLUMN ad_banners.target_area_id IS 'ID ของพื้นที่เป้าหมาย (FK ไป th_provinces, th_districts, หรือ th_subdistricts)';
COMMENT ON COLUMN ad_banners.priority IS 'ค่าความสำคัญ (เลขสูงกว่า = แสดงก่อน)';
COMMENT ON COLUMN ad_banners.view_count IS 'จำนวนครั้งที่โฆษณาถูกแสดง';
COMMENT ON COLUMN ad_banners.click_count IS 'จำนวนครั้งที่โฆษณาถูกคลิก';

COMMENT ON COLUMN ad_impressions.event_type IS 'ประเภทของเหตุการณ์: view (แสดง) หรือ click (คลิก)';
COMMENT ON COLUMN ad_impressions.session_id IS 'Session ID สำหรับ anonymous users';
