// src/app/profile/page.tsx

"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export const dynamic = 'force-dynamic';

type Role = "user" | "admin" | "shop";

export default function ProfilePage() {
  // ⭐ เปลี่ยนจาก destructure เป็นเรียกใช้แบบปลอดภัย
  const sessionData = useSession();
  const session = sessionData?.data;
  const status = sessionData?.status || 'loading';
  
  const [role, setRole] = useState<Role>("user");

  useEffect(() => {
    if (session?.user) {
      setRole((session.user as { role?: Role }).role ?? "user");
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl mb-4">กรุณาเข้าสู่ระบบก่อน</p>
          <a 
            href="/api/auth/signin" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            เข้าสู่ระบบ
          </a>
        </div>
      </div>
    );
  }

  const upgradeToShop = () => {
    setRole("shop");
    alert("คุณได้อัปเกรดเป็น Shop แล้ว!");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">โปรไฟล์ของคุณ</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <p className="mb-2"><strong>ชื่อผู้ใช้:</strong> {session.user?.name}</p>
        <p className="mb-2"><strong>อีเมล:</strong> {session.user?.email}</p>
        <p className="mb-4"><strong>Role ปัจจุบัน:</strong> {role}</p>
        {role === "user" && (
          <button
            onClick={upgradeToShop}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            อัปเกรดเป็น Shop
          </button>
        )}
      </div>
    </div>
  );
}