// src/app/bookmarks/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Star, Trash2, ExternalLink } from "lucide-react";

interface BookmarkedShop {
  id: string;
  name: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  address: string;
  bookmarkedAt: string;
}

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "recent" | "rating">("all");

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
            <Heart className="text-red-500" size={40} fill="currentColor" />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
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
        </div>

        {/* Bookmarked Shops */}
        {filteredBookmarks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Heart className="mx-auto mb-4 text-gray-400" size={64} />
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
      </div>
    </div>
  );
}