// src/app/dashboard/shop/campaigns/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  X,
  Clock,
  AlertCircle,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import ConfirmationDialog from "@/components/ConfirmationDialog";

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
  Shop: {
    id: string;
    name: string;
  };
  campaign_jobs?: CampaignJob[];
  jobs?: CampaignJob[]; // Fallback for API response
}

interface CampaignJob {
  id: string;
  agreedPrice: number;
  status: string;
  reviewLink?: string;
  reviewNotes?: string;
  tokensPaid?: number;
  creatorEarning?: number;
  createdAt: string;
  acceptedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  creators: {
    id: string;
    displayName: string;
    bio?: string;
    phone?: string;
    socialMedia?: any;
    currentPriceMin?: number;
    currentPriceMax?: number;
  };
}

export default function CampaignDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;
  const toast = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info";
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && campaignId) {
      fetchCampaign();
    }
  }, [status, campaignId]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      } else {
        toast.showError("ไม่พบ Campaign");
        router.push("/dashboard/shop/campaigns");
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info";
    onConfirm: () => void;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);

  const handleCompleteJob = async (jobId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "ยืนยันการอนุมัติ",
      message: "คุณต้องการอนุมัติและจ่ายเงินให้ Creator ใช่หรือไม่?",
      variant: "info",
      onConfirm: async () => {
        setConfirmDialog(null);
        setProcessing(jobId);
        try {
          const res = await fetch(`/api/campaign-jobs/${jobId}/complete`, {
            method: "POST",
          });

          if (res.ok) {
            toast.showSuccess("อนุมัติและจ่ายเงินสำเร็จ!");
            fetchCampaign();
          } else {
            const error = await res.json();
            toast.showError(error.error || "เกิดข้อผิดพลาด");
          }
        } catch (error) {
          console.error("Error completing job:", error);
          toast.showError("เกิดข้อผิดพลาด");
        } finally {
          setProcessing(null);
        }
      },
    });
  };

  const handleRejectJob = (jobId: string) => {
    setRejectingJobId(jobId);
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!rejectingJobId || !rejectReason.trim()) {
      toast.showError("กรุณาระบุเหตุผล");
      return;
    }

    setShowRejectDialog(false);
    setProcessing(rejectingJobId);
    try {
      const res = await fetch(`/api/campaign-jobs/${rejectingJobId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (res.ok) {
        toast.showSuccess("ปฏิเสธงานสำเร็จ");
        setRejectReason("");
        setRejectingJobId(null);
        fetchCampaign();
      } else {
        const error = await res.json();
        toast.showError(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (jobStatus: string) => {
    const badges: Record<string, { text: string; color: string; icon: any }> = {
      PENDING: {
        text: "รอรับงาน",
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
      },
      ACCEPTED: {
        text: "รับงานแล้ว",
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
      },
      IN_PROGRESS: {
        text: "กำลังทำ",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      SUBMITTED: {
        text: "ส่งผลงานแล้ว",
        color: "bg-purple-100 text-purple-800",
        icon: CheckCircle,
      },
      COMPLETED: {
        text: "เสร็จสิ้น",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      REJECTED: {
        text: "ปฏิเสธ",
        color: "bg-red-100 text-red-800",
        icon: X,
      },
    };
    return badges[jobStatus] || badges.PENDING;
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

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบ Campaign</h2>
          <Link href="/dashboard/shop/campaigns" className="text-blue-600 hover:underline">
            กลับไปหน้า Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const jobs = (campaign.campaign_jobs || campaign.jobs || []) as CampaignJob[];
  const submittedJobs = jobs.filter((j) => j.status === "SUBMITTED");
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard/shop" },
            { label: "จ้าง Creator", href: "/dashboard/shop/campaigns" },
            { label: campaign.title },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
              {campaign.description && (
                <p className="text-gray-600">{campaign.description}</p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === "ACTIVE"
                  ? "bg-green-100 text-green-800"
                  : campaign.status === "DRAFT"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {campaign.status === "ACTIVE"
                ? "ใช้งาน"
                : campaign.status === "DRAFT"
                ? "ร่าง"
                : campaign.status}
            </span>
          </div>
        </div>

        {/* Campaign Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaign.remainingBudget.toLocaleString()} / {campaign.totalBudget.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">tokens</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Creator</p>
                <p className="text-2xl font-bold text-gray-900">
                  {jobs.length} / {campaign.targetReviewers}
                </p>
                <p className="text-xs text-gray-500">คน</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">วันที่</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(campaign.startDate).toLocaleDateString("th-TH")} -{" "}
                  {new Date(campaign.endDate).toLocaleDateString("th-TH")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">งานทั้งหมด</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                รออนุมัติ: {submittedJobs.length}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                เสร็จสิ้น: {completedJobs.length}
              </span>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ยังไม่มี Creator รับงาน</p>
              <Link
                href={`/dashboard/shop/select-reviewers?shopId=${campaign.Shop.id}`}
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                เลือก Creator
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const statusBadge = getStatusBadge(job.status);
                const Icon = statusBadge.icon;
                return (
                  <div
                    key={job.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {job.creators.displayName}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {statusBadge.text}
                          </span>
                        </div>
                        {job.creators?.bio && (
                          <p className="text-sm text-gray-600 mb-2">{job.creators.bio}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>ราคา: {job.agreedPrice.toLocaleString()} tokens</span>
                          </div>
                          {job.creators?.phone && (
                            <div className="flex items-center gap-1">
                              <span>📞 {job.creators.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Review Link & Notes */}
                    {job.reviewLink && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-blue-900">ลิงก์รีวิว:</span>
                        </div>
                        <a
                          href={job.reviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {job.reviewLink}
                        </a>
                        {job.reviewNotes && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-700">{job.reviewNotes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {job.status === "SUBMITTED" && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleCompleteJob(job.id)}
                          disabled={processing === job.id}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processing === job.id ? "กำลังดำเนินการ..." : "อนุมัติและจ่ายเงิน"}
                        </button>
                        <button
                          onClick={() => handleRejectJob(job.id)}
                          disabled={processing === job.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          ปฏิเสธ
                        </button>
                      </div>
                    )}

                    {job.status === "COMPLETED" && job.tokensPaid && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            จ่ายเงินแล้ว: {job.tokensPaid.toLocaleString()} tokens
                            {job.completedAt &&
                              ` (${new Date(job.completedAt).toLocaleDateString("th-TH")})`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          isLoading={processing !== null}
        />
      )}
    </div>
  );
}
