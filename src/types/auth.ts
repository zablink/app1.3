// src/types/auth.ts

export type UserRole = 'guest' | 'user' | 'shop_owner' | 'super_admin';

export interface User {
  id: string;
  email: string | null;
  role: UserRole;
  displayName: string | null;
  avatarUrl: string | null;
  provider?: string; // 'google', 'facebook', 'tiktok', etc.
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

export interface ShopOwnership {
  userId: string;
  shopId: string;
  role: 'owner' | 'admin' | 'editor';
}

// Database schema extension
export interface UserProfile {
  id: string; // matches auth.users.id
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}