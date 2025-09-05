// src/app/profile/page.tsx
"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";

// กำหนด type ของ role ให้ตรงกับ NextAuth ExtendedUser
type Role = "user" | "admin" | "shop";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [role, setRole] = useState<Role>((session?.user as { role?: Role })?.role ?? "user");

  const upgradeToShop = () => {
    setRole("shop"); // ตอนนี้ TypeScript ไม่เตือนแล้ว
    alert("คุณได้อัปเกรดเป็น Shop แล้ว!");
    // TODO: Update role ใน DB ผ่าน API
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">โปรไฟล์ของคุณ</h1>
      <p>ชื่อผู้ใช้: {session?.user?.name}</p>
      <p>อีเมล: {session?.user?.email}</p>
      <p>Role ปัจจุบัน: {role}</p>

      {role === "user" && (
        <button
          onClick={upgradeToShop}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          อัปเกรดเป็น Shop
        </button>
      )}
    </div>
  );
}
