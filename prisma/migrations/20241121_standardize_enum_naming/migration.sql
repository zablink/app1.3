-- Migration: Standardize Enum Naming Convention
-- Date: 2024-11-21
-- Purpose: Rename subscription_status → SubscriptionStatus, subscription_tier → SubscriptionTier

-- Step 1: Create new enum types with PascalCase names
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED');
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'PREMIUM');

-- Step 2: Add temporary columns with new enum types
ALTER TABLE "subscription_packages" 
  ADD COLUMN "tier_new" "SubscriptionTier";

ALTER TABLE "shop_subscriptions" 
  ADD COLUMN "status_new" "SubscriptionStatus";

-- Step 3: Copy data from old columns to new columns
UPDATE "subscription_packages" 
  SET "tier_new" = tier::text::"SubscriptionTier"
  WHERE tier IS NOT NULL;

UPDATE "shop_subscriptions" 
  SET "status_new" = status::text::"SubscriptionStatus";

-- Step 4: Drop old columns
ALTER TABLE "subscription_packages" DROP COLUMN "tier";
ALTER TABLE "shop_subscriptions" DROP COLUMN "status";

-- Step 5: Rename new columns to original names
ALTER TABLE "subscription_packages" 
  RENAME COLUMN "tier_new" TO "tier";

ALTER TABLE "shop_subscriptions" 
  RENAME COLUMN "status_new" TO "status";

-- Step 6: Set default value for status column
ALTER TABLE "shop_subscriptions" 
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"SubscriptionStatus";

-- Step 7: Set NOT NULL constraint for status
ALTER TABLE "shop_subscriptions" 
  ALTER COLUMN "status" SET NOT NULL;

-- Step 8: Drop old enum types
DROP TYPE IF EXISTS "subscription_status";
DROP TYPE IF EXISTS "subscription_tier";

-- Step 9: Create indexes if needed (optional, for performance)
CREATE INDEX IF NOT EXISTS "idx_shop_subscriptions_status" ON "shop_subscriptions"("status");
CREATE INDEX IF NOT EXISTS "idx_subscription_packages_tier" ON "subscription_packages"("tier");
