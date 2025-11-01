// src/components/layout/MobileMenu.tsx
"use client";
import Link from "next/link";
import { X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

type MenuLink = {
  href: string;
  label: string;
};

type UserMenuItem = {
  href: string;
  label: string;
  icon?: string;
};

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  links: MenuLink[];
  userMenuItems?: UserMenuItem[];
  role?: string;
};

export default function MobileMenu({ 
  open, 
  onClose, 
  links,
  userMenuItems = [],
  role
}: MobileMenuProps) {
  const { data: session } = useSession();

  if (!open) return null;

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
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile Menu */}
      <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl z-50 md:hidden overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">เมนู</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              aria-label="close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info (if logged in) */}
          {session && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white">
                  {session.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-medium text-sm">{session.user?.name || "User"}</p>
                  <p className="text-xs text-gray-500">{session.user?.email}</p>
                </div>
              </div>
              {getRoleBadge()}
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="block px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User Menu Items (if logged in) */}
          {session && userMenuItems.length > 0 && (
            <>
              <div className="h-px bg-gray-200 my-4" />
              <div className="space-y-1">
                {userMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-sm"
                  >
                    {item.icon && <span>{item.icon}</span>}
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Sign Out / Sign In */}
          <div className="h-px bg-gray-200 my-4" />
          {session ? (
            <button
              onClick={() => {
                onClose();
                signOut();
              }}
              className="w-full px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm transition"
            >
              🚪 ออกจากระบบ
            </button>
          ) : (
            <div className="space-y-2">
              <Link
                href="/signin"
                onClick={onClose}
                className="block w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm text-center hover:bg-blue-700 transition"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="block w-full px-3 py-2 rounded-lg border border-blue-600 text-blue-600 font-medium text-sm text-center hover:bg-blue-50 transition"
              >
                สมัครสมาชิก
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
