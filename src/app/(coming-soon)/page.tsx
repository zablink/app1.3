// src/app/(coming-soon)/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

type Shop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  packageType: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  distance?: number;
};

export default function HomePage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLocation, setManualLocation] = useState({ lat: "", lng: "" });
  const [locationMethod, setLocationMethod] = useState<"auto" | "manual">("auto");

  // Function to fetch shops from API
  const fetchShops = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/shops?lat=${lat}&lng=${lng}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch shops`);
      }
      const data = await response.json();
      
      // Check if data has an error property
      if (data.error) {
        throw new Error(data.error);
      }
      
      setShops(data);
    } catch (err) {
      console.error("Error fetching shops:", err);
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลร้านค้าได้ กรุณาลองใหม่อีกครั้ง");
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location
  const getUserLocation = () => {
    setLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          fetchShops(latitude, longitude);
        },
        (err) => {
          setError(`Geolocation error: ${err.message}`);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
    }
  };

  // Handle manual location search
  const handleManualSearch = () => {
    const lat = parseFloat(manualLocation.lat);
    const lng = parseFloat(manualLocation.lng);

    if (isNaN(lat) || isNaN(lng)) {
      setError("Please enter valid coordinates");
      return;
    }

    setLocation({ lat, lng });
    fetchShops(lat, lng);
  };

  // Auto-load with user location on component mount (only once)
  useEffect(() => {
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              🍴 ค้นหาร้านอาหารใกล้คุณ
            </h1>
            <p className="text-gray-600">
              ค้นหาร้านอาหารและเครื่องดื่มในพื้นที่ของคุณ
            </p>
          </div>

          {/* Location Method Toggle */}
          <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-4 mb-4 flex-wrap">
              <button
                onClick={() => {
                  setLocationMethod("auto");
                  getUserLocation();
                }}
                className={`px-4 py-2 rounded-lg transition ${
                  locationMethod === "auto"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                📍 ใช้ตำแหน่งปัจจุบัน
              </button>
              <button
                onClick={() => setLocationMethod("manual")}
                className={`px-4 py-2 rounded-lg transition ${
                  locationMethod === "manual"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                🗺️ ระบุตำแหน่งเอง
              </button>
            </div>

            {/* Manual Location Input */}
            {locationMethod === "manual" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Latitude (เช่น 13.7563)"
                    value={manualLocation.lat}
                    onChange={(e) =>
                      setManualLocation({ ...manualLocation, lat: e.target.value })
                    }
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="text"
                    placeholder="Longitude (เช่น 100.5018)"
                    value={manualLocation.lng}
                    onChange={(e) =>
                      setManualLocation({ ...manualLocation, lng: e.target.value })
                    }
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  onClick={handleManualSearch}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  ค้นหาร้าน
                </button>
              </div>
            )}

            {/* Current Location Display */}
            {location && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  📍 ตำแหน่งปัจจุบัน: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">❌ {error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-600">กำลังค้นหาร้านใกล้คุณ...</span>
            </div>
          )}

          {/* Shops Grid */}
          {!loading && shops.length === 0 && !error && location && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                ไม่พบร้านค้าในบริเวณนี้ ลองค้นหาในพื้นที่อื่น
              </p>
            </div>
          )}

          {!loading && shops.length > 0 && (
            <div>
              <p className="text-gray-600 mb-4">
                พบ {shops.length} ร้านค้า
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop, index) => (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden"
                  >
                    <Link href={`/shop/${shop.id}`}>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg text-gray-800">
                            {shop.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            shop.packageType === "special" ? "bg-purple-100 text-purple-800" :
                            shop.packageType === "pro3" ? "bg-yellow-100 text-yellow-800" :
                            shop.packageType === "pro2" ? "bg-orange-100 text-orange-800" :
                            shop.packageType === "pro1" ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {shop.packageType.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          {shop.distance !== undefined && (
                            <p>📍 ระยะทาง: {shop.distance.toFixed(2)} กม.</p>
                          )}
                          {shop.subdistrict && (
                            <p>📌 {shop.subdistrict}</p>
                          )}
                          {shop.district && (
                            <p>🏘️ {shop.district}</p>
                          )}
                          {shop.province && (
                            <p>🗺️ {shop.province}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}