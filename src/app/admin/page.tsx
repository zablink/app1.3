// src/app/admin/page.tsx
"use client";

export default function AdminDashboard() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-4 bg-white shadow rounded-lg">
          <h2 className="font-semibold mb-2">จัดการร้านค้า</h2>
          <p>แก้ไข / ลบ / เพิ่มร้าน</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg">
          <h2 className="font-semibold mb-2">จัดการผู้ใช้</h2>
          <p>เปลี่ยน role, ลบผู้ใช้</p>
        </div>
        <div className="p-4 bg-white shadow rounded-lg">
          <h2 className="font-semibold mb-2">ดู Analytics Platform</h2>
          <p>ผู้ใช้ทั้งหมด, ร้านทั้งหมด, รายได้โฆษณา</p>
        </div>
      </div>
    </div>
  );
}
