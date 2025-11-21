-- Migration: Standardize Enum Naming Convention
-- Date: 2024-11-21
-- Purpose: Rename subscription_status → SubscriptionStatus, subscription_tier → SubscriptionTier

-- Step 1: Create new enum types with PascalCase names
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'PREMIUM');

-- Step 2: Add temporary columns with new enum types to ALL tables (including backups)
ALTER TABLE "subscription_packages" 
  ADD COLUMN "tier_new" "SubscriptionTier";

ALTER TABLE "shop_subscriptions" 
  ADD COLUMN "status_new" "SubscriptionStatus";

-- Handle backup tables if they exist
ALTER TABLE "bak_subscription_packages" 
  ADD COLUMN "tier_new" "SubscriptionTier" IF EXISTS;

ALTER TABLE "backup_subscription_packages" 
  ADD COLUMN "tier_new" "SubscriptionTier" IF EXISTS;

ALTER TABLE "backup_bak_subscription_packages" 
  ADD COLUMN "tier_new" "SubscriptionTier" IF EXISTS;

-- Step 3: Copy data from old columns to new columns
UPDATE "subscription_packages" 
  SET "tier_new" = tier::text::"SubscriptionTier"
  WHERE tier IS NOT NULL;

UPDATE "shop_subscriptions" 
  SET "status_new" = status::text::"SubscriptionStatus";

-- Copy data in backup tables
UPDATE "bak_subscription_packages" 
  SET "tier_new" = tier::text::"SubscriptionTier"
  WHERE tier IS NOT NULL;

UPDATE "backup_subscription_packages" 
  SET "tier_new" = tier::text::"SubscriptionTier"
  WHERE tier IS NOT NULL;

UPDATE "backup_bak_subscription_packages" 
  SET "tier_new" = tier::text::"SubscriptionTier"
  WHERE tier IS NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "subscription_packages" DROP COLUMN "tier";
ALTER TABLE "shop_subscriptions" DROP COLUMN "status";
ALTER TABLE "bak_subscription_packages" DROP COLUMN "tier";
ALTER TABLE "backup_subscription_packages" DROP COLUMN "tier";
ALTER TABLE "backup_bak_subscription_packages" DROP COLUMN "tier";

-- Step 5: Rename new columns to original names
ALTER TABLE "subscription_packages" 
  RENAME COLUMN "tier_new" TO "tier";

ALTER TABLE "shop_subscriptions" 
  RENAME COLUMN "status_new" TO "status";

ALTER TABLE "bak_subscription_packages" 
  RENAME COLUMN "tier_new" TO "tier";

ALTER TABLE "backup_subscription_packages" 
  RENAME COLUMN "tier_new" TO "tier";

ALTER TABLE "backup_bak_subscription_packages" 
  RENAME COLUMN "tier_new" TO "tier";

-- Step 6: Set default value for status column
ALTER TABLE "shop_subscriptions" 
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"SubscriptionStatus";

-- Step 7: Set NOT NULL constraint for status
ALTER TABLE "shop_subscriptions" 
  ALTER COLUMN "status" SET NOT NULL;

-- Step 8: Drop or recreate function get_active_subscription
-- First, let's drop the function
DROP FUNCTION IF EXISTS get_active_subscription(text) CASCADE;

-- Recreate function with new enum type (adjust as needed)
CREATE OR REPLACE FUNCTION get_active_subscription(shop_id_param text)
RETURNS TABLE (
  id text,
  shop_id text,
  plan_id text,
  status "SubscriptionStatus",
  started_at timestamp,
  expires_at timestamp
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.shop_id,
    ss.plan_id,
    ss.status,
    ss.started_at,
    ss.expires_at
  FROM shop_subscriptions ss
  WHERE ss.shop_id = shop_id_param
    AND ss.status = 'ACTIVE'::"SubscriptionStatus"
    AND ss.expires_at > NOW()
  ORDER BY ss.expires_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Drop old enum types (now safe)
DROP TYPE IF EXISTS "subscription_status" CASCADE;
DROP TYPE IF EXISTS "subscription_tier" CASCADE;

-- Step 10: Create indexes if needed (optional, for performance)
CREATE INDEX IF NOT EXISTS "idx_shop_subscriptions_status" ON "shop_subscriptions"("status");
CREATE INDEX IF NOT EXISTS "idx_subscription_packages_tier" ON "subscription_packages"("tier");
