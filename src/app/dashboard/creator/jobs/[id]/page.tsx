// src/app/dashboard/creator/jobs/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  Paperclip,
  Send,
  Trash2,
  X,
  ArrowRight,
  Calendar,
  Store,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useToast } from "@/contexts/ToastContext";

interface Job {
  id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  status: string;
  shop: {
    id: string;
    name: string;
    profileImage: string;
  };
  reviewLinks: { id: string; url: string }[];
  rejectionReason?: string;
  creatorId?: string;
}

export default function CreatorJobDetailPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const toast = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for submitting links
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/");
    }
    if (sessionStatus === "authenticated" && jobId) {
      fetchJobDetails();
    }
  }, [sessionStatus, jobId]);

  const fetchJobDetails = async () => {
    try {
      const res = await fetch(`/api/creator/jobs/${jobId}`);
      if (!res.ok) {
        toast.showError("ไม่พบงานที่ต้องการ");
        router.push("/dashboard/creator/jobs");
        return;
      }
      const data = await res.json();
      setJob(data.job);
      // Pre-fill links if they exist (e.g., when resubmitting)
      if (data.job.reviewLinks) {
        setLinks(data.job.reviewLinks.map((l: any) => l.url));
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast.showError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/creator/jobs/${jobId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.showSuccess(`อัปเดตสถานะเป็น "${newStatus}" เรียบร้อย`);
        fetchJobDetails(); // Refresh job data
      } else {
        const error = await res.json();
        toast.showError(error.error || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (error) {
      toast.showError("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddLink = () => {
    if (newLink && !links.includes(newLink)) {
      try {
        new URL(newLink); // Validate URL format
        setLinks([...links, newLink]);
        setNewLink("");
      } catch (_error) {
        toast.showError("รูปแบบ URL ไม่ถูกต้อง");
      }
    } else if (links.includes(newLink)) {
        toast.showWarning("คุณได้เพิ่มลิงก์นี้ไปแล้ว");
    }
  };

  const handleRemoveLink = (linkToRemove: string) => {
    setLinks(links.filter((link) => link !== linkToRemove));
  };

  const handleSubmitReview = async () => {
    if (links.length === 0) {
        toast.showError("กรุณาเพิ่มลิงก์ผลงานอย่างน้อย 1 ลิงก์");
        return;
    }
    setIsSubmitting(true);
    try {
        const res = await fetch(`/api/creator/jobs/${jobId}/submit`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links }),
        });

        if (res.ok) {
            toast.showSuccess("ส่งผลงานเรียบร้อยแล้ว รอการตรวจสอบ");
            fetchJobDetails();
        } else {
            const error = await res.json();
            toast.showError(error.error || "ไม่สามารถส่งผลงานได้");
        }
    } catch (error) {
        toast.showError("เกิดข้อผิดพลาดในการส่งผลงาน");
    } finally {
        setIsSubmitting(false);
    }
  };

  const getStatusComponent = () => {
    if (!job) return null;

    switch (job.status) {
      case "ACCEPTED":
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">คุณได้รับงานนี้แล้ว</h3>
            <p className="text-blue-700 mb-6">กรุณากด "เริ่มทำรีวิว" เพื่อแจ้งให้ร้านค้าทราบว่าคุณกำลังจะเริ่มทำงาน</p>
            <button
              onClick={() => handleUpdateStatus("IN_PROGRESS")}
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full sm:w-auto disabled:opacity-50"
            >
              {isSubmitting ? "กำลังอัปเดต..." : "เริ่มทำรีวิว"}
            </button>
          </div>
        );
      case "IN_PROGRESS":
      case "REJECTED": // Allow resubmission if rejected
        return (
          <div className="bg-white border rounded-lg p-6">
            {job.status === 'REJECTED' && job.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0"/>
                        <div>
                             <h4 className="font-bold text-red-800">ร้านค้าปฏิเสธงานของคุณ</h4>
                             <p className="text-red-700 mt-1">เหตุผล: {job.rejectionReason}</p>
                             <p className="text-sm text-red-600 mt-2">กรุณาแก้ไขและส่งผลงานอีกครั้ง</p>
                        </div>
                    </div>
                </div>
            )}
            <h3 className="text-xl font-bold text-gray-900 mb-4">ส่งผลงานรีวิว</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ลิงก์ผลงาน (เช่น Facebook, Instagram, TikTok)</label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            placeholder="https://..."
                            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handleAddLink} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium">
                            เพิ่ม
                        </button>
                    </div>
                </div>

                {links.length > 0 && (
                <div className="space-y-2 pt-2">
                    {links.map((link, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Paperclip size={16} className="text-gray-500"/>
                            <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">{link}</a>
                        </div>
                        <button onClick={() => handleRemoveLink(link)} className="p-1 text-red-500 hover:text-red-700">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                    ))}
                </div>
                )}

                <div className="pt-4">
                     <button
                        onClick={handleSubmitReview}
                        disabled={isSubmitting || links.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        <Send size={18}/>
                        {isSubmitting ? "กำลังส่ง..." : "ส่งผลงานเพื่อตรวจสอบ"}
                    </button>
                </div>
            </div>
          </div>
        );
      case "SUBMITTED":
        return (
             <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-purple-600 mx-auto mb-4"/>
                    <h3 className="text-xl font-bold text-purple-900">ส่งผลงานเรียบร้อย</h3>
                    <p className="text-purple-700 mt-2">ร้านค้ากำลังตรวจสอบผลงานของคุณ</p>
                </div>
                 <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-2">ลิงก์ที่ส่งไป:</h4>
                     <div className="space-y-2">
                        {job.reviewLinks.map(link => (
                            <div key={link.id} className="flex items-center gap-2 bg-white p-2 rounded">
                               <Paperclip size={16} className="text-gray-500"/>
                               <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">{link.url}</a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
      case "COMPLETED":
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4"/>
            <h3 className="text-xl font-bold text-green-900">งานเสร็จสมบูรณ์</h3>
            <p className="text-green-700 mt-2">ร้านค้าได้อนุมัติงานของคุณแล้ว ยอดเงินจะถูกโอนเข้าบัญชีของคุณเร็วๆ นี้</p>
            <Link href="/dashboard/creator/earnings" className="mt-4 inline-block text-blue-600 hover:underline font-medium">
                ดูประวัติรายได้
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!job) {
      return (
           <div className="min-h-screen flex items-center justify-center">
               <div className="text-center">
                   <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                   <h2 className="text-2xl font-bold text-gray-800 mb-2">ไม่พบข้อมูลงาน</h2>
                    <Link href="/dashboard/creator/jobs" className="text-blue-600 hover:underline">
                       กลับไปหน้ารายการงาน
                   </Link>
               </div>
           </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "แดชบอร์ด", href: "/dashboard/creator" },
            { label: "งานของฉัน", href: "/dashboard/creator/jobs" },
            { label: job.title },
          ]}
        />

        <div className="bg-white shadow-md rounded-lg overflow-hidden mt-4">
           <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                        <img src={job.shop.profileImage || '/placeholder.svg'} alt={job.shop.name} className="w-24 h-24 rounded-lg object-cover"/>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                        <div className="flex items-center gap-2 text-gray-600 mb-4">
                            <Store size={16}/>
                            <span className="font-medium">ร้านค้า:</span>
                            <Link href={`/shop/${job.shop.id}`} className="text-blue-600 hover:underline">
                                {job.shop.name}
                            </Link>
                        </div>
                         <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-green-600 font-semibold">
                                <DollarSign size={16}/>
                                <span>ค่าตอบแทน: {job.budget.toLocaleString()} บาท</span>
                            </div>
                            <div className="flex items-center gap-2 text-red-600">
                                <Calendar size={16}/>
                                <span>กำหนดส่ง: {new Date(job.deadline).toLocaleDateString("th-TH")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {job.description && (
                    <div className="mt-6 border-t pt-6">
                         <h2 className="text-lg font-semibold text-gray-800 mb-2">รายละเอียดงาน</h2>
                         <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
                    </div>
                )}
            </div>

            {/* Action/Status Area */}
            <div className="px-6 py-8 bg-gray-50/70">
                {getStatusComponent()}
            </div>
        </div>
      </div>
    </div>
  );
}
