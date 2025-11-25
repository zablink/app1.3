// src/app/category/[slug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";

type Shop = {
  id: string;
  name: string;
  description?: string | null;
  image: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
  subscriptionTier?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
};

// Package badge configuration
const PACKAGE_BADGES: Record<string, { emoji: string; text: string; color: string }> = {
  PREMIUM: { emoji: '👑', text: 'Premium', color: 'bg-gradient-to-r from-yellow-400 to-amber-500' },
  PRO: { emoji: '🔥', text: 'Pro', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  BASIC: { emoji: '⭐', text: 'Basic', color: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
  FREE: { emoji: '', text: '', color: '' },
};

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch category details and shops
        const response = await fetch(`/api/category/${slug}`);
        
        if (!response.ok) {
          throw new Error('ไม่พบหมวดหมู่นี้');
        }

        const data = await response.json();
        setCategory(data.category);
        setShops(data.shops || []);
      } catch (err) {
        console.error('Error fetching category:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'ไม่พบหมวดหมู่'}</p>
          <Link href="/category" className="text-blue-600 hover:underline">
            ← กลับไปหน้าหมวดหมู่
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-4 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">หน้าแรก</Link>
          {' > '}
          <Link href="/category" className="hover:text-blue-600">หมวดหมู่</Link>
          {' > '}
          <span className="text-gray-900">{category.name}</span>
        </div>

        {/* Category Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{category.icon || '📦'}</div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-gray-600">{category.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                พบทั้งหมด {shops.length} ร้าน
              </p>
            </div>
          </div>
        </div>

        {/* Shops Grid */}
        {shops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {shops.map((shop, index) => {
              const tier = shop.subscriptionTier || 'FREE';
              const badge = PACKAGE_BADGES[tier];

              return (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/shop/${shop.id}`}>
                    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer h-full">
                      {/* Image */}
                      <div className="relative h-48 bg-gray-200">
                        {shop.image ? (
                          <img
                            src={shop.image}
                            alt={shop.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-4xl">🏪</span>
                          </div>
                        )}

                        {/* Package Badge */}
                        {badge.text && (
                          <div className={`absolute top-2 right-2 ${badge.color} text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1`}>
                            <span>{badge.emoji}</span>
                            <span>{badge.text}</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                          {shop.name}
                        </h3>
                        
                        {shop.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {shop.description}
                          </p>
                        )}

                        {(shop.district || shop.province) && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {[shop.district, shop.province].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500 text-lg">ยังไม่มีร้านค้าในหมวดหมู่นี้</p>
            <Link href="/category" className="text-blue-600 hover:underline mt-4 inline-block">
              ← ดูหมวดหมู่อื่น
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
