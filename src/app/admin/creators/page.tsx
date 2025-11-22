'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Creator {
  id: string;
  displayName: string;
  bio?: string;
  phone?: string;
  applicationStatus: string;
  currentPriceMin?: number;
  currentPriceMax?: number;
  totalReviews: number;
  completedReviews: number;
  rating: number;
  totalEarnings: number;
  availableBalance: number;
  createdAt: string;
  appliedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCreatorsPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCreators();
  }, [pagination.page, statusFilter]);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/admin/creators?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch creators');

      const data = await response.json();
      setCreators(data.creators || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Error fetching creators:', error);
      alert('ไม่สามารถโหลดข้อมูล Creator ได้');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'รอดำเนินการ', className: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { label: 'อนุมัติแล้ว', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'ปฏิเสธ', className: 'bg-red-100 text-red-800' },
      SUSPENDED: { label: 'ระงับ', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const filteredCreators = creators.filter((creator) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      creator.displayName?.toLowerCase().includes(term) ||
      creator.user?.name?.toLowerCase().includes(term) ||
      creator.user?.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">จัดการ Content Creators</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค้นหา
            </label>
            <input
              type="text"
              placeholder="ชื่อ, อีเมล..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะการสมัคร
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <option value="">ทั้งหมด</option>
              <option value="PENDING">รอดำเนินการ</option>
              <option value="APPROVED">อนุมัติแล้ว</option>
              <option value="REJECTED">ปฏิเสธ</option>
              <option value="SUSPENDED">ระงับ</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchCreators}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              รีเฟรช
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">ทั้งหมด</div>
          <div className="text-2xl font-bold">{pagination.total}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="text-sm text-yellow-700">รอดำเนินการ</div>
          <div className="text-2xl font-bold text-yellow-800">
            {creators.filter((c) => c.applicationStatus === 'PENDING').length}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-sm text-green-700">อนุมัติแล้ว</div>
          <div className="text-2xl font-bold text-green-800">
            {creators.filter((c) => c.applicationStatus === 'APPROVED').length}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="text-sm text-red-700">ปฏิเสธ</div>
          <div className="text-2xl font-bold text-red-800">
            {creators.filter((c) => c.applicationStatus === 'REJECTED').length}
          </div>
        </div>
      </div>

      {/* Creators Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">กำลังโหลด...</p>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ไม่พบข้อมูล Creator</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ข้อมูลติดต่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถิติ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCreators.map((creator) => (
                  <tr key={creator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {creator.displayName?.charAt(0) || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {creator.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {creator.user?.name || 'ไม่ระบุ'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{creator.user?.email}</div>
                      <div className="text-sm text-gray-500">{creator.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {creator.currentPriceMin && creator.currentPriceMax ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            ฿{creator.currentPriceMin.toLocaleString()} - ฿
                            {creator.currentPriceMax.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">ยังไม่กำหนด</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>รีวิว: {creator.completedReviews}/{creator.totalReviews}</div>
                      <div>คะแนน: {creator.rating.toFixed(1)} ⭐</div>
                      <div className="text-gray-600">
                        รายได้: ฿{creator.totalEarnings.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(creator.applicationStatus)}
                      <div className="text-xs text-gray-500 mt-1">
                        {creator.appliedAt &&
                          new Date(creator.appliedAt).toLocaleDateString('th-TH')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/admin/creators/${creator.id}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ก่อนหน้า
          </button>
          <span className="text-sm text-gray-700">
            หน้า {pagination.page} จาก {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
