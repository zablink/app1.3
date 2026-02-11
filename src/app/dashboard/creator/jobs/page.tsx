// src/app/dashboard/creator/jobs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Filter,
  Search,
  Video,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";

interface ReviewJob {
  id: string;
  title: string;
  shopName: string;
  budget: number;
  deadline: string;
  status: string;
  shop: {
    id: string;
    name: string;
  };
}

export default function CreatorJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [jobs, setJobs] = useState<ReviewJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<ReviewJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    if (status === "authenticated") {
      fetchJobs();
    }
  }, [status, router]);

  useEffect(() => {
    let filtered = [...jobs];

    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.shop.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset page when filters change
  }, [jobs, searchQuery, statusFilter]);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/creator/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string; icon: React.ElementType }> = {
      PENDING: { text: "รอการตอบรับ", color: "bg-gray-100 text-gray-800", icon: Clock },
      ACCEPTED: { text: "รับงานแล้ว", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      IN_PROGRESS: { text: "รอส่งผลงาน", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      SUBMITTED: { text: "ส่งงานแล้ว", color: "bg-purple-100 text-purple-800", icon: CheckCircle },
      COMPLETED: { text: "เสร็จสิ้น", color: "bg-green-100 text-green-800", icon: CheckCircle },
      REJECTED: { text: "ถูกปฏิเสธ", color: "bg-red-100 text-red-800", icon: AlertCircle },
      CANCELLED: { text: "ยกเลิก", color: "bg-red-100 text-red-800", icon: AlertCircle },
    };
    const badge = badges[status] || badges.PENDING;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={14} />
        {badge.text}
      </span>
    );
  };
  
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "แดชบอร์ด", href: "/dashboard/creator" }, { label: "งานของฉัน" }]} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">งานของฉัน</h1>
          <p className="text-gray-600">จัดการและติดตามงานรีวิวทั้งหมดของคุณ</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-auto flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหางาน หรือ ร้านค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative w-full md:w-auto">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="ACCEPTED">รับงานแล้ว</option>
                <option value="IN_PROGRESS">รอส่งผลงาน</option>
                <option value="SUBMITTED">ส่งงานแล้ว</option>
                <option value="COMPLETED">เสร็จสิ้น</option>
                <option value="REJECTED">ถูกปฏิเสธ</option>
              </select>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">ไม่พบงาน</h3>
              <p className="text-gray-500 mt-2">
                {statusFilter === 'all' && searchQuery === '' 
                  ? "ยังไม่มีการจ้างงานในขณะนี้"
                  : "ไม่พบงานที่ตรงกับการค้นหาของคุณ"
                }
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/dashboard/creator/jobs/${job.id}`}
                    className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{job.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">สำหรับร้าน: {job.shop.name}</p>
                         {getStatusBadge(job.status)}
                      </div>
                      <div className="flex-shrink-0 flex flex-col sm:items-end">
                        <div className="flex items-center gap-2 text-green-600 font-semibold text-lg mb-2">
                          <DollarSign size={20} />
                          <span>{job.budget.toLocaleString()} บาท</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Clock size={14} />
                           <span>ส่งงานภายใน: {new Date(job.deadline).toLocaleDateString("th-TH")}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {totalPages > 1 && (
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredJobs.length}
                  />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
