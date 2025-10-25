// src/app/admin/shops/pending/page.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Clock, MapPin, Mail, RefreshCw } from "lucide-react";

type PendingShop = {
  id: number;
  name: string;
  province: string | null;
  district: string | null;
  submitted_at: string;
  owner_email: string | null;
  rejection_count: number;
  resubmitted_at: string | null;
};

export default function AdminPendingShopsPage() {
  const [shops, setShops] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending shops
  const fetchPendingShops = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/shops?status=PENDING_APPROVAL');

      if (!response.ok) {
        throw new Error('Failed to fetch pending shops');
      }

      const data = await response.json();
      setShops(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingShops();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchPendingShops}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              ลองอีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ร้านค้ารออนุมัติ
              </h1>
              <p className="text-gray-600 mt-1">
                ทั้งหมด {shops.length} รายการ
              </p>
            </div>
            <button
              onClick={fetchPendingShops}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600">รออนุมัติ</div>
              <div className="text-2xl font-bold text-blue-600">{shops.length}</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600">ส่งซ้ำ (Resubmit)</div>
              <div className="text-2xl font-bold text-orange-600">
                {shops.filter(s => s.resubmitted_at).length}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600">ถูก Reject มาก่อน</div>
              <div className="text-2xl font-bold text-red-600">
                {shops.filter(s => s.rejection_count > 0).length}
              </div>
            </div>
          </div>
        </div>

        {/* Shops List */}
        {shops.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ชื่อร้าน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      พื้นที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      เวลาสมัคร
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      การดำเนินการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shops.map((shop, index) => (
                    <motion.tr
                      key={shop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {shop.name}
                            </div>
                            {shop.owner_email && (
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Mail className="w-3 h-3" />
                                {shop.owner_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {shop.province && shop.district
                            ? `${shop.district}, ${shop.province}`
                            : shop.province || 'ไม่ระบุ'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatDate(shop.resubmitted_at || shop.submitted_at)}
                        </div>
                        {shop.resubmitted_at && (
                          <div className="text-xs text-orange-600 mt-1">
                            📮 ส่งซ้ำ
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {shop.rejection_count > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            ถูก Reject {shop.rejection_count} ครั้ง
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Link
                          href={`/admin/shops/review/${shop.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                          ตรวจสอบ
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {shops.map((shop, index) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                      {shop.owner_email && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {shop.owner_email}
                        </p>
                      )}
                    </div>
                    {shop.rejection_count > 0 && (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Reject {shop.rejection_count}x
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {shop.province && shop.district
                        ? `${shop.district}, ${shop.province}`
                        : shop.province || 'ไม่ระบุ'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {formatDate(shop.resubmitted_at || shop.submitted_at)}
                      {shop.resubmitted_at && (
                        <span className="text-orange-600 text-xs">📮 ส่งซ้ำ</span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/admin/shops/review/${shop.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                  >
                    <Eye className="w-4 h-4" />
                    ตรวจสอบ
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              ไม่มีร้านค้ารออนุมัติ
            </h3>
            <p className="text-gray-600">
              ยินดีด้วย! ไม่มีร้านค้าที่รอการพิจารณาในขณะนี้
            </p>
          </div>
        )}
      </div>
    </div>
  );
}