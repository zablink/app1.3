// src/app/dashboard/shop/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Edit,
  Package,
  Coins,
  Eye,
  TrendingUp,
  Settings,
  Heart,
  Star,
  Users,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search
} from "lucide-react";

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
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      {/* ... (rest of the component is the same) */}
    </div>
  );
}

const getStatusBadge = (status: string) => {
  const badges: Record<string, { text: string; color: string; icon: React.ElementType }> = {
    PENDING: { text: "รอตรวจสอบ", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    APPROVED: { text: "อนุมัติแล้ว", color: "bg-green-100 text-green-800", icon: CheckCircle },
    REJECTED: { text: "ถูกปฏิเสธ", color: "bg-red-100 text-red-800", icon: XCircle },
    SUSPENDED: { text: "ถูกระงับ", color: "bg-red-100 text-red-800", icon: AlertCircle },
  };

  const badge = badges[status] || badges.PENDING;
  const Icon = badge.icon;

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}
    >
      <Icon size={14} />
      {badge.text}
    </span>
  );
};


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
  
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: "รอตรวจสอบ",
      APPROVED: "อนุมัติแล้ว",
      REJECTED: "ถูกปฏิเสธ",
      SUSPENDED: "ถูกระงับ",
    };
    return statusMap[status] || "ไม่ทราบสถานะ";
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

  const ManagementActions = ({ shopId }: { shopId: string }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">จัดการร้านค้า</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/shop/edit/${shopId}`}
          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Edit className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">แก้ไขข้อมูลร้าน</h3>
            <p className="text-sm text-gray-600">อัปเดตรายละเอียดและรูปภาพ</p>
          </div>
        </Link>
        <Link
          href={`/dashboard/shop/select-reviewers?shopId=${shopId}`}
          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Search className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">ค้นหา Creator</h3>
            <p className="text-sm text-gray-600">ค้นหาและจ้าง Creator มารีวิวร้าน</p>
          </div>
        </Link>
        <Link
          href={`/dashboard/shop/campaigns?shopId=${shopId}`}
          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">จัดการแคมเปญ</h3>
            <p className="text-sm text-gray-600">สร้างและติดตามแคมเปญจ้างงาน</p>
          </div>
        </Link>
        <Link
          href={`/dashboard/shop/ads?shopId=${shopId}`}
          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">โฆษณาร้าน</h3>
            <p className="text-sm text-gray-600">โปรโมทร้านค้าเพื่อเพิ่มการมองเห็น</p>
          </div>
        </Link>
      </div>
    </div>
  );

  if (shops.length === 1) {
    const shop = shops[0];
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
              {getStatusBadge(shop.status)}
            </div>
          </div>
          {/* ... Analytics Cards, Subscription Info, etc. ... */}
          <ManagementActions shopId={shop.id} />
           <Link
                href="/shop/register"
                className="flex items-center gap-4 p-4 mt-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">เพิ่มร้านค้าใหม่</h3>
                  <p className="text-sm text-gray-600">ลงทะเบียนร้านค้าเพิ่มเติมในบัญชีของคุณ</p>
                </div>
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">แดชบอร์ดร้านค้า</h1>
          <p className="text-gray-600">คุณมี {shops.length} ร้านค้าในบัญชีของคุณ</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลือกร้านค้าเพื่อจัดการ
          </label>
          <select
            value={selectedShopId || ''}
            onChange={(e) => handleShopChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name} ({getStatusText(shop.status)})
              </option>
            ))}
          </select>
        </div>

        {selectedShopId && (
            <>
             {/* ... Analytics will go here ... */}
             <ManagementActions shopId={selectedShopId} />
            </>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
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
                {getStatusBadge(shop.status)}
                 <button onClick={() => handleShopChange(shop.id)} className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium">
                    เลือก
                </button>
              </div>
            ))}

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
