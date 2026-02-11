// src/app/dashboard/shop/ads/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import {
  TrendingUp,
  Plus,
  Clock,
  MapPin,
  Coins,
  AlertCircle,
  Search,
  Filter,
  Tag,
  ArrowRight,
  Star, // Import Star icon for OG Badge
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";

interface Ad {
  id: string;
  scope: string;
  durationDays: number;
  tokenCost: number;
  startAt: string;
  endAt: string;
  status: string;
}

interface TokenBatch {
  id: string;
  remainingAmount: number;
  purchasedAt: string;
  expiresAt: string;
}

const AD_SCOPES = [
  { value: "SUBDISTRICT", label: "ตำบล", pricePerDay: 50 },
  { value: "DISTRICT", label: "อำเภอ", pricePerDay: 200 },
  { value: "PROVINCE", label: "จังหวัด", pricePerDay: 500 },
  { value: "REGION", label: "ภูมิภาค", pricePerDay: 1500 },
  { value: "NATIONWIDE", label: "ทั่วประเทศ", pricePerDay: 3000 },
];

const OG_DISCOUNT_PERCENT = 30;

const getDiscountTier = (purchasedAt: string, expiresAt: string) => {
  const now = new Date();
  const purchasedDate = new Date(purchasedAt);
  const expiryDate = new Date(expiresAt);

  const daysSincePurchase = (now.getTime() - purchasedDate.getTime()) / (1000 * 3600 * 24);
  const daysToExpire = (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

  if (daysToExpire <= 14) {
    return { text: "ไม่มีส่วนลด", discount: 0 };
  }
  if (daysSincePurchase <= 30) {
    return { text: "10%", discount: 10 };
  }
  if (daysSincePurchase <= 60) {
    return { text: "7%", discount: 7 };
  }
  return { text: "5%", discount: 5 };
};

export default function ShopAdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");
  const toast = useToast();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Wallet, Batches & OG Status
  const [walletBalance, setWalletBalance] = useState(0);
  const [tokenBatches, setTokenBatches] = useState<TokenBatch[]>([]);
  const [isOgMember, setIsOgMember] = useState(false);

  // Form state
  const [selectedScope, setSelectedScope] = useState("SUBDISTRICT");
  const [durationDays, setDurationDays] = useState(7);
  const [tokenCost, setTokenCost] = useState(0);

  const costSummary = useMemo(() => {
    if (tokenCost === 0) {
      return { finalCost: 0, discountValue: 0, bestDiscount: 0, isOgDiscount: false };
    }

    let tokenAgeDiscount = 0;
    if (tokenBatches && tokenBatches.length > 0) {
        let tokensNeeded = tokenCost;
        let tokensChecked = 0;
        const sortedBatches = [...tokenBatches].sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());

        for (const batch of sortedBatches) {
            if (tokensChecked >= tokensNeeded) break;
            const discountInfo = getDiscountTier(batch.purchasedAt, batch.expiresAt);
            if (discountInfo.discount > tokenAgeDiscount) {
                tokenAgeDiscount = discountInfo.discount;
            }
            tokensChecked += batch.remainingAmount;
        }
    }
    
    const finalAppliedDiscount = isOgMember ? Math.max(tokenAgeDiscount, OG_DISCOUNT_PERCENT) : tokenAgeDiscount;
    const isOgDiscount = isOgMember && finalAppliedDiscount === OG_DISCOUNT_PERCENT;

    const finalCost = Math.ceil(tokenCost * (1 - finalAppliedDiscount / 100));
    return { finalCost, discountValue: tokenCost - finalCost, bestDiscount: finalAppliedDiscount, isOgDiscount };

  }, [tokenCost, tokenBatches, isOgMember]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && shopId) {
      fetchData();
    }
  }, [status, shopId]);

  useEffect(() => {
    const scope = AD_SCOPES.find((s) => s.value === selectedScope);
    if (scope) {
      setTokenCost(scope.pricePerDay * durationDays);
    }
  }, [selectedScope, durationDays]);

  const fetchData = async () => {
    if (!shopId) return;
    try {
      const [adsRes, reportRes] = await Promise.all([
        fetch(`/api/shops/${shopId}/ads`),
        fetch(`/api/shops/${shopId}/tokens/report?include_og_status=true`),
      ]);

      if (adsRes.ok) {
        const adsData = await adsRes.json();
        setAds(adsData.ads || []);
      }
      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setWalletBalance(reportData.wallet?.balance || 0);
        setTokenBatches(reportData.batches || []);
        setIsOgMember(reportData.isOgMember || false); // Get OG status from API
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.showError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async () => {
    // ... (rest of the function is the same, it correctly uses costSummary.finalCost)
     if (!shopId || !selectedScope || !durationDays || !tokenCost) {
      toast.showError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (walletBalance < costSummary.finalCost) {
      toast.showError("Token ไม่พอ กรุณาซื้อ Token เพิ่ม");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/ads/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          scope: selectedScope,
          durationDays,
          tokenCost, // Backend will recalculate the final cost based on this
        }),
      });

      if (res.ok) {
        toast.showSuccess("ลงโฆษณาสำเร็จ!");
        setShowCreateForm(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.showError(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setCreating(false);
    }
  };

  if (loading || status === "loading") {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard/shop" }, { label: "โฆษณาร้าน" }]} />
        <div className="flex items-center justify-between mb-6">
          {/* ... Header and Button ... */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">โฆษณาร้าน</h1>
              <p className="text-gray-600">จัดการและสร้างโฆษณาเพื่อโปรโมทร้านของคุณ</p>
            </div>
            <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {showCreateForm ? 'ยกเลิก' : 'สร้างโฆษณาใหม่'}
            </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {showCreateForm && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">สร้างโฆษณาใหม่</h2>
                <div className="space-y-4">
                  {/* ... Scope and Duration selectors ... */}
                   <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">เลือกระดับการโฆษณา</label>
                        <select value={selectedScope} onChange={(e) => setSelectedScope(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        {AD_SCOPES.map((scope) => (
                            <option key={scope.value} value={scope.value}>
                            {scope.label} ({scope.pricePerDay.toLocaleString()} tokens/วัน)
                            </option>
                        ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ระยะเวลา (วัน)</label>
                        <input type="number" min="1" max="365" value={durationDays} onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>

                  {/* Cost Summary - UPDATED */}
                  <div className="bg-blue-50/70 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600 mb-2">สรุปค่าใช้จ่าย</p>
                    {costSummary.bestDiscount > 0 ? (
                      <div>
                        <p className="text-xl font-medium text-gray-500 line-through">{tokenCost.toLocaleString()} tokens</p>
                        <div className="flex items-center gap-3 my-1">
                          <p className="text-3xl font-bold text-gray-900">{costSummary.finalCost.toLocaleString()} <span className="text-xl font-medium">Tokens</span></p>
                          <span className={`text-sm font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full ${costSummary.isOgDiscount ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'}`}>
                              {costSummary.isOgDiscount ? <Star size={14}/> : <Tag size={14}/>}
                              {costSummary.isOgDiscount ? `OG Member ${costSummary.bestDiscount}%` : `ส่วนลด ${costSummary.bestDiscount}%`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{tokenCost.toLocaleString()} <span className="text-xl font-medium">Tokens</span></p>
                    )}
                    {walletBalance < costSummary.finalCost && (
                      <div className="text-red-600 text-sm mt-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Token ของคุณไม่เพียงพอ</div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                     <button onClick={handleCreateAd} disabled={creating || walletBalance < costSummary.finalCost} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold">
                        {creating ? "กำลังสร้าง..." : "ยืนยันและชำระเงิน"}
                        </button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ประวัติการโฆษณา</h2>
              {/* Ads list rendering */}
            </div>
          </div>
          <div className="lg:col-span-1">
            {/* ... Wallet Summary Info ... */}
             <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg">
                        <Coins className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                         <h3 className="font-bold text-gray-900">Token Wallet</h3>
                         <p className="text-sm text-gray-600">ยอด Token คงเหลือ</p>
                    </div>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-4">{walletBalance.toLocaleString()}</p>
                <div className="flex flex-col gap-2">
                    <Link href={`/payment/tokens?shopId=${shopId}`} className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                        ซื้อ Token
                    </Link>
                    <Link href={`/dashboard/shop/reports?shopId=${shopId}`} className="w-full text-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium">
                        ดูประวัติ
                    </Link>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
