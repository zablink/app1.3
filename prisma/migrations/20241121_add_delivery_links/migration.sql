-- Add delivery link columns to Shop table
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "lineman_url" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "grabfood_url" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "foodpanda_url" TEXT;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "shopee_url" TEXT;

-- Add Google Analytics setting if not exists
INSERT INTO site_settings (id, key, value, category, data_type, label, description, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'google_analytics_id',
  '',
  'analytics',
  'string',
  'Google Analytics Tracking ID',
  'Google Analytics Measurement ID (G-XXXXXXXXXX)',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Add Google Tag Manager setting if not exists
INSERT INTO site_settings (id, key, value, category, data_type, label, description, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'google_tag_manager_id',
  '',
  'analytics',
  'string',
  'Google Tag Manager ID',
  'Google Tag Manager Container ID (GTM-XXXXXXX)',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;
