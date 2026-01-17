// src/app/dashboard/creator/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Save, DollarSign, MapPin, User } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function CreatorSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creator, setCreator] = useState<any>(null);

  // Form state
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [coverageAreas, setCoverageAreas] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchCreator();
    }
  }, [status]);

  const fetchCreator = async () => {
    try {
      const res = await fetch("/api/creator/profile");
      if (res.ok) {
        const data = await res.json();
        setCreator(data);
        setPriceMin(data.currentPriceMin?.toString() || "");
        setPriceMax(data.currentPriceMax?.toString() || "");
      }
    } catch (error) {
      console.error("Error fetching creator:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!priceMin || !priceMax) {
      toast.showError("กรุณากรอกช่วงราคา");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/creator/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPriceMin: parseInt(priceMin),
          currentPriceMax: parseInt(priceMax),
        }),
      });

      if (res.ok) {
        toast.showSuccess("บันทึกการตั้งค่าสำเร็จ!");
        fetchCreator();
      } else {
        const error = await res.json();
        toast.showError(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
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

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบข้อมูล Creator</h2>
          <Link href="/dashboard/creator" className="text-blue-600 hover:underline">
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
            { label: "Dashboard", href: "/dashboard/creator" },
            { label: "ตั้งค่า" },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ตั้งค่า Creator</h1>
          <p className="text-gray-600">จัดการการตั้งค่าต่างๆ ของคุณ</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              โปรไฟล์
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                แก้ไขข้อมูลโปรไฟล์ Creator
              </p>
              <Link
                href="/creator/profile/edit"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                แก้ไขโปรไฟล์
              </Link>
            </div>
          </div>

          {/* Pricing Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              ราคา
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ราคาต่ำสุด (tokens) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ราคาสูงสุด (tokens) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>

          {/* Coverage Areas */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              พื้นที่ให้บริการ
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                จัดการพื้นที่ที่คุณสามารถให้บริการได้
              </p>
              <p className="text-sm text-gray-500">
                (ฟีเจอร์นี้จะเพิ่มในอนาคต)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
