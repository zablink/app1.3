// src/app/dashboard/creator/earnings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Earning {
  id: string;
  amount: number;
  type: 'JOB_PAYMENT' | 'ADJUSTMENT' | 'WITHDRAWAL_FEE' | 'WITHDRAWAL';
  createdAt: string;
  job?: {
    campaign: {
      title: string;
      Shop: {
        name: string;
      };
    };
  };
  withdrawal?: {
    id: string;
    status: string;
  };
}

interface Summary {
  totalEarnings: number;
  totalWithdrawn: number;
  availableBalance: number;
}

export default function CreatorEarningsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/earnings/summary");
      if (res.ok) {
        const data = await res.json();
        setEarnings(data.earnings || []);
        setSummary(data.summary || null);
      } else {
        console.error("Failed to fetch earnings");
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionDescription = (earning: Earning) => {
    switch (earning.type) {
      case 'JOB_PAYMENT':
        return `รับจากงาน: "${earning.job?.campaign.title}" - ร้าน ${earning.job?.campaign.Shop.name}`;
      case 'ADJUSTMENT':
        return 'การปรับยอดโดยผู้ดูแล';
      case 'WITHDRAWAL':
        return `เบิกเงิน (ID: ${earning.withdrawal?.id.substring(0, 8)}...)`;
       case 'WITHDRAWAL_FEE':
        return `ค่าธรรมเนียมการเบิกเงิน`;
      default:
        return 'รายการไม่ระบุประเภท';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'JOB_PAYMENT':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ADJUSTMENT':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'WITHDRAWAL':
      case 'WITHDRAWAL_FEE':
        return <CreditCard className="w-5 h-5 text-red-500" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-500" />;
    }
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard/creator" },
            { label: "รายได้" },
          ]}
        />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ประวัติรายได้</h1>
          <p className="text-gray-600">ดูประวัติรายรับและรายจ่ายทั้งหมดของคุณ</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">รายได้ทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">฿{summary.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-red-600" size={24} />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">ถอนไปแล้ว</p>
                  <p className="text-2xl font-bold text-gray-900">฿{summary.totalWithdrawn.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">ยอดที่ถอนได้</p>
                  <p className="text-2xl font-bold">฿{summary.availableBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transactions History */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">ประวัติธุรกรรม</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รายละเอียด
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวนเงิน (บาท)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earnings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      ยังไม่มีประวัติธุรกรรม
                    </td>
                  </tr>
                ) : (
                  earnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(earning.createdAt).toLocaleString("th-TH")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(earning.type)}
                          <p className="text-sm text-gray-900">{getTransactionDescription(earning)}</p>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                        earning.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {earning.amount >= 0 ? '+' : ''}{earning.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}