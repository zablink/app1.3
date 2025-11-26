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
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">จัดการร้านค้า</h2>
            
            <div className="space-y-4">
              <Link
                href={`/shop/edit/${shop.id}`}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Edit className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                  <p className="text-sm text-gray-600">แก้ไขข้อมูลร้าน</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  shop.status === 'APPROVED' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {shop.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                </span>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการร้านค้า</h1>
          <p className="text-gray-600">คุณมี {shops.length} ร้านค้า</p>
        </div>

        <div className="space-y-4">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/shop/edit/${shop.id}`}
              className="block bg-white rounded-lg shadow-sm border hover:shadow-md transition"
            >
              <div className="p-6 flex items-center gap-4">
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
              </div>
            </Link>
          ))}

          <Link
            href="/shop/register"
            className="block bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 hover:shadow-md transition"
          >
            <div className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">เพิ่มร้านค้าใหม่</h3>
                <p className="text-sm text-gray-600">ลงทะเบียนร้านค้าเพิ่มเติม</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
