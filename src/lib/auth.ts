// lib/auth.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

/**
 * Get server session with proper typing
 */
export async function getSession() {
  return await getServerSession();
}

/**
 * Require authentication - return 401 if not authenticated
 */
export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null
    };
  }
  
  return {
    error: null,
    session
  };
}

/**
 * Require specific role - return 403 if user doesn't have required role
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null
    };
  }
  
  const userRole = (session.user as any).role || 'USER';
  
  if (!allowedRoles.includes(userRole)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      session: null
    };
  }
  
  return {
    error: null,
    session
  };
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return requireRole(['ADMIN']);
}

/**
 * Require shop owner role
 */
export async function requireShopOwner() {
  return requireRole(['SHOP', 'ADMIN']);
}

/**
 * Require creator role
 */
export async function requireCreator() {
  return requireRole(['CREATOR', 'ADMIN']);
}

/**
 * Check if user is authenticated (returns boolean)
 */
export async function isAuthenticated() {
  const session = await getServerSession();
  return !!session?.user;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string) {
  const session = await getServerSession();
  if (!session?.user) return false;
  
  const userRole = (session.user as any).role || 'USER';
  return userRole === role;
}

/**
 * Check if user is admin
 */
export async function isAdmin() {
  return hasRole('ADMIN');
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user || null;
}

/**
 * Get user ID from session
 */
export async function getUserId() {
  const session = await getServerSession();
  return session?.user?.id || null;
}

/**
 * Get user role from session
 */
export async function getUserRole() {
  const session = await getServerSession();
  if (!session?.user) return null;
  
  return (session.user as any).role || 'USER';
}
