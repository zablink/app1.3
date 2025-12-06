-- Migration: สร้างระบบ Analytics & Stats
-- File: prisma/migrations/create_analytics_system.sql

-- ===================================
-- 1. ตาราง page_views - เก็บข้อมูลการเข้าชมหน้า
-- ===================================
CREATE TABLE page_views (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Page Info
  page_path       TEXT NOT NULL,
  page_title      TEXT,
  referrer        TEXT,
  
  -- User Info
  user_id         TEXT,
  session_id      TEXT NOT NULL,
  
  -- Location
  tambon_id       INTEGER,
  amphure_id      INTEGER,
  province_id     INTEGER,
  
  -- Device Info
  user_agent      TEXT,
  device_type     TEXT,  -- 'desktop' | 'mobile' | 'tablet'
  browser         TEXT,
  os              TEXT,
  
  -- Network
  ip_address      TEXT,
  country         TEXT DEFAULT 'TH',
  
  -- Timing
  duration_ms     INTEGER,  -- เวลาที่อยู่ในหน้า (milliseconds)
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ===================================
-- 2. ตาราง shop_views - เก็บข้อมูลการดูร้านค้า
-- ===================================
CREATE TABLE shop_views (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shop_id         TEXT NOT NULL,
  
  -- User Info
  user_id         TEXT,
  session_id      TEXT NOT NULL,
  
  -- Location
  tambon_id       INTEGER,
  amphure_id      INTEGER,
  province_id     INTEGER,
  
  -- Source
  referrer        TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  
  -- Device
  device_type     TEXT,
  
  -- Timing
  duration_ms     INTEGER,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ===================================
-- 3. ตาราง user_sessions - เก็บข้อมูล Session
-- ===================================
CREATE TABLE user_sessions (
  id              TEXT PRIMARY KEY,  -- session_id
  
  -- User
  user_id         TEXT,
  
  -- Location (เก็บตำแหน่งแรกที่เข้ามา)
  tambon_id       INTEGER,
  amphure_id      INTEGER,
  province_id     INTEGER,
  
  -- Entry Point
  landing_page    TEXT,
  referrer        TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  
  -- Device
  user_agent      TEXT,
  device_type     TEXT,
  browser         TEXT,
  os              TEXT,
  ip_address      TEXT,
  
  -- Metrics
  page_views      INTEGER DEFAULT 0,
  duration_ms     INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_active_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMP WITH TIME ZONE
);

-- ===================================
-- 4. ตาราง events - เก็บ Custom Events
-- ===================================
CREATE TABLE events (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Event Info
  event_name      TEXT NOT NULL,  -- 'shop_call', 'shop_direction', 'shop_share', etc.
  event_category  TEXT,           -- 'engagement', 'conversion', 'social'
  event_label     TEXT,
  event_value     NUMERIC,
  
  -- Related Entity
  shop_id         TEXT,
  category_id     TEXT,
  
  -- User Info
  user_id         TEXT,
  session_id      TEXT NOT NULL,
  
  -- Page Context
  page_path       TEXT,
  
  -- Metadata (JSON for flexibility)
  metadata        JSONB,
  
  -- Timestamps
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ===================================
-- 5. ตาราง conversion_funnel - ติดตาม Conversion
-- ===================================
CREATE TABLE conversion_funnel (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id      TEXT NOT NULL,
  user_id         TEXT,
  
  -- Funnel Steps
  step_name       TEXT NOT NULL,  -- 'view_shop', 'click_call', 'click_direction', etc.
  step_order      INTEGER NOT NULL,
  
  -- Related Entity
  shop_id         TEXT,
  
  -- Timestamps
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(session_id, step_name, shop_id)
);

-- ===================================
-- 6. ตาราง daily_stats - สถิติรายวัน (Aggregated)
-- ===================================
CREATE TABLE daily_stats (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stat_date       DATE NOT NULL,
  
  -- Overall Stats
  total_page_views      INTEGER DEFAULT 0,
  total_sessions        INTEGER DEFAULT 0,
  total_users           INTEGER DEFAULT 0,
  total_shop_views      INTEGER DEFAULT 0,
  
  -- Engagement
  avg_session_duration  INTEGER DEFAULT 0,  -- milliseconds
  avg_pages_per_session NUMERIC DEFAULT 0,
  bounce_rate           NUMERIC DEFAULT 0,  -- percentage
  
  -- Top Pages (JSON array)
  top_pages             JSONB,
  
  -- Top Shops (JSON array)
  top_shops             JSONB,
  
  -- Device Breakdown (JSON)
  device_breakdown      JSONB,
  
  -- Location Breakdown (JSON)
  location_breakdown    JSONB,
  
  -- Timestamps
  created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(stat_date)
);

-- ===================================
-- Indexes
-- ===================================

-- page_views
CREATE INDEX idx_page_views_session ON page_views(session_id);
CREATE INDEX idx_page_views_user ON page_views(user_id);
CREATE INDEX idx_page_views_path ON page_views(page_path);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_location ON page_views(tambon_id, amphure_id, province_id);

-- shop_views
CREATE INDEX idx_shop_views_shop ON shop_views(shop_id);
CREATE INDEX idx_shop_views_session ON shop_views(session_id);
CREATE INDEX idx_shop_views_user ON shop_views(user_id);
CREATE INDEX idx_shop_views_created_at ON shop_views(created_at);
CREATE INDEX idx_shop_views_location ON shop_views(tambon_id);

-- user_sessions
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX idx_user_sessions_location ON user_sessions(province_id);

-- events
CREATE INDEX idx_events_event_name ON events(event_name);
CREATE INDEX idx_events_shop ON events(shop_id);
CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_created_at ON events(created_at);

-- conversion_funnel
CREATE INDEX idx_conversion_funnel_session ON conversion_funnel(session_id);
CREATE INDEX idx_conversion_funnel_shop ON conversion_funnel(shop_id);
CREATE INDEX idx_conversion_funnel_step ON conversion_funnel(step_name);

-- daily_stats
CREATE INDEX idx_daily_stats_date ON daily_stats(stat_date DESC);

-- ===================================
-- Functions & Triggers
-- ===================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_daily_stats_updated_at
BEFORE UPDATE ON daily_stats
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ===================================
-- Views สำหรับ Quick Analytics
-- ===================================

-- View: รวมสถิติร้านค้า
CREATE OR REPLACE VIEW shop_analytics AS
SELECT 
  s.id as shop_id,
  s.name as shop_name,
  COUNT(DISTINCT sv.id) as total_views,
  COUNT(DISTINCT sv.session_id) as unique_visitors,
  COUNT(DISTINCT sv.user_id) FILTER (WHERE sv.user_id IS NOT NULL) as logged_in_visitors,
  AVG(sv.duration_ms) as avg_view_duration,
  COUNT(DISTINCT e.id) FILTER (WHERE e.event_name = 'shop_call') as total_calls,
  COUNT(DISTINCT e.id) FILTER (WHERE e.event_name = 'shop_direction') as total_directions,
  COUNT(DISTINCT e.id) FILTER (WHERE e.event_name = 'shop_share') as total_shares
FROM "Shop" s
LEFT JOIN shop_views sv ON sv.shop_id = s.id
LEFT JOIN events e ON e.shop_id = s.id
GROUP BY s.id, s.name;

-- View: Popular pages
CREATE OR REPLACE VIEW popular_pages AS
SELECT 
  page_path,
  COUNT(*) as total_views,
  COUNT(DISTINCT session_id) as unique_visitors,
  AVG(duration_ms) as avg_duration
FROM page_views
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY page_path
ORDER BY total_views DESC
LIMIT 100;

-- ===================================
-- Comments
-- ===================================

COMMENT ON TABLE page_views IS 'บันทึกการเข้าชมหน้าเว็บทุกหน้า';
COMMENT ON TABLE shop_views IS 'บันทึกการดูร้านค้าโดยเฉพาะ (มี duration และ source tracking)';
COMMENT ON TABLE user_sessions IS 'บันทึก session ของผู้ใช้ (เก็บ landing page, device, location)';
COMMENT ON TABLE events IS 'บันทึก custom events เช่น การโทร, ขอเส้นทาง, แชร์';
COMMENT ON TABLE conversion_funnel IS 'ติดตาม conversion funnel (view → click → convert)';
COMMENT ON TABLE daily_stats IS 'สถิติรายวันที่รวมแล้ว (สำหรับ dashboard)';
