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
  package_tier?: string | null;
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

// Package configurations
const PACKAGES = {
  PREMIUM: {
    name: 'พรีเมียม',
    emoji: '👑',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
  },
  PRO: {
    name: 'โปร',
    emoji: '🔥',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  },
  BASIC: {
    name: 'เบสิค',
    emoji: '⭐',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-gradient-to-r from-blue-400 to-cyan-400 text-white',
  },
  FREE: {
    name: 'ฟรี',
    emoji: '',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-400 text-white',
  },
};

// Haversine formula
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
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

export default function HomePage() {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ province?: string }>({});
  
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  
  // แยก shops ตาม package
  const [premiumShops, setPremiumShops] = useState<Shop[]>([]);
  const [proShops, setProShops] = useState<Shop[]>([]);
  const [basicShops, setBasicShops] = useState<Shop[]>([]);
  const [freeShops, setFreeShops] = useState<Shop[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Fetch data from API
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [shopsRes, bannersRes] = await Promise.all([
          fetch('/api/shops'),
          fetch('/api/banners'),
        ]);

        if (!shopsRes.ok) {
          throw new Error(`Failed to fetch shops: ${shopsRes.status}`);
        }
        if (!bannersRes.ok) {
          throw new Error(`Failed to fetch banners: ${bannersRes.status}`);
        }

        const shopsData = await shopsRes.json();
        const bannersData = await bannersRes.json();

        const sortedBanners = bannersData.sort((a: Banner, b: Banner) => a.order - b.order);

        setAllShops(shopsData);
        setBanners(sortedBanners);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLat(latitude);
        setUserLng(longitude);

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) return;

        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
          );
          const data = await res.json();

          if (data.results && data.results[0]) {
            const province = data.results[0].address_components?.find((c: AddressComponent) =>
              c.types.includes("administrative_area_level_1")
            )?.long_name;

            if (province) {
              setUserLocation({ province });
            }
          }
        } catch (err) {
          console.log("Reverse geocoding error:", err);
        }
      },
      (err) => console.log("Location permission denied:", err)
    );
  }, []);

  // จัดกลุ่ม shops ตาม package และ location
  useEffect(() => {
    if (allShops.length === 0) return;

    // กรองร้านตาม location
    let filteredShops = allShops;

    if (userLat !== null && userLng !== null) {
      const nearby = allShops.filter((shop) => {
        if (shop.lat === null || shop.lng === null) return false;
        return getDistance(userLat, userLng, shop.lat, shop.lng) <= 5;
      });

      if (nearby.length > 0) {
        filteredShops = nearby;
      } else if (userLocation.province) {
        const sameProv = allShops.filter(
          (shop) => shop.province === userLocation.province
        );
        if (sameProv.length > 0) {
          filteredShops = sameProv;
        }
      }
    }

    // แยกร้านตาม package_tier
    const premium = filteredShops.filter(s => s.package_tier === 'PREMIUM');
    const pro = filteredShops.filter(s => s.package_tier === 'PRO');
    const basic = filteredShops.filter(s => s.package_tier === 'BASIC');
    const free = filteredShops.filter(s => !s.package_tier || s.package_tier === 'FREE');

    // Random และจำกัดจำนวน (สูงสุด 12 รายการต่อ section)
    setPremiumShops(premium.sort(() => 0.5 - Math.random()).slice(0, 12));
    setProShops(pro.sort(() => 0.5 - Math.random()).slice(0, 12));
    setBasicShops(basic.sort(() => 0.5 - Math.random()).slice(0, 12));
    setFreeShops(free.sort(() => 0.5 - Math.random()).slice(0, 12));

  }, [userLat, userLng, userLocation, allShops]);

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
      {/* ========== Hero Banner ========== */}
      {banners.length > 0 && (
        <div className="w-full overflow-hidden mb-8">
          <div className="relative h-64 sm:h-80 md:h-96 lg:h-[28rem] rounded-lg overflow-hidden shadow-lg">
            {banners.map((banner, i) => (
              <Link
                key={banner.id}
                href={banner.link ?? "#"}
                className="absolute inset-0 w-full h-full"
              >
                <motion.img
                  src={banner.image}
                  alt={`Banner ${banner.order}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i === currentBanner ? 1 : 0 }}
                  transition={{ duration: 0.8 }}
                />
              </Link>
            ))}

            {banners.length > 1 && (
              <>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentBanner(i)}
                      aria-label={`Go to banner ${i + 1}`}
                      className={`w-3 h-3 rounded-full transition-all ${
                        i === currentBanner
                          ? "bg-white scale-110 shadow-lg"
                          : "bg-white/50 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentBanner((prev) =>
                      prev === 0 ? banners.length - 1 : prev - 1
                    )
                  }
                  className="hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition z-10"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setCurrentBanner((prev) => (prev + 1) % banners.length)
                  }
                  className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition z-10"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========== Package Sections ========== */}
      
      {/* Premium Section */}
      {premiumShops.length > 0 && (
        <PackageSection
          title="ร้านค้าพรีเมียม"
          shops={premiumShops}
          config={PACKAGES.PREMIUM}
        />
      )}

      {/* Pro Section */}
      {proShops.length > 0 && (
        <PackageSection
          title="ร้านค้าโปร"
          shops={proShops}
          config={PACKAGES.PRO}
        />
      )}

      {/* Basic Section */}
      {basicShops.length > 0 && (
        <PackageSection
          title="ร้านค้าเบสิค"
          shops={basicShops}
          config={PACKAGES.BASIC}
        />
      )}

      {/* Free Section */}
      {freeShops.length > 0 && (
        <PackageSection
          title="ร้านค้าทั่วไป"
          shops={freeShops}
          config={PACKAGES.FREE}
        />
      )}

      {/* No shops */}
      {premiumShops.length === 0 && proShops.length === 0 && basicShops.length === 0 && freeShops.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">ไม่พบร้านค้าในขณะนี้</p>
        </div>
      )}

      {/* View all button */}
      <div className="text-center mt-12 mb-8">
        <Link
          href="/shop"
          className="inline-block px-8 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all"
        >
          ดูร้านค้าทั้งหมด
        </Link>
      </div>
  );
}

// ========== Package Section Component ==========
type PackageSectionProps = {
  title: string;
  shops: Shop[];
  config: typeof PACKAGES.PREMIUM;
};

function PackageSection({ title, shops, config }: PackageSectionProps) {
  return (
    <div className={`${config.bg} border ${config.border} rounded-2xl p-6 mb-8 shadow-sm`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-3xl">{config.emoji}</span>
          {title}
        </h2>
        <span className={`${config.badge} px-4 py-1 rounded-full text-sm font-semibold shadow-md`}>
          {config.name}
        </span>
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {shops.map((shop, i) => (
          <motion.div
            key={shop.id}
            className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-all"
            whileHover={{ scale: 1.02, y: -4 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link href={`/shop/${shop.id}`}>
              <div className="relative h-48 bg-gray-200">
                <img
                  src={shop.image || '/images/placeholder.jpg'}
                  alt={shop.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
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
                  <p className="text-xs text-gray-400">
                    📍 {shop.district}{shop.district && shop.province ? ', ' : ''}{shop.province}
                  </p>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}