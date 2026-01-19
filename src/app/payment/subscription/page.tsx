// src/app/payment/subscription/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { Package, CreditCard, ArrowLeft, CheckCircle } from "lucide-react";

export default function PaymentSubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");
  const packageId = searchParams.get("packageId");

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && shopId && packageId) {
      fetchPlan();
    }
  }, [status, shopId, packageId]);

  const fetchPlan = async () => {
    try {
      const res = await fetch(`/api/subscription-plans`);
      if (res.ok) {
        const plans = await res.json();
        const selectedPlan = plans.find((p: any) => p.id === packageId);
        setPlan(selectedPlan);
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!shopId || !packageId) {
      toast.showError("ข้อมูลไม่ครบถ้วน");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId,
          autoRenew: true,
          paymentProvider: "omise",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Omise payment
        if (data.charge?.authorize_uri) {
          window.location.href = data.charge.authorize_uri;
        } else {
          toast.showInfo("กำลังดำเนินการชำระเงิน...");
        }
      } else {
        const error = await res.json();
        toast.showError(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error purchasing subscription:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(false);
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

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบแพ็กเกจ</h2>
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
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard/shop"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ชำระเงิน Subscription</h1>
          <p className="text-gray-600">ยืนยันการสมัครสมาชิก</p>
        </div>

        {/* Plan Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {plan.badge_emoji && <span className="mr-2">{plan.badge_emoji}</span>}
                {plan.name}
              </h2>
              <p className="text-gray-600">{plan.tier}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">ราคา</p>
              <p className="text-3xl font-bold text-gray-900">
                ฿{plan.price?.toLocaleString() || "0"}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Features ที่ได้รับ:</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">
                  รูปภาพสูงสุด: {plan.max_images}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">
                  เมนูสูงสุด: {plan.max_menu_items}
                </span>
              </div>
              {plan.token_amount > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    Token: {plan.token_amount.toLocaleString()}
                  </span>
                </div>
              )}
              {plan.has_verified_badge && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Verified Badge</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">ยอดรวม</p>
              <p className="text-2xl font-bold text-gray-900">
                ฿{plan.price?.toLocaleString() || "0"}
              </p>
            </div>
          </div>
          <button
            onClick={handlePurchase}
            disabled={processing}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            <CreditCard className="w-5 h-5" />
            {processing ? "กำลังดำเนินการ..." : "ชำระเงินผ่าน Omise"}
          </button>
        </div>
      </div>
    </div>
  );
}
