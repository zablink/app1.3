"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/contexts/ToastContext";

type Props =
  | {
      kind: "subscription";
      tier: "FREE" | "BASIC" | "PRO" | "PREMIUM";
      className?: string;
      children: React.ReactNode;
    }
  | {
      kind: "token_pack";
      packId: "pack_100" | "pack_500" | "pack_1000" | "pack_5000";
      className?: string;
      children: React.ReactNode;
    };

export function PricingAddToCartButton(props: Props) {
  const router = useRouter();
  const toast = useToast();
  const { status } = useSession();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (status === "unauthenticated") {
      if (props.kind === "subscription" && props.tier === "FREE") {
        router.push("/signin?callbackUrl=/shop/register");
      } else {
        router.push("/signin?callbackUrl=/pricing");
      }
      return;
    }

    if (props.kind === "subscription" && props.tier === "FREE") {
      router.push("/shop/register");
      return;
    }

    setLoading(true);
    try {
      const shopsRes = await fetch("/api/user/shops", { cache: "no-store" });
      const shopsData = await shopsRes.json().catch(() => ({}));
      const shopId = shopsData?.shops?.[0]?.id;
      if (!shopId) {
        toast.showError("กรุณาสมัครร้านค้าก่อน");
        router.push("/shop/register");
        return;
      }

      const item =
        props.kind === "subscription"
          ? { kind: "subscription", tier: props.tier }
          : { kind: "token_pack", packId: props.packId };

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, item }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.showError(data.error || "บันทึกตะกร้าไม่สำเร็จ");
        return;
      }

      router.push("/cart");
    } catch {
      toast.showError("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={props.className}
    >
      {loading ? "กำลังเพิ่ม..." : props.children}
    </button>
  );
}

