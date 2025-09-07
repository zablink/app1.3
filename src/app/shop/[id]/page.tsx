// src/app/shop/[id]/page.tsx

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import AppLayout from "@/components/AppLayout";

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
  menu?: string[]; // optional
};

// -----------------------------
// ร้านทั้งหมด 30 ร้าน
// -----------------------------
const shops: Shop[] = [
  // --- ร้านเก่า 20 ร้าน ---
  {
    id: 1, name: "ร้านข้าวผัดอร่อย", category: "อาหารตามสั่ง",
    image: "/images/friedrice.jpg", lat: 13.746, lng: 100.534,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ",
    menu: ["ข้าวผัดหมู", "ข้าวผัดไก่"]
  },
  { id: 2, name: "ก๋วยเตี๋ยวเรืออยุธยา", category: "ก๋วยเตี๋ยว",
    image: "/images/noodleboat.jpg", lat: 13.742, lng: 100.538,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 3, name: "ชานมไข่มุกนุ่มนิ่ม", category: "เครื่องดื่ม",
    image: "/images/milktea.jpg", lat: 13.744, lng: 100.536,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 4, name: "ขนมปังอบใหม่", category: "เบเกอรี่",
    image: "/images/bakery.jpg", lat: 13.745, lng: 100.539,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 5, name: "ส้มตำรสเด็ด", category: "อาหารตามสั่ง",
    image: "/images/somtam.jpg", lat: 13.743, lng: 100.537,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 6, name: "ก๋วยเตี๋ยวต้มยำ", category: "ก๋วยเตี๋ยว",
    image: "/images/noodletomyum.jpg", lat: 13.741, lng: 100.535,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 7, name: "คาเฟ่กาแฟสด", category: "เครื่องดื่ม",
    image: "/images/coffee.jpg", lat: 13.746, lng: 100.540,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 8, name: "ครัวข้าวแกง", category: "อาหารตามสั่ง",
    image: "/images/ricecurry.jpg", lat: 13.747, lng: 100.534,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 9, name: "ขนมเค้กวานิลลา", category: "เบเกอรี่",
    image: "/images/cake.jpg", lat: 13.744, lng: 100.539,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 10, name: "ร้านชาบูหมูจุ่ม", category: "อาหารตามสั่ง",
    image: "/images/shabu.jpg", lat: 13.745, lng: 100.537,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 11, name: "ก๋วยเตี๋ยวเนื้อน้ำตก", category: "ก๋วยเตี๋ยว",
    image: "/images/noodlebeef.jpg", lat: 13.743, lng: 100.536,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 12, name: "น้ำผลไม้สด", category: "เครื่องดื่ม",
    image: "/images/juice.jpg", lat: 13.746, lng: 100.538,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 13, name: "ครัวป้าแดง", category: "อาหารตามสั่ง",
    image: "/images/thai-food.jpg", lat: 13.742, lng: 100.539,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 14, name: "ขนมครัวซองต์หอมกรุ่น", category: "เบเกอรี่",
    image: "/images/croissant.jpg", lat: 13.744, lng: 100.535,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 15, name: "สเต๊กพรีเมียม", category: "อาหารตามสั่ง",
    image: "/images/steak.jpg", lat: 13.745, lng: 100.536,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 16, name: "ก๋วยเตี๋ยวหมูเด้ง", category: "ก๋วยเตี๋ยว",
    image: "/images/noodle-pork.jpg", lat: 13.746, lng: 100.537,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 17, name: "ชามะนาวเย็น", category: "เครื่องดื่ม",
    image: "/images/icetea.jpg", lat: 13.747, lng: 100.536,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 18, name: "เบเกอรี่โฮมเมด", category: "เบเกอรี่",
    image: "/images/homemade-bakery.jpg", lat: 13.745, lng: 100.539,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 19, name: "อาหารใต้จัดจ้าน", category: "อาหารตามสั่ง",
    image: "/images/south-food.jpg", lat: 13.743, lng: 100.534,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },
  { id: 20, name: "ก๋วยเตี๋ยวไก่ตุ๋น", category: "ก๋วยเตี๋ยว",
    image: "/images/noodle-chicken.jpg", lat: 13.742, lng: 100.538,
    subdistrict: "วังบูรพา", district: "พระนคร", province: "กรุงเทพฯ"
  },

  // --- ร้านใหม่ 10 ร้าน สมุทรปราการ ---
  { id: 21, name: "ร้านกาแฟกระทิงแดง", category: "เครื่องดื่ม",
    image: "/images/coffee2.jpg", lat: 13.605, lng: 100.609,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
  { id: 22, name: "ข้าวต้มประชาอุทิศ 90", category: "อาหารตามสั่ง",
    image: "/images/riceporridge.jpg", lat: 13.607, lng: 100.615,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
  { id: 23, name: "ก๋วยเตี๋ยวซอยช้อยเพ็ง", category: "ก๋วยเตี๋ยว",
    image: "/images/noodles2.jpg", lat: 13.603, lng: 100.611,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
  { id: 24, name: "เบเกอรี่วัดคู่สร้าง", category: "เบเกอรี่",
    image: "/images/bakery2.jpg", lat: 13.606, lng: 100.613,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
  { id: 25, name: "ชานมไข่มุกคลองบางปลากด", category: "เครื่องดื่ม",
    image: "/images/milktea2.jpg", lat: 13.604, lng: 100.610,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
  { id: 26, name: "ข้าวมันไก่ประชาอุทิศ", category: "อาหารตามสั่ง",
    image: "/images/chickenrice.jpg", lat: 13.605, lng: 100.612,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
  { id: 27, name: "ร้านก๋วยเตี๋ยวเรือสมุทรปราการ", category: "ก๋วยเตี๋ยว",
    image: "/images/noodleboat2.jpg", lat: 13.606, lng: 100.614,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
  { id: 28, name: "คาเฟ่สดชื่น", category: "เครื่องดื่ม",
    image: "/images/coffee3.jpg", lat: 13.603, lng: 100.609,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
  { id: 29, name: "ครัวอาหารใต้บางปลากด", category: "อาหารตามสั่ง",
    image: "/images/southfood2.jpg", lat: 13.604, lng: 100.611,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
  { id: 30, name: "เบเกอรี่อบสดประชาอุทิศ", category: "เบเกอรี่",
    image: "/images/bakery3.jpg", lat: 13.605, lng: 100.613,
    subdistrict: "ในคลองบางปลากด", district: "พระประแดง", province: "สมุทรปราการ"
  },
];

// -----------------------------
// Component
// -----------------------------
export default function ShopDetail() {
  const params = useParams();
  const shopId = Number(params?.id);
  const shop = shops.find((s) => s.id === shopId);

  if (!shop) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-xl font-bold">ไม่พบร้านที่คุณเลือก</h1>
        <Link href="/" className="text-blue-600 underline">กลับหน้าหลัก</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AppLayout>
        <Link href="/" className="inline-block mb-6 text-blue-600 hover:underline">
          ← กลับหน้าหลัก
        </Link>

        <motion.div
          className="bg-white rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <img src={shop.image} alt={shop.name} className="w-full h-64 object-cover" />
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{shop.name}</h1>
            <p className="text-gray-500 mb-2">{shop.category}</p>
            <p className="text-gray-400 text-sm mb-4">
              {shop.subdistrict}, {shop.district}, {shop.province}
            </p>

            {shop.menu && shop.menu.length > 0 ? (
              <>
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
              </>
            ) : (
              <p className="text-gray-500">ยังไม่มีเมนูแนะนำ</p>
            )}
          </div>
        </motion.div>
      </AppLayout>
    </div>
  );
}
