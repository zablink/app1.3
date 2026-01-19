// Token Transaction Types
export interface TokenTransaction {
  id: string;
  type: 'PURCHASE' | 'SPEND' | 'REFUND' | 'EXPIRED';
  amount: number;
  balance: number;
  description: string;
  createdAt: Date;
  expiresAt?: Date;
  campaignId?: string;
  campaignTitle?: string;
}

// Token Balance Info
export interface TokenBalance {
  total: number;
  available: number;
  reserved: number; // tokens reserved for active campaigns
  expiringSoon: number; // tokens expiring in next 30 days
  expiringDetails?: {
    amount: number;
    expiresAt: Date;
  }[];
}

// Token Purchase Data
export interface TokenPurchaseData {
  packageId: string;
  amount: number;
  paymentMethod: 'PROMPTPAY' | 'CREDIT_CARD' | 'BANK_TRANSFER';
}

// Token Package (subscription packages provide monthly tokens)
export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  bonusTokens?: number;
  validityDays: number; // usually 90 days (3 months)
  popular?: boolean;
}

// FIFO Token Allocation
export interface TokenAllocation {
  purchaseId: string;
  amount: number;
  expiresAt: Date;
}

// Token Usage Summary
export interface TokenUsageSummary {
  totalPurchased: number;
  totalSpent: number;
  totalExpired: number;
  totalRefunded: number;
  currentBalance: number;
  activeCampaignsSpend: number;
}