// src/app/admin/shops/review/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Check, X, Edit, MapPin, Phone, Mail, 
  Clock, AlertCircle, History 
} from "lucide-react";

type ShopDetail = {
  id: number;
  name: string;
  category: string | null;
  image: string | null;
  lat: number | null;
  lng: number | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  submitted_at: string;
  rejection_reason: string | null;
  rejection_count: number;
  status_changes: any[];
};

export default function AdminReviewShopPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params?.id as string;

  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decline modal
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Fetch shop details
  useEffect(() => {
    if (!shopId) return;

    async function fetchShop() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/shops/${shopId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch shop');
        }

        const data = await response.json();
        setShop(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    }

    fetchShop();
  }, [shopId]);

  // Approve shop
  const handleApprove = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการอนุมัติร้านนี้?')) return;

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/shops/${shopId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve shop');
      }

      alert('✅ อนุมัติร้านสำเร็จ!');
      router.push('/admin/shops/pending');
    } catch (err) {
      console.error('Error:', err);
      alert('เกิดข้อผิดพลาดในการอนุมัติร้าน');
    } finally {
      setProcessing(false);
    }
  };

  // Decline shop
  const handleDecline = async () => {
    if (!declineReason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/shops/${shopId}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejection_reason: declineReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to decline shop');
      }

      alert('❌ ปฏิเสธร้านสำเร็จ! ระบบจะส่ง email แจ้งเจ้าของร้าน');
      router.push('/admin/shops/pending');
    } catch (err) {
      console.error('Error:', err);
      alert('เกิดข้อผิดพลาดในการปฏิเสธร้าน');
    } finally {
      setProcessing(false);
      setShowDeclineModal(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !shop) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600">{error || 'ไม่พบร้านค้า'}</p>
            <Link
              href="/admin/shops/pending"
              className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              กลับไปรายการ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/shops/pending"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปรายการ
          </Link>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">โหมดตรวจสอบร้านค้า (Admin)</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  กรุณาตรวจสอบข้อมูลร้านค้าอย่างละเอียดก่อนอนุมัติหรือปฏิเสธ
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Preview (Similar to Shop Detail Page) */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {/* Hero Image */}
          <div className="relative h-64 bg-gray-200">
            <img
              src={shop.image || '/images/placeholder.jpg'}
              alt={shop.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">{shop.name}</h1>
              {shop.category && (
                <p className="text-lg">{shop.category}</p>
              )}
            </div>
          </div>

          {/* Shop Info */}
          <div className="p-6 space-y-6">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-3">ข้อมูลติดต่อ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">ที่อยู่</div>
                    <div className="font-medium">
                      {shop.subdistrict && `${shop.subdistrict}, `}
                      {shop.district && `${shop.district}, `}
                      {shop.province || 'ไม่ระบุ'}
                    </div>
                  </div>
                </div>

                {shop.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">เบอร์โทร</div>
                      <div className="font-medium">{shop.phone}</div>
                    </div>
                  </div>
                )}

                {shop.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">อีเมล</div>
                      <div className="font-medium">{shop.email}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-600">เวลาสมัคร</div>
                    <div className="font-medium">{formatDate(shop.submitted_at)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* GPS Coordinates */}
            {shop.lat && shop.lng && (
              <div>
                <h3 className="text-lg font-semibold mb-3">พิกัด GPS</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Latitude:</span>
                      <span className="ml-2 font-mono font-semibold">{shop.lat.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Longitude:</span>
                      <span className="ml-2 font-mono font-semibold">{shop.lng.toFixed(6)}</span>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${shop.lat},${shop.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-blue-600 hover:text-blue-700 text-sm"
                  >
                    🗺️ ดูบน Google Maps →
                  </a>
                </div>
              </div>
            )}

            {/* Rejection History */}
            {shop.rejection_count > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  ประวัติการปฏิเสธ
                </h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 mb-2">
                    ร้านนี้ถูกปฏิเสธมาแล้ว <strong>{shop.rejection_count} ครั้ง</strong>
                  </p>
                  {shop.rejection_reason && (
                    <div className="mt-2">
                      <div className="text-sm font-medium text-red-700 mb-1">เหตุผลครั้งล่าสุด:</div>
                      <div className="text-sm text-red-600 bg-white rounded p-2">
                        {shop.rejection_reason}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status History */}
            {shop.status_changes && shop.status_changes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">ประวัติการเปลี่ยนสถานะ</h3>
                <div className="space-y-2">
                  {shop.status_changes.map((change: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 text-sm bg-gray-50 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="font-medium">
                          {change.old_status} → <span className="text-blue-600">{change.new_status}</span>
                        </div>
                        {change.reason && (
                          <div className="text-gray-600 mt-1">{change.reason}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(change.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admin Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="text-xl font-bold mb-4">การดำเนินการ (Admin)</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Approve Button */}
            <button
              onClick={handleApprove}
              disabled={processing}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              {processing ? 'กำลังดำเนินการ...' : 'อนุมัติร้าน'}
            </button>

            {/* Decline Button */}
            <button
              onClick={() => setShowDeclineModal(true)}
              disabled={processing}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
              ปฏิเสธร้าน
            </button>

            {/* Edit Button */}
            <Link
              href={`/admin/shops/edit/${shopId}`}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit className="w-5 h-5" />
              แก้ไขข้อมูล
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">ปฏิเสธร้าน</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผลในการปฏิเสธ (จำเป็น)
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="เช่น: รูปภาพไม่ชัดเจน, ข้อมูลไม่ครบถ้วน, พิกัดไม่ถูกต้อง..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 เหตุผลนี้จะถูกส่งไปยังเจ้าของร้านทาง email
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDecline}
                disabled={!declineReason.trim() || processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}