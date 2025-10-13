// src/types/creator.ts

export type CreatorStatus = 'pending' | 'active' | 'suspended' | 'rejected';
export type ReviewRequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type CoverageLevel = 'tambon' | 'amphure' | 'province';

export interface Creator {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  phone: string | null;
  lineId: string | null;
  
  // Social media links
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  
  // Coverage area
  provinceId: number;
  provinceName: string;
  amphureId: number | null;
  amphureName: string | null;
  tambonId: number | null;
  tambonName: string | null;
  coverageLevel: CoverageLevel;
  
  // Stats
  totalReviews: number;
  completedReviews: number;
  rating: number; // Shop owner ratings
  
  // Financial
  totalEarnings: number;
  availableBalance: number;
  totalWithdrawn: number;
  
  status: CreatorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  id: string;
  shopId: string;
  shopName: string;
  creatorId: string | null;
  creatorName: string | null;
  
  // Request details
  title: string;
  description: string;
  budget: number;
  deadline: string;
  
  // Location
  provinceId: number;
  amphureId: number;
  tambonId: number;
  
  status: ReviewRequestStatus;
  
  // Timestamps
  requestedAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  
  // Review details
  videoUrl: string | null;
  shopRating: number | null; // Shop rates creator performance
  notes: string | null;
}

export interface CreatorEarning {
  id: string;
  creatorId: string;
  reviewRequestId: string;
  amount: number;
  description: string;
  earnedAt: string;
}

export interface CreatorWithdrawal {
  id: string;
  creatorId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  bankAccount: string;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
  notes: string | null;
}

export interface LocationData {
  provinces: Province[];
  amphures: Amphure[];
  tambons: Tambon[];
}

export interface Province {
  id: number;
  name_th: string;
  name_en: string;
}

export interface Amphure {
  id: number;
  name_th: string;
  name_en: string;
  province_id: number;
}

export interface Tambon {
  id: number;
  name_th: string;
  name_en: string;
  amphure_id: number;
  zip_code: string | null;
}