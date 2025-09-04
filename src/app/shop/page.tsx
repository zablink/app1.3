// src/app/shop/[id]/page.tsx

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

export default function ShopDetail() {
  const params = useParams();
  const shopId = Number(params?.id);
  const shop = shops.find((s) => s.id === shopId);

  if (!shop) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold">ไม่พบร้านที่คุณเลือก</h1>
        <Link href="/" className="text-blue-600 underline">
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back Button */}
      <Link href="/" className="inline-block mb-6 text-blue-600 hover:underline">
        ← กลับหน้าหลัก
      </Link>

      {/* Shop Info */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <img src={shop.image} alt={shop.name} className="w-full h-64 object-cover" />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">{shop.name}</h1>
          <p className="text-gray-500 mb-4">{shop.category}</p>

          <h2 className="text-xl font-semibold mb-3">เมนูแนะนำ</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            {shop.menu.map((item, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
