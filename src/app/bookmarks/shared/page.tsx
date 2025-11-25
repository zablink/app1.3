// src/app/bookmarks/shared/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, ExternalLink, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";

const BookmarkMapView = dynamic(() => import("@/components/BookmarkMapView"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">กำลังโหลดแผนที่...</p>
    </div>
  ),
});

interface Shop {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  address: string;
  lat: number | null;
  lng: number | null;
}

export default function SharedBookmarksPage() {
  const searchParams = useSearchParams();
  const shopIds = searchParams.get("shops")?.split(",") || [];

  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (shopIds.length > 0) {
      fetchShops();
    } else {
      setIsLoading(false);
    }
  }, [shopIds]);

  const fetchShops = async () => {
    try {
      setIsLoading(true);
      // Fetch shops data
      const responses = await Promise.all(
        shopIds.map((id) =>
          fetch(`/api/shops/${id}`).then((res) => (res.ok ? res.json() : null))
        )
      );

      const validShops = responses.filter((shop) => shop !== null);
      setShops(validShops);
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์ของคุณไม่รองรับ Geolocation");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoadingLocation(false);
        setViewMode("map");
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("ไม่สามารถเข้าถึงตำแหน่งของคุณได้");
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดรายการร้าน...</p>
        </div>
      </div>
    );
  }

  if (shopIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Star className="mx-auto mb-4 text-gray-400" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ไม่พบรายการร้าน
          </h2>
          <p className="text-gray-600 mb-6">
            ลิงก์แชร์ไม่ถูกต้องหรือไม่มีข้อมูลร้าน
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Star size={32} fill="currentColor" />
              <h1 className="text-3xl font-bold">รายการร้านที่แชร์มา</h1>
            </div>
            <p className="text-blue-100">
              เพื่อนของคุณแชร์รายการร้าน {shops.length} ร้านมาให้
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">
              มุมมอง:
            </span>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              รายการ
            </button>
            <button
              onClick={() => {
                if (!userLocation) {
                  handleGetLocation();
                } else {
                  setViewMode("map");
                }
              }}
              disabled={isLoadingLocation}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === "map"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } ${isLoadingLocation ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <MapIcon size={16} />
              {isLoadingLocation ? "กำลังโหลด..." : "แผนที่"}
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === "map" ? (
          <BookmarkMapView bookmarks={shops} userLocation={userLocation} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition group"
              >
                <Link href={`/shop/${shop.id}`} className="block relative h-48">
                  <Image
                    src={shop.image || "/placeholder-shop.jpg"}
                    alt={shop.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                </Link>

                <div className="p-4">
                  <Link
                    href={`/shop/${shop.id}`}
                    className="block hover:text-blue-600 transition"
                  >
                    <h3 className="font-bold text-lg mb-1 line-clamp-1">
                      {shop.name}
                    </h3>
                  </Link>

                  <p className="text-sm text-gray-600 mb-2">{shop.category}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">
                      <Star
                        className="text-yellow-400"
                        size={16}
                        fill="currentColor"
                      />
                      <span className="ml-1 text-sm font-semibold">
                        {shop.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({shop.reviewCount} รีวิว)
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{shop.address}</span>
                  </div>

                  <Link
                    href={`/shop/${shop.id}`}
                    className="block w-full py-2 text-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-sm"
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
