// lib/og-campaign.ts
// OG Campaign (Original Gangs) Helper Functions

import prisma from '@/lib/prisma';
import { getSetting } from './settings';

/**
 * OG Campaign Settings Keys (stored in SiteSetting)
 */
export const OG_CAMPAIGN_SETTINGS = {
  START_DATE: 'og_campaign_start_date',      // ISO date string
  END_DATE: 'og_campaign_end_date',           // ISO date string
  BENEFITS_DURATION_DAYS: 'og_benefits_duration_days', // number (default: 730 = 2 years)
  TOKEN_MULTIPLIER: 'og_token_multiplier',    // number (default: 2.0)
  USAGE_DISCOUNT: 'og_usage_discount',        // number 0-1 (default: 0.30 = 30%)
  ENABLED: 'og_campaign_enabled',             // boolean (default: true)
} as const;

/**
 * Default OG Campaign values
 */
const DEFAULT_OG_VALUES = {
  BENEFITS_DURATION_DAYS: 730, // 2 years
  TOKEN_MULTIPLIER: 2.0,
  USAGE_DISCOUNT: 0.30, // 30%
  ENABLED: true,
};

/**
 * Get OG Campaign start date from settings
 */
export async function getOGCampaignStartDate(): Promise<Date | null> {
  const startDateStr = await getSetting(OG_CAMPAIGN_SETTINGS.START_DATE, null);
  if (!startDateStr) return null;
  
  try {
    return new Date(startDateStr);
  } catch {
    return null;
  }
}

/**
 * Get OG Campaign end date from settings
 */
export async function getOGCampaignEndDate(): Promise<Date | null> {
  const endDateStr = await getSetting(OG_CAMPAIGN_SETTINGS.END_DATE, null);
  if (!endDateStr) return null;
  
  try {
    return new Date(endDateStr);
  } catch {
    return null;
  }
}

/**
 * Check if OG Campaign is enabled
 */
export async function isOGCampaignEnabled(): Promise<boolean> {
  return await getSetting(OG_CAMPAIGN_SETTINGS.ENABLED, DEFAULT_OG_VALUES.ENABLED);
}

/**
 * Check if a subscription date is eligible for OG Campaign
 */
export async function isOGEligible(subscriptionDate: Date): Promise<boolean> {
  // Check if campaign is enabled
  const enabled = await isOGCampaignEnabled();
  if (!enabled) return false;

  // Get campaign dates
  const startDate = await getOGCampaignStartDate();
  const endDate = await getOGCampaignEndDate();

  // If dates are not set, return false
  if (!startDate || !endDate) return false;

  // Check if subscription date is within campaign period
  return subscriptionDate >= startDate && subscriptionDate <= endDate;
}

/**
 * Calculate OG benefits end date (subscription date + benefits duration)
 */
export async function calculateOGBenefitsUntil(subscriptionDate: Date): Promise<Date> {
  const durationDays = await getSetting(
    OG_CAMPAIGN_SETTINGS.BENEFITS_DURATION_DAYS,
    DEFAULT_OG_VALUES.BENEFITS_DURATION_DAYS
  );
  
  return new Date(subscriptionDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
}

/**
 * Get OG token multiplier
 */
export async function getOGTokenMultiplier(): Promise<number> {
  return await getSetting(
    OG_CAMPAIGN_SETTINGS.TOKEN_MULTIPLIER,
    DEFAULT_OG_VALUES.TOKEN_MULTIPLIER
  );
}

/**
 * Get OG usage discount (0-1)
 */
export async function getOGUsageDiscount(): Promise<number> {
  return await getSetting(
    OG_CAMPAIGN_SETTINGS.USAGE_DISCOUNT,
    DEFAULT_OG_VALUES.USAGE_DISCOUNT
  );
}

/**
 * Calculate token amount with OG multiplier
 */
export async function calculateOGTokens(baseTokenAmount: number, isOG: boolean): Promise<number> {
  if (!isOG) return baseTokenAmount;
  
  const multiplier = await getOGTokenMultiplier();
  return Math.floor(baseTokenAmount * multiplier);
}

/**
 * Check if a shop subscription has active OG benefits
 */
export async function hasActiveOGBenefits(subscription: {
  is_og_subscription?: boolean;
  start_date?: Date;
  end_date?: Date;
}): Promise<boolean> {
  if (!subscription.is_og_subscription) return false;

  // If subscription has end_date, check if it's still active
  if (subscription.end_date) {
    const now = new Date();
    if (now > subscription.end_date) return false;
  }

  // Calculate benefits until date
  if (subscription.start_date) {
    const benefitsUntil = await calculateOGBenefitsUntil(subscription.start_date);
    const now = new Date();
    return now <= benefitsUntil;
  }

  return false;
}

/**
 * Calculate token cost with OG discount
 */
export async function calculateOGTokenCost(
  baseCost: number,
  subscription: {
    is_og_subscription?: boolean;
    start_date?: Date;
    end_date?: Date;
  }
): Promise<{ finalCost: number; discountApplied: number; isOG: boolean }> {
  const hasActiveOG = await hasActiveOGBenefits(subscription);
  
  if (!hasActiveOG) {
    return {
      finalCost: baseCost,
      discountApplied: 0,
      isOG: false,
    };
  }

  const discount = await getOGUsageDiscount();
  const finalCost = Math.ceil(baseCost * (1 - discount));

  return {
    finalCost,
    discountApplied: discount,
    isOG: true,
  };
}

/**
 * Get shop's OG subscription status
 */
export async function getShopOGStatus(shopId: string): Promise<{
  isOG: boolean;
  isActive: boolean;
  benefitsUntil: Date | null;
  tokenMultiplier: number;
  usageDiscount: number;
}> {
  const subscription = await prisma.shopSubscription.findFirst({
    where: {
      shop_id: shopId,
      status: 'ACTIVE',
      is_og_subscription: true,
    },
    orderBy: { start_date: 'desc' },
  });

  if (!subscription) {
    return {
      isOG: false,
      isActive: false,
      benefitsUntil: null,
      tokenMultiplier: 1.0,
      usageDiscount: 0,
    };
  }

  const isActive = await hasActiveOGBenefits(subscription);
  const benefitsUntil = subscription.start_date
    ? await calculateOGBenefitsUntil(subscription.start_date)
    : null;
  const tokenMultiplier = await getOGTokenMultiplier();
  const usageDiscount = await getOGUsageDiscount();

  return {
    isOG: true,
    isActive,
    benefitsUntil,
    tokenMultiplier,
    usageDiscount,
  };
}

/**
 * Get user's OG member status
 */
export async function getUserOGStatus(userId: string): Promise<{
  isOG: boolean;
  isActive: boolean;
  joinedAt: Date | null;
  benefitsUntil: Date | null;
  badgeEnabled: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isOGMember: true,
      ogJoinedAt: true,
      ogBenefitsUntil: true,
      ogBadgeEnabled: true,
    },
  });

  if (!user?.isOGMember) {
    return {
      isOG: false,
      isActive: false,
      joinedAt: null,
      benefitsUntil: null,
      badgeEnabled: false,
    };
  }

  const now = new Date();
  const isActive = user.ogBenefitsUntil ? now <= user.ogBenefitsUntil : false;

  return {
    isOG: true,
    isActive,
    joinedAt: user.ogJoinedAt,
    benefitsUntil: user.ogBenefitsUntil,
    badgeEnabled: user.ogBadgeEnabled ?? true,
  };
}
