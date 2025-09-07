// src/components/AppLayout.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import React, { ReactNode } from "react";
import Head from "next/head";
import { useRouter, usePathname } from "next/navigation";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();

  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const role = session?.user?.role ?? "user";

  const pathname = usePathname();
  const ptClass = pathname === "/" ? "pt-0" : "pt-20";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
      setOpen(false);
    }
  };

  return (
    <>

      <div>
        {/* Navbar */}
        <nav
          className={`fixed top-0 left-0 right-0 flex justify-between items-center z-50 transition-all duration-300 ${
            scrolled ? "bg-white shadow-md p-2" : "bg-wihte p-4"
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
              ZabLink
            </span>
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex gap-4 items-center relative">
            {items.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}

            {/* Search button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-gray-200 transition"
            >
              🔍
            </button>

            {/* Search dropdown */}
            {showSearch && (
              <div className="absolute top-full right-0 mt-2 bg-white shadow-md rounded-lg p-2 z-50 transition-all">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาร้านหรือหมวดหมู่..."
                    className="px-3 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                  />
                </form>
              </div>
            )}
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

            {/* Mobile search */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 rounded-full hover:bg-gray-200 transition mt-2"
            >
              🔍 ค้นหา
            </button>

            {showSearch && (
              <form onSubmit={handleSearchSubmit} className="mt-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาร้านหรือหมวดหมู่..."
                  className="px-3 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
              </form>
            )}
          </div>
        )}

        {/* Content */}
        <main className="${ptTop} p-4">{children}</main>
      </div>
    </>
  );
}
