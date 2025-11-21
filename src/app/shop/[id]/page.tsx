// src/app/shop/[id]/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

type Shop = {
  id: string;
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

type Review = {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

// Mock reviews (ในอนาคตจะดึงจาก API)
const mockReviews: Review[] = [
  {
    id: 1,
    userName: "สมชาย ใจดี",
    rating: 5,
    comment: "อร่อยมาก บริการดี จะมาใหม่แน่นอน",
    date: "2025-10-15"
  },
  {
    id: 2,
    userName: "กิตติ รักอาหาร",
    rating: 4,
    comment: "รสชาติดี แต่รอนานหน่อย",
    date: "2025-10-10"
  },
  {
    id: 3,
    userName: "นิดา หิวข้าว",
    rating: 5,
    comment: "เป็นร้านประจำแล้ว อาหารสด สะอาด",
    date: "2025-10-05"
  }
];

// Package badge configuration
const PACKAGE_BADGES: Record<string, { emoji: string; text: string; color: string }> = {
  PREMIUM: { emoji: '👑', text: 'Premium Partner', color: 'bg-gradient-to-r from-yellow-400 to-amber-500' },
  PRO: { emoji: '🔥', text: 'Pro Shop', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  BASIC: { emoji: '⭐', text: 'Verified', color: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
  FREE: { emoji: '', text: '', color: '' },
};

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params?.id as string | undefined;

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [newReview, setNewReview] = useState({
    userName: "",
    rating: 5,
    comment: ""
  });

  // Calculate average rating (memoized)
  const averageRating = useMemo(() => {
    return reviews.length > 0
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      : 0;
  }, [reviews]);

  // Gallery memoized
  const gallery = useMemo(() => {
    return [shop?.image || '/images/placeholder.jpg'];
  }, [shop?.image]);
  
  // Gallery state
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    async function fetchShop() {
      if (!shopId) {
        setError('รหัสร้านค้าไม่ถูกต้อง');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/shops/${shopId}`, {
          next: { revalidate: 60 } // Cache for 60 seconds
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('ไม่พบร้านค้าที่คุณต้องการ');
          }
          throw new Error(`เกิดข้อผิดพลาดในการโหลดข้อมูล`);
        }

        const data = await response.json();
        setShop(data);
      } catch (err) {
        console.error('Error fetching shop:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } finally {
        setLoading(false);
      }
    }

    fetchShop();
  }, [shopId]);

  // Submit review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.userName || !newReview.comment) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    const review: Review = {
      id: reviews.length + 1,
      userName: newReview.userName,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split('T')[0]
    };

    setReviews([review, ...reviews]);
    setNewReview({ userName: "", rating: 5, comment: "" });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Skeleton Header */}
        <div className="h-96 bg-gray-300 animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="h-6 bg-gray-300 rounded w-1/2 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !shop) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'ไม่พบร้านค้า'}
          </h2>
          <p className="text-gray-600 mb-4">
            ไม่พบร้านค้าที่ท่านต้องการ หรือร้านค้าอาจถูกลบไปแล้ว
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              ย้อนกลับ
            </button>
            <Link
              href="/shop"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              ดูร้านค้าทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">หน้าหลัก</Link>
          <span>›</span>
          <Link href="/shop" className="hover:text-blue-600">ร้านค้าทั้งหมด</Link>
          <span>›</span>
          <span className="text-gray-900">{shop.name}</span>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-96 w-full bg-gray-200 overflow-hidden">
        <img
          src={gallery[selectedImage]}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        {/* Shop Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
                {shop.category && (
                  <p className="text-xl mb-2">{shop.category}</p>
                )}
                {(shop.district || shop.province) && (
                  <p className="text-lg opacity-90">
                    📍 {shop.district}{shop.district && shop.province ? ', ' : ''}{shop.province}
                  </p>
                )}
              </div>
              {shop.package_tier && PACKAGE_BADGES[shop.package_tier]?.text && (
                <div className={`${PACKAGE_BADGES[shop.package_tier].color} px-4 py-2 rounded-full text-white font-semibold shadow-lg flex items-center gap-2`}>
                  <span className="text-xl">{PACKAGE_BADGES[shop.package_tier]?.emoji}</span>
                  <span>{PACKAGE_BADGES[shop.package_tier]?.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">เกี่ยวกับร้าน</h2>
              <p className="text-gray-700 leading-relaxed">
                ร้าน{shop.name} เป็นร้านที่ให้บริการ{shop.category}คุณภาพดี 
                ตั้งอยู่ใจกลางเมืองที่สะดวกต่อการเดินทาง 
                พร้อมบริการด้วยความใส่ใจและคุณภาพในทุกจานอาหาร
              </p>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">รีวิว</h2>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-2xl ${
                          star <= averageRating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-600">
                    ({averageRating.toFixed(1)} จาก {reviews.length} รีวิว)
                  </span>
                </div>
              </div>

              {/* Add Review Form */}
              <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">เขียนรีวิว</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="ชื่อของคุณ"
                      value={newReview.userName}
                      onChange={(e) => setNewReview({...newReview, userName: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <span>คะแนน:</span>
                      <select
                        value={newReview.rating}
                        onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <option key={rating} value={rating}>{rating} ดาว</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <textarea
                    placeholder="เขียนรีวิวของคุณ..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    ส่งรีวิว
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b pb-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {review.userName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{review.userName}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${
                                  star <= review.rating ? "text-yellow-400" : "text-gray-300"
                                }`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 ml-14">{review.comment}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">ข้อมูลติดต่อ</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">📍 ที่อยู่:</span>
                  <p className="font-medium mt-1">
                    {shop.subdistrict && `${shop.subdistrict}, `}
                    {shop.district && `${shop.district}, `}
                    {shop.province}
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Links */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">สั่งออนไลน์</h3>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">L</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">LINE MAN</p>
                    <p className="text-sm text-gray-500">ส่งฟรี เมื่อสั่งครบ 100 บาท</p>
                  </div>
                </a>
                
                <a
                  href="#"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold">G</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Grab Food</p>
                    <p className="text-sm text-gray-500">ส่งเร็ว ภายใน 30 นาที</p>
                  </div>
                </a>

                <a
                  href="#"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                >
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <span className="text-pink-600 font-bold">F</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">foodpanda</p>
                    <p className="text-sm text-gray-500">โปรโมชั่นพิเศษ</p>
                  </div>
                </a>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 คลิกลิงก์ข้างบนเพื่อสั่งอาหารผ่านแอปฯ
                </p>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">แผนที่</h3>
              <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">🗺️ แผนที่ (Coming Soon)</p>
              </div>
            </div>

            {/* Back Button */}
            <Link
              href="/shop"
              className="block w-full text-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              ← ดูร้านค้าทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}