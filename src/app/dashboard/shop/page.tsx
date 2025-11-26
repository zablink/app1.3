// src/app/dashboard/shop/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Edit, Package, Coins, Eye, TrendingUp, Settings } from "lucide-react";

export default function ShopDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    if (status === "authenticated") {
      fetchShopData();
    }
  }, [status]);

  const fetchShopData = async () => {
    try {
      const res = await fetch('/api/shops/my-shop');
      if (res.ok) {
        const data = await res.json();
        setShop(data.shop);
      } else {
        // ถ้ายังไม่มีร้าน ให้ไปหน้าสมัคร
        router.push('/shop/register');
      }
    } catch (error) {
      console.error('Error fetching shop:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ยังไม่มีร้านค้า</h2>
          <p className="text-gray-600 mb-4">กรุณาสมัครร้านค้าก่อนเข้าใช้งาน</p>
          <Link
            href="/shop/register"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            สมัครร้านค้า
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Store className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
                <p className="text-sm text-gray-600">จัดการร้านค้าของคุณ</p>
              </div>
            </div>
            <Link
              href={`/shop/edit/${shop.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit className="w-4 h-4" />
              แก้ไขร้าน
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">สถานะร้านค้า</h3>
              <p className="text-sm text-gray-600">ตรวจสอบสถานะและแพ็กเกจของคุณ</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                shop.status === 'APPROVED' 
                  ? 'bg-green-100 text-green-800' 
                  : shop.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {shop.status === 'APPROVED' ? '✓ อนุมัติแล้ว' : shop.status === 'PENDING' ? '⏳ รออนุมัติ' : '✗ ปฏิเสธ'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ผู้เข้าชมวันนี้</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ผู้เข้าชมเดือนนี้</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Token คงเหลือ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shop.tokenWallet?.balance || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Coins className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">แพ็กเกจ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shop.subscription?.package?.name || 'FREE'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">การจัดการ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/shop/edit/${shop.id}`}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <Edit className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">แก้ไขข้อมูลร้าน</p>
                <p className="text-sm text-gray-600">เปลี่ยนชื่อ รายละเอียด รูปภาพ</p>
              </div>
            </Link>

            <Link
              href={`/shop/${shop.id}`}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <Eye className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">ดูหน้าร้าน</p>
                <p className="text-sm text-gray-600">ดูหน้าร้านแบบที่ลูกค้าเห็น</p>
              </div>
            </Link>

            <button
              onClick={() => alert('ฟีเจอร์กำลังพัฒนา')}
              className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">ตั้งค่าเพิ่มเติม</p>
                <p className="text-sm text-gray-600">การแจ้งเตือน การตลาด</p>
              </div>
            </button>
          </div>
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลร้าน</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">ที่อยู่:</span>
              <span className="text-gray-900 text-right max-w-md">{shop.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">หมวดหมู่:</span>
              <span className="text-gray-900">
                {shop.categories?.map((c: any) => c.name).join(', ') || 'ไม่ระบุ'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">วันที่สร้าง:</span>
              <span className="text-gray-900">
                {new Date(shop.createdAt).toLocaleDateString('th-TH')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
