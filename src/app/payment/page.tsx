// src/app/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { Package, Coins, CreditCard, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const item = cart?.items?.[0];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/cart");
      return;
    }
    if (status === "authenticated") {
      (async () => {
        try {
          const res = await fetch("/api/cart", { cache: "no-store" });
          const data = await res.json();
          if (!data.cart || !data.cart.items?.length) {
            toast.showError("ตะกร้าว่าง");
            router.push("/cart");
            return;
          }
          setCart(data.cart);
        } catch {
          toast.showError("โหลดตะกร้าไม่สำเร็จ");
          router.push("/cart");
          return;
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [status]);

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/payment/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showError(data.error || "เกิดข้อผิดพลาดในการสร้างการชำระเงิน");
        setProcessing(false);
        return;
      }
      if (data.charge?.authorize_uri) {
        window.location.href = data.charge.authorize_uri;
        return;
      }
      toast.showError("ไม่พบลิงก์ชำระเงิน");
      setProcessing(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.showError("เกิดข้อผิดพลาด");
      setProcessing(false);
    }
  };

  // Handle return from Omise
  useEffect(() => {
    const returnParam = searchParams.get("return");
    if (returnParam === "true") {
      toast.showSuccess("กำลังตรวจสอบการชำระเงิน...");
      setTimeout(() => {
        router.push("/dashboard/shop");
      }, 2000);
    }
  }, [searchParams]);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CreditCard className="w-8 h-8" />
            ชำระเงิน
          </h1>
          <p className="text-gray-600">เลือกช่องทางการชำระเงินที่คุณต้องการ</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">สรุปคำสั่งซื้อ</h2>
          
          {item?.kind === "subscription" && (
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">แพ็คเกจ {item.tier}</h3>
                <p className="text-sm text-gray-600">ราคาจะคำนวณจากฝั่งเซิร์ฟเวอร์</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  —
                </p>
              </div>
            </div>
          )}

          {item?.kind === "token_pack" && (
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Token Pack {item.packId}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  —
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">ยอดรวม</span>
              <span className="text-2xl font-bold text-gray-900">
                —
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ช่องทางการชำระเงิน</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Omise Payment Gateway</h3>
                    <p className="text-sm text-gray-600">
                      บัตรเครดิต/เดบิต, พร้อมเพย์, อินเตอร์เน็ตแบงก์กิ้ง
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>การชำระเงินจะดำเนินการผ่าน Omise Payment Gateway ที่ปลอดภัย</span>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <div className="flex gap-4">
          <Link
            href="/cart"
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center font-medium"
          >
            ยกเลิก
          </Link>
          <button
            onClick={handlePayment}
            disabled={processing}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                ชำระเงินผ่าน Omise
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
