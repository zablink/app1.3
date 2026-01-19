// src/app/dashboard/creator/campaigns/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Send,
  X,
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
    image?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  campaign_jobs?: any[];
  jobs?: any[];
}

interface Job {
  id: string;
  agreedPrice: number;
  status: string;
  reviewLink?: string;
  reviewNotes?: string;
  createdAt: string;
  acceptedAt?: string;
  submittedAt?: string;
}

export default function CreatorCampaignDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;
  const toast = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info";
    onConfirm: () => void;
  } | null>(null);

  // Form state
  const [reviewLink, setReviewLink] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

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

        // Find job for current creator
        const jobs = data.campaign_jobs || data.jobs || [];
        const creatorJob = jobs.find(
          (j: any) => j.creators?.userId === session?.user?.id || j.creator?.userId === session?.user?.id
        );
        setJob(creatorJob || null);
      } else {
        toast.showError("ไม่พบ Campaign");
        router.push("/dashboard/creator/available-campaigns");
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async () => {
    if (!confirm("ยืนยันการรับงานนี้?")) {
      return;
    }

    setSubmitting(true);
    try {
      // First, create the job if it doesn't exist
      const res = await fetch(`/api/campaigns/${campaignId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreedPrice: campaign?.totalBudget || 0,
        }),
      });

      if (res.ok) {
        toast.showSuccess("รับงานสำเร็จ!");
        fetchCampaign();
      } else {
        const error = await res.json();
        toast.showError(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!reviewLink) {
      toast.showError("กรุณากรอกลิงก์รีวิว");
      return;
    }

    if (!job?.id) {
      toast.showError("ไม่พบงาน");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaign-jobs/${job.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewLink,
          reviewNotes,
        }),
      });

      if (res.ok) {
        toast.showSuccess("ส่งผลงานสำเร็จ!");
        setShowSubmitForm(false);
        setReviewLink("");
        setReviewNotes("");
        fetchCampaign();
      } else {
        const error = await res.json();
        toast.showError(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error submitting work:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
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
          <Link href="/dashboard/creator/available-campaigns" className="text-blue-600 hover:underline">
            กลับไปหน้า Campaigns
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = job ? getStatusBadge(job.status) : null;
  const Icon = statusBadge?.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard/creator" },
            { label: "งานที่เปิดรับ", href: "/dashboard/creator/available-campaigns" },
            { label: campaign.title },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
          {campaign.description && <p className="text-gray-600">{campaign.description}</p>}
        </div>

        {/* Campaign Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            {campaign.Shop.image && (
              <img
                src={campaign.Shop.image}
                alt={campaign.Shop.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{campaign.Shop.name}</h2>
              {campaign.Shop.address && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{campaign.Shop.address}</span>
                </div>
              )}
              <Link
                href={`/shop/${campaign.Shop.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                ดูข้อมูลร้าน →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Budget</p>
              <p className="text-lg font-bold text-gray-900">
                {campaign.totalBudget.toLocaleString()} tokens
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">วันที่</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(campaign.startDate).toLocaleDateString("th-TH")} -{" "}
                {new Date(campaign.endDate).toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>

          {/* Job Status */}
          {job ? (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">สถานะงาน</p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 w-fit ${statusBadge?.color}`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {statusBadge?.text}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">ราคา</p>
                  <p className="text-lg font-bold text-gray-900">
                    {job.agreedPrice.toLocaleString()} tokens
                  </p>
                </div>
              </div>

              {/* Submit Form */}
              {job.status === "ACCEPTED" || job.status === "IN_PROGRESS" ? (
                <div className="mt-4">
                  {!showSubmitForm ? (
                    <button
                      onClick={() => setShowSubmitForm(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      ส่งผลงาน
                    </button>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ลิงก์รีวิว *
                        </label>
                        <input
                          type="url"
                          value={reviewLink}
                          onChange={(e) => setReviewLink(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          หมายเหตุ (ถ้ามี)
                        </label>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          rows={3}
                          placeholder="รายละเอียดเพิ่มเติม..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSubmitWork}
                          disabled={submitting || !reviewLink}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {submitting ? "กำลังส่ง..." : "ส่งผลงาน"}
                        </button>
                        <button
                          onClick={() => {
                            setShowSubmitForm(false);
                            setReviewLink("");
                            setReviewNotes("");
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : job.status === "SUBMITTED" ? (
                <div className="mt-4 bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-800 mb-2">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    ส่งผลงานแล้ว - รอการอนุมัติจากร้าน
                  </p>
                  {job.reviewLink && (
                    <a
                      href={job.reviewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {job.reviewLink}
                    </a>
                  )}
                </div>
              ) : job.status === "COMPLETED" ? (
                <div className="mt-4 bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    งานเสร็จสิ้น - ได้รับการอนุมัติและจ่ายเงินแล้ว
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-600 mb-4">คุณยังไม่ได้รับงานนี้</p>
              <button
                onClick={handleAcceptJob}
                disabled={submitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {submitting ? "กำลังรับงาน..." : "รับงาน"}
              </button>
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
          isLoading={submitting}
        />
      )}
    </div>
  );
}
