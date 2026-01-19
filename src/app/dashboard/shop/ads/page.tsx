// src/app/dashboard/shop/ads/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  Eye,
  MousePointerClick,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
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
  adPackage?: {
    id: string;
    name: string;
    scope: string;
  };
}

const AD_SCOPES = [
  { value: "SUBDISTRICT", label: "ตำบล", pricePerDay: 50 },
  { value: "DISTRICT", label: "อำเภอ", pricePerDay: 200 },
  { value: "PROVINCE", label: "จังหวัด", pricePerDay: 500 },
  { value: "REGION", label: "ภูมิภาค", pricePerDay: 1500 },
  { value: "NATIONWIDE", label: "ทั่วประเทศ", pricePerDay: 3000 },
];

export default function ShopAdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");

  const [ads, setAds] = useState<Ad[]>([]);
  const [filteredAds, setFilteredAds] = useState<Ad[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form state
  const [selectedScope, setSelectedScope] = useState("SUBDISTRICT");
  const [durationDays, setDurationDays] = useState(7);
  const [tokenCost, setTokenCost] = useState(0);

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
    if (selectedScope && durationDays) {
      const scope = AD_SCOPES.find((s) => s.value === selectedScope);
      if (scope) {
        setTokenCost(scope.pricePerDay * durationDays);
      }
    }
  }, [selectedScope, durationDays]);

  // Filter ads
  useEffect(() => {
    let filtered = [...ads];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (ad) =>
          ad.scope.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ad.adPackage?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((ad) => {
        const startAt = new Date(ad.startAt);
        const endAt = new Date(ad.endAt);
        if (statusFilter === "active") {
          return now >= startAt && now <= endAt;
        } else if (statusFilter === "upcoming") {
          return now < startAt;
        } else if (statusFilter === "expired") {
          return now > endAt;
        }
        return true;
      });
    }

    setFilteredAds(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [ads, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAds.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAds = filteredAds.slice(startIndex, endIndex);

  const fetchData = async () => {
    if (!shopId) return;
    try {
      const [adsRes, walletRes] = await Promise.all([
        fetch(`/api/shops/${shopId}/ads`),
        fetch(`/api/shops/${shopId}/tokens/wallet`),
      ]);

      if (adsRes.ok) {
        const adsData = await adsRes.json();
        setAds(adsData.ads || []);
      }

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async () => {
    if (!shopId || !selectedScope || !durationDays || !tokenCost) {
      toast.showError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (wallet?.wallet?.balance < tokenCost) {
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
          tokenCost,
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

  const getStatusBadge = (ad: Ad) => {
    const now = new Date();
    const startAt = new Date(ad.startAt);
    const endAt = new Date(ad.endAt);

    if (now < startAt) {
      return { text: "รอเริ่ม", color: "bg-yellow-100 text-yellow-800" };
    } else if (now >= startAt && now <= endAt) {
      return { text: "กำลังใช้งาน", color: "bg-green-100 text-green-800" };
    } else {
      return { text: "หมดอายุ", color: "bg-gray-100 text-gray-800" };
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
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบร้านค้า</h2>
          <Link href="/dashboard/shop" className="text-blue-600 hover:underline">
            กลับไปหน้า Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const scope = AD_SCOPES.find((s) => s.value === selectedScope);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard/shop" },
            { label: "โฆษณาร้าน" },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">โฆษณาร้าน</h1>
              <p className="text-gray-600">จัดการโฆษณาของคุณ</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/shop"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                กลับ
              </Link>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                สร้างโฆษณาใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Token Balance */}
        {wallet && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Token Wallet</p>
                <p className="text-3xl font-bold">
                  {wallet.wallet?.balance?.toLocaleString() || 0} tokens
                </p>
              </div>
              <Link
                href={`/payment/tokens?shopId=${shopId}`}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                ซื้อ Token
              </Link>
            </div>
          </div>
        )}

        {/* Create Ad Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">สร้างโฆษณาใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกระดับการโฆษณา
                </label>
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {AD_SCOPES.map((scope) => (
                    <option key={scope.value} value={scope.value}>
                      {scope.label} ({scope.pricePerDay.toLocaleString()} tokens/วัน)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลา (วัน)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ราคา Token</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tokenCost.toLocaleString()} tokens
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {scope?.pricePerDay.toLocaleString()} tokens/วัน × {durationDays} วัน
                    </p>
                  </div>
                  {wallet && wallet.wallet?.balance < tokenCost && (
                    <div className="text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      Token ไม่พอ
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateAd}
                  disabled={creating || (wallet && wallet.wallet?.balance < tokenCost)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "กำลังสร้าง..." : "ยืนยันการสร้างโฆษณา"}
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ads List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">โฆษณาทั้งหมด</h2>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="active">กำลังใช้งาน</option>
                  <option value="upcoming">รอเริ่ม</option>
                  <option value="expired">หมดอายุ</option>
                </select>
              </div>
            </div>
          </div>
          {filteredAds.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ยังไม่มีโฆษณา</p>
              <p className="text-gray-400 text-sm mt-2">
                สร้างโฆษณาใหม่เพื่อเพิ่มการมองเห็นร้านของคุณ
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedAds.map((ad) => {
                  const statusBadge = getStatusBadge(ad);
                  const scopeLabel = AD_SCOPES.find((s) => s.value === ad.scope)?.label || ad.scope;
                  return (
                    <div
                      key={ad.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900">{scopeLabel}</h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}
                            >
                              {statusBadge.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(ad.startAt).toLocaleDateString("th-TH")} -{" "}
                                {new Date(ad.endAt).toLocaleDateString("th-TH")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4" />
                              <span>{ad.tokenCost.toLocaleString()} tokens</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredAds.length}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
