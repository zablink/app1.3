// src/app/dashboard/shop/campaigns/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import {
  Users,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  X,
  MapPin,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";

interface Campaign {
  id: string;
  title: string;
  description: string;
  totalBudget: number;
  remainingBudget: number;
  targetReviewers: number;
  startDate: string;
  endDate: string;
  status: string;
  campaign_jobs: any[];
}

export default function ShopCampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [targetReviewers, setTargetReviewers] = useState("1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && shopId) {
      fetchCampaigns();
    }
  }, [status, shopId]);

  // Filter campaigns
  useEffect(() => {
    let filtered = [...campaigns];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredCampaigns(filtered);
    setCurrentPage(1); // Reset to first page when filter changes
  }, [campaigns, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  const fetchCampaigns = async () => {
    if (!shopId) return;
    try {
      const res = await fetch(`/api/campaigns?shopId=${shopId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!shopId || !title || !totalBudget || !startDate || !endDate) {
      toast.showError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          title,
          description,
          totalBudget: parseInt(totalBudget),
          targetReviewers: parseInt(targetReviewers) || 1,
          startDate,
          endDate,
        }),
      });

      if (res.ok) {
        toast.showSuccess("สร้าง Campaign สำเร็จ!");
        setShowCreateForm(false);
        resetForm();
        fetchCampaigns();
      } else {
        const error = await res.json();
        toast.showError(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTotalBudget("");
    setTargetReviewers("1");
    setStartDate("");
    setEndDate("");
  };

  const getStatusBadge = (campaign: Campaign) => {
    const badges: Record<string, { text: string; color: string }> = {
      DRAFT: { text: "ร่าง", color: "bg-gray-100 text-gray-800" },
      ACTIVE: { text: "ใช้งาน", color: "bg-green-100 text-green-800" },
      PENDING: { text: "รออนุมัติ", color: "bg-yellow-100 text-yellow-800" },
      COMPLETED: { text: "เสร็จสิ้น", color: "bg-blue-100 text-blue-800" },
      CANCELLED: { text: "ยกเลิก", color: "bg-red-100 text-red-800" },
    };
    return badges[campaign.status] || badges.DRAFT;
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบร้านค้า</h2>
          <Link href="/dashboard/shop" className="text-blue-600 hover:underline">
            กลับไปหน้า Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard/shop" },
            { label: "จ้าง Creator" },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">จ้าง Creator</h1>
              <p className="text-gray-600">จัดการ Campaigns และจ้าง Content Creator</p>
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
                สร้าง Campaign ใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Create Campaign Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">สร้าง Campaign ใหม่</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อ Campaign *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น รีวิวเมนูใหม่"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="รายละเอียดของ Campaign"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (Tokens) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวน Creator ที่ต้องการ *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={targetReviewers}
                    onChange={(e) => setTargetReviewers(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่เริ่ม *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่สิ้นสุด *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateCampaign}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creating ? "กำลังสร้าง..." : "สร้าง Campaign"}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Campaigns ทั้งหมด</h2>
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
                  <option value="DRAFT">ร่าง</option>
                  <option value="ACTIVE">ใช้งาน</option>
                  <option value="PENDING">รออนุมัติ</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
              </div>
            </div>
          </div>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ยังไม่มี Campaign</p>
              <p className="text-gray-400 text-sm mt-2">
                สร้าง Campaign ใหม่เพื่อจ้าง Creator
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedCampaigns.map((campaign) => {
                  const statusBadge = getStatusBadge(campaign);
                  const assignedCount = campaign.campaign_jobs?.length || 0;
                  return (
                    <Link
                      key={campaign.id}
                      href={`/dashboard/shop/campaigns/${campaign.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900">{campaign.title}</h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}
                            >
                              {statusBadge.text}
                            </span>
                          </div>
                          {campaign.description && (
                            <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span>
                                {campaign.remainingBudget.toLocaleString()} /{" "}
                                {campaign.totalBudget.toLocaleString()} tokens
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>
                                {assignedCount} / {campaign.targetReviewers} Creator
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(campaign.startDate).toLocaleDateString("th-TH")} -{" "}
                                {new Date(campaign.endDate).toLocaleDateString("th-TH")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredCampaigns.length}
                />
              )}
            </>
          )}
        </div>

        {/* Quick Action */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">ต้องการเลือก Creator?</p>
              <p className="text-sm text-gray-600">
                ไปที่หน้าค้นหา Creator เพื่อเลือกและเชิญเข้าร่วม Campaign
              </p>
            </div>
            <Link
              href={`/dashboard/shop/select-reviewers?shopId=${shopId}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              เลือก Creator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
