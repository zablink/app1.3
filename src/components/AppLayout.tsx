// src/components/AppLayout.tsx
"use client";
import Link from "next/link";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Navbar แบบ fixed */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center z-50">
        <Link href="/" className="font-bold text-xl">
          FoodPlatform
        </Link>
        <div className="hidden md:flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/dashboard/shop">Shop Dashboard</Link>
          <Link href="/admin">Admin</Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          ☰
        </button>
      </nav>

      {/* เมนู mobile (dropdown) */}
      {open && (
        <div className="fixed top-[64px] left-0 right-0 flex flex-col bg-white p-4 md:hidden gap-2 shadow-md z-40">
          <Link href="/">Home</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/dashboard/shop">Shop Dashboard</Link>
          <Link href="/admin">Admin</Link>
        </div>
      )}

      {/* เนื้อหา */}
      <main className="pt-20 p-4">{children}</main>
    </div>
  );
}
