// components/SearchResults.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ShopCard from '@/components/home/ShopCard';
import { Loader, AlertCircle } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  distance_km?: number;
  activeSubscription?: any;
}

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query && !category) {
      setLoading(false);
      return;
    }

    fetchResults();
  }, [query, category]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (category) params.set('category', category);
      
      // Get user location from localStorage if available
      const savedLocation = localStorage.getItem('user_location');
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        if (location.coordinates?.lat && location.coordinates?.lng) {
          params.set('lat', location.coordinates.lat.toString());
          params.set('lng', location.coordinates.lng.toString());
        }
      }

      const response = await fetch(`/api/shops?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setShops(data.shops || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('ไม่สามารถค้นหาได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">กำลังค้นหา...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium mb-2">เกิดข้อผิดพลาด</p>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchResults}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  // No query state
  if (!query && !category) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">กรุณากรอกคำค้นหา</p>
      </div>
    );
  }

  // Empty results
  if (shops.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-900 font-medium mb-2">ไม่พบผลการค้นหา</p>
        <p className="text-gray-600 text-sm mb-4">
          {query ? `ไม่พบร้านค้าสำหรับ "${query}"` : 'ไม่พบร้านค้าในหมวดหมู่นี้'}
        </p>
        <p className="text-gray-500 text-sm">
          ลองใช้คำค้นหาอื่น หรือเปลี่ยนพื้นที่การค้นหา
        </p>
      </div>
    );
  }

  // Results
  return (
    <div>
      {/* Results Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          ผลการค้นหา
        </h2>
        <p className="text-gray-600">
          พบ {shops.length} ร้านค้า
          {query && <span> สำหรับ "{query}"</span>}
        </p>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => {
          // Determine tier from subscription
          const tier = shop.activeSubscription?.subscription_packages?.tier || 'FREE';
          
          return (
            <ShopCard
              key={shop.id}
              shop={shop}
              tier={tier as any}
            />
          );
        })}
      </div>

      {/* Load More (if needed) */}
      {shops.length >= 50 && (
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500 mb-4">
            แสดง {shops.length} ร้านแรก
          </p>
          <button
            onClick={fetchResults}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            โหลดเพิ่มเติม
          </button>
        </div>
      )}
    </div>
  );
}