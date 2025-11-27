// Test endpoint to clear all NextAuth cookies
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  
  // Get all cookies
  const allCookies = cookieStore.getAll();
  
  // Delete NextAuth related cookies
  const deletedCookies: string[] = [];
  
  allCookies.forEach((cookie) => {
    if (
      cookie.name.includes('next-auth') || 
      cookie.name.includes('__Secure-next-auth') ||
      cookie.name.includes('__Host-next-auth')
    ) {
      cookieStore.delete(cookie.name);
      deletedCookies.push(cookie.name);
    }
  });
  
  return NextResponse.json({
    message: 'Cookies cleared',
    deleted: deletedCookies,
    total: deletedCookies.length,
  });
}
