// src/app/pricing/cart/package/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { Package, CheckCircle, ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";

export default function PackageCartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageName = searchParams.get("packageName"); // FREE, BASIC, PRO, PREMIUM
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [packageData, setPackageData] = useState<any>(null);
  const [shopId, setShopId] = useState<string | null>(null);

  // Hardcoded package data matching the pricing page
  const packageMapping: Record<string, any> = {
    FREE: {
      name: 'FREE',
      price: 0,
      period: 'ตลอดไป',
      features: [
        'ลงข้อมูลร้านค้าพื้นฐาน',
        'อัพโหลดรูปภาพได้ 3 รูป',
        'แสดงในผลการค้นหา',
        'รับรีวิวจากลูกค้า',
      ],
    },
    BASIC: {
      name: 'BASIC',
      price: 199,
      period: 'ต่อเดือน',
      features: [
        'ทุกอย่างใน FREE',
        'อัพโหลดรูปภาพได้ 10 รูป',
        'ป้าย "Verified" บนร้าน',
        'ลิงก์แพลตฟอร์มส่งอาหาร',
        'สถิติการเข้าชมร้าน',
        'รับ 100 Tokens ฟรี',
      ],
    },
    PRO: {
      name: 'PRO',
      price: 499,
      period: 'ต่อเดือน',
      features: [
        'ทุกอย่างใน BASIC',
        'อัพโหลดรูปภาพได้ 30 รูป',
        'ป้าย "Pro Shop" โดดเด่น',
        'แสดงในหน้าแรก (แบบสุ่ม)',
        'สถิติแบบละเอียด',
        'รับ 300 Tokens ฟรี',
        'ส่วนลด 10% โฆษณา',
      ],
    },
    PREMIUM: {
      name: 'PREMIUM',
      price: 999,
      period: 'ต่อเดือน',
      features: [
        'ทุกอย่างใน PRO',
        'อัพโหลดรูปภาพไม่จำกัด',
        'ป้าย "Premium Partner" พิเศษ',
        'ติดหน้าแรกเป็นพิเศษ',
        'การวิเคราะห์ขั้นสูง',
        'รับ 700 Tokens ฟรี',
        'ส่วนลด 20% โฆษณา',
        'ตัวแทนเฉพาะ (Account Manager)',
      ],
    },
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/pricing");
      return;
    }
    if (status === "authenticated") {
      if (!packageName || !packageMapping[packageName.toUpperCase()]) {
        toast.showError("ไม่พบแพ็คเกจที่เลือก");
        router.push("/pricing");
        return;
      }
      setPackageData(packageMapping[packageName.toUpperCase()]);
      fetchShopId();
      setLoading(false);
    }
  }, [status, packageName]);

  const fetchShopId = async () => {
    try {
      const res = await fetch('/api/user/shops');
      if (res.ok) {
        const data = await res.json();
        if (data.shops && data.shops.length > 0) {
          setShopId(data.shops[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
    }
  };

  const handleCheckout = () => {
    if (!shopId) {
      toast.showError("กรุณาสมัครร้านค้าก่อน");
      router.push("/shop/register");
      return;
    }

    if (packageData.price === 0) {
      // FREE package - redirect directly
      router.push(`/shop/register`);
      return;
    }

    // Redirect to payment page
    router.push(`/payment?type=package&packageName=${packageName}&shopId=${shopId}`);
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบแพ็คเกจ</h2>
          <Link href="/pricing" className="text-blue-600 hover:underline">
            กลับไปหน้าแพ็คเกจ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าแพ็คเกจ
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            สรุปคำสั่งซื้อแพ็คเกจ
          </h1>
          <p className="text-gray-600">ตรวจสอบรายละเอียดก่อนชำระเงิน</p>
        </div>

        {/* Package Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                แพ็คเกจ {packageData.name}
              </h2>
              <p className="text-gray-600">{packageData.period}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">ราคา</p>
              <p className="text-3xl font-bold text-gray-900">
                {packageData.price === 0 ? (
                  <span className="text-green-600">ฟรี</span>
                ) : (
                  <>฿{packageData.price.toLocaleString()}</>
                )}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">สิทธิประโยชน์ที่ได้รับ:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {packageData.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">สรุปคำสั่งซื้อ</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>แพ็คเกจ {packageData.name}</span>
              <span>
                {packageData.price === 0 ? (
                  <span className="text-green-600">ฟรี</span>
                ) : (
                  <>฿{packageData.price.toLocaleString()}</>
                )}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">ยอดรวม</span>
                <span className="text-2xl font-bold text-gray-900">
                  {packageData.price === 0 ? (
                    <span className="text-green-600">ฟรี</span>
                  ) : (
                    <>฿{packageData.price.toLocaleString()}</>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/pricing"
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center font-medium"
          >
            ยกเลิก
          </Link>
          <button
            onClick={handleCheckout}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
          >
            ดำเนินการชำระเงิน
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
