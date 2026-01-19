// src/app/dashboard/creator/withdraw/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

interface Withdrawal {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  bankName: string;
  bankAccount: string;
  accountName: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  rejectionReason?: string;
}

export default function CreatorWithdrawPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [accountName, setAccountName] = useState("");

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
      const res = await fetch("/api/creator/withdraw");
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
        setAvailableBalance(data.availableBalance || 0);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !bankName || !bankAccount || !accountName) {
      toast.showError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum < 100) {
      toast.showError("จำนวนเงินขั้นต่ำคือ 100 บาท");
      return;
    }

    if (amountNum > availableBalance) {
      toast.showError("ยอดเงินไม่พอ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/creator/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          bankName,
          bankAccount,
          accountName,
        }),
      });

      if (res.ok) {
        toast.showSuccess("ส่งคำขอเบิกเงินสำเร็จ!");
        resetForm();
        fetchData();
      } else {
        const error = await res.json();
        toast.showError(error.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setBankName("");
    setBankAccount("");
    setAccountName("");
  };

  const getStatusBadge = (withdrawal: Withdrawal) => {
    const badges: Record<string, { text: string; color: string; icon: any }> = {
      PENDING: {
        text: "รอตรวจสอบ",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      PROCESSING: {
        text: "กำลังดำเนินการ",
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
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
    return badges[withdrawal.status] || badges.PENDING;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard/creator" },
            { label: "เบิกเงิน" },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">เบิกเงิน</h1>
          <p className="text-gray-600">ถอนเงินที่ได้รับจากการทำงาน</p>
        </div>

        {/* Available Balance */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">ยอดที่ถอนได้</p>
              <p className="text-3xl font-bold">
                ฿{availableBalance.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
          {availableBalance < 100 && (
            <div className="mt-4 bg-yellow-500/20 rounded-lg p-3">
              <p className="text-sm">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                จำนวนเงินขั้นต่ำสำหรับการเบิกคือ 100 บาท
              </p>
            </div>
          )}
        </div>

        {/* Withdrawal Form */}
        {availableBalance >= 100 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ขอเบิกเงิน</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวนเงิน (บาท) *
                </label>
                <input
                  type="number"
                  min="100"
                  max={availableBalance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  จำนวนเงินขั้นต่ำ: 100 บาท
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อธนาคาร *
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น ธนาคารกรุงเทพ"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลขบัญชี *
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="123-456-7890"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อบัญชี *
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ชื่อเจ้าของบัญชี"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {submitting ? "กำลังส่งคำขอ..." : "ส่งคำขอเบิกเงิน"}
              </button>
            </form>
          </div>
        )}

        {/* Withdrawals History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">ประวัติการเบิกเงิน</h2>
          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">ยังไม่มีประวัติการเบิกเงิน</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => {
                const statusBadge = getStatusBadge(withdrawal);
                const Icon = statusBadge.icon;
                return (
                  <div
                    key={withdrawal.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusBadge.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {statusBadge.text}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">จำนวนเงิน:</span> ฿
                            {withdrawal.amount.toLocaleString()}
                          </p>
                          {withdrawal.fee > 0 && (
                            <p>
                              <span className="font-medium">ค่าธรรมเนียม:</span> ฿
                              {withdrawal.fee.toLocaleString()}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">ยอดสุทธิ:</span> ฿
                            {withdrawal.netAmount.toLocaleString()}
                          </p>
                          <p>
                            <span className="font-medium">ธนาคาร:</span> {withdrawal.bankName}
                          </p>
                          <p>
                            <span className="font-medium">เลขบัญชี:</span>{" "}
                            {withdrawal.bankAccount}
                          </p>
                          <p>
                            <span className="font-medium">ชื่อบัญชี:</span>{" "}
                            {withdrawal.accountName}
                          </p>
                          <p>
                            <span className="font-medium">วันที่ขอ:</span>{" "}
                            {new Date(withdrawal.requestedAt).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {withdrawal.rejectionReason && (
                            <p className="text-red-600">
                              <span className="font-medium">เหตุผลที่ปฏิเสธ:</span>{" "}
                              {withdrawal.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
