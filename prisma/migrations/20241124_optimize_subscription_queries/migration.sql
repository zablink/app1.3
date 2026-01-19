-- Migration: Optimize subscription queries for better performance
-- Date: 2024-11-24
-- Description: Add indexes to improve subscription query performance and prevent unstable loading

-- Add composite index on shop_subscriptions for faster lookups
CREATE INDEX IF NOT EXISTS idx_shop_subscriptions_active_lookup 
ON shop_subscriptions (shop_id, status, end_date) 
WHERE status = 'ACTIVE';

-- Add index on subscription_packages tier for faster sorting
CREATE INDEX IF NOT EXISTS idx_subscription_packages_tier_order 
ON subscription_packages (tier) 
WHERE tier IS NOT NULL;

-- Add partial index for active subscriptions only
CREATE INDEX IF NOT EXISTS idx_shop_subscriptions_active_only 
ON shop_subscriptions (shop_id, package_id, end_date) 
WHERE status = 'ACTIVE' AND end_date > NOW();

-- Optimize existing queries by analyzing tables
ANALYZE shop_subscriptions;
ANALYZE subscription_packages;
ANALYZE "Shop";
