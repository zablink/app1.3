// src/app/pricing/cart/package/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PackageCartPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageName = searchParams.get("packageName"); // FREE, BASIC, PRO, PREMIUM

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/signin?callbackUrl=/pricing");
      return;
    }

    if (packageName?.toUpperCase() === "FREE") {
      router.replace("/shop/register");
      return;
    }
    router.replace("/pricing");
  }, [status, packageName, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">กำลังเปลี่ยนเส้นทาง...</p>
      </div>
    </div>
  );
}
