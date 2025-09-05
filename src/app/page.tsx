// src/app/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const categories = [
  "ทั้งหมด",
  "อาหารตามสั่ง",
  "ก๋วยเตี๋ยว",
  "เครื่องดื่ม",
  "เบเกอรี่",
];

type Shop = {
  id: number;
  name: string;
  category: string;
  image: string;
  lat: number; // latitude
  lng: number; // longitude
  subdistrict: string;
  district: string;
  province: string;
};

const shops = [
  { id: 1, name: "ร้านข้าวผัดอร่อย", category: "อาหารตามสั่ง", image: "/images/friedrice.jpg" },
  { id: 2, name: "ก๋วยเตี๋ยวเรืออยุธยา", category: "ก๋วยเตี๋ยว", image: "/images/noodleboat.jpg" },
  { id: 3, name: "ชานมไข่มุกนุ่มนิ่ม", category: "เครื่องดื่ม", image: "/images/milktea.jpg" },
  { id: 4, name: "ขนมปังอบใหม่", category: "เบเกอรี่", image: "/images/bakery.jpg" },
  { id: 5, name: "ส้มตำรสเด็ด", category: "อาหารตามสั่ง", image: "/images/somtam.jpg" },
  { id: 6, name: "ก๋วยเตี๋ยวต้มยำ", category: "ก๋วยเตี๋ยว", image: "/images/noodletomyum.jpg" },
  { id: 7, name: "คาเฟ่กาแฟสด", category: "เครื่องดื่ม", image: "/images/coffee.jpg" },
  { id: 8, name: "ครัวข้าวแกง", category: "อาหารตามสั่ง", image: "/images/ricecurry.jpg" },
  { id: 9, name: "ขนมเค้กวานิลลา", category: "เบเกอรี่", image: "/images/cake.jpg" },
  { id: 10, name: "ร้านชาบูหมูจุ่ม", category: "อาหารตามสั่ง", image: "/images/shabu.jpg" },
  { id: 11, name: "ก๋วยเตี๋ยวเนื้อน้ำตก", category: "ก๋วยเตี๋ยว", image: "/images/noodlebeef.jpg" },
  { id: 12, name: "น้ำผลไม้สด", category: "เครื่องดื่ม", image: "/images/juice.jpg" },
  { id: 13, name: "ครัวป้าแดง", category: "อาหารตามสั่ง", image: "/images/thai-food.jpg" },
  { id: 14, name: "ขนมครัวซองต์หอมกรุ่น", category: "เบเกอรี่", image: "/images/croissant.jpg" },
  { id: 15, name: "สเต๊กพรีเมียม", category: "อาหารตามสั่ง", image: "/images/steak.jpg" },
  { id: 16, name: "ก๋วยเตี๋ยวหมูเด้ง", category: "ก๋วยเตี๋ยว", image: "/images/noodle-pork.jpg" },
  { id: 17, name: "ชามะนาวเย็น", category: "เครื่องดื่ม", image: "/images/icetea.jpg" },
  { id: 18, name: "เบเกอรี่โฮมเมด", category: "เบเกอรี่", image: "/images/homemade-bakery.jpg" },
  { id: 19, name: "อาหารใต้จัดจ้าน", category: "อาหารตามสั่ง", image: "/images/south-food.jpg" },
  { id: 20, name: "ก๋วยเตี๋ยวไก่ตุ๋น", category: "ก๋วยเตี๋ยว", image: "/images/noodle-chicken.jpg" },
];

// Haversine formula
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

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [filteredShops, setFilteredShops] = useState<Shop[]>(shops);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      });
    }
  }, []);

  useEffect(() => {
    let result = Shops.filter(
      (Shop) =>
        Shop.name.toLowerCase().includes(query.toLowerCase()) ||
        Shop.category.toLowerCase().includes(query.toLowerCase())
    );

    if (userLat !== null && userLng !== null) {
      // 1. ร้านในรัศมี 5 กม.
      const nearby = result.filter((Shop) => getDistance(userLat, userLng, Shop.lat, Shop.lng) <= 5);
      if (nearby.length > 0) {
        result = nearby;
      } else {
        // 2. ร้านในตำบลเดียวกัน
        const sameSubdistrict = result.filter((Shop) => Shop.subdistrict === "วังบูรพา"); // ใช้ตัวอย่างตำบลผู้ใช้
        if (sameSubdistrict.length > 0) {
          result = sameSubdistrict;
        } else {
          // 3. ร้านในอำเภอเดียวกัน
          const sameDistrict = result.filter((Shop) => Shop.district === "พระนคร");
          if (sameDistrict.length > 0) {
            result = sameDistrict;
          } else {
            // 4. ร้านในจังหวัดเดียวกัน
            const sameProvince = result.filter((Shop) => Shop.province === "กรุงเทพฯ");
            result = sameProvince;
          }
        }
      }
    }

    setFilteredShops(result);
  }, [query, userLat, userLng]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">ค้นหาร้านใกล้คุณ 🍜</h1>

      {/* Search */}
      <div className="max-w-xl mx-auto mb-6">
        <input
          type="text"
          placeholder="ค้นหาร้านหรือหมวดหมู่..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      </div>

      {/* Category */}
      <div className="flex flex-wrap gap-3 mb-8 justify-center">
        {["อาหารตามสั่ง", "ก๋วยเตี๋ยว", "เครื่องดื่ม", "เบเกอรี่"].map((cat) => (
          <Link
            key={cat}
            href={`/category/${encodeURIComponent(cat)}`}
            className="px-4 py-2 bg-white shadow rounded-full hover:bg-blue-50 transition"
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Shops */}
      {filteredShops.length === 0 ? (
        <p className="text-center text-gray-500">ไม่พบร้านในพื้นที่ของคุณ</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredShops.map((Shop, i) => (
            <motion.div
              key={Shop.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/Shop/${Shop.id}`}>
                <img src={Shop.image} alt={Shop.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h2 className="font-semibold text-lg">{Shop.name}</h2>
                  <p className="text-sm text-gray-500">{Shop.category}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}