'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Creator {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  phone?: string;
  youtubeUrl?: string;
  youtubeSubscribers?: number;
  facebookUrl?: string;
  facebookFollowers?: number;
  instagramUrl?: string;
  instagramFollowers?: number;
  tiktokUrl?: string;
  tiktokFollowers?: number;
  coverageLevel: string;
  totalReviews: number;
  completedReviews: number;
  rating: number;
  totalEarnings: number;
  availableBalance: number;
  totalWithdrawn: number;
  applicationStatus: string;
  currentPriceMin?: number;
  currentPriceMax?: number;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectReason?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  creator_price_history?: Array<{
    id: string;
    priceMin: number;
    priceMax: number;
    effectiveFrom: string;
    effectiveTo?: string;
    changedBy: string;
    reason?: string;
  }>;
}

interface Job {
  id: string;
  campaignId: string;
  agreedPrice: number;
  status: string;
  tokensPaid?: number;
  platformCommission?: number;
  creatorEarning?: number;
  reviewLink?: string;
  createdAt: string;
  completedAt?: string;
  campaigns: {
    id: string;
    title: string;
    description?: string;
    Shop: {
      id: string;
      name: string;
      image?: string;
    };
  };
}

export default function CreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params?.id as string;

  const [creator, setCreator] = useState<Creator | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobStats, setJobStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'jobs' | 'pricing' | 'earnings'>('info');

  // Approval Modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [approving, setApproving] = useState(false);

  // Pricing Update Modal
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [newPriceMin, setNewPriceMin] = useState('');
  const [newPriceMax, setNewPriceMax] = useState('');
  const [pricingReason, setPricingReason] = useState('');
  const [updatingPricing, setUpdatingPricing] = useState(false);

  // Rejection Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    if (creatorId) {
      fetchCreator();
      fetchJobs();
    }
  }, [creatorId]);

  const fetchCreator = async () => {
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}`);
      if (!response.ok) throw new Error('Failed to fetch creator');
      const data = await response.json();
      setCreator(data);
    } catch (error) {
      console.error('Error fetching creator:', error);
      alert('ไม่สามารถโหลดข้อมูล Creator ได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/jobs`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data.jobs || []);
      setJobStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleApprove = async () => {
    if (!priceMin || !priceMax) {
      alert('กรุณากรอกช่วงราคา');
      return;
    }

    setApproving(true);
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceMin, priceMax }),
      });

      if (!response.ok) throw new Error('Failed to approve');

      alert('อนุมัติ Creator เรียบร้อยแล้ว');
      setShowApprovalModal(false);
      fetchCreator();
    } catch (error) {
      console.error('Error approving creator:', error);
      alert('ไม่สามารถอนุมัติได้');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุเหตุผล');
      return;
    }

    setRejecting(true);
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) throw new Error('Failed to reject');

      alert('ปฏิเสธ Creator เรียบร้อยแล้ว');
      setShowRejectModal(false);
      fetchCreator();
    } catch (error) {
      console.error('Error rejecting creator:', error);
      alert('ไม่สามารถปฏิเสธได้');
    } finally {
      setRejecting(false);
    }
  };

  const handleUpdatePricing = async () => {
    if (!newPriceMin || !newPriceMax) {
      alert('กรุณากรอกช่วงราคาใหม่');
      return;
    }

    setUpdatingPricing(true);
    try {
      const response = await fetch(`/api/admin/creators/${creatorId}/update-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPriceMin,
          newPriceMax,
          reason: pricingReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to update pricing');

      alert('อัพเดทราคาเรียบร้อยแล้ว');
      setShowPricingModal(false);
      fetchCreator();
    } catch (error) {
      console.error('Error updating pricing:', error);
      alert('ไม่สามารถอัพเดทราคาได้');
    } finally {
      setUpdatingPricing(false);
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
      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getJobStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'รอรับงาน', className: 'bg-yellow-100 text-yellow-800' },
      ACCEPTED: { label: 'รับงานแล้ว', className: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: 'กำลังทำ', className: 'bg-purple-100 text-purple-800' },
      SUBMITTED: { label: 'ส่งงานแล้ว', className: 'bg-indigo-100 text-indigo-800' },
      COMPLETED: { label: 'เสร็จสิ้น', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'ปฏิเสธ', className: 'bg-red-100 text-red-800' },
      CANCELLED: { label: 'ยกเลิก', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-gray-600">ไม่พบข้อมูล Creator</p>
          <Link href="/admin/creators" className="text-blue-600 hover:underline mt-4 inline-block">
            กลับไปหน้ารายการ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/creators" className="text-blue-600 hover:underline mb-4 inline-block">
          ← กลับไปหน้ารายการ
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{creator.displayName}</h1>
            <p className="text-gray-600 mt-1">{creator.user?.email}</p>
          </div>
          <div className="flex gap-2">
            {getStatusBadge(creator.applicationStatus)}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {creator.applicationStatus === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 mb-3">การสมัครนี้รอการอนุมัติ</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowApprovalModal(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              อนุมัติ
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ปฏิเสธ
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'info', label: 'ข้อมูลทั่วไป' },
            { id: 'jobs', label: 'งานที่รับ' },
            { id: 'pricing', label: 'ประวัติราคา' },
            { id: 'earnings', label: 'รายได้' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">ข้อมูลส่วนตัว</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">ชื่อผู้ใช้</label>
                  <p className="font-medium">{creator.user?.name || 'ไม่ระบุ'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">ชื่อที่แสดง</label>
                  <p className="font-medium">{creator.displayName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">อีเมล</label>
                  <p className="font-medium">{creator.user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">เบอร์โทร</label>
                  <p className="font-medium">{creator.phone || 'ไม่ระบุ'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">ประวัติ</label>
                  <p className="text-gray-700">{creator.bio || 'ไม่ระบุ'}</p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">โซเชียลมีเดีย</h2>
              <div className="space-y-3">
                {creator.youtubeUrl && (
                  <div>
                    <label className="text-sm text-gray-600">YouTube</label>
                    <p className="font-medium">
                      <a
                        href={creator.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {creator.youtubeUrl}
                      </a>
                    </p>
                    {creator.youtubeSubscribers && (
                      <p className="text-sm text-gray-600">
                        {creator.youtubeSubscribers.toLocaleString()} subscribers
                      </p>
                    )}
                  </div>
                )}
                {creator.facebookUrl && (
                  <div>
                    <label className="text-sm text-gray-600">Facebook</label>
                    <p className="font-medium">
                      <a
                        href={creator.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {creator.facebookUrl}
                      </a>
                    </p>
                    {creator.facebookFollowers && (
                      <p className="text-sm text-gray-600">
                        {creator.facebookFollowers.toLocaleString()} followers
                      </p>
                    )}
                  </div>
                )}
                {creator.instagramUrl && (
                  <div>
                    <label className="text-sm text-gray-600">Instagram</label>
                    <p className="font-medium">
                      <a
                        href={creator.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {creator.instagramUrl}
                      </a>
                    </p>
                    {creator.instagramFollowers && (
                      <p className="text-sm text-gray-600">
                        {creator.instagramFollowers.toLocaleString()} followers
                      </p>
                    )}
                  </div>
                )}
                {creator.tiktokUrl && (
                  <div>
                    <label className="text-sm text-gray-600">TikTok</label>
                    <p className="font-medium">
                      <a
                        href={creator.tiktokUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {creator.tiktokUrl}
                      </a>
                    </p>
                    {creator.tiktokFollowers && (
                      <p className="text-sm text-gray-600">
                        {creator.tiktokFollowers.toLocaleString()} followers
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">สถิติ</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">รีวิวทั้งหมด</label>
                  <p className="text-2xl font-bold">{creator.totalReviews}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">รีวิวที่เสร็จ</label>
                  <p className="text-2xl font-bold text-green-600">{creator.completedReviews}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">คะแนนเฉลี่ย</label>
                  <p className="text-2xl font-bold">{creator.rating.toFixed(1)} ⭐</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">อัตราความสำเร็จ</label>
                  <p className="text-2xl font-bold">
                    {creator.totalReviews > 0
                      ? ((creator.completedReviews / creator.totalReviews) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">ราคา</h2>
                {creator.applicationStatus === 'APPROVED' && (
                  <button
                    onClick={() => {
                      setNewPriceMin(creator.currentPriceMin?.toString() || '');
                      setNewPriceMax(creator.currentPriceMax?.toString() || '');
                      setShowPricingModal(true);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    แก้ไขราคา
                  </button>
                )}
              </div>
              {creator.currentPriceMin && creator.currentPriceMax ? (
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    ฿{creator.currentPriceMin.toLocaleString()} - ฿
                    {creator.currentPriceMax.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">ราคาต่อรีวิว</p>
                </div>
              ) : (
                <p className="text-gray-500">ยังไม่กำหนดราคา</p>
              )}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            {/* Job Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600">ทั้งหมด</div>
                <div className="text-2xl font-bold">{jobs.length}</div>
              </div>
              <div className="bg-green-50 rounded-lg shadow p-4">
                <div className="text-sm text-green-700">เสร็จสิ้น</div>
                <div className="text-2xl font-bold text-green-800">
                  {jobStats.COMPLETED || 0}
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg shadow p-4">
                <div className="text-sm text-blue-700">กำลังดำเนินการ</div>
                <div className="text-2xl font-bold text-blue-800">
                  {(jobStats.ACCEPTED || 0) + (jobStats.IN_PROGRESS || 0)}
                </div>
              </div>
              <div className="bg-yellow-50 rounded-lg shadow p-4">
                <div className="text-sm text-yellow-700">รอดำเนินการ</div>
                <div className="text-2xl font-bold text-yellow-800">
                  {jobStats.PENDING || 0}
                </div>
              </div>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {jobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">ยังไม่มีงาน</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          แคมเปญ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          ร้านค้า
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          ราคา
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          สถานะ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          วันที่
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {job.campaigns.title}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{job.campaigns.Shop.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-green-600">
                              ฿{job.agreedPrice.toLocaleString()}
                            </div>
                            {job.creatorEarning && (
                              <div className="text-xs text-gray-500">
                                รับ: ฿{job.creatorEarning.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">{getJobStatusBadge(job.status)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(job.createdAt).toLocaleDateString('th-TH')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing History Tab */}
        {activeTab === 'pricing' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {!creator.creator_price_history || creator.creator_price_history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">ยังไม่มีประวัติราคา</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ช่วงราคา
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        มีผลตั้งแต่
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ถึงวันที่
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        เหตุผล
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {creator.creator_price_history.map((history) => (
                      <tr key={history.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            ฿{history.priceMin.toLocaleString()} - ฿
                            {history.priceMax.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(history.effectiveFrom).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {history.effectiveTo
                            ? new Date(history.effectiveTo).toLocaleDateString('th-TH')
                            : 'ปัจจุบัน'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {history.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-600 mb-2">รายได้ทั้งหมด</h3>
              <p className="text-3xl font-bold text-green-600">
                ฿{creator.totalEarnings.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-600 mb-2">ยอดคงเหลือ</h3>
              <p className="text-3xl font-bold text-blue-600">
                ฿{creator.availableBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm text-gray-600 mb-2">ถอนไปแล้ว</h3>
              <p className="text-3xl font-bold text-gray-600">
                ฿{creator.totalWithdrawn.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">อนุมัติ Creator</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ราคาต่ำสุด (บาท)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ราคาสูงสุด (บาท)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="2000"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {approving ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                </button>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  disabled={approving}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Update Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">แก้ไขราคา</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ราคาต่ำสุดใหม่ (บาท)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={newPriceMin}
                  onChange={(e) => setNewPriceMin(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ราคาสูงสุดใหม่ (บาท)
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  value={newPriceMax}
                  onChange={(e) => setNewPriceMax(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เหตุผล (ไม่บังคับ)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  value={pricingReason}
                  onChange={(e) => setPricingReason(e.target.value)}
                  placeholder="เหตุผลในการเปลี่ยนราคา..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdatePricing}
                  disabled={updatingPricing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingPricing ? 'กำลังอัพเดท...' : 'บันทึก'}
                </button>
                <button
                  onClick={() => setShowPricingModal(false)}
                  disabled={updatingPricing}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">ปฏิเสธ Creator</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เหตุผล <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="กรุณาระบุเหตุผลในการปฏิเสธ..."
                  required
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {rejecting ? 'กำลังดำเนินการ...' : 'ปฏิเสธ'}
                </button>
                <button
                  onClick={() => setShowRejectModal(false)}
                  disabled={rejecting}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
