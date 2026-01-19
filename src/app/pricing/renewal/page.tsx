// src/app/pricing/renewal/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { Package, CheckCircle, ArrowLeft, ArrowRight, ShoppingCart, Clock } from "lucide-react";

export default function RenewalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/pricing/renewal");
      return;
    }
    if (status === "authenticated" && shopId) {
      fetchSubscription();
      fetchCampaigns();
    }
  }, [status, shopId]);

  const fetchSubscription = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/subscription`);
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`/api/promotion-campaigns?type=RENEWAL&activeOnly=true`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const handleRenewal = () => {
    if (!subscription || !subscription.plan) {
      toast.showError("ไม่พบข้อมูล Package");
      return;
    }

    // Redirect to payment with renewal flag
    router.push(
      `/payment?type=package&packageId=${subscription.plan.id}&shopId=${shopId}&renewal=true`
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

  if (!subscription || !subscription.plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบ Package</h2>
          <Link href="/pricing" className="text-blue-600 hover:underline">
            กลับไปหน้าแพ็คเกจ
          </Link>
        </div>
      </div>
    );
  }

  const plan = subscription.plan;
  const expiresAt = new Date(subscription.expiresAt);
  const now = new Date();
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const basePrice = Number(plan.price || plan.price_monthly || 0);
  
  // Calculate campaign price
  const campaignPrice = campaigns.length > 0
    ? campaigns.reduce((price, campaign) => {
        if (campaign.discountType === "PERCENTAGE") {
          return price * (1 - (campaign.discountValue || 0) / 100);
        } else if (campaign.discountType === "FIXED_AMOUNT") {
          return Math.max(0, price - (campaign.discountValue || 0));
        }
        return price;
      }, basePrice)
    : basePrice;

  const discount = basePrice - campaignPrice;
  const hasActiveCampaign = campaigns.length > 0;

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
            กลับไป Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            ต่ออายุ Package
          </h1>
          <p className="text-gray-600">ต่ออายุ Package ปัจจุบันของคุณ</p>
        </div>

        {/* Current Subscription Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Package ปัจจุบัน
          </h2>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-gray-600">
                {daysRemaining > 0
                  ? `เหลืออีก ${daysRemaining} วัน`
                  : `หมดอายุเมื่อ ${expiresAt.toLocaleDateString("th-TH")}`}
              </p>
            </div>
          </div>

          {daysRemaining > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Package ของคุณจะหมดอายุในอีก {daysRemaining} วัน
              </p>
            </div>
          )}
        </div>

        {/* Campaign Banner */}
        {hasActiveCampaign && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-sm p-6 mb-6 border border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-2">🎉 โปรโมชั่นพิเศษ!</h3>
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="mb-2">
                <p className="text-green-700">
                  {campaign.name}
                  {campaign.discountType === "PERCENTAGE" && (
                    <span className="font-bold"> - ส่วนลด {campaign.discountValue}%</span>
                  )}
                  {campaign.discountType === "FIXED_AMOUNT" && (
                    <span className="font-bold"> - ลด {campaign.discountValue} บาท</span>
                  )}
                </p>
                {campaign.description && (
                  <p className="text-sm text-green-600">{campaign.description}</p>
                )}
                <p className="text-xs text-green-500 mt-1">
                  ถึงวันที่ {new Date(campaign.endDate).toLocaleDateString("th-TH")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Renewal Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">สรุปการต่ออายุ</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>แพ็คเกจ {plan.name}</span>
              <span>฿{basePrice.toLocaleString()}</span>
            </div>
            {hasActiveCampaign && discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>ส่วนลดจาก Campaign</span>
                <span>-฿{discount.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">ยอดรวม</span>
                <span className="text-2xl font-bold text-gray-900">
                  ฿{campaignPrice.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link
            href="/dashboard/shop"
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center font-medium"
          >
            ยกเลิก
          </Link>
          <button
            onClick={handleRenewal}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
          >
            ต่ออายุ Package
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
