// src/app/shop/[shopId]/ShopDetailPageClient.tsx

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import BookmarkButton from "@/components/BookmarkButton";

// Move types to a shared file in a real app
type Shop = {
  id: string;
  name: string;
  categories?: Array<{ id: string; name: string; slug: string; icon?: string | null; }>;
  image: string | null;
  gallery?: Array<{ id: string; url: string; }>;
  lat: number | null;
  lng: number | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  description?: string | null;
  address?: string | null;
  package_tier?: string | null;
  isOG?: boolean;
  ogBadgeEnabled?: boolean;
  lineManUrl?: string | null;
  grabFoodUrl?: string | null;
  foodPandaUrl?: string | null;
  shopeeUrl?: string | null;
  has_physical_store?: boolean;
  show_location_on_map?: boolean;
  isMockup?: boolean;
};

type Review = { id: number; userName: string; rating: number; comment: string; date: string; };

const mockReviews: Review[] = []; // Reviews should be passed as props

const PACKAGE_BADGES: Record<string, { emoji: string; text: string; color: string }> = {
  PREMIUM: { emoji: '👑', text: 'Premium Partner', color: 'bg-gradient-to-r from-yellow-400 to-amber-500' },
  PRO: { emoji: '🔥', text: 'Pro Shop', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  BASIC: { emoji: '⭐', text: 'Verified', color: 'bg-gradient-to-r from-blue-400 to-cyan-400' },
  FREE: { emoji: '', text: '', color: '' },
};

interface ShopDetailPageClientProps {
  shop: Shop;
  initialReviews: Review[]; // Pass reviews from server
}

export default function ShopDetailPageClient({ shop, initialReviews }: ShopDetailPageClientProps) {
  const router = useRouter();
  
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [newReview, setNewReview] = useState({ userName: "", rating: 5, comment: "" });

  const averageRating = useMemo(() => reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0, [reviews]);
  const totalReviews = useMemo(() => reviews.length, [reviews]);

  const gallery = useMemo(() => shop?.gallery?.map(img => img.url) || [], [shop?.gallery]);
  const heroImage = useMemo(() => shop?.image || '/images/placeholder.jpg', [shop?.image]);
  
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const shouldShowMap = useMemo(() => shop.has_physical_store && shop.show_location_on_map, [shop]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.userName || !newReview.comment) return;
    const review: Review = {
      id: reviews.length + 1,
      ...newReview,
      date: new Date().toISOString().split('T')[0]
    };
    setReviews([review, ...reviews]);
    setNewReview({ userName: "", rating: 5, comment: "" });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev === 0 ? gallery.length - 1 : prev - 1));
      if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev === gallery.length - 1 ? 0 : prev + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, gallery.length]);

  // Return statement with the full JSX from the original component
  // This is a simplified version for brevity. In practice, you'd move the entire JSX here.
  return (
    <div>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
         <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-blue-600">หน้าหลัก</Link>
          <span>›</span>
          <span className="text-gray-900">{shop.name}</span>
        </div>
      </div>

      {/* Hero Image */}
       <div className="relative h-[400px] md:h-[500px] w-full bg-gray-800">
         <img src={heroImage} alt={shop.name} className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
         <div className="absolute top-4 right-4 z-10"><BookmarkButton shopId={shop.id} size="lg" /></div>
         <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
           <h1 className="text-3xl md:text-5xl font-bold">{shop.name}</h1>
           {/* ... other hero content ... */}
         </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           {/* Description */}
           <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">เกี่ยวกับร้าน</h2>
              <p className="text-gray-700 whitespace-pre-line">{shop.description || 'No description available.'}</p>
           </div>
           {/* Reviews */}
           <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-4">รีวิว ({totalReviews})</h2>
              {/* ... review list and form ... */}
           </div>
        </div>
        <div className="space-y-6">
            {/* Delivery Links */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">สั่งออนไลน์</h3>
                {/* ... delivery links ... */}
            </div>
            {/* Map */}
            {shouldShowMap && shop.lat && shop.lng && (
                 <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">แผนที่</h3>
                    <iframe src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${shop.lat},${shop.lng}`} width="100%" height="200" loading="lazy"></iframe>
                 </div>
            )}
        </div>
      </div>

      {/* Lightbox would be here */}
    </div>
  );
}
