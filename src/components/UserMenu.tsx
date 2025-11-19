// components/UserMenu.tsx
// User Menu with Avatar and Dropdown
// รองรับ role: USER, SHOP, CREATOR, MCN_MANAGER, AD_MANAGER, ADMIN

"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Settings,
  LogOut,
  Store,
  BarChart3,
  Shield,
  Star,
  DollarSign,
  FileText,
  ChevronDown,
  Bell,
  Palette,
} from "lucide-react";

interface Creator {
  id: string;
  displayName: string;
  applicationStatus: string;
  rating: number;
  totalEarnings: number;
}

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Load creator data if user is CREATOR
  useEffect(() => {
    const loadCreatorData = async () => {
      if (session?.user?.role === "CREATOR" && !creator && !isLoadingCreator) {
        setIsLoadingCreator(true);
        try {
          const res = await fetch("/api/creator/profile");
          if (res.ok) {
            const data = await res.json();
            setCreator(data);
          }
        } catch (error) {
          console.error("Error loading creator data:", error);
        } finally {
          setIsLoadingCreator(false);
        }
      }
    };

    if (status === "authenticated") {
      loadCreatorData();
    }
  }, [session, status, creator, isLoadingCreator]);

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
    );
  }

  if (!session || !session.user) {
    return (
      <Link
        href="/signin"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        เข้าสู่ระบบ
      </Link>
    );
  }

  const userRole = session.user.role || "USER";
  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";
  const userImage = session.user.image;

  // Get status badge for creator
  const getCreatorStatusBadge = () => {
    if (!creator) return null;

    const statusConfig = {
      PENDING: { label: "รอการอนุมัติ", color: "bg-yellow-100 text-yellow-800" },
      APPROVED: { label: "อนุมัติแล้ว", color: "bg-green-100 text-green-800" },
      REJECTED: { label: "ไม่อนุมัติ", color: "bg-red-100 text-red-800" },
      SUSPENDED: { label: "ระงับการใช้งาน", color: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[creator.applicationStatus as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        {userImage ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
            <Image
              src={userImage}
              alt={userName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* User Info */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 line-clamp-1">
            {userName}
          </p>
          {creator && creator.applicationStatus === "APPROVED" && (
            <p className="text-xs text-gray-500">
              ⭐ {creator.rating.toFixed(1)} • ฿{creator.totalEarnings.toLocaleString()}
            </p>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {userImage ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                  <Image
                    src={userImage}
                    alt={userName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-sm text-gray-500 truncate">{userEmail}</p>
                {creator && getCreatorStatusBadge() && (
                  <div className="mt-1">{getCreatorStatusBadge()}</div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Profile */}
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 text-gray-500" />
              <span>โปรไฟล์</span>
            </Link>

            {/* Dashboard */}
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span>แดชบอร์ด</span>
            </Link>

            {/* Creator Menu Items */}
            {userRole === "CREATOR" && creator?.applicationStatus === "APPROVED" && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Creator</p>
                </div>
                <Link
                  href="/creator/jobs"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>งานของฉัน</span>
                </Link>
                <Link
                  href="/creator/earnings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span>รายได้</span>
                  {creator && creator.totalEarnings > 0 && (
                    <span className="ml-auto text-xs text-green-600 font-medium">
                      ฿{creator.totalEarnings.toLocaleString()}
                    </span>
                  )}
                </Link>
                <Link
                  href="/creator/profile/edit"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>แก้ไขโปรไฟล์ Creator</span>
                </Link>
              </>
            )}

            {/* Creator Application Pending */}
            {userRole === "CREATOR" && creator?.applicationStatus === "PENDING" && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <div className="px-4 py-3 bg-yellow-50 mx-2 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium">
                    🕐 คำขอสมัครของคุณกำลังรอการอนุมัติ
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    ทีมงานจะแจ้งผลภายใน 1-3 วันทำการ
                  </p>
                </div>
              </>
            )}

            {/* Upgrade to Creator */}
            {userRole === "USER" && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <Link
                  href="/upgrade/reviewer"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Star className="w-4 h-4" />
                  <span className="font-medium">สมัครเป็น Creator</span>
                </Link>
              </>
            )}

            {/* Shop Menu Items */}
            {userRole === "SHOP" && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">ร้านค้า</p>
                </div>
                <Link
                  href="/shop/manage"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Store className="w-4 h-4 text-gray-500" />
                  <span>จัดการร้านค้า</span>
                </Link>
                <Link
                  href="/shop/campaigns"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>แคมเปญของฉัน</span>
                </Link>
              </>
            )}

            {/* Admin Menu Items */}
            {userRole === "ADMIN" && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Admin</p>
                </div>
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">Admin Dashboard</span>
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span>การตั้งค่าเว็บไซต์</span>
                </Link>
                <Link
                  href="/admin/users"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-4 h-4 text-gray-500" />
                  <span>จัดการผู้ใช้งาน</span>
                </Link>
                <Link
                  href="/admin/shops"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Store className="w-4 h-4 text-gray-500" />
                  <span>จัดการร้านค้า</span>
                </Link>
                <Link
                  href="/admin/creators"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Star className="w-4 h-4 text-gray-500" />
                  <span>จัดการ Creators</span>
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  <span>สถิติและรายงาน</span>
                </Link>
              </>
            )}

            {/* Common Menu Items */}
            <div className="border-t border-gray-100 my-2"></div>

            <Link
              href="/notifications"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Bell className="w-4 h-4 text-gray-500" />
              <span>การแจ้งเตือน</span>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 text-gray-500" />
              <span>ตั้งค่า</span>
            </Link>

            {/* Logout */}
            <div className="border-t border-gray-100 my-2"></div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
