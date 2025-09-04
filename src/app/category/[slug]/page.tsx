// src/app/category/[slug]/page.tsx

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

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

export default function CategoryPage() {
  const params = useParams();
  const slug = decodeURIComponent(params?.slug as string);

  const filtered = shops.filter((s) => s.category === slug);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Link href="/" className="inline-block mb-6 text-blue-600 hover:underline">
        ← กลับหน้าหลัก
      </Link>

      <h1 className="text-2xl font-bold mb-6">หมวดหมู่: {slug}</h1>

      {filtered.length === 0 ? (
        <p className="text-gray-600">ยังไม่มีร้านในหมวดหมู่นี้</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((shop, i) => (
            <motion.div
              key={shop.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/shop/${shop.id}`}>
                <img src={shop.image} alt={shop.name} className="w-full h-40 object-cover" />
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
