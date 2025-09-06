// src/components/AppLayout.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();

  const role = session?.user?.role ?? "guest"; // fallback เป็น guest

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- เมนูแยกตาม role ---
  const menuItems: Record<string, { href: string; label: string }[]> = {
    guest: [
      { href: "/", label: "Home" },
      { href: "/auth/login", label: "Login" },
    ],
    user: [
      { href: "/", label: "Home" },
      { href: "/profile", label: "Profile" },
    ],
    shop: [
      { href: "/", label: "Home" },
      { href: "/dashboard/shop", label: "Shop Dashboard" },
    ],
    admin: [
      { href: "/", label: "Home" },
      { href: "/admin", label: "Admin Panel" },
    ],
  };

  const items = menuItems[role] ?? menuItems.guest;

  return (
    <div>
      {/* Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 flex justify-between items-center z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-md p-2"
            : "bg-transparent p-4"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Logo"
            width={scrolled ? 32 : 48}
            height={scrolled ? 32 : 48}
            className="object-contain transition-all duration-300"
          />
          <span
            className={`font-bold transition-all duration-300 ${
              scrolled ? "text-lg" : "text-xl"
            }`}
          >
            FoodPlatform
          </span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex gap-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Hamburger */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          ☰
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="fixed top-[64px] left-0 right-0 flex flex-col bg-white p-4 md:hidden gap-2 shadow-md z-40">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      <main className="pt-20 p-4">{children}</main>
    </div>
  );
}
