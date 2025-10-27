// src/app/shop/page.tsx

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
//import AppLayout from "@/components/AppLayout";

type Shop = {
  id: number;
  name: string;
  category: string | null;
  image: string | null;
  lat: number | null;
  lng: number | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  package_tier?: string | null;
  badge_emoji?: string | null;
  badge_text?: string | null;
};

// Package badge configuration
const PACKAGE_BADGES: Record<string, { emoji: string; text: string; color: string }> = {
  PREMIUM: { emoji: '👑', text: 'Premium', color: 'bg-gradient-to-r from-yellow-400 to-amber-500' },
  PRO: { emoji: '🔥', text: 'Pro', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  BASIC: { emoji: '⭐', text: 'Basic', color: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
  FREE: { emoji: '', text: '', color: '' },
};

export default function ShopListPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  
  // Get unique categories and provinces
  const categories = ["all", ...Array.from(new Set(shops.map(s => s.category).filter(Boolean)))];
  const provinces = ["all", ...Array.from(new Set(shops.map(s => s.province).filter(Boolean)))];

  // Fetch shops from API
  useEffect(() => {
    async function fetchShops() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/shops');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch shops: ${response.status}`);
        }

        const data = await response.json();
        setShops(data);
        setFilteredShops(data);
      } catch (err) {
        console.error('Error fetching shops:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    }

    fetchShops();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...shops];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(shop => 
        shop.name.toLowerCase().includes(query) ||
        shop.category?.toLowerCase().includes(query) ||
        shop.district?.toLowerCase().includes(query) ||
        shop.province?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(shop => shop.category === selectedCategory);
    }

    // Province filter
    if (selectedProvince !== "all") {
      result = result.filter(shop => shop.province === selectedProvince);
    }

    setFilteredShops(result);
  }, [searchQuery, selectedCategory, selectedProvince, shops]);

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              โหลดใหม่
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ร้านค้าทั้งหมด</h1>
          <p className="text-gray-600">พบทั้งหมด {filteredShops.length} ร้าน</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔍 ค้นหา
              </label>
              <input
                type="text"
                placeholder="ค้นหาชื่อร้าน, หมวดหมู่, พื้นที่..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏷️ หมวดหมู่
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "ทั้งหมด" : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Province Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 จังหวัด
              </label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov === "all" ? "ทั้งหมด" : prov}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedCategory !== "all" || selectedProvince !== "all") && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedProvince("all");
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                ล้างตัวกรอง
              </button>
            </div>
          )}
        </div>

        {/* Shop Grid */}
        {filteredShops.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShops.map((shop, i) => (
              <motion.div
                key={shop.id}
                className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-all"
                whileHover={{ scale: 1.02, y: -4 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <Link href={`/shop/${shop.id}`}>
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={shop.image || '/images/placeholder.jpg'}
                      alt={shop.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Package Badge */}
                    {shop.package_tier && shop.package_tier !== 'FREE' && (
                      <div className={`absolute top-2 right-2 ${PACKAGE_BADGES[shop.package_tier]?.color} text-white px-3 py-1 rounded-md text-xs font-semibold shadow-lg flex items-center gap-1`}>
                        <span>{PACKAGE_BADGES[shop.package_tier]?.emoji}</span>
                        <span>{PACKAGE_BADGES[shop.package_tier]?.text}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {shop.name}
                    </h3>
                    {shop.category && (
                      <p className="text-sm text-gray-500 mb-2">
                        {shop.category}
                      </p>
                    )}
                    {(shop.district || shop.province) && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <span>📍</span>
                        <span className="line-clamp-1">
                          {shop.district}{shop.district && shop.province ? ', ' : ''}{shop.province}
                        </span>
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              ไม่พบร้านค้าที่ตรงกับการค้นหา
            </h3>
            <p className="text-gray-600 mb-4">
              ลองปรับเปลี่ยนตัวกรองหรือคำค้นหาใหม่
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedProvince("all");
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}