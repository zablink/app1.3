// src/app/page.tsx

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

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
};

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

type Banner = {
  id: number;
  image: string;
  link: string | null;
  order: number;
};

// --- Haversine formula (เหมือนเดิม) ---
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- HomePage ---
export default function HomePage() {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ province?: string }>({});
  const [displayShops, setDisplayShops] = useState<Shop[]>([]);
  
  // ⭐ State สำหรับ fetch data
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero Banner
  const [currentBanner, setCurrentBanner] = useState(0);

  // ⭐ Fetch data from API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch shops and banners in parallel
        const [shopsRes, bannersRes] = await Promise.all([
          fetch('/api/shops'),
          fetch('/api/banners'),
        ]);

        if (!shopsRes.ok || !bannersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const shopsData = await shopsRes.json();
        const bannersData = await bannersRes.json();

        setAllShops(shopsData);
        setBanners(bannersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Banner carousel
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // --- Get user location ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);

          // --- Google reverse geocode ---
          if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            const data: { results?: { address_components: AddressComponent[] }[] } =
              await res.json();

            const province = data.results?.[0]?.address_components?.find((c) =>
              c.types.includes("administrative_area_level_1")
            )?.long_name;

            if (province) setUserLocation({ province });
          }
        },
        (err) => console.log("Location error:", err)
      );
    }
  }, []);

  // --- Determine shops to display ---
  useEffect(() => {
    if (allShops.length === 0) return;

    let result: Shop[] = [];

    if (userLat !== null && userLng !== null) {
      // 1. ร้านใกล้ ≤ 5 กม.
      const nearby = allShops.filter((shop) => {
        if (shop.lat === null || shop.lng === null) return false;
        return getDistance(userLat, userLng, shop.lat, shop.lng) <= 5;
      });

      if (nearby.length > 0) {
        result = nearby;
      } else if (userLocation.province) {
        // 2. ร้านใน province เดียวกัน
        const sameProv = allShops.filter(
          (shop) => shop.province === userLocation.province
        );
        if (sameProv.length > 0) result = sameProv;
      }
    }

    // 3. ถ้าไม่มี location หรือไม่มีร้านใกล้/ในจังหวัด → random 12 ร้าน
    if (result.length === 0) {
      result = [...allShops].sort(() => 0.5 - Math.random()).slice(0, 12);
    } else if (result.length > 12) {
      // ถ้ามีร้านมากกว่า 12 ร้าน → random 12 ร้านจากผลลัพธ์
      result = [...result].sort(() => 0.5 - Math.random()).slice(0, 12);
    }

    setDisplayShops(result);
  }, [userLat, userLng, userLocation, allShops]);

  // ⭐ Loading state
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

  return (
    <AppLayout>
      {/* ---------------- Hero Banner ---------------- */}
      {banners.length > 0 && (
        <div className="w-full overflow-hidden mb-6 mt-0 pt-0 sm:pt-2 md:pt-4">
          <div className="relative h-80 sm:h-96 md:h-[28rem]">
            {banners.map((banner, i) => (
              <Link
                key={banner.id}
                href={banner.link ?? "#"}
                className="absolute inset-0 w-full h-full"
              >
                <motion.img
                  src={banner.image}
                  alt={`Banner ${banner.id}`}
                  className="w-full h-full object-contain md:object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i === currentBanner ? 1 : 0 }}
                  transition={{ duration: 1 }}
                />
              </Link>
            ))}

            {/* ---------------- Dot navigator ---------------- */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBanner(i)}
                  className={`w-3 h-3 rounded-full ${
                    i === currentBanner
                      ? "bg-white shadow-md"
                      : "bg-white/50 shadow-sm"
                  }`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">รายชื่อร้าน</h2>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Shop grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          {displayShops.map((shop, i) => (
            <motion.div
              key={shop.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/shop/${shop.id}`}>
                <img
                  src={shop.image || '/images/placeholder.jpg'}
                  alt={shop.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h2 className="font-semibold text-lg">{shop.name}</h2>
                  <p className="text-sm text-gray-500">{shop.category}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View all button */}
        <div className="text-center">
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow hover:bg-blue-600 transition"
          >
            ดูทั้งหมด
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}