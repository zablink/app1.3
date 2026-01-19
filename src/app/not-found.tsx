"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">ไม่พบหน้าที่คุณต้องการ</p>
        <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg">
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
