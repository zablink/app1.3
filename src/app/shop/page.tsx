// src/app/shop/page.tsx

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Shop = {
  id: string; // Changed from number to string (UUID)
  name: string;
  image: string | null;
  lat: number | null;
  lng: number | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  description?: string | null;
  address?: string | null;
  package_tier?: string | null;
  badge_emoji?: string | null;
  badge_text?: string | null;
  subscriptionTier?: string | null; // API may return this
  distance?: number | null;
  categories?: Array<{ id: string; name: string; slug: string; icon: string | null }> | null;
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
  
  // Categories from API
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string; slug: string; icon?: string | null }>>([]);
  
  // Location data from loc_* tables
  const [availableProvinces, setAvailableProvinces] = useState<Array<{ id: number; name: string }>>([]);
  const [availableDistricts, setAvailableDistricts] = useState<Array<{ id: number; name: string }>>([]);
  const [availableSubdistricts, setAvailableSubdistricts] = useState<Array<{ id: number; name: string }>>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [selectedSubdistrictId, setSelectedSubdistrictId] = useState<number | null>(null);
  
  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        console.log('🏷️ Categories response:', data);
        if (data.success) {
          setAvailableCategories(data.categories || []);
          console.log('✅ Loaded categories:', data.categories?.length);
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
      }
    }

    fetchCategories();
  }, []);

  // Fetch provinces
  useEffect(() => {
    async function fetchProvinces() {
      try {
        const response = await fetch('/api/locations/provinces');
        const data = await response.json();
        console.log('📍 Provinces response:', data);
        if (Array.isArray(data)) {
          setAvailableProvinces(data.map(p => ({ id: p.id, name: p.name_th })));
          console.log('✅ Loaded provinces:', data.length);
        }
      } catch (error) {
        console.error('❌ Error fetching provinces:', error);
      }
    }

    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    async function fetchDistricts() {
      if (!selectedProvinceId) {
        setAvailableDistricts([]);
        setSelectedDistrictId(null);
        return;
      }

      try {
        const response = await fetch(`/api/locations/districts?provinceId=${selectedProvinceId}`);
        const data = await response.json();
        if (data.success) {
          setAvailableDistricts(data.districts.map((d: any) => ({ id: d.id, name: d.name })));
        }
      } catch (error) {
        console.error('❌ Error fetching districts:', error);
      }
    }

    fetchDistricts();
  }, [selectedProvinceId]);

  // Fetch subdistricts when district changes
  useEffect(() => {
    async function fetchSubdistricts() {
      if (!selectedDistrictId) {
        setAvailableSubdistricts([]);
        setSelectedSubdistrictId(null);
        return;
      }

      try {
        const response = await fetch(`/api/locations/subdistricts?districtId=${selectedDistrictId}`);
        const data = await response.json();
        if (data.success) {
          setAvailableSubdistricts(data.subdistricts.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (error) {
        console.error('❌ Error fetching subdistricts:', error);
      }
    }

    fetchSubdistricts();
  }, [selectedDistrictId]);

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
        
        // Handle both response formats: array or { shops: array }
        const shopsData = Array.isArray(data) ? data : (data.shops || []);
        
        console.log('📦 Loaded shops:', shopsData.length);
        console.log('📍 Sample shop:', shopsData[0]);
        console.log('🏷️ Sample categories:', shopsData[0]?.categories);
        console.log('📍 Sample province:', shopsData[0]?.province);
        
        setShops(shopsData);
        setFilteredShops(shopsData);
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
      result = result.filter(shop => {
        const categoryMatch = shop.categories?.some(cat => 
          cat.name.toLowerCase().includes(query)
        );
        return shop.name.toLowerCase().includes(query) ||
          categoryMatch ||
          shop.district?.toLowerCase().includes(query) ||
          shop.province?.toLowerCase().includes(query) ||
          shop.subdistrict?.toLowerCase().includes(query);
      });
    }

    // Category filter (check if shop has this category by slug)
    if (selectedCategory !== "all") {
      result = result.filter(shop => 
        shop.categories?.some(cat => cat.slug === selectedCategory)
      );
    }

    // Province filter (by name match)
    if (selectedProvinceId) {
      const provinceName = availableProvinces.find(p => p.id === selectedProvinceId)?.name;
      if (provinceName) {
        result = result.filter(shop => shop.province === provinceName);
      }
    }

    // District filter (by name match)
    if (selectedDistrictId) {
      const districtName = availableDistricts.find(d => d.id === selectedDistrictId)?.name;
      if (districtName) {
        result = result.filter(shop => shop.district === districtName);
      }
    }

    // Subdistrict filter (by name match)
    if (selectedSubdistrictId) {
      const subdistrictName = availableSubdistricts.find(s => s.id === selectedSubdistrictId)?.name;
      if (subdistrictName) {
        result = result.filter(shop => shop.subdistrict === subdistrictName);
      }
    }

    // Sort by distance if user location is available
    if (userLocation) {
      result = result.map(shop => {
        if (shop.lat && shop.lng) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            shop.lat,
            shop.lng
          );
          return { ...shop, distance };
        }
        return { ...shop, distance: null };
      }).sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    setFilteredShops(result);
  }, [searchQuery, selectedCategory, selectedProvinceId, selectedDistrictId, selectedSubdistrictId, shops, userLocation, availableProvinces, availableDistricts, availableSubdistricts]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user location
  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการหาตำแหน่ง');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
        // Clear location filters when using nearby
        setSelectedProvinceId(null);
        setSelectedDistrictId(null);
        setSelectedSubdistrictId(null);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง');
        setLoadingLocation(false);
      }
    );
  };

  // Reset location filter
  const handleClearLocation = () => {
    setUserLocation(null);
  };

  // Loading state
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
    );
  }

  // Error state
  if (error) {
    return (
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
    );
  }

  return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ร้านค้าทั้งหมด</h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              พบทั้งหมด {filteredShops.length} ร้าน
              {userLocation && <span className="ml-2 text-blue-600">(เรียงตามระยะทาง)</span>}
            </p>
            
            {/* Find Nearby Button */}
            <button
              onClick={userLocation ? handleClearLocation : handleFindNearby}
              disabled={loadingLocation}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                userLocation 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loadingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>กำลังหาตำแหน่ง...</span>
                </>
              ) : userLocation ? (
                <>
                  <span>✖️</span>
                  <span>ล้างตำแหน่ง</span>
                </>
              ) : (
                <>
                  <span>📍</span>
                  <span>ร้านใกล้ฉัน</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="lg:col-span-3">
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
                <option value="all">ทั้งหมด</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.name}
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
                value={selectedProvinceId || ""}
                onChange={(e) => {
                  setSelectedProvinceId(e.target.value ? parseInt(e.target.value) : null);
                  setSelectedDistrictId(null);
                  setSelectedSubdistrictId(null);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">ทั้งหมด</option>
                {availableProvinces.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏘️ อำเภอ/เขต
              </label>
              <select
                value={selectedDistrictId || ""}
                onChange={(e) => {
                  setSelectedDistrictId(e.target.value ? parseInt(e.target.value) : null);
                  setSelectedSubdistrictId(null);
                }}
                disabled={!selectedProvinceId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">ทั้งหมด</option>
                {availableDistricts.map((dist) => (
                  <option key={dist.id} value={dist.id}>
                    {dist.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subdistrict Filter */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏡 ตำบล/แขวง
              </label>
              <select
                value={selectedSubdistrictId || ""}
                onChange={(e) => setSelectedSubdistrictId(e.target.value ? parseInt(e.target.value) : null)}
                disabled={!selectedDistrictId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">ทั้งหมด</option>
                {availableSubdistricts.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedCategory !== "all" || selectedProvinceId || selectedDistrictId || selectedSubdistrictId || userLocation) && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedProvinceId(null);
                  setSelectedDistrictId(null);
                  setSelectedSubdistrictId(null);
                  setUserLocation(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                ล้างตัวกรองทั้งหมด
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
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                      {shop.name}
                    </h3>
                    
                    {/* Category Badges */}
                    {shop.categories && shop.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {shop.categories.slice(0, 3).map((cat) => (
                          <span 
                            key={cat.id} 
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs"
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </span>
                        ))}
                        {shop.categories.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            +{shop.categories.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Distance */}
                    {shop.distance !== null && shop.distance !== undefined && (
                      <p className="text-xs text-green-600 font-medium mb-1">
                        📍 {shop.distance.toFixed(1)} km
                      </p>
                    )}
                    
                    {/* Location */}
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
  );
}