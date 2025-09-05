// src/app/profile/page.tsx
"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

type Role = "user" | "admin" | "shop";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<Role>("user");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "loading") return; // รอ loading
    setRole((session?.user as { role?: Role })?.role ?? "user");
    setLoaded(true);
  }, [session, status]);

  const upgradeToShop = () => {
    setRole("shop");
    alert("คุณได้อัปเกรดเป็น Shop แล้ว!");
    // TODO: update role ใน DB
  };

  if (!loaded) return <p>Loading...</p>; // รอ session ก่อน render

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
