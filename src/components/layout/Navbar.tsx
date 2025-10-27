// src/components/layout/Navbar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, ChevronDown } from "lucide-react";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const role = (session?.user as { role?: string })?.role;

  const links = [
    { href: "/", label: "หน้าแรก" },
    { href: "/dashboard", label: "Dashboard" },
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">FoodFinder</Link>

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

        <div className="hidden md:flex items-center gap-3">
          {!session ? (
            <Link 
              href="/signin" 
              className="px-3 py-2 rounded-lg border hover:bg-gray-50 transition"
            >
              เข้าสู่ระบบ
            </Link>
          ) : (
            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar name={session.user?.name || "User"} image={session.user?.image} />
                <ChevronDown className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-xl border bg-background shadow-md p-1"
                >
                  <MenuItem href="/dashboard" onClick={() => setMenuOpen(false)}>
                    Dashboard
                  </MenuItem>
                  {role === "ADMIN" && (
                    <MenuItem href="/admin" onClick={() => setMenuOpen(false)}>
                      Admin
                    </MenuItem>
                  )}
                  <MenuItem href="/dashboard/user" onClick={() => setMenuOpen(false)}>
                    โปรไฟล์
                  </MenuItem>
                  <button
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="menu">
          <Menu />
        </button>
      </div>

      <MobileMenu open={open} onClose={() => setOpen(false)} links={links} />
    </header>
  );
}

type MenuItemProps = {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
};

function MenuItem({ href, children, onClick }: MenuItemProps) {
  return (
    <Link href={href} className="block px-3 py-2 rounded-lg hover:bg-muted" onClick={onClick}>
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
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={image} alt={name || "avatar"} className="h-6 w-6 rounded-full object-cover" />
    );
  }
  const initials = (name || "U")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
      {initials}
    </div>
  );
}