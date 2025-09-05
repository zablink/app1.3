"use client"; // ต้องอยู่บนสุด

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export const dynamic = "force-dynamic"; // บังคับ render แบบ client/server ไม่ prerender static

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<"user" | "admin" | "shop">("user");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    setRole((session?.user as { role?: "user" | "admin" | "shop" })?.role ?? "user");
    setLoaded(true);
  }, [session, status]);

  if (!loaded) return <p className="p-6 max-w-2xl mx-auto">Loading...</p>;

  const upgradeToShop = () => {
    setRole("shop");
    alert("คุณได้อัปเกรดเป็น Shop แล้ว!");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">โปรไฟล์ของคุณ</h1>
      <p>ชื่อผู้ใช้: {session?.user?.name ?? "-"}</p>
      <p>อีเมล: {session?.user?.email ?? "-"}</p>
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
