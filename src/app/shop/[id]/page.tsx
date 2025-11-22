// src/app/shop/[id]/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

type Shop = {
  id: string;
  name: string;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  }>;
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
  lineManUrl?: string | null;
  grabFoodUrl?: string | null;
  foodPandaUrl?: string | null;
  shopeeUrl?: string | null;
  has_physical_store?: boolean;
  show_location_on_map?: boolean;
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
  const [reviewsLoading, setReviewsLoading] = useState(false);
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

  // Calculate total reviews
  const totalReviews = useMemo(() => reviews.length, [reviews]);

  // Gallery memoized
  const gallery = useMemo(() => {
    return [shop?.image || '/images/placeholder.jpg'];
  }, [shop?.image]);
  
  // Gallery state
  const [selectedImage, setSelectedImage] = useState(0);

  // Determine if map should be shown
  const shouldShowMap = useMemo(() => {
    if (!shop) return false;
    // ไม่มีหน้าร้าน = ไม่แสดงแผนที่
    if (!shop.has_physical_store) return false;
    // มีหน้าร้าน + show_location_on_map = true = แสดงแผนที่
    return shop.show_location_on_map === true;
  }, [shop]);

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
      <div className="relative h-[400px] md:h-[500px] w-full bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
        <img
          src={gallery[selectedImage]}
          alt={shop.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/images/placeholder.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        {/* Shop Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl md:text-5xl font-bold">{shop.name}</h1>
                  {shop.package_tier && PACKAGE_BADGES[shop.package_tier]?.emoji && (
                    <span className="text-2xl md:text-3xl">{PACKAGE_BADGES[shop.package_tier]?.emoji}</span>
                  )}
                </div>
                {shop.categories && shop.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {shop.categories.map((cat) => (
                      <div key={cat.id} className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                        {cat.icon && <span className="text-sm">{cat.icon}</span>}
                        <p className="text-sm md:text-base font-medium">{cat.name}</p>
                      </div>
                    ))}
                  </div>
                )}
                {(shop.district || shop.province) && (
                  <p className="text-base md:text-lg opacity-90 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span>{shop.district}{shop.district && shop.province ? ', ' : ''}{shop.province}</span>
                  </p>
                )}
              </div>
              {shop.package_tier && PACKAGE_BADGES[shop.package_tier]?.text && (
                <div className={`${PACKAGE_BADGES[shop.package_tier].color} px-4 md:px-6 py-2 md:py-3 rounded-full text-white font-semibold shadow-xl flex items-center gap-2 self-start md:self-auto`}>
                  <span className="text-lg md:text-xl">{PACKAGE_BADGES[shop.package_tier]?.emoji}</span>
                  <span className="text-sm md:text-base">{PACKAGE_BADGES[shop.package_tier]?.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Delivery Links - Mobile Only (แสดงก่อนเนื้อหาหลักบน mobile) */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🛵</span>
              สั่งออนไลน์
            </h3>
            <div className="space-y-2">
              {shop.lineManUrl ? (
                <a
                  href={shop.lineManUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-green-700">LINE MAN</p>
                    <p className="text-xs text-gray-500">สั่งผ่าน LINE MAN</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-green-600">→</span>
                </a>
              ) : (
                <a
                  href={`https://lineman.line.me/search?q=${encodeURIComponent(shop.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group opacity-60"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-green-700">LINE MAN</p>
                    <p className="text-xs text-gray-500">ค้นหาร้านบน LINE MAN</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-green-600">→</span>
                </a>
              )}
              
              {shop.grabFoodUrl ? (
                <a
                  href={shop.grabFoodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-green-700">Grab Food</p>
                    <p className="text-xs text-gray-500">สั่งผ่าน Grab</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-green-600">→</span>
                </a>
              ) : (
                <a
                  href={`https://food.grab.com/th/th/search?query=${encodeURIComponent(shop.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group opacity-60"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-green-700">Grab Food</p>
                    <p className="text-xs text-gray-500">ค้นหาร้านบน Grab</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-green-600">→</span>
                </a>
              )}

              {shop.foodPandaUrl ? (
                <a
                  href={shop.foodPandaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-pink-200 rounded-lg hover:bg-pink-50 hover:border-pink-400 transition group"
                >
                  <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-pink-700">foodpanda</p>
                    <p className="text-xs text-gray-500">สั่งผ่าน foodpanda</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-pink-600">→</span>
                </a>
              ) : (
                <a
                  href={`https://www.foodpanda.co.th/search?query=${encodeURIComponent(shop.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-pink-50 hover:border-pink-400 transition group opacity-60"
                >
                  <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-pink-700">foodpanda</p>
                    <p className="text-xs text-gray-500">ค้นหาร้านบน foodpanda</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-pink-600">→</span>
                </a>
              )}

              {shop.shopeeUrl && (
                <a
                  href={shop.shopeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-400 transition group"
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-orange-700">Shopee Food</p>
                    <p className="text-xs text-gray-500">สั่งผ่าน Shopee</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-orange-600">→</span>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>📝</span>
                เกี่ยวกับร้าน
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {shop.description || `ร้าน ${shop.name} ${shop.categories && shop.categories.length > 0 ? `เป็นร้าน${shop.categories[0].name}` : ''} ที่พร้อมให้บริการคุณด้วยความใส่ใจและคุณภาพ`}
              </p>
              {shop.address && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    ที่อยู่
                  </p>
                  <p className="text-gray-800">{shop.address}</p>
                </div>
              )}
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
                    ({averageRating.toFixed(1)} จาก {totalReviews} รีวิว)
                  </span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="border-t pt-6">
                {reviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded ml-14"></div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length > 0 ? (
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
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">💬</span>
                    <p>ยังไม่มีรีวิว</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Links - Desktop Only */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🛵</span>
                สั่งออนไลน์
              </h3>
              <div className="space-y-2">
                {shop.lineManUrl ? (
                  <a
                    href={shop.lineManUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">L</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 group-hover:text-green-700">LINE MAN</p>
                      <p className="text-xs text-gray-500">สั่งผ่าน LINE MAN</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-green-600">→</span>
                  </a>
                ) : (
                  <a
                    href={`https://lineman.line.me/search?q=${encodeURIComponent(shop.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group opacity-60"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">L</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 group-hover:text-green-700">LINE MAN</p>
                      <p className="text-xs text-gray-500">ค้นหาร้านบน LINE MAN</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-green-600">→</span>
                  </a>
                )}
                
                {shop.grabFoodUrl ? (
                  <a
                    href={shop.grabFoodUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group"
                  >
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">G</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 group-hover:text-green-700">Grab Food</p>
                      <p className="text-xs text-gray-500">สั่งผ่าน Grab</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-green-600">→</span>
                  </a>
                ) : (
                  <a
                    href={`https://food.grab.com/th/th/search?query=${encodeURIComponent(shop.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group opacity-60"
                  >
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">G</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 group-hover:text-green-700">Grab Food</p>
                      <p className="text-xs text-gray-500">ค้นหาร้านบน Grab</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-green-600">→</span>
                  </a>
                )}

                {shop.foodPandaUrl ? (
                  <a
                    href={shop.foodPandaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-pink-200 rounded-lg hover:bg-pink-50 hover:border-pink-400 transition group"
                  >
                    <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 group-hover:text-pink-700">foodpanda</p>
                      <p className="text-xs text-gray-500">สั่งผ่าน foodpanda</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-pink-600">→</span>
                  </a>
                ) : (
                  <a
                    href={`https://www.foodpanda.co.th/search?query=${encodeURIComponent(shop.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-pink-50 hover:border-pink-400 transition group opacity-60"
                  >
                    <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 group-hover:text-pink-700">foodpanda</p>
                      <p className="text-xs text-gray-500">ค้นหาร้านบน foodpanda</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-pink-600">→</span>
                  </a>
                )}

                {shop.shopeeUrl && (
                  <a
                    href={shop.shopeeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-400 transition group"
                  >
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 group-hover:text-orange-700">Shopee Food</p>
                      <p className="text-xs text-gray-500">สั่งผ่าน Shopee</p>
                    </div>
                    <span className="text-gray-400 group-hover:text-orange-600">→</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 border border-blue-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>⚡</span>
                ดำเนินการด่วน
              </h3>
              <div className="space-y-3">
                {shouldShowMap && (
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`, '_blank')}
                    disabled={!shop.lat || !shop.lng}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium shadow-sm"
                  >
                    <span>🗺️</span>
                    <span>เปิดแผนที่</span>
                  </button>
                )}
                <button
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
                  onClick={() => alert('ฟีเจอร์กำลังพัฒนา')}
                >
                  <span>💬</span>
                  <span>ติดต่อร้านค้า</span>
                </button>
                <button
                  className="w-full flex items-center justify-center gap-2 bg-pink-600 text-white px-4 py-3 rounded-lg hover:bg-pink-700 transition font-medium shadow-sm"
                  onClick={() => alert('ฟีเจอร์กำลังพัฒนา')}
                >
                  <span>❤️</span>
                  <span>บันทึกร้านโปรด</span>
                </button>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                ที่อยู่ร้าน
              </h3>
              <div className="space-y-2 text-gray-700">
                {shop.subdistrict && (
                  <p>ตำบล/แขวง: <span className="font-medium">{shop.subdistrict}</span></p>
                )}
                {shop.district && (
                  <p>อำเภอ/เขต: <span className="font-medium">{shop.district}</span></p>
                )}
                {shop.province && (
                  <p>จังหวัด: <span className="font-medium">{shop.province}</span></p>
                )}
                {(!shop.subdistrict && !shop.district && !shop.province) && (
                  <p className="text-gray-500 text-sm">ไม่มีข้อมูลที่อยู่</p>
                )}
              </div>
            </div>

            {/* Delivery Links */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🛵</span>
                สั่งออนไลน์
              </h3>
              <div className="space-y-2">
                <a
                  href={`https://lineman.line.me/search?q=${encodeURIComponent(shop.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-green-700">LINE MAN</p>
                    <p className="text-xs text-gray-500">สั่งผ่าน LINE MAN</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-green-600">→</span>
                </a>
                
                <a
                  href={`https://food.grab.com/th/th/search?query=${encodeURIComponent(shop.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-400 transition group"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">G</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-green-700">Grab Food</p>
                    <p className="text-xs text-gray-500">สั่งผ่าน Grab</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-green-600">→</span>
                </a>

                <a
                  href={`https://www.foodpanda.co.th/search?query=${encodeURIComponent(shop.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border border-pink-200 rounded-lg hover:bg-pink-50 hover:border-pink-400 transition group"
                >
                  <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-pink-700">foodpanda</p>
                    <p className="text-xs text-gray-500">สั่งผ่าน foodpanda</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-pink-600">→</span>
                </a>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 <strong>หมายเหตุ:</strong> ลิงก์จะเปิดหน้าค้นหาบนแพลตฟอร์มต่างๆ
                </p>
              </div>
            </div>

            {/* Map */}
            {shouldShowMap && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>🗺️</span>
                  แผนที่
                </h3>
                {shop.lat && shop.lng ? (
                  <div className="relative">
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${shop.lat},${shop.lng}&zoom=15`}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Shop Location Map"
                      />
                    </div>
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`, '_blank')}
                      className="mt-3 w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                    >
                      <span>🧭</span>
                      <span>นำทาง</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-100 h-48 rounded-lg flex flex-col items-center justify-center text-gray-500">
                    <svg className="w-12 h-12 mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm">ไม่มีข้อมูลพิกัด</p>
                  </div>
                )}
              </div>
            )}

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