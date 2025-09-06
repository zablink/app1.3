// src/components/AppLayout.tsx
"use client";
import Link from "next/link";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div>
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">FoodPlatform</Link>
        <div className="hidden md:flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/dashboard/shop">Shop Dashboard</Link>
          <Link href="/admin">Admin</Link>
        </div>
        <button className="md:hidden" onClick={()=>setOpen(!open)}>☰</button>
      </nav>
      {open && (
        <div className="flex flex-col bg-white p-4 md:hidden gap-2">
          <Link href="/">Home</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/dashboard/shop">Shop Dashboard</Link>
          <Link href="/admin">Admin</Link>
        </div>
      )}
      <main>{children}</main>
    </div>
  );
}
