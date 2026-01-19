// src/app/pricing/cart/token/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { Coins, CheckCircle, ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";

export default function TokenCartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get("amount"); // Total tokens (including bonus)
  const price = searchParams.get("price");
  const bonus = searchParams.get("bonus") || "0";
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/pricing");
      return;
    }
    if (status === "authenticated") {
      if (!amount || !price) {
        toast.showError("ข้อมูลไม่ครบถ้วน");
        router.push("/pricing");
        return;
      }
      fetchShopId();
      setLoading(false);
    }
  }, [status, amount, price]);

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

    // Redirect to payment page
    router.push(
      `/payment?type=token&amount=${amount}&price=${price}&bonus=${bonus}&shopId=${shopId}`
    );
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

  const tokenAmount = parseInt(amount || "0");
  const tokenPrice = parseFloat(price || "0");
  const tokenBonus = parseInt(bonus || "0");
  const baseAmount = tokenAmount - tokenBonus;

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
            สรุปคำสั่งซื้อ Token
          </h1>
          <p className="text-gray-600">ตรวจสอบรายละเอียดก่อนชำระเงิน</p>
        </div>

        {/* Token Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Coins className="w-8 h-8 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                ซื้อ Token
              </h2>
              <p className="text-gray-600">สำหรับใช้โฆษณาและบริการพิเศษ</p>
            </div>
            <div className="text-right">
              <div className="text-4xl mb-1">🪙</div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">จำนวน Token ที่จะได้รับ</span>
                <span className="text-2xl font-bold text-gray-900">
                  {tokenAmount.toLocaleString()} Tokens
                </span>
              </div>
              {tokenBonus > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">จำนวน Token ฐาน</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {baseAmount.toLocaleString()} Tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600 font-semibold">โบนัส!</p>
                      <p className="text-lg font-bold text-green-600">
                        +{tokenBonus.toLocaleString()} Tokens
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Token ไม่มีวันหมดอายุ</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>สามารถใช้โฆษณาและบริการพิเศษได้ทันที</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">สรุปคำสั่งซื้อ</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Token {tokenAmount.toLocaleString()} เหรียญ</span>
              <span>฿{tokenPrice.toLocaleString()}</span>
            </div>
            {tokenBonus > 0 && (
              <div className="flex justify-between text-green-600">
                <span>โบนัส {tokenBonus.toLocaleString()} เหรียญ</span>
                <span>ฟรี</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">ยอดรวม</span>
                <span className="text-2xl font-bold text-gray-900">
                  ฿{tokenPrice.toLocaleString()}
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
