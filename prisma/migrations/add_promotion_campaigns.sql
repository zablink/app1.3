-- Migration: Add Promotion Campaigns
-- Date: 2025-01-XX
-- Purpose: Add promotion campaigns for package subscriptions and token purchases

-- Create PromotionCampaign model
CREATE TABLE IF NOT EXISTS "promotion_campaigns" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('PACKAGE', 'TOKEN', 'RENEWAL')),
  
  -- Package specific fields
  package_tier TEXT, -- FREE, BASIC, PRO, PREMIUM
  package_id TEXT,
  
  -- Discount/benefit fields
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'TOKEN_MULTIPLIER', 'FREE_TOKENS')),
  discount_value DECIMAL(10, 2), -- percentage, fixed amount, or multiplier
  token_multiplier DECIMAL(5, 2) DEFAULT 1.0, -- e.g., 2.0 for 2x tokens
  free_tokens INT DEFAULT 0,
  
  -- Date range
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  max_uses INT, -- NULL = unlimited
  current_uses INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  
  CONSTRAINT fk_package FOREIGN KEY (package_id) REFERENCES subscription_packages(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_promotion_campaigns_type ON promotion_campaigns(campaign_type);
CREATE INDEX idx_promotion_campaigns_dates ON promotion_campaigns(start_date, end_date);
CREATE INDEX idx_promotion_campaigns_active ON promotion_campaigns(is_active, start_date, end_date);
CREATE INDEX idx_promotion_campaigns_package ON promotion_campaigns(package_id);
CREATE INDEX idx_promotion_campaigns_tier ON promotion_campaigns(package_tier);
