// src/app/dashboard/shop/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Edit, Package, Coins, Eye, TrendingUp, Settings, Heart, Star, Users, ArrowUp, ArrowDown } from "lucide-react";

interface ShopAnalytics {
  totalViews: number;
  totalClicks: number;
  totalBookmarks: number;
  averageRating: number;
  totalReviews: number;
  recentViews: number;
  recentBookmarks: number;
  subscription?: {
    packageName: string;
    tier: string;
    endDate: string;
    features: {
      maxImages: number;
      maxMenuItems: number;
      maxDeliveryLinks: number;
      hasVerifiedBadge: boolean;
      hasAdvancedAnalytics: boolean;
      canPinOnMap: boolean;
      badgeText?: string;
      badgeEmoji?: string;
    };
  } | null;
}

// Token Wallet Component
function TokenWalletSection({ shopId }: { shopId: string }) {
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shops/${shopId}/tokens/wallet`)
      .then((res) => res.json())
      .then((data) => {
        setWallet(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching wallet:", err);
        setLoading(false);
      });
  }, [shopId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 mb-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <Coins className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Token Wallet</h2>
            <p className="text-sm text-gray-600">ยอด Token ที่ใช้ได้</p>
          </div>
        </div>
        <Link
          href={`/payment/tokens?shopId=${shopId}`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          ซื้อ Token
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">ยอด Token คงเหลือ</p>
          <p className="text-3xl font-bold text-gray-900">
            {wallet.wallet?.balance?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">Token ที่จะหมดอายุเร็วๆ นี้</p>
          <p className="text-3xl font-bold text-orange-600">
            {wallet.expiringSoon?.amount?.toLocaleString() || 0}
          </p>
          {wallet.expiringSoon?.amount > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              หมดอายุใน 30 วัน
            </p>
          )}
        </div>
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
          <p className="text-xs text-gray-600 mb-1">จำนวน Batches</p>
          <p className="text-3xl font-bold text-gray-900">
            {wallet.purchases?.length || 0}
          </p>
        </div>
      </div>

      {wallet.expiringSoon?.batches?.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <p className="text-sm font-medium text-orange-800">Token ที่จะหมดอายุเร็วๆ นี้</p>
          </div>
          <div className="space-y-1">
            {wallet.expiringSoon.batches.slice(0, 3).map((batch: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-gray-700">
                  {batch.amount.toLocaleString()} tokens
                </span>
                <span className="text-orange-600">
                  หมดอายุ: {new Date(batch.expiresAt).toLocaleDateString('th-TH')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <Link
          href={`/dashboard/shop/reports?shopId=${shopId}`}
          className="flex-1 text-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
        >
          ดูรายงาน
        </Link>
      </div>
    </div>
  );
}

export default function ShopDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ShopAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchShopsData();
    }
  }, [status]);

  const fetchShopsData = async () => {
    try {
      const res = await fetch('/api/user/shops');
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
        // Auto-select first shop for analytics
        if (data.shops && data.shops.length > 0) {
          setSelectedShopId(data.shops[0].id);
          fetchAnalytics(data.shops[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (shopId: string) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/shop/${shopId}/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleShopChange = (shopId: string) => {
    setSelectedShopId(shopId);
    fetchAnalytics(shopId);
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

  if (shops.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ยังไม่มีร้านค้า</h2>
          <p className="text-gray-600 mb-4">กรุณาเพิ่มร้านค้าก่อนเข้าใช้งาน</p>
          <Link
            href="/shop/register"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            เพิ่มร้านค้า
          </Link>
        </div>
      </div>
    );
  }

  if (shops.length === 1) {
    const shop = shops[0];
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Store className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
                  <p className="text-gray-600">
                    {shop.categories?.map((c: any) => c.category.name).join(', ') || 'ไม่ระบุหมวดหมู่'}
                  </p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                shop.status === 'APPROVED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {shop.status === 'APPROVED' ? '✓ อนุมัติแล้ว' : '⏳ รออนุมัติ'}
              </span>
            </div>
          </div>

          {/* Analytics Cards */}
          {analyticsLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">กำลังโหลดสถิติ...</p>
              </div>
            </div>
          ) : analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Views */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  {analytics.recentViews > 0 && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <ArrowUp className="w-4 h-4" />
                      {analytics.recentViews}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">ผู้เข้าชมทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalViews.toLocaleString()}</p>
                {analytics.recentViews > 0 && (
                  <p className="text-xs text-gray-500 mt-1">+{analytics.recentViews} ใน 7 วันที่ผ่านมา</p>
                )}
              </div>

              {/* Total Bookmarks */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  {analytics.recentBookmarks > 0 && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <ArrowUp className="w-4 h-4" />
                      {analytics.recentBookmarks}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">ร้านที่ถูกบันทึก</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalBookmarks.toLocaleString()}</p>
                {analytics.recentBookmarks > 0 && (
                  <p className="text-xs text-gray-500 mt-1">+{analytics.recentBookmarks} ใน 7 วันที่ผ่านมา</p>
                )}
              </div>

              {/* Average Rating */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm">คะแนนเฉลี่ย</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : '-'}
                  </p>
                  {analytics.averageRating > 0 && (
                    <span className="text-yellow-500">★</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.totalReviews > 0 ? `จาก ${analytics.totalReviews} รีวิว` : 'ยังไม่มีรีวิว'}
                </p>
              </div>

              {/* Total Clicks */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm">คลิกทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalClicks.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">การโต้ตอบกับร้าน</p>
              </div>
            </div>
          ) : null}

          {/* Subscription Info */}
          {analytics?.subscription && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 mb-6 border border-purple-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {analytics.subscription.features.badgeEmoji && (
                        <span className="mr-2">{analytics.subscription.features.badgeEmoji}</span>
                      )}
                      {analytics.subscription.packageName}
                      {analytics.subscription.features.badgeText && (
                        <span className="ml-2 text-sm font-normal text-purple-600">
                          {analytics.subscription.features.badgeText}
                        </span>
                      )}
                    </h2>
                    <div className="text-sm text-gray-600">
                      <p>
                        หมดอายุ: {new Date(analytics.subscription.endDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {(() => {
                        const endDate = new Date(analytics.subscription.endDate);
                        const now = new Date();
                        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return daysRemaining > 0 ? (
                          <p className={`mt-1 font-semibold ${daysRemaining <= 7 ? 'text-red-600' : daysRemaining <= 30 ? 'text-orange-600' : 'text-green-600'}`}>
                            เหลืออีก {daysRemaining} วัน
                          </p>
                        ) : (
                          <p className="mt-1 font-semibold text-red-600">
                            หมดอายุแล้ว
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                {analytics.subscription.features.hasVerifiedBadge && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    ✓ ยืนยันแล้ว
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">รูปภาพสูงสุด</p>
                  <p className="text-lg font-bold text-gray-900">
                    {analytics.subscription.features.maxImages}
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">เมนูสูงสุด</p>
                  <p className="text-lg font-bold text-gray-900">
                    {analytics.subscription.features.maxMenuItems}
                  </p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">ลิงก์เดลิเวอรี</p>
                  <p className="text-lg font-bold text-gray-900">
                    {analytics.subscription.features.maxDeliveryLinks}
                  </p>
                </div>
                {analytics.subscription.features.canPinOnMap && (
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">ปักหมุดแผนที่</p>
                    <p className="text-lg font-bold text-green-600">✓</p>
                  </div>
                )}
                {analytics.subscription.features.hasAdvancedAnalytics && (
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Analytics ขั้นสูง</p>
                    <p className="text-lg font-bold text-green-600">✓</p>
                  </div>
                )}
              </div>
              
              {/* Renewal Button */}
              {(() => {
                const endDate = new Date(analytics.subscription.endDate);
                const now = new Date();
                const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return daysRemaining <= 30 ? (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <Link
                      href={`/pricing/renewal?shopId=${shop.id}`}
                      className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      {daysRemaining > 0 ? 'ต่ออายุ Package' : 'ต่ออายุ Package (หมดอายุแล้ว)'}
                    </Link>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Token Wallet Section */}
          <TokenWalletSection shopId={shop.id} />

          {/* Management Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">จัดการร้านค้า</h2>
            <div className="space-y-4">
              <Link
                href={`/shop/edit/${shop.id}`}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Edit className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">แก้ไขข้อมูลร้าน</h3>
                  <p className="text-sm text-gray-600">อัปเดตรายละเอียด รูปภาพ และข้อมูลร้านค้า</p>
                </div>
              </Link>

              <Link
                href={`/dashboard/shop/ads?shopId=${shop.id}`}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">โฆษณาร้าน</h3>
                  <p className="text-sm text-gray-600">ลงโฆษณาเพื่อเพิ่มการมองเห็น</p>
                </div>
              </Link>

              <Link
                href={`/dashboard/shop/campaigns?shopId=${shop.id}`}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">จ้าง Creator</h3>
                  <p className="text-sm text-gray-600">เลือกและจ้าง Content Creator เพื่อรีวิวร้าน</p>
                </div>
              </Link>

              <Link
                href="/shop/register"
                className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">เพิ่มร้านค้าใหม่</h3>
                  <p className="text-sm text-gray-600">ลงทะเบียนร้านค้าเพิ่มเติม</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการร้านค้า</h1>
          <p className="text-gray-600">คุณมี {shops.length} ร้านค้า</p>
        </div>

        {/* Shop Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลือกร้านที่จะดูสถิติ
          </label>
          <select
            value={selectedShopId || ''}
            onChange={(e) => handleShopChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name} {shop.status === 'APPROVED' ? '✓' : '⏳'}
              </option>
            ))}
          </select>
        </div>

        {/* Analytics Cards */}
        {analyticsLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 text-sm">กำลังโหลดสถิติ...</p>
            </div>
          </div>
        ) : analytics && selectedShopId ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Views */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  {analytics.recentViews > 0 && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <ArrowUp className="w-4 h-4" />
                      {analytics.recentViews}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">ผู้เข้าชมทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalViews.toLocaleString()}</p>
                {analytics.recentViews > 0 && (
                  <p className="text-xs text-gray-500 mt-1">+{analytics.recentViews} ใน 7 วันที่ผ่านมา</p>
                )}
              </div>

              {/* Total Bookmarks */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  {analytics.recentBookmarks > 0 && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <ArrowUp className="w-4 h-4" />
                      {analytics.recentBookmarks}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">ร้านที่ถูกบันทึก</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalBookmarks.toLocaleString()}</p>
                {analytics.recentBookmarks > 0 && (
                  <p className="text-xs text-gray-500 mt-1">+{analytics.recentBookmarks} ใน 7 วันที่ผ่านมา</p>
                )}
              </div>

              {/* Average Rating */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm">คะแนนเฉลี่ย</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : '-'}
                  </p>
                  {analytics.averageRating > 0 && (
                    <span className="text-yellow-500">★</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.totalReviews > 0 ? `จาก ${analytics.totalReviews} รีวิว` : 'ยังไม่มีรีวิว'}
                </p>
              </div>

              {/* Total Clicks */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm">คลิกทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.totalClicks.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">การโต้ตอบกับร้าน</p>
              </div>
            </div>

            {/* Subscription Info */}
            {analytics.subscription && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm p-6 mb-6 border border-purple-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {analytics.subscription.features.badgeEmoji && (
                          <span className="mr-2">{analytics.subscription.features.badgeEmoji}</span>
                        )}
                        {analytics.subscription.packageName}
                        {analytics.subscription.features.badgeText && (
                          <span className="ml-2 text-sm font-normal text-purple-600">
                            {analytics.subscription.features.badgeText}
                          </span>
                        )}
                      </h2>
                      <p className="text-sm text-gray-600">
                        หมดอายุ: {new Date(analytics.subscription.endDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {analytics.subscription.features.hasVerifiedBadge && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      ✓ ยืนยันแล้ว
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">รูปภาพสูงสุด</p>
                    <p className="text-lg font-bold text-gray-900">
                      {analytics.subscription.features.maxImages}
                    </p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">เมนูสูงสุด</p>
                    <p className="text-lg font-bold text-gray-900">
                      {analytics.subscription.features.maxMenuItems}
                    </p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">ลิงก์เดลิเวอรี</p>
                    <p className="text-lg font-bold text-gray-900">
                      {analytics.subscription.features.maxDeliveryLinks}
                    </p>
                  </div>
                  {analytics.subscription.features.canPinOnMap && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">ปักหมุดแผนที่</p>
                      <p className="text-lg font-bold text-green-600">✓</p>
                    </div>
                  )}
                  {analytics.subscription.features.hasAdvancedAnalytics && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Analytics ขั้นสูง</p>
                      <p className="text-lg font-bold text-green-600">✓</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions for Selected Shop */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">จัดการร้านที่เลือก</h2>
              <div className="flex flex-wrap gap-4">
                <Link
                  href={`/shop/edit/${selectedShopId}`}
                  className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Edit className="w-5 h-5" />
                  <span>แก้ไขข้อมูลร้าน</span>
                </Link>
              </div>
            </div>
          </>
        ) : null}

        {/* All Shops List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ร้านค้าทั้งหมด</h2>
          <div className="space-y-4">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{shop.name}</h3>
                  <p className="text-sm text-gray-600">
                    {shop.categories?.map((c: any) => c.category.name).join(', ') || 'ไม่ระบุหมวดหมู่'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  shop.status === 'APPROVED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {shop.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                </span>
                <Link
                  href={`/shop/edit/${shop.id}`}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  แก้ไข
                </Link>
              </div>
            ))}

            <Link
              href="/shop/register"
              className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">เพิ่มร้านค้าใหม่</h3>
                <p className="text-sm text-gray-600">ลงทะเบียนร้านค้าเพิ่มเติม</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
