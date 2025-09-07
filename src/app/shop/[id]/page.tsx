// src/app/shop/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

// -----------------------------
// TypeScript Type
// -----------------------------
type Shop = {
  id: number;
  name: string;
  category: string;
  image: string;
  lat: number;
  lng: number;
  subdistrict: string;
  district: string;
  province: string;
  menu?: string[];
  description?: string;
  gallery?: string[];
  rating?: number;
  reviews?: Review[];
  deliveryLinks?: {
    lineMan?: string;
    grabFood?: string;
    foodPanda?: string;
  };
};

type Review = {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: 1,
    userName: "สมชาย ใจดี",
    rating: 5,
    comment: "อร่อยมาก บริการดี จะมาใหม่แน่นอน",
    date: "2024-09-01"
  },
  {
    id: 2,
    userName: "กิตติ รักอาหาร",
    rating: 4,
    comment: "รสชาติดี แต่รอนานหน่อย",
    date: "2024-08-28"
  },
  {
    id: 3,
    userName: "นิดา หิวข้าว",
    rating: 5,
    comment: "เป็นร้านประจำแล้ว อาหารสด สะอาด",
    date: "2024-08-25"
  }
];

// Mock descriptions for different shop types
const mockDescriptions = {
  "อาหารตามสั่ง": "ร้านอาหารตามสั่งที่ให้บริการอาหารไทยต้นตำรับ ปรุงสดใหม่ทุกจาน ด้วยวัตถุดิบคุณภาพดี เสิร์ฟร้อนๆ พร้อมรสชาติที่ถูกปากคนไทย",
  "ก๋วยเตี๋ยว": "ร้านก๋วยเตี๋ยวต้นตำรับ เส้นสด น้ำซุปเข้มข้น หมูสด ปลาลูกชิ้นทำเอง เครื่องเคียงครบครัน บรรยากาศแบบดั้งเดิม",
  "เครื่องดื่ม": "ร้านเครื่องดื่มสดชื่น เน้นคุณภาพเครื่องดื่ม วัตถุดิบพรีเมียม บรรยากาศร้านสบายๆ เหมาะสำหรับนั่งชิลล์หรือซื้อกลับบ้าน",
  "เบเกอรี่": "เบเกอรี่ขนมปังและเค้กสดใหม่ อบทุกวัน วัตถุดิบนำเข้าคุณภาดี หอมกรุ่นทั้งร้าน มีทั้งขนมหวานและขนมคาว"
};

// -----------------------------
// ร้านทั้งหมด 30 ร้าน (เพิ่ม description, gallery, rating)
// -----------------------------
const shops: Shop[] = [
  {
    id: 1, 
    name: "ร้านข้าวผัดอร่อย", 
    category: "อาหารตามสั่ง",
    image: "/images/friedrice.jpg", 
    lat: 13.746, 
    lng: 100.534,
    subdistrict: "วังบูรพา", 
    district: "พระนคร", 
    province: "กรุงเทพฯ",
    menu: ["ข้าวผัดหมู", "ข้าวผัดไก่", "ข้าวผัดกุ้ง", "ข้าวผัดปู"],
    description: mockDescriptions["อาหารตามสั่ง"],
    rating: 4.5,
    gallery: ["/images/friedrice.jpg", "/images/friedrice-2.jpg", "/images/friedrice-3.jpg"],
    deliveryLinks: {
      lineMan: "https://lineman.line.me/shop/1",
      grabFood: "https://food.grab.com/shop/1",
      foodPanda: "https://foodpanda.co.th/shop/1"
    }
  },
  { 
    id: 2, 
    name: "ก๋วยเตี๋ยวเรืออยุธยา", 
    category: "ก๋วยเตี๋ยว",
    image: "/images/noodleboat.jpg", 
    lat: 13.742, 
    lng: 100.538,
    subdistrict: "วังบูรพา", 
    district: "พระนคร", 
    province: "กรุงเทพฯ",
    menu: ["ก๋วยเตี๋ยวน้ำ", "ก๋วยเตี๋ยวแห้ง", "เย็นตาโฟ"],
    description: mockDescriptions["ก๋วยเตี๋ยว"],
    rating: 4.2,
    gallery: ["/images/noodleboat.jpg", "/images/noodle-2.jpg", "/images/noodle-3.jpg"]
  },
  { 
    id: 3, 
    name: "ชานมไข่มุกนุ่มนิ่ม", 
    category: "เครื่องดื่ม",
    image: "/images/milktea.jpg", 
    lat: 13.744, 
    lng: 100.536,
    subdistrict: "วังบูรพา", 
    district: "พระนคร", 
    province: "กรุงเทพฯ",
    menu: ["ชานมไข่มุก", "ชาไทย", "กาแฟเย็น", "โกโก้"],
    description: mockDescriptions["เครื่องดื่ม"],
    rating: 4.7,
    gallery: ["/images/milktea.jpg", "/images/drink-2.jpg", "/images/drink-3.jpg"]
  },
  // ... เพิ่มร้านอื่นๆ ตามต้องการ
];

