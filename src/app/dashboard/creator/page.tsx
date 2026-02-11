// app/dashboard/creator/page.tsx - Creator Dashboard
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Video,
  DollarSign,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Plus,
} from "lucide-react";

interface Creator {
  id: string;
  displayName: string;
  status: string;
  totalReviews: number;
  completedReviews: number;
  rating: number;
  totalEarnings: number;
  availableBalance: number;
  totalWithdrawn: number;
}

interface ReviewJob {
  id: string;
  title: string;
  shopName: string;
  budget: number;
  deadline: string;
  status: string;
}

export default function CreatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [jobs, setJobs] = useState<ReviewJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    if (status === "authenticated") {
      if (session?.user?.role !== "CREATOR" && session?.user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        fetchCreatorData();
      }
    }
  }, [status, session, router]);

  const fetchCreatorData = async () => {
    try {
      const [creatorRes, jobsRes] = await Promise.all([
        fetch("/api/creator/me"),
        fetch("/api/creator/jobs"),
      ]);

      const creatorData = await creatorRes.json();
      const jobsData = await jobsRes.json();

      setCreator(creatorData);
      setJobs(jobsData.jobs || []);
    } catch (error) {
      console.error("Error fetching creator data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { icon: Clock, text: "รอตรวจสอบ", color: "bg-yellow-100 text-yellow-800" },
      APPROVED: { icon: CheckCircle, text: "อนุมัติแล้ว", color: "bg-green-100 text-green-800" },
      SUSPENDED: { icon: AlertCircle, text: "ระงับ", color: "bg-red-100 text-red-800" },
      REJECTED: { icon: AlertCircle, text: "ถูกปฏิเสธ", color: "bg-red-100 text-red-800" },
    };
    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };

  const getJobStatusBadge = (status: string) => {
    const badges = {
      pending: { text: "รอรับงาน", color: "bg-gray-100 text-gray-800" },
      assigned: { text: "รับงานแล้ว", color: "bg-blue-100 text-blue-800" },
      in_progress: { text: "กำลังทำ", color: "bg-yellow-100 text-yellow-800" },
      completed: { text: "เสร็จสิ้น", color: "bg-green-100 text-green-800" },
      cancelled: { text: "ยกเลิก", color: "bg-red-100 text-red-800" },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // Not registered as creator
  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="text-purple-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ยินดีต้อนรับสู่ Dashboard Creator
            </h2>
            <p className="text-gray-600 mb-8">
              คุณยังไม่ได้ลงทะเบียนเป็น Creator เริ่มต้นสร้างรายได้จากการรีวิวร้านอาหาร
            </p>
            <button
              onClick={() => router.push("/creator/register")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              <Plus size={20} />
              สมัครเป็น Creator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {creator.displayName}
              </h1>
              {getStatusBadge(creator.status)}
            </div>
            <button
              onClick={() => router.push("/creator/profile")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              แก้ไขโปรไฟล์
            </button>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-white text-lg font-semibold mb-4">สรุปรายได้</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/80 text-sm mb-1">รายได้ทั้งหมด</p>
              <p className="text-white text-2xl font-bold">
                ฿{creator.totalEarnings.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/80 text-sm mb-1">ยอดที่ถอนได้</p>
              <p className="text-white text-2xl font-bold">
                ฿{creator.availableBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/80 text-sm mb-1">ถอนไปแล้ว</p>
              <p className="text-white text-2xl font-bold">
                ฿{creator.totalWithdrawn.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/dashboard/creator/withdraw")}
              disabled={creator.availableBalance < 100}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard size={20} />
              ถอนเงิน {creator.availableBalance < 100 && "(ขั้นต่ำ 100 บาท)"}
            </button>
            <button
              onClick={() => router.push("/dashboard/creator/earnings")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium"
            >
              <DollarSign size={20} />
              ดูประวัติรายได้
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">งานทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{creator.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">เสร็จสมบูรณ์</p>
                <p className="text-2xl font-bold text-gray-900">{creator.completedReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">คะแนนเฉลี่ย</p>
                <p className="text-2xl font-bold text-gray-900">
                  {creator.rating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">งานของฉัน</h2>
            <button
              onClick={() => router.push("/creator/jobs")}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              ดูทั้งหมด
            </button>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-600">ยังไม่มีงาน</p>
              <p className="text-gray-400 text-sm mt-2">
                งานใหม่จะแสดงที่นี่เมื่อร้านค้าส่งคำขอรีวิว
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition cursor-pointer"
                  onClick={() => router.push(`/creator/jobs/${job.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{job.title}</h3>
                      <p className="text-gray-600 text-sm">{job.shopName}</p>
                    </div>
                    {getJobStatusBadge(job.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                    <div className="flex items-center gap-1">
                      <DollarSign size={16} />
                      <span>฿{job.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>
                        {new Date(job.deadline).toLocaleDateString("th-TH")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}