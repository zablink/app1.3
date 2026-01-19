
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

CREATE TABLE IF NOT EXISTS site_setting_history (
  id TEXT PRIMARY KEY,
  setting_key TEXT NOT NULL REFERENCES site_settings(key),
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

INSERT INTO site_settings (id, key, value, category, data_type, label, description) VALUES ('st_001', 'site.name', 'Zablink', 'branding', 'string', 'Site Name', 'Main site name') ON CONFLICT (key) DO NOTHING;
INSERT INTO site_settings (id, key, value, category, data_type, label, description) VALUES ('st_002', 'site.logo', '/logo.png', 'branding', 'image', 'Logo', 'Site logo') ON CONFLICT (key) DO NOTHING;

INSERT INTO hero_banners (id, title, subtitle, cta_label, cta_link, image_url, priority, is_active) VALUES
  ('hb_001', 'ยินดีต้อนรับสู่ Zablink', 'ค้นหาร้านค้าและบริการที่คุณชื่นชอบได้ง่ายๆ ในพื้นที่ใกล้คุณ', 'เริ่มค้นหา', '/search', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=600&fit=crop', 100, true),
  ('hb_002', 'ค้นพบร้านอาหารใกล้คุณ', 'รีวิวจากผู้ใช้งานจริง พร้อมโปรโมชั่นพิเศษ', 'ดูร้านอาหาร', '/search?category=food', 90, true),
  ('hb_003', 'ลงทะเบียนร้านค้าของคุณ', 'เพิ่มโอกาสทางธุรกิจด้วยการลงทะเบียนร้านค้าฟรี', 'เริ่มต้นเลย', '/shop/register', 80, true)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
CREATE INDEX IF NOT EXISTS idx_hero_banners_active ON hero_banners(is_active, priority DESC);
CREATE INDEX IF NOT EXISTS idx_hero_banners_dates ON hero_banners(start_date, end_date);
[new_code]
ON CONFLICT (id) DO NOTHING;
