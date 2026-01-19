// src/app/admin/campaigns/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { Plus, Edit, Trash2, Calendar, Percent, Gift, RefreshCw, ArrowLeft } from "lucide-react";

export default function AdminCampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    campaignType: "PACKAGE",
    packageTier: "",
    packageId: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    tokenMultiplier: "",
    freeTokens: "",
    startDate: "",
    endDate: "",
    isActive: true,
    maxUses: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/unauthorized");
        return;
      }
      fetchCampaigns();
    }
  }, [status]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/promotion-campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.showError("ไม่สามารถโหลดข้อมูล Campaign ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCampaign
        ? `/api/promotion-campaigns/${editingCampaign.id}`
        : "/api/promotion-campaigns";
      const method = editingCampaign ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.showSuccess(editingCampaign ? "อัพเดท Campaign สำเร็จ" : "สร้าง Campaign สำเร็จ");
        setShowModal(false);
        setEditingCampaign(null);
        resetForm();
        fetchCampaigns();
      } else {
        const error = await res.json();
        toast.showError(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast.showError("เกิดข้อผิดพลาด");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบ Campaign นี้?")) return;

    try {
      const res = await fetch(`/api/promotion-campaigns/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.showSuccess("ลบ Campaign สำเร็จ");
        fetchCampaigns();
      } else {
        toast.showError("ไม่สามารถลบ Campaign ได้");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.showError("เกิดข้อผิดพลาด");
    }
  };

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name || "",
      description: campaign.description || "",
      campaignType: campaign.campaignType || "PACKAGE",
      packageTier: campaign.packageTier || "",
      packageId: campaign.packageId || "",
      discountType: campaign.discountType || "PERCENTAGE",
      discountValue: campaign.discountValue?.toString() || "",
      tokenMultiplier: campaign.tokenMultiplier?.toString() || "",
      freeTokens: campaign.freeTokens?.toString() || "",
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split("T")[0] : "",
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : "",
      isActive: campaign.isActive !== false,
      maxUses: campaign.maxUses?.toString() || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      campaignType: "PACKAGE",
      packageTier: "",
      packageId: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      tokenMultiplier: "",
      freeTokens: "",
      startDate: "",
      endDate: "",
      isActive: true,
      maxUses: "",
    });
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้า Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">จัดการ Campaign</h1>
              <p className="text-gray-600 mt-1">สร้างและจัดการ Promotion Campaign</p>
            </div>
            <button
              onClick={() => {
                setEditingCampaign(null);
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              สร้าง Campaign ใหม่
            </button>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ส่วนลด
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ระยะเวลา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การใช้งาน
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      ยังไม่มี Campaign
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => {
                    const now = new Date();
                    const startDate = new Date(campaign.startDate);
                    const endDate = new Date(campaign.endDate);
                    const isActive = campaign.isActive && now >= startDate && now <= endDate;
                    const isExpired = now > endDate;

                    return (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                          {campaign.description && (
                            <div className="text-xs text-gray-500">{campaign.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            {campaign.campaignType}
                          </span>
                          {campaign.packageTier && (
                            <div className="text-xs text-gray-500 mt-1">{campaign.packageTier}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {campaign.discountType === "PERCENTAGE" && (
                              <span className="flex items-center gap-1">
                                <Percent className="w-4 h-4" />
                                {campaign.discountValue}%
                              </span>
                            )}
                            {campaign.discountType === "FIXED_AMOUNT" && (
                              <>฿{campaign.discountValue}</>
                            )}
                            {campaign.discountType === "TOKEN_MULTIPLIER" && (
                              <span className="flex items-center gap-1">
                                <RefreshCw className="w-4 h-4" />
                                x{campaign.tokenMultiplier}
                              </span>
                            )}
                            {campaign.discountType === "FREE_TOKENS" && (
                              <span className="flex items-center gap-1">
                                <Gift className="w-4 h-4" />
                                +{campaign.freeTokens} Tokens
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(campaign.startDate).toLocaleDateString("th-TH")}
                            </div>
                            <div className="text-xs text-gray-500">
                              ถึง {new Date(campaign.endDate).toLocaleDateString("th-TH")}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              isActive
                                ? "bg-green-100 text-green-800"
                                : isExpired
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {isActive ? "กำลังใช้งาน" : isExpired ? "หมดอายุ" : "ยังไม่เริ่ม"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {campaign.currentUses}
                            {campaign.maxUses && ` / ${campaign.maxUses}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(campaign)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(campaign.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {editingCampaign ? "แก้ไข Campaign" : "สร้าง Campaign ใหม่"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อ Campaign *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      คำอธิบาย
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ประเภท Campaign *
                      </label>
                      <select
                        required
                        value={formData.campaignType}
                        onChange={(e) => setFormData({ ...formData, campaignType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="PACKAGE">Package</option>
                        <option value="TOKEN">Token</option>
                        <option value="RENEWAL">Renewal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ประเภท Package Tier
                      </label>
                      <select
                        value={formData.packageTier}
                        onChange={(e) => setFormData({ ...formData, packageTier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">ทั้งหมด</option>
                        <option value="FREE">FREE</option>
                        <option value="BASIC">BASIC</option>
                        <option value="PRO">PRO</option>
                        <option value="PREMIUM">PREMIUM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ประเภทส่วนลด *
                    </label>
                    <select
                      required
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="PERCENTAGE">เปอร์เซ็นต์ (%)</option>
                      <option value="FIXED_AMOUNT">จำนวนเงินคงที่ (บาท)</option>
                      <option value="TOKEN_MULTIPLIER">Token x เท่า</option>
                      <option value="FREE_TOKENS">Token ฟรี</option>
                    </select>
                  </div>

                  {(formData.discountType === "PERCENTAGE" || formData.discountType === "FIXED_AMOUNT") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวนส่วนลด *
                      </label>
                      <input
                        type="number"
                        required
                        step={formData.discountType === "PERCENTAGE" ? "0.01" : "1"}
                        min="0"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder={formData.discountType === "PERCENTAGE" ? "เช่น 10" : "เช่น 100"}
                      />
                    </div>
                  )}

                  {formData.discountType === "TOKEN_MULTIPLIER" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        คูณเท่า *
                      </label>
                      <input
                        type="number"
                        required
                        step="0.1"
                        min="1"
                        value={formData.tokenMultiplier}
                        onChange={(e) => setFormData({ ...formData, tokenMultiplier: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="เช่น 2"
                      />
                    </div>
                  )}

                  {formData.discountType === "FREE_TOKENS" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        จำนวน Token ฟรี *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.freeTokens}
                        onChange={(e) => setFormData({ ...formData, freeTokens: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="เช่น 100"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        วันที่เริ่มต้น *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        วันที่สิ้นสุด *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      จำนวนครั้งสูงสุด (ว่าง = ไม่จำกัด)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="เช่น 100"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">เปิดใช้งาน</label>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingCampaign(null);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {editingCampaign ? "อัพเดท" : "สร้าง"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
