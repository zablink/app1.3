"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";

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

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

type Banner = {
  id: number;
  image: string;
  link?: string;
};

// -----------------------------
// Example Data
// -----------------------------
const banners: Banner[] = [
  { id: 1, image: "/images/banner/1.jpg", link: "/shop/6" },
  { id: 2, image: "/images/banner/2.jpg", link: "/shop/26"  },
  { id: 3, image: "/images/banner/3.jpg"},
];

// --- shops ตัวอย่าง 30 ร้าน ---
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

// --- Haversine formula ---
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

// --- HomePage ---
export default function HomePage() {
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ province?: string }>({});
  const [displayShops, setDisplayShops] = useState<Shop[]>([]);
  const [query, setQuery] = useState("");


  //// Hero Banner 
  const [currentBanner, setCurrentBanner] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 8000); // 8000ms = 8 วินาที

    return () => clearInterval(interval);
  }, []);

  // --- Get user location ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);


          // --- Google reverse geocode ---
          if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
            );
            const data: { results?: { address_components: AddressComponent[] }[] } = await res.json();

            const province = data.results?.[0]?.address_components?.find((c) =>
              c.types.includes("administrative_area_level_1")
            )?.long_name;

            if (province) setUserLocation({ province });
          }

        },
        (err) => console.log("Location error:", err)
      );
    }
  }, []);

  // --- Determine shops to display ---
  useEffect(() => {
    let result: Shop[] = [];

    if (userLat !== null && userLng !== null) {
      // 1. ร้านใกล้ ≤ 5 กม.
      const nearby = shops.filter((shop) => getDistance(userLat, userLng, shop.lat, shop.lng) <= 5);
      if (nearby.length > 0) {
        result = nearby;
      } else if (userLocation.province) {
        // 2. ร้านใน province เดียวกัน
        const sameProv = shops.filter((shop) => shop.province === userLocation.province);
        if (sameProv.length > 0) result = sameProv;
      }
    }

    // 3. ถ้าไม่มี location หรือไม่มีร้านใกล้/ในจังหวัด → random 12 ร้าน
    if (result.length === 0) {
      result = [...shops].sort(() => 0.5 - Math.random()).slice(0, 12);
    } else if (result.length > 12) {
      // ถ้ามีร้านมากกว่า 12 ร้าน → random 12 ร้านจากผลลัพธ์
      result = [...result].sort(() => 0.5 - Math.random()).slice(0, 12);
    }

    setDisplayShops(result);
  }, [userLat, userLng, userLocation]);

  return (
    <AppLayout>
      {/* ---------------- Hero Banner ---------------- */}
      <div className="w-full overflow-hidden mb-6">
        <div className="relative h-64 sm:h-80 md:h-96">
          {banners.map((banner, i) => (
            <Link
              key={banner.id}
              href={banner.link ?? "#"}
              className="absolute inset-0 w-full h-full"
            >
              <motion.img
                key={banner.id}
                src={banner.image}
                alt={`Banner ${banner.id}`}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: i === currentBanner ? 1 : 0 }}
                transition={{ duration: 1 }}
              />
            </Link>
          ))}
        </div>
      </div>



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

        {/* Shop grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
          {displayShops.map((shop, i) => (
            <motion.div
              key={shop.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition"
              whileHover={{ scale: 1.03 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
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

        {/* View all button */}
        <div className="text-center">
          <Link
            href="/shop"
            className="inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl shadow hover:bg-blue-600 transition"
          >
            ดูทั้งหมด
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
