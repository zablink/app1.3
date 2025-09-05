// src/app/profile/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

type Role = "user" | "admin" | "shop";

export default function ProfilePage() {
  // ดึง session และ status จาก useSession// src/app/profile/page.tsx
"use client"; // ยังต้องมี

export const dynamic = 'force-dynamic'; // บังคับ render client / server

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

type Role = "user" | "admin" | "shop";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<Role>("user");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    setRole((session?.user as { role?: Role })?.role ?? "user");
    setLoaded(true);
  }, [session, status]);

  if (!loaded) return <p>Loading...</p>;

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

  const { data: session, status } = useSession();

  // local state สำหรับ role และโหลด session เสร็จแล้วหรือยัง
  const [role, setRole] = useState<Role>("user");
  const [loaded, setLoaded] = useState(false);

  // effect เพื่ออัปเดต role หลังจาก session โหลดเสร็จ
  useEffect(() => {
    if (status === "loading") return; // รอจน session โหลดเสร็จ
    setRole((session?.user as { role?: Role })?.role ?? "user");
    setLoaded(true);
  }, [session, status]);

  // แสดง loading ขณะ session กำลังโหลด
  if (!loaded) return <p className="p-6 max-w-2xl mx-auto">Loading...</p>;

  // ฟังก์ชันอัปเกรด role เป็น Shop
  const upgradeToShop = () => {
    setRole("shop");
    alert("คุณได้อัปเกรดเป็น Shop แล้ว!");
    // TODO: เรียก API อัปเดต role ใน DB
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
