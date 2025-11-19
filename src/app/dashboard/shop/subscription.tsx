// src/app/dashboard/shop/subscription.tsx
"use client";
import { useEffect, useState } from "react";

export default function ShopSubscriptionWidget({ shopId }: { shopId: string }) {
  const [current, setCurrent] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const r1 = await fetch(`/api/shops/${shopId}/subscription`);
        if (r1.ok) setCurrent(await r1.json());
        const r2 = await fetch(`/api/subscription-plans`);
        if (r2.ok) setPlans(await r2.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (shopId) load();
  }, [shopId]);

  async function subscribe(planId: string) {
    setMessage(null);
    try {
      const r = await fetch(`/api/shops/${shopId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, autoRenew: true, paymentProvider: "omise" }),
      });
      if (!r.ok) {
        const err = await r.json();
        setMessage(err?.error || "Failed");
      } else {
        setCurrent(await r.json());
        setMessage("สมัครสำเร็จ");
      }
    } catch (err) {
      console.error(err);
      setMessage("เกิดข้อผิดพลาด");
    }
  }

  async function cancel() {
    setMessage(null);
    try {
      const r = await fetch(`/api/shops/${shopId}/subscription`, { method: "DELETE" });
      if (!r.ok) {
        const err = await r.json();
        setMessage(err?.error || "Failed");
      } else {
        setCurrent(null);
        setMessage("ยกเลิกสำเร็จ");
      }
    } catch (err) {
      console.error(err);
      setMessage("เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="font-semibold mb-2">Subscription</h3>
      {loading ? (
        <p>Loading...</p>
      ) : current ? (
        <div>
          <p>Plan: {current.plan?.name}</p>
          <p>Expires: {new Date(current.expiresAt).toLocaleDateString()}</p>
          <button onClick={cancel} className="mt-2 px-3 py-1 bg-red-500 text-white rounded">Cancel</button>
        </div>
      ) : (
        <div>
          <p>ไม่มี subscription ปัจจุบัน</p>
          <div className="flex gap-2 mt-2">
            {plans.map((p) => (
              <button key={p.id} onClick={() => subscribe(p.id)} className="px-3 py-1 border rounded">
                {p.name} - {p.price}฿
              </button>
            ))}
          </div>
        </div>
      )}
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}