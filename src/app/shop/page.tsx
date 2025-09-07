// src/app/shop/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import Image from "next/image";

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
  description: string;
  gallery: string[];
  phone: string;
  hours: string;
  links: {
    lineman: string;
    grab: string;
    other: string;
  };
};

type Review = {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
};

// Mock data for shops with extended information
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
    description: "ร้านข้าวผัดที่มีประสบการณ์มากกว่า 20 ปี เสิร์ฟข้าวผัดรสเด็ดด้วยส่วนผสมแสนพิเศษและเครื่องเทศสูตรลับ ใช้วัตถุดิบคุณภาพสูงและเสิร์ฟในอุณหภูมิที่เหมาะสม รับประกันความอร่อยที่จะทำให้คุณต้องกลับมาอีก",
    gallery: [
      "/images/friedrice.jpg",
      "/images/friedrice-gallery1.jpg", 
      "/images/friedrice-gallery2.jpg",
      "/images/friedrice-gallery3.jpg"
    ],
    phone: "02-123-4567",
    hours: "09:00 - 22:00",
    links: {
      lineman: "https://lineman.onelink.me/shop/abc123",
      grab: "https://food.grab.com/th/restaurant/abc123", 
      other: "https://foodpanda.co.th/restaurant/abc123"
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
    description: "ก๋วยเตี๋ยวเรือสไตล์อยุธยาแท้ๆ ใช้เส้นที่ทำสดใหม่ทุกวัน น้ำซุปใส หวานมัน เข้มข้น เสิร์ฟพร้อมเครื่องเคียงครบครัน ลิ้มรสชาติดั้งเดิมที่สืบทอดมายาวนาน ร้านเปิดมาแล้ว 15 ปี",
    gallery: [
      "/images/noodleboat.jpg",
      "/images/noodleboat-gallery1.jpg",
      "/images/noodleboat-gallery2.jpg"
    ],
    phone: "02-234-5678",
    hours: "07:00 - 16:00",
    links: {
      lineman: "https://lineman.onelink.me/shop/def456",
      grab: "https://food.grab.com/th/restaurant/def456",
      other: "https://robinhood.co.th/restaurant/def456"
    }
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
    description: "ชานมไข่มุกพรีเมียม ใช้ชาคุณภาพดีนำเข้าจากต่างประเทศ ไข่มุกทำสดใหม่ทุกวัน เนื้อนุ่ม หนึบ หวานมัน เสิร์ฟในแก้วใสพร้อมหลอดขนาดใหญ่ มีให้เลือกหลากหลายรสชาติและระดับความหวาน",
    gallery: [
      "/images/milktea.jpg",
      "/images/milktea-gallery1.jpg",
      "/images/milktea-gallery2.jpg",
      "/images/milktea-gallery3.jpg"
    ],
    phone: "02-345-6789",
    hours: "10:00 - 22:00",
    links: {
      lineman: "https://lineman.onelink.me/shop/ghi789",
      grab: "https://food.grab.com/th/restaurant/ghi789",
      other: "https://foodpanda.co.th/restaurant/ghi789"
    }
  }
];

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: 1,
    userName: "สมศรี",
    rating: 5,
    comment: "อร่อยมากครับ ข้าวผัดเผ็ดน้อยหวานหน่อย กำลังดี เสิร์ฟเร็วด้วย",
    date: "2024-01-15"
  },
  {
    id: 2,
    userName: "นายกิจ",
    rating: 4,
    comment: "รสชาติดี แต่ราคาเท่าไหร่ก็ไม่ระบุชัดเจน โดยรวมพอใจ",
    date: "2024-01-10"
  },
  {
    id: 3,
    userName: "คุณแนน",
    rating: 5,
    comment: "เป็นลูกค้าประจำมา 3 ปีแล้ว ไม่เคยผิดหวัง อร่อยทุกครั้ง",
    date: "2024-01-08"
  }
];

export default function ShopDetailPage() {
  const params = useParams();
  const shopId = parseInt(params.id as string);
  const [shop, setShop] = useState<Shop | null>(null);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [newReview, setNewReview] = useState({
    userName: "",
    rating: 5,
    comment: ""
  });
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const foundShop = shops.find(s => s.id === shopId);
    setShop(foundShop || null);
  }, [shopId]);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.userName && newReview.comment) {
      const review: Review = {
        id: reviews.length + 1,
        userName: newReview.userName,
        rating: newReview.rating,
        comment: newReview.comment,
        date: new Date().toISOString().split('T')[0]
      };
      setReviews([review, ...reviews]);
      setNewReview({ userName: "", rating: 5, comment: "" });
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-500">ไม่พบร้านที่คุณต้องการ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-96 w-full">
        <img
          src={shop.gallery[selectedImage]}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
          <p className="text-lg">{shop.category}</p>
        </div>
      </div>

      {/* Gallery Thumbnails */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-4 overflow-x-auto">
            {shop.gallery.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                  selectedImage === index ? "border-blue-500" : "border-gray-200"
                }`}
              >
                <img src={image} alt={`${shop.name} ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shop Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">เกี่ยวกับร้าน</h2>
              <p className="text-gray-700 leading-relaxed">{shop.description}</p>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold">รีวิว</h2>
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
                      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <span>คะแนน:</span>
                      <select
                        value={newReview.rating}
                        onChange={(e) => setNewReview({...newReview, rating: parseInt(e.target.value)})}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                    className="w-full px-4 py-2 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">ข้อมูลร้าน</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">📍 ที่อยู่:</span>
                  <p className="font-medium">{shop.subdistrict}, {shop.district}</p>
                  <p className="text-gray-600">{shop.province}</p>
                </div>
                <div>
                  <span className="text-gray-600">📞 โทรศัพท์:</span>
                  <p className="font-medium">{shop.phone}</p>
                </div>
                <div>
                  <span className="text-gray-600">🕐 เวลาเปิด:</span>
                  <p className="font-medium">{shop.hours}</p>
                </div>
              </div>
            </div>

            {/* Delivery Links */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">สั่งออนไลน์</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">L</span>
                  </div>
                  <div>
                    <p className="font-semibold">LINE MAN</p>
                    <p className="text-sm text-gray-500">ส่งฟรี เมื่อสั่งครบ 100 บาท</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">G</span>
                  </div>
                  <div>
                    <p className="font-semibold">Grab Food</p>
                    <p className="text-sm text-gray-500">ส่งเร็ว ภายใน 30 นาที</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">F</span>
                  </div>
                  <div>
                    <p className="font-semibold">FoodPanda</p>
                    <p className="text-sm text-gray-500">โปรโมชั่นพิเศษ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">แผนที่</h3>
              <div className="bg-gray-200 h-48 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">📍 แผนที่ (Coming Soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}