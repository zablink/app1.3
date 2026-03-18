"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { ShoppingCart, Package, Coins, Trash2, CreditCard } from "lucide-react";

type Cart =
  | null
  | {
      v: 1;
      shopId: string;
      createdAt: number;
      items: Array<
        | { kind: "subscription"; tier: "FREE" | "BASIC" | "PRO" | "PREMIUM" }
        | { kind: "token_pack"; packId: "pack_100" | "pack_500" | "pack_1000" | "pack_5000" }
      >;
    };

const TOKEN_PACK_LABELS: Record<string, { tokens: string; price: string }> = {
  pack_100: { tokens: "100", price: "฿100" },
  pack_500: { tokens: "525 (รวมโบนัส)", price: "฿475" },
  pack_1000: { tokens: "1,100 (รวมโบนัส)", price: "฿900" },
  pack_5000: { tokens: "5,750 (รวมโบนัส)", price: "฿4,250" },
};

export default function CartPage() {
  const router = useRouter();
  const toast = useToast();
  const [cart, setCart] = useState<Cart>(null);
  const [loading, setLoading] = useState(true);

  const item = useMemo(() => cart?.items?.[0], [cart]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        const data = await res.json();
        setCart(data.cart);
      } catch {
        setCart(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const clearCart = async () => {
    await fetch("/api/cart", { method: "DELETE" });
    setCart(null);
    toast.showSuccess("ล้างตะกร้าแล้ว");
  };

  const goToPayment = () => {
    if (!cart || !item) {
      toast.showError("ตะกร้าว่าง");
      router.push("/pricing");
      return;
    }
    router.push("/payment");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">กำลังโหลดตะกร้า...</p>
        </div>
      </div>
    );
  }

  if (!cart || !item) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 mt-4">ตะกร้าว่าง</h1>
            <p className="text-gray-600 mt-2">ไปเลือกแพ็คเกจหรือ Token ก่อนนะ</p>
            <div className="mt-6">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                ไปหน้า Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" />
              ตะกร้าสินค้า
            </h1>
            <p className="text-gray-600 mt-1">ตรวจสอบรายการก่อนชำระเงิน</p>
          </div>
          <button
            onClick={clearCart}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Trash2 className="w-4 h-4" />
            ล้างตะกร้า
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {item.kind === "subscription" ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">แพ็คเกจ {item.tier}</div>
                <div className="text-sm text-gray-600">คิดราคาจริงจากฝั่งเซิร์ฟเวอร์ตอน checkout</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Token Pack</div>
                <div className="text-sm text-gray-600">
                  {TOKEN_PACK_LABELS[item.packId]?.tokens ?? item.packId} Tokens •{" "}
                  {TOKEN_PACK_LABELS[item.packId]?.price ?? ""}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-4">
          <Link
            href="/pricing"
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center font-medium"
          >
            เลือกต่อ
          </Link>
          <button
            onClick={goToPayment}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
          >
            <CreditCard className="w-5 h-5" />
            ไปชำระเงิน
          </button>
        </div>
      </div>
    </div>
  );
}

