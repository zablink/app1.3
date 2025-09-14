// src/components/SearchResults.tsx
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
  // --- ร้านเก่า 20 ร้าน (ค่าเดิม + เพิ่ม field) ---
  {
    id: 1,
    name: "ร้านข้าวผัดอร่อย",
    category: "อาหารตามสั่ง",
    image: "/images/friedrice.jpg",
    lat: 13.746, lng: 100.534,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 2,
    name: "ก๋วยเตี๋ยวเรืออยุธยา",
    category: "ก๋วยเตี๋ยว",
    image: "/images/noodleboat.jpg",
    lat: 13.742, lng: 100.538,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 3,
    name: "ชานมไข่มุกนุ่มนิ่ม",
    category: "เครื่องดื่ม",
    image: "/images/milktea.jpg",
    lat: 13.744, lng: 100.536,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 4,
    name: "ขนมปังอบใหม่",
    category: "เบเกอรี่",
    image: "/images/bakery.jpg",
    lat: 13.745, lng: 100.539,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 5,
    name: "ส้มตำรสเด็ด",
    category: "อาหารตามสั่ง",
    image: "/images/somtam.jpg",
    lat: 13.743, lng: 100.537,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 6,
    name: "ก๋วยเตี๋ยวต้มยำ",
    category: "ก๋วยเตี๋ยว",
    image: "/images/noodletomyum.jpg",
    lat: 13.741, lng: 100.535,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 7,
    name: "คาเฟ่กาแฟสด",
    category: "เครื่องดื่ม",
    image: "/images/coffee.jpg",
    lat: 13.746, lng: 100.540,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 8,
    name: "ครัวข้าวแกง",
    category: "อาหารตามสั่ง",
    image: "/images/ricecurry.jpg",
    lat: 13.747, lng: 100.534,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 9,
    name: "ขนมเค้กวานิลลา",
    category: "เบเกอรี่",
    image: "/images/cake.jpg",
    lat: 13.744, lng: 100.539,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 10,
    name: "ร้านชาบูหมูจุ่ม",
    category: "อาหารตามสั่ง",
    image: "/images/shabu.jpg",
    lat: 13.745, lng: 100.537,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 11,
    name: "ก๋วยเตี๋ยวเนื้อน้ำตก",
    category: "ก๋วยเตี๋ยว",
    image: "/images/noodlebeef.jpg",
    lat: 13.743, lng: 100.536,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 12,
    name: "น้ำผลไม้สด",
    category: "เครื่องดื่ม",
    image: "/images/juice.jpg",
    lat: 13.746, lng: 100.538,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 13,
    name: "ครัวป้าแดง",
    category: "อาหารตามสั่ง",
    image: "/images/thai-food.jpg",
    lat: 13.742, lng: 100.539,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 14,
    name: "ขนมครัวซองต์หอมกรุ่น",
    category: "เบเกอรี่",
    image: "/images/croissant.jpg",
    lat: 13.744, lng: 100.535,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 15,
    name: "สเต๊กพรีเมียม",
    category: "อาหารตามสั่ง",
    image: "/images/steak.jpg",
    lat: 13.745, lng: 100.536,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 16,
    name: "ก๋วยเตี๋ยวหมูเด้ง",
    category: "ก๋วยเตี๋ยว",
    image: "/images/noodle-pork.jpg",
    lat: 13.746, lng: 100.537,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 17,
    name: "ชามะนาวเย็น",
    category: "เครื่องดื่ม",
    image: "/images/icetea.jpg",
    lat: 13.747, lng: 100.536,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 18,
    name: "เบเกอรี่โฮมเมด",
    category: "เบเกอรี่",
    image: "/images/homemade-bakery.jpg",
    lat: 13.745, lng: 100.539,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 19,
    name: "อาหารใต้จัดจ้าน",
    category: "อาหารตามสั่ง",
    image: "/images/south-food.jpg",
    lat: 13.743, lng: 100.534,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },
  {
    id: 20,
    name: "ก๋วยเตี๋ยวไก่ตุ๋น",
    category: "ก๋วยเตี๋ยว",
    image: "/images/noodle-chicken.jpg",
    lat: 13.742, lng: 100.538,
    subdistrict: "วังบูรพา",
    district: "พระนคร",
    province: "กรุงเทพฯ",
  },

  // --- ร้านใหม่ 10 ร้าน แถวสมุทรปราการ ---
  {
    id: 21,
    name: "ร้านกาแฟกระทิงแดง",
    category: "เครื่องดื่ม",
    image: "/images/coffee2.jpg",
    lat: 13.605, lng: 100.609,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
  {
    id: 22,
    name: "ข้าวต้มประชาอุทิศ 90",
    category: "อาหารตามสั่ง",
    image: "/images/riceporridge.jpg",
    lat: 13.607, lng: 100.615,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
  {
    id: 23,
    name: "ก๋วยเตี๋ยวซอยช้อยเพ็ง",
    category: "ก๋วยเตี๋ยว",
    image: "/images/noodles2.jpg",
    lat: 13.603, lng: 100.611,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
  {
    id: 24,
    name: "เบเกอรี่วัดคู่สร้าง",
    category: "เบเกอรี่",
    image: "/images/bakery2.jpg",
    lat: 13.606, lng: 100.613,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
  {
    id: 25,
    name: "ชานมไข่มุกคลองบางปลากด",
    category: "เครื่องดื่ม",
    image: "/images/milktea2.jpg",
    lat: 13.604, lng: 100.610,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
  {
    id: 26,
    name: "ข้าวมันไก่ประชาอุทิศ",
    category: "อาหารตามสั่ง",
    image: "/images/chickenrice.jpg",
    lat: 13.605, lng: 100.612,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
  {
    id: 27,
    name: "ร้านก๋วยเตี๋ยวเรือสมุทรปราการ",
    category: "ก๋วยเตี๋ยว",
    image: "/images/noodleboat2.jpg",
    lat: 13.606, lng: 100.614,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
  {
    id: 28,
    name: "คาเฟ่สดชื่น",
    category: "เครื่องดื่ม",
    image: "/images/coffee3.jpg",
    lat: 13.603, lng: 100.609,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
  {
    id: 29,
    name: "ครัวอาหารใต้บางปลากด",
    category: "อาหารตามสั่ง",
    image: "/images/southfood2.jpg",
    lat: 13.604, lng: 100.611,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
  {
    id: 30,
    name: "เบเกอรี่อบสดประชาอุทิศ",
    category: "เบเกอรี่",
    image: "/images/bakery3.jpg",
    lat: 13.605, lng: 100.613,
    subdistrict: "ในคลองบางปลากด",
    district: "พระประแดง",
    province: "สมุทรปราการ",
  },
];

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("query") ?? "").toLowerCase();
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