// src/components/layout/Navbar.tsx
"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, ChevronDown, Bell } from "lucide-react";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const role = (session?.user as { role?: string })?.role;

  // กำหนด Navigation Links ตาม Role
  const getNavLinks = () => {
    if (!session) {
      // Guest - Before Login
      return [
        { href: "/", label: "หน้าแรก" },
        { href: "/shop", label: "ค้นหาร้าน" },
        { href: "/reviews", label: "รีวิว" },
        { href: "/about", label: "เกี่ยวกับเรา" },
      ];
    }

    // Base links for logged-in users
    const baseLinks = [
      { href: "/", label: "หน้าแรก" },
      { href: "/shop", label: "ค้นหาร้าน" },
      { href: "/reviews", label: "รีวิว" },
    ];

    // Add role-specific links
    switch (role) {
      case "ADMIN":
        return [
          ...baseLinks,
          { href: "/admin/users", label: "ผู้ใช้" },
          { href: "/admin/shops", label: "ร้าน" },
          { href: "/admin/reports", label: "รายงาน" },
          { href: "/admin", label: "Admin" },
        ];

      case "OWNER":
        return [
          ...baseLinks,
          { href: "/my-shop", label: "ร้านของฉัน" },
          { href: "/my-shop/reviews", label: "รีวิว" },
          { href: "/dashboard", label: "Dashboard" },
        ];

      case "REVIEWER":
        return [
          ...baseLinks,
          { href: "/reviews/create", label: "เขียนรีวิว" },
          { href: "/dashboard", label: "Dashboard" },
        ];

      default: // USER
        return [
          ...baseLinks,
          { href: "/bookmarks", label: "บุ๊คมาร์ค" },
        ];
    }
  };

  const links = getNavLinks();

  // User Dropdown Menu Items ตาม Role
  const getUserMenuItems = () => {
    const baseItems = [
      { href: "/profile", label: "โปรไฟล์", icon: "👤" },
      { href: "/settings", label: "ตั้งค่า", icon: "⚙️" },
    ];

    switch (role) {
      case "ADMIN":
        return [
          { href: "/admin/dashboard", label: "Admin Panel", icon: "👑" },
          { href: "/admin/logs", label: "Logs", icon: "🔍" },
          ...baseItems,
        ];

      case "OWNER":
        return [
          { href: "/my-shop", label: "ร้านของฉัน", icon: "🏪" },
          { href: "/dashboard/stats", label: "สถิติ", icon: "📊" },
          { href: "/my-shop/settings", label: "ตั้งค่าร้าน", icon: "⚙️" },
          ...baseItems,
        ];

      case "REVIEWER":
        return [
          { href: "/my-reviews", label: "รีวิวของฉัน", icon: "📝" },
          { href: "/dashboard/stats", label: "สถิติ", icon: "📈" },
          { href: "/achievements", label: "ความสำเร็จ", icon: "🏆" },
          ...baseItems,
        ];

      default: // USER
        return [
          { href: "/bookmarks", label: "บุ๊คมาร์ค", icon: "🔖" },
          ...baseItems,
          { href: "/upgrade/reviewer", label: "อัปเกรดเป็นนักรีวิว", icon: "⭐" },
        ];
    }
  };

  const userMenuItems = getUserMenuItems();

  // Badge ตาม Role
  const getRoleBadge = () => {
    switch (role) {
      case "ADMIN":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">👑 Admin</span>;
      case "OWNER":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">🏪 เจ้าของร้าน</span>;
      case "REVIEWER":
        return <span className="px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded">⭐ นักรีวิว</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Zablink Logo"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
          <span className="font-bold text-xl text-gray-800">
            Zablink
          </span>
        </Link>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex gap-6 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? "page" : undefined}
              className={[
                "hover:opacity-80 transition",
                pathname === l.href ? "font-semibold underline underline-offset-4" : "",
              ].join(" ")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side - Login/User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {!session ? (
            // Guest - Show Sign In Button
            <>
              <Link 
                href="/signup?role=owner" 
                className="px-4 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition font-medium text-sm"
              >
                สมัครเป็นเจ้าของร้าน
              </Link>
              <Link 
                href="/signin" 
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium text-sm"
              >
                เข้าสู่ระบบ
              </Link>
            </>
          ) : (
            // Logged in - Show User Menu
            <>
              {/* Notification Bell */}
              <button
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="notifications"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {/* Notification badge - ถ้ามีการแจ้งเตือน */}
                {/* <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span> */}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50 transition"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <Avatar name={session.user?.name || "User"} image={session.user?.image} />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{session.user?.name || "User"}</span>
                    {getRoleBadge()}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-lg p-1"
                  >
                    {userMenuItems.map((item) => (
                      <MenuItem 
                        key={item.href}
                        href={item.href} 
                        onClick={() => setMenuOpen(false)}
                        icon={item.icon}
                      >
                        {item.label}
                      </MenuItem>
                    ))}
                    <div className="h-px bg-gray-200 my-1" />
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-red-600 font-medium"
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                    >
                      🚪 ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden" 
          onClick={() => setOpen((v) => !v)} 
          aria-label="menu"
        >
          <Menu />
        </button>
      </div>

      <MobileMenu 
        open={open} 
        onClose={() => setOpen(false)} 
        links={links}
        userMenuItems={userMenuItems}
        role={role}
      />
    </header>
  );
}

type MenuItemProps = {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  icon?: string;
};

function MenuItem({ href, children, onClick, icon }: MenuItemProps) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm" 
      onClick={onClick}
    >
      {icon && <span>{icon}</span>}
      {children}
    </Link>
  );
}

function Avatar({
  name,
  image,
}: {
  name?: string | null;
  image?: string | null;
}) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name || "avatar"}
        width={32}
        height={32}
        className="rounded-full object-cover"
      />
    );
  }
  const initials = (name || "U")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white">
      {initials}
    </div>
  );
}
