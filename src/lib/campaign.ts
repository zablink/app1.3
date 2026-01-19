// src/lib/campaign.ts
import prisma from "@/lib/prisma";

export type CampaignType = "PACKAGE" | "TOKEN" | "RENEWAL";
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "TOKEN_MULTIPLIER" | "FREE_TOKENS";

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  campaignType: CampaignType;
  packageTier?: string;
  packageId?: string;
  discountType: DiscountType;
  discountValue?: number;
  tokenMultiplier?: number;
  freeTokens?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  maxUses?: number;
  currentUses: number;
}

/**
 * Get active campaigns for a specific type and package/tier
 */
export async function getActiveCampaigns(
  campaignType: CampaignType,
  packageTier?: string,
  packageId?: string
): Promise<Campaign[]> {
  const now = new Date();

  const campaigns = await prisma.promotionCampaign.findMany({
    where: {
      campaignType,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      OR: [
        { packageTier: packageTier || undefined },
        { packageId: packageId || undefined },
        { packageTier: null, packageId: null }, // General campaigns
      ],
      AND: [
        {
          OR: [
            { maxUses: null },
            { currentUses: { lt: prisma.promotionCampaign.fields.maxUses } },
          ],
        },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  return campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || undefined,
    campaignType: c.campaignType as CampaignType,
    packageTier: c.packageTier || undefined,
    packageId: c.packageId || undefined,
    discountType: c.discountType as DiscountType,
    discountValue: c.discountValue ? Number(c.discountValue) : undefined,
    tokenMultiplier: c.tokenMultiplier ? Number(c.tokenMultiplier) : undefined,
    freeTokens: c.freeTokens || undefined,
    startDate: c.startDate,
    endDate: c.endDate,
    isActive: c.isActive,
    maxUses: c.maxUses || undefined,
    currentUses: c.currentUses,
  }));
}

/**
 * Calculate final price with campaign discount
 */
export function calculateCampaignPrice(
  basePrice: number,
  campaigns: Campaign[]
): {
  finalPrice: number;
  discount: number;
  discountPercentage: number;
  appliedCampaign?: Campaign;
} {
  if (campaigns.length === 0) {
    return {
      finalPrice: basePrice,
      discount: 0,
      discountPercentage: 0,
    };
  }

  // Use the first campaign (most recent)
  const campaign = campaigns[0];
  let finalPrice = basePrice;
  let discount = 0;

  switch (campaign.discountType) {
    case "PERCENTAGE":
      discount = (basePrice * (campaign.discountValue || 0)) / 100;
      finalPrice = basePrice - discount;
      break;
    case "FIXED_AMOUNT":
      discount = campaign.discountValue || 0;
      finalPrice = Math.max(0, basePrice - discount);
      break;
    case "TOKEN_MULTIPLIER":
    case "FREE_TOKENS":
      // These don't affect price
      finalPrice = basePrice;
      break;
  }

  return {
    finalPrice: Math.max(0, finalPrice),
    discount,
    discountPercentage: basePrice > 0 ? (discount / basePrice) * 100 : 0,
    appliedCampaign: campaign,
  };
}

/**
 * Calculate token amount with campaign multiplier
 */
export function calculateCampaignTokens(
  baseTokens: number,
  campaigns: Campaign[]
): {
  finalTokens: number;
  bonusTokens: number;
  appliedCampaign?: Campaign;
} {
  if (campaigns.length === 0) {
    return {
      finalTokens: baseTokens,
      bonusTokens: 0,
    };
  }

  const campaign = campaigns[0];
  let finalTokens = baseTokens;
  let bonusTokens = 0;

  switch (campaign.discountType) {
    case "TOKEN_MULTIPLIER":
      finalTokens = Math.floor(baseTokens * (campaign.tokenMultiplier || 1));
      bonusTokens = finalTokens - baseTokens;
      break;
    case "FREE_TOKENS":
      bonusTokens = campaign.freeTokens || 0;
      finalTokens = baseTokens + bonusTokens;
      break;
    case "PERCENTAGE":
    case "FIXED_AMOUNT":
      // These don't affect tokens
      finalTokens = baseTokens;
      break;
  }

  return {
    finalTokens,
    bonusTokens,
    appliedCampaign: campaign,
  };
}

/**
 * Apply campaign usage (increment currentUses)
 */
export async function applyCampaignUsage(campaignId: string): Promise<void> {
  await prisma.promotionCampaign.update({
    where: { id: campaignId },
    data: {
      currentUses: { increment: 1 },
    },
  });
}
