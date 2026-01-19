// src/app/dashboard/shop/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Settings, Save, ArrowLeft, Store, Coins, Users } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function ShopSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState<any>(null);
  const toast = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && shopId) {
      fetchShop();
    }
  }, [status, shopId]);

  const fetchShop = async () => {
    if (!shopId) return;
    try {
      const res = await fetch(`/api/shops/${shopId}`);
      if (res.ok) {
        const data = await res.json();
        setShop(data);
      }
    } catch (error) {
      console.error("Error fetching shop:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบร้านค้า</h2>
          <Link href="/dashboard/shop" className="text-blue-600 hover:underline">
            กลับไปหน้า Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard/shop" },
            { label: "ตั้งค่า" },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ตั้งค่าร้านค้า</h1>
          <p className="text-gray-600">จัดการการตั้งค่าต่างๆ ของร้าน</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5" />
              ข้อมูลทั่วไป
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อร้าน
                </label>
                <input
                  type="text"
                  value={shop?.name || ""}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  แก้ไขได้ที่{" "}
                  <Link
                    href={`/shop/edit/${shopId}`}
                    className="text-blue-600 hover:underline"
                  >
                    หน้าแก้ไขร้าน
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5" />
              สมาชิกภาพ
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                จัดการแพ็กเกจสมาชิกและ Token ของคุณ
              </p>
              <div className="flex gap-3">
                <Link
                  href={`/dashboard/shop?shopId=${shopId}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  ดูแพ็กเกจปัจจุบัน
                </Link>
                <Link
                  href={`/payment/tokens?shopId=${shopId}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ซื้อ Token
                </Link>
              </div>
            </div>
          </div>

          {/* Campaign Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              การตั้งค่า Campaign
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                จัดการการตั้งค่าสำหรับการจ้าง Creator
              </p>
              <div className="flex gap-3">
                <Link
                  href={`/dashboard/shop/campaigns?shopId=${shopId}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  จัดการ Campaigns
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