// Star Rating Component
const StarRating = ({ rating, size = "w-5 h-5" }: { rating: number; size?: string }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${size} ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ⭐
        </span>
      ))}
      <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
};

// Review Component
const ReviewSection = ({ shopId }: { shopId: number }) => {
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [reviews, setReviews] = useState(mockReviews);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0 || userComment.trim() === "") return;

    const newReview: Review = {
      id: reviews.length + 1,
      userName: "ผู้ใช้งาน", // In real app, get from session
      rating: userRating,
      comment: userComment,
      date: new Date().toISOString().split('T')[0]
    };

    setReviews([newReview, ...reviews]);
    setUserRating(0);
    setUserComment("");
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-2xl font-bold mb-4">รีวิวจากลูกค้า</h2>
      
      {/* Review Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">เขียนรีวิว</h3>
        <form onSubmit={handleSubmitReview}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">ให้คะแนน</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setUserRating(star)}
                  className={`w-8 h-8 ${
                    star <= userRating ? "text-yellow-400" : "text-gray-300"
                  } hover:text-yellow-400 transition`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">ความคิดเห็น</label>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={4}
              placeholder="แบ่งปันประสบการณ์ของคุณ..."
            />
          </div>
          
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
            className="bg-white p-4 rounded-lg shadow-sm border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold">{review.userName}</h4>
                <StarRating rating={review.rating} size="w-4 h-4" />
              </div>
              <span className="text-sm text-gray-500">{review.date}</span>
            </div>
            <p className="text-gray-700">{review.comment}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// -----------------------------
// Main Component
// -----------------------------
export default function ShopDetail() {
  const params = useParams();
  const shopId = Number(params?.id);
  const shop = shops.find((s) => s.id === shopId);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!shop) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold">ไม่พบร้านที่คุณเลือก</h1>
        <Link href="/" className="text-blue-600 underline">กลับหน้าหลัก</Link>
      </div>
    );
  }

  // Mock gallery if not provided
  const gallery = shop.gallery || [shop.image, shop.image, shop.image];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={gallery[selectedImage]} 
          alt={shop.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
            <p className="text-xl">{shop.category}</p>
          </div>
        </div>
        
        {/* Back Button */}
        <Link 
          href="/" 
          className="absolute top-4 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-lg text-gray-800 hover:bg-opacity-100 transition"
        >
          ← กลับหน้าหลัก
        </Link>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Gallery Thumbnails */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {gallery.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                selectedImage === index ? "border-blue-500" : "border-gray-300"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shop Info */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{shop.name}</h2>
                  <p className="text-gray-600">{shop.category}</p>
                </div>
                <StarRating rating={shop.rating || 4.0} />
              </div>

              <p className="text-gray-700 mb-4">
                {shop.description || "ร้านอาหารคุณภาพดี บริการเป็นกันเอง"}
              </p>

              <div className="text-sm text-gray-500">
                📍 {shop.subdistrict}, {shop.district}, {shop.province}
              </div>
            </motion.div>

            {/* Menu */}
            {shop.menu && shop.menu.length > 0 && (
              <motion.div
                className="bg-white rounded-lg shadow-md p-6 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xl font-semibold mb-4">เมนูแนะนำ</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shop.menu.map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {item}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Reviews */}
            <ReviewSection shopId={shopId} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Delivery Links */}
            <motion.div
              className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-4">สั่งอาหารออนไลน์</h3>
              
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center justify-between p-3 border border-green-200 rounded-lg hover:bg-green-50 transition group"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">LM</span>
                    </div>
                    <span>LINE MAN</span>
                  </div>
                  <span className="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between p-3 border border-orange-200 rounded-lg hover:bg-orange-50 transition group"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">GB</span>
                    </div>
                    <span>Grab Food</span>
                  </div>
                  <span className="text-orange-600 group-hover:translate-x-1 transition-transform">→</span>
                </a>

                <a
                  href="#"
                  className="flex items-center justify-between p-3 border border-pink-200 rounded-lg hover:bg-pink-50 transition group"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-pink-500 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">FP</span>
                    </div>
                    <span>Food Panda</span>
                  </div>
                  <span className="text-pink-600 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 คลิกลิงก์ข้างบนเพื่อสั่งอาหารผ่านแอปฯ
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}