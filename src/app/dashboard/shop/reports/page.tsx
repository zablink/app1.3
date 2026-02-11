// src/app/dashboard/shop/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Coins,
  ArrowDown,
  ArrowUp,
  Tag,
  Clock,
  Calendar,
  FileText,
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";

interface TokenBatch {
  id: string;
  amount: number;
  remainingAmount: number;
  purchasedAt: string;
  expiresAt: string;
}

interface Transaction {
  id: string;
  type: "PURCHASE" | "ADVERTISEMENT" | "CAMPAIGN";
  description: string;
  amount: number;
  discountApplied: number;
  finalAmount: number;
  createdAt: string;
}

interface TokenReport {
  wallet: {
    balance: number;
  };
  batches: TokenBatch[];
  history: Transaction[];
}

const getDiscountTier = (purchasedAt: string, expiresAt: string) => {
  const now = new Date();
  const purchasedDate = new Date(purchasedAt);
  const expiryDate = new Date(expiresAt);
  
  const daysSincePurchase = (now.getTime() - purchasedDate.getTime()) / (1000 * 3600 * 24);
  const daysToExpire = (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

  if (daysToExpire <= 14) {
    return { text: "ไม่มีส่วนลด", discount: 0, color: "text-gray-500" };
  }
  if (daysSincePurchase <= 30) {
    return { text: "10%", discount: 10, color: "text-green-600 font-bold" };
  }
  if (daysSincePurchase <= 60) {
    return { text: "7%", discount: 7, color: "text-blue-600 font-bold" };
  }
  return { text: "5%", discount: 5, color: "text-orange-600 font-bold" };
};

export default function ShopReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId");

  const [report, setReport] = useState<TokenReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    if (status === "authenticated" && shopId) {
      fetchReport();
    }
  }, [status, shopId]);

  const fetchReport = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/tokens/report`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (error) {
      console.error("Error fetching token report:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const getTransactionIcon = (type: string) => {
      const icons: Record<string, { icon: React.ElementType, color: string}> = {
          PURCHASE: { icon: ArrowUp, color: "text-green-600"},
          ADVERTISEMENT: { icon: ArrowDown, color: "text-red-600"},
          CAMPAIGN: { icon: ArrowDown, color: "text-red-600"}
      }
      return icons[type] || {icon: FileText, color: "text-gray-500"};
  }

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
            <h2 className="text-xl font-bold">ไม่พบรหัสร้านค้า</h2>
            <Link href="/dashboard/shop" className="text-blue-600 hover:underline mt-2 inline-block">กลับไปหน้าแดชบอร์ด</Link>
        </div>
      </div>
    );
  }

  const paginatedHistory = report?.history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: `/dashboard/shop?shopId=${shopId}` },
            { label: "รายงาน Token" },
          ]}
        />
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">รายงาน Token</h1>
          <p className="text-gray-600">สรุปภาพรวม, รายละเอียด, และประวัติการใช้ Token</p>
        </div>

        {/* Wallet Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg p-6 mb-8">
           <p className="text-blue-100 text-sm mb-1">ยอด Token ทั้งหมด</p>
           <p className="text-4xl font-bold">{report?.wallet.balance.toLocaleString() || 0} <span className="text-2xl font-normal">Tokens</span></p>
           <div className="mt-4 pt-4 border-t border-blue-500/50 flex justify-end">
                <Link href={`/payment/tokens?shopId=${shopId}`} className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
                    ซื้อ Token เพิ่ม
                </Link>
           </div>
        </div>

        {/* Token Batches */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><Coins size={20}/> Token ที่มีทั้งหมด (Batches)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนคงเหลือ</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ส่วนลดปัจจุบัน</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ซื้อ</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันหมดอายุ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report?.batches && report.batches.length > 0 ? (
                  report.batches.map((batch) => {
                    const discountInfo = getDiscountTier(batch.purchasedAt, batch.expiresAt);
                    return (
                      <tr key={batch.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.remainingAmount.toLocaleString()} Tokens</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${discountInfo.color}`}>{discountInfo.text}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(batch.purchasedAt).toLocaleDateString("th-TH")}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(batch.expiresAt).toLocaleDateString("th-TH")}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">ไม่มี Token ในระบบ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={20}/> ประวัติการทำธุรกรรม</h2>
           <div className="space-y-4">
                {paginatedHistory && paginatedHistory.length > 0 ? (
                    paginatedHistory.map(tx => {
                        const { icon: Icon, color } = getTransactionIcon(tx.type);
                        const isDebit = tx.finalAmount < 0;
                        return (
                            <div key={tx.id} className="border-b pb-3 mb-3 last:border-b-0 last:pb-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDebit ? 'bg-red-50' : 'bg-green-50'}`}>
                                            <Icon size={20} className={isDebit ? 'text-red-600' : 'text-green-600'} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{tx.description}</p>
                                            <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString("th-TH")}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                       <p className={`font-bold text-lg ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                                           {tx.finalAmount.toLocaleString()} 
                                       </p>
                                       {tx.discountApplied > 0 && (
                                           <p className="text-xs text-gray-500 line-through">
                                               {tx.amount.toLocaleString()}
                                           </p>
                                       )}
                                    </div>
                                </div>
                                 {tx.discountApplied > 0 && (
                                    <div className="mt-2 ml-14 pl-1 border-l-2 border-dashed">
                                        <p className="text-xs text-green-700 bg-green-50 rounded-full px-2 py-0.5 inline-block">
                                            <Tag size={12} className="inline mr-1"/>
                                            ใช้ส่วนลด {tx.discountApplied}% 
                                        </p>
                                    </div>
                                 )}
                            </div>
                        )
                    })
                ) : (
                     <div className="px-6 py-12 text-center text-gray-500">
                        <p>ยังไม่มีประวัติการทำธุรกรรม</p>
                    </div>
                )}
           </div>
           {report && report.history.length > itemsPerPage && (
                <Pagination 
                    currentPage={currentPage}
                    totalPages={Math.ceil(report.history.length / itemsPerPage)}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={report.history.length}
                />
           )}
        </div>
      </div>
    </div>
  );
}
