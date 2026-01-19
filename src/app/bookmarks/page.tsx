// src/app/bookmarks/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Trash2, ExternalLink, Map, List, Share2 } from "lucide-react";
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

interface BookmarkedShop {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  address: string;
  lat: number | null;
  lng: number | null;
  bookmarkedAt: string;
  notes?: string;
  tags?: string[];
}

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "recent" | "rating">("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    
    if (status === "authenticated") {
      fetchBookmarks();
    }
  }, [status, router]);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user/bookmarks");
      const data = await res.json();
      
      if (res.ok) {
        setBookmarks(data.bookmarks || []);
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (shopId: string) => {
    if (!confirm("ต้องการลบร้านนี้ออกจากบุ๊คมาร์คหรือไม่?")) return;

    try {
      const res = await fetch(`/api/user/bookmarks/${shopId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setBookmarks(prev => prev.filter(shop => shop.id !== shopId));
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
  };

  const getFilteredBookmarks = () => {
    switch (filter) {
      case "recent":
        return [...bookmarks].sort((a, b) => 
          new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()
        );
      case "rating":
        return [...bookmarks].sort((a, b) => b.rating - a.rating);
      default:
        return bookmarks;
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
        alert("ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง");
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleShareBookmarks = async () => {
    // สร้าง URL สำหรับแชร์
    const shopIds = bookmarks.map(b => b.id).join(',');
    const url = `${window.location.origin}/bookmarks/shared?shops=${shopIds}`;
    setShareUrl(url);
    setShowShareModal(true);
  };

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("คัดลอกลิงก์เรียบร้อย!");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      alert("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดบุ๊คมาร์ค...</p>
        </div>
      </div>
    );
  }

  const filteredBookmarks = getFilteredBookmarks();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                บุ๊คมาร์คของฉัน
              </h1>
              <p className="text-gray-600">
                ร้านที่คุณบันทึกไว้ทั้งหมด ({bookmarks.length} ร้าน)
              </p>
            </div>
            <div className="flex items-center gap-3">
              {bookmarks.length > 0 && (
                <button
                  onClick={handleShareBookmarks}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  title="แชร์รายการร้านให้เพื่อน"
                >
                  <Share2 size={20} />
                  <span className="hidden sm:inline">แชร์</span>
                </button>
              )}
              <Star className="text-yellow-500" size={40} fill="currentColor" />
            </div>
          </div>
        </div>

        {/* View Mode Toggle & Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 space-y-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 pb-4 border-b">
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
              <List size={16} />
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
              <Map size={16} />
              {isLoadingLocation ? "กำลังโหลด..." : "แผนที่"}
            </button>
            {viewMode === "map" && userLocation && (
              <button
                onClick={handleGetLocation}
                className="ml-auto px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition"
              >
                🔄 อัปเดตตำแหน่ง
              </button>
            )}
          </div>

          {/* Filters - แสดงเฉพาะใน list mode */}
          {viewMode === "list" && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">
                เรียงตาม:
              </span>
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilter("recent")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "recent"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ล่าสุด
              </button>
              <button
                onClick={() => setFilter("rating")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === "rating"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                คะแนนสูงสุด
              </button>
            </div>
          )}
        </div>

        {/* Bookmarked Shops */}
        {filteredBookmarks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Star className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ยังไม่มีร้านที่บันทึกไว้
            </h3>
            <p className="text-gray-600 mb-6">
              เริ่มบันทึกร้านที่คุณชอบเพื่อเข้าถึงได้ง่ายๆ
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <ExternalLink size={20} />
              ค้นหาร้านอาหาร
            </Link>
          </div>
        ) : viewMode === "map" ? (
          <BookmarkMapView bookmarks={filteredBookmarks} userLocation={userLocation} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookmarks.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition group"
              >
                {/* Shop Image */}
                <Link href={`/shop/${shop.id}`} className="block relative h-48">
                  <Image
                    src={shop.image || "/placeholder-shop.jpg"}
                    alt={shop.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveBookmark(shop.id);
                      }}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-red-50 transition shadow-lg"
                      title="ลบออกจากบุ๊คมาร์ค"
                    >
                      <Trash2 className="text-red-500" size={18} />
                    </button>
                  </div>
                </Link>

                {/* Shop Info */}
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

                  {/* Rating */}
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

                  {/* Address */}
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{shop.address}</span>
                  </div>

                  {/* Bookmarked Date */}
                  <div className="text-xs text-gray-500 pt-3 border-t">
                    บันทึกเมื่อ{" "}
                    {new Date(shop.bookmarkedAt).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {/* Action Button */}
                <div className="px-4 pb-4">
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

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  แชร์รายการร้าน
                </h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                คัดลอกลิงก์ด้านล่างเพื่อแชร์รายการร้าน {bookmarks.length} ร้านให้เพื่อนของคุณ
              </p>

              <div className="bg-gray-50 p-3 rounded-lg mb-4 break-all text-sm text-gray-700">
                {shareUrl}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyShareUrl}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  คัดลอกลิงก์
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}