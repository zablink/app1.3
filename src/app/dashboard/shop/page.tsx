// src/app/dashboard/shop/page.tsx
"use client";
import { useState } from "react";

const packages = [
  { name: "ฟรี", effect: "แสดงร้านพื้นฐาน" },
  { name: "Pro1", effect: "ร้านเด่น + ขึ้นอันดับสูงขึ้น" },
  { name: "Pro2", effect: "ร้านเด่น + โฆษณาเพิ่มเติม" },
  { name: "Pro3", effect: "ร้านเด่น + โฆษณาทั่วประเทศ" },
  { name: "พิเศษ", effect: "เหมือน Pro3 แต่ไม่ต้องจ่ายเงิน" },
];

export default function ShopDashboard() {
  const [selectedPackage, setSelectedPackage] = useState(packages[0].name);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Shop Dashboard</h1>

      {/* Package Selection */}
      <h2 className="text-xl font-semibold mb-3">เลือก Package</h2>
      <div className="flex gap-4 mb-6 flex-wrap">
        {packages.map((pkg) => (
          <button
            key={pkg.name}
            onClick={() => setSelectedPackage(pkg.name)}
            className={`px-4 py-2 rounded-lg border ${
              selectedPackage === pkg.name
                ? "bg-blue-600 text-white"
                : "bg-white hover:bg-blue-50"
            } transition`}
          >
            {pkg.name}
          </button>
        ))}
      </div>
      <p>Effect: {packages.find((p) => p.name === selectedPackage)?.effect}</p>

      {/* Analytics */}
      <h2 className="text-xl font-semibold mt-6 mb-3">Analytics (จำลอง)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white shadow rounded-lg">
          <p>ผู้เข้าชมวันนี้: 120</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg">
          <p>ผู้เข้าชมเดือนนี้: 3,450</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg">
          <p>ยอดซื้อโฆษณา: 5 ครั้ง</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg">
          <p>Scope ที่ซื้อ: ตำบล</p>
        </div>
      </div>
    </div>
  );
}
