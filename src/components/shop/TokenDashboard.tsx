// components/shop/TokenDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Coins, TrendingUp, Clock, ShoppingCart, AlertCircle } from "lucide-react";

interface TokenBatch {
  id: string;
  amount: number;
  remainingAmount: number;
  source: string;
  receivedAt: string;
  expiresAt: string;
  daysUntilExpiry: number;
}

interface TokenTransaction {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

interface TokenBalance {
  totalTokens: number;
  usedTokens: number;
  availableTokens: number;
  batches: TokenBatch[];
  transactions: TokenTransaction[];
}

export default function TokenDashboard({ shopId }: { shopId: string }) {
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, [shopId]);

  const fetchBalance = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/tokens`);
      const data = await res.json();
      setBalance(data);
    } catch (error) {
      console.error("Error fetching token balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      earn: "text-green-600 bg-green-50",
      spend: "text-red-600 bg-red-50",
      refund: "text-blue-600 bg-blue-50",
      expire: "text-orange-600 bg-orange-50",
      convert: "text-purple-600 bg-purple-50",
    };
    return colors[type as keyof typeof colors] || "text-gray-600 bg-gray-50";
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      earn: "➕",
      spend: "➖",
      refund: "↩️",
      expire: "⏰",
      convert: "🎁",
    };
    return icons[type as keyof typeof icons] || "•";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600">ไม่พบข้อมูล Token</p>
      </div>
    );
  }

  const expiringBatches = balance.batches.filter(
    (b) => b.remainingAmount > 0 && b.daysUntilExpiry <= 30
  );

  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins size={24} />
            <h3 className="text-lg font-semibold">Token Balance</h3>
          </div>
          <button
            onClick={() => window.location.href = `/shop/${shopId}/tokens/purchase`}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
          >
            <ShoppingCart size={16} className="inline mr-2" />
            ซื้อ Token
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-blue-200 text-sm mb-1">ทั้งหมด</p>
            <p className="text-3xl font-bold">{balance.totalTokens}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm mb-1">ใช้แล้ว</p>
            <p className="text-3xl font-bold">{balance.usedTokens}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm mb-1">คงเหลือ</p>
            <p className="text-3xl font-bold">{balance.availableTokens}</p>
          </div>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {expiringBatches.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-1">
                ⚠️ Token ใกล้หมดอายุ!
              </h4>
              <p className="text-sm text-yellow-800 mb-3">
                คุณมี {expiringBatches.reduce((sum, b) => sum + b.remainingAmount, 0)} tokens 
                ที่จะหมดอายุใน 30 วัน
              </p>
              <div className="space-y-2">
                {expiringBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between text-sm bg-white rounded p-2"
                  >
                    <span className="text-gray-700">
                      {batch.remainingAmount} tokens จาก {batch.source}
                    </span>
                    <span className="text-yellow-700 font-medium">
                      <Clock size={14} className="inline mr-1" />
                      เหลือ {batch.daysUntilExpiry} วัน
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => window.location.href = `/shop/${shopId}/tokens/convert`}
                className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium underline"
              >
                แปลงเป็นส่วนลด →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Token Batches */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Token Batches (FIFO)
        </h3>
        {balance.batches.length === 0 ? (
          <p className="text-gray-600 text-center py-8">ยังไม่มี Token</p>
        ) : (
          <div className="space-y-3">
            {balance.batches.map((batch, index) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {batch.source}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {batch.remainingAmount} / {batch.amount} tokens
                  </p>
                  <p className="text-sm text-gray-600">
                    ได้รับ: {new Date(batch.receivedAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    batch.daysUntilExpiry <= 7
                      ? "text-red-600"
                      : batch.daysUntilExpiry <= 30
                      ? "text-yellow-600"
                      : "text-gray-600"
                  }`}>
                    <Clock size={14} className="inline mr-1" />
                    {batch.daysUntilExpiry > 0
                      ? `เหลือ ${batch.daysUntilExpiry} วัน`
                      : "หมดอายุแล้ว"}
                  </p>
                  <p className="text-xs text-gray-500">
                    หมดอายุ: {new Date(batch.expiresAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            ประวัติการใช้งาน
          </h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showHistory ? "ซ่อน" : "แสดงทั้งหมด"}
          </button>
        </div>

        {balance.transactions.length === 0 ? (
          <p className="text-gray-600 text-center py-8">ยังไม่มีประวัติ</p>
        ) : (
          <div className="space-y-2">
            {(showHistory
              ? balance.transactions
              : balance.transactions.slice(0, 5)
            ).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(
                      tx.type
                    )}`}
                  >
                    {getTypeIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {tx.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleString("th-TH")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-medium ${
                      tx.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount}
                  </p>
                  <p className="text-xs text-gray-500">
                    คงเหลือ: {tx.balance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}