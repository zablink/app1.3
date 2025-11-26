// src/app/dashboard/shop/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Edit, Package, Coins, Eye, TrendingUp, Settings } from "lucide-react";

export default function ShopDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && !hasRedirected) {
      fetchShopsData();
    }
  }, [status, hasRedirected]);

  const fetchShopsData = async () => {
    try {
      // Fetch all user's shops
      const res = await fetch('/api/user/shops');
      if (res.ok) {
        const data = await res.json();
        const userShops = data.shops || [];
        setShops(userShops);
        
        if (userShops.length === 0) {
          // No shops - redirect to register
          setHasRedirected(true);
          router.push('/shop/register');
        } else if (userShops.length === 1) {
          // Only one shop - redirect to edit page
          setHasRedirected(true);
          router.push(`/shop/edit/${userShops[0].id}`);
        } else {
          // Multiple shops - redirect to selection page
          setHasRedirected(true);
          router.push('/shop/select');
        }
      } else {
        // No shops found, redirect to register
        setHasRedirected(true);
        router.push('/shop/register');
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // This page will redirect, so we just show loading
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลร้านค้า...</p>
      </div>
    </div>
  );
}
