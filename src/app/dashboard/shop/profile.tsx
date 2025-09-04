// src/app/dashboard/shop/profile.tsx
"use client";
import { useState } from "react";

export default function ShopProfile() {
  const [shopName, setShopName] = useState("ร้านข้าวผัดอร่อย");
  const [deliveryLink, setDeliveryLink] = useState("https://grab.com");
  const [gallery, setGallery] = useState<string[]>(["/images/friedrice.jpg"]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">แก้ไขโปรไฟล์ร้าน</h1>
      <input value={shopName} onChange={(e)=>setShopName(e.target.value)} placeholder="ชื่อร้าน" className="w-full mb-3 p-2 border rounded"/>
      <input value={deliveryLink} onChange={(e)=>setDeliveryLink(e.target.value)} placeholder="ลิงก์ Delivery" className="w-full mb-3 p-2 border rounded"/>
      <h2 className="font-semibold mb-2">Gallery</h2>
      <div className="flex gap-2 mb-3">
        {gallery.map((img, i)=>(
          <img key={i} src={img} className="w-24 h-24 object-cover rounded" />
        ))}
      </div>
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">บันทึก</button>
    </div>
  );
}
