// src/app/search/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
};

// --- ตัวอย่าง shops เดิม ---
const shops: Shop[] = [
  { id: 1, name: "ร้านข้าวผัดอร่อย", category: "อาหารตามสั่ง", image: "/images/friedrice.jpg", lat: 13.746, lng: 100.534, subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ" },
  { id: 2, name: "ก๋วยเตี๋ยวเรืออยุธยา", category: "ก๋วยเตี๋ยว", image: "/images/noodleboat.jpg", lat: 13.742, lng: 100.538, subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ" },
  { id: 3, name: "ชานมไข่มุกนุ่มนิ่ม", category: "เครื่องดื่ม", image: "/images/milktea.jpg", lat: 13.744, lng: 100.536, subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ" },
  // ... เพิ่มร้านอื่น ๆ ตามต้องการ
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").toLowerCase();

  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);

  useEffect(() => {
    if (!query) {
      setFilteredShops([]);
      return;
    }

    const result = shops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(query) ||
        shop.category.toLowerCase().includes(query)
    );

    setFilteredShops(result);
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        ผลการค้นหา: &quot;{query}&quot;
      </h1>

      {filteredShops.length === 0 ? (
        <p className="text-center text-gray-500">
          ไม่พบร้านค้าที่ตรงกับคำค้น
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredShops.map((shop, i) => (
            <motion.div
              key={shop.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/shop/${shop.id}`}>
                <img
                  src={shop.image}
                  alt={shop.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h2 className="font-semibold text-lg">{shop.name}</h2>
                  <p className="text-sm text-gray-500">{shop.category}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
