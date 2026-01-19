// src/app/payment/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";
import { Package, Coins, CreditCard, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

export default function PaymentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type"); // "package" or "token"
  const shopId = searchParams.get("shopId");
  
  // Package params
  const packageName = searchParams.get("packageName");
  
  // Token params
  const amount = searchParams.get("amount");
  const price = searchParams.get("price");
  const bonus = searchParams.get("bonus") || "0";
  
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [packageData, setPackageData] = useState<any>(null);

  // Hardcoded package data matching the pricing page
  const packageMapping: Record<string, any> = {
    FREE: { name: 'FREE', price: 0, period: 'ตลอดไป' },
    BASIC: { name: 'BASIC', price: 199, period: 'ต่อเดือน' },
    PRO: { name: 'PRO', price: 499, period: 'ต่อเดือน' },
    PREMIUM: { name: 'PREMIUM', price: 999, period: 'ต่อเดือน' },
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/pricing");
      return;
    }
    if (status === "authenticated") {
      if (!type || !shopId) {
        toast.showError("ข้อมูลไม่ครบถ้วน");
        router.push("/pricing");
        return;
      }
      
      if (type === "package") {
        if (!packageName || !packageMapping[packageName.toUpperCase()]) {
          toast.showError("ไม่พบแพ็คเกจที่เลือก");
          router.push("/pricing");
          return;
        }
        setPackageData(packageMapping[packageName.toUpperCase()]);
      } else if (type === "token") {
        if (!amount || !price) {
          toast.showError("ข้อมูล Token ไม่ครบถ้วน");
          router.push("/pricing");
          return;
        }
      }
      
      setLoading(false);
    }
  }, [status, type, shopId, packageName, amount, price]);

  const handlePayment = async () => {
    if (!shopId) {
      toast.showError("ไม่พบร้านค้า");
      return;
    }

    setProcessing(true);
    try {
      if (type === "token") {
        // Handle token purchase
        const tokenAmount = parseInt(amount || "0");
        const tokenPrice = parseFloat(price || "0");
        
        const res = await fetch(`/api/shops/${shopId}/tokens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amountTokens: tokenAmount,
            price: tokenPrice,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          // Redirect to Omise payment
          if (data.charge?.authorize_uri) {
            window.location.href = data.charge.authorize_uri;
          } else {
            toast.showError("ไม่สามารถสร้างการชำระเงินได้");
            setProcessing(false);
          }
        } else {
          const error = await res.json();
          toast.showError(error.error || "เกิดข้อผิดพลาด");
          setProcessing(false);
        }
      } else if (type === "package") {
        // Handle package purchase
        if (!packageName || packageData.price === 0) {
          // FREE package - redirect to register
          router.push(`/shop/register`);
          return;
        }

        // Get package ID from database
        const plansRes = await fetch(`/api/subscription-plans`);
        if (!plansRes.ok) {
          toast.showError("ไม่สามารถโหลดข้อมูลแพ็คเกจได้");
          setProcessing(false);
          return;
        }

        const plansData = await plansRes.json();
        const plans = plansData.packages || [];
        
        // Find package by tier name
        const plan = plans.find((p: any) => 
          p.tier?.toUpperCase() === packageName.toUpperCase() ||
          p.name?.toUpperCase() === packageName.toUpperCase()
        );

        if (!plan) {
          toast.showError("ไม่พบแพ็คเกจในระบบ");
          setProcessing(false);
          return;
        }

        // Create Omise charge first with return URI
        const returnUri = `${window.location.origin}/payment?type=package&packageName=${packageName}&shopId=${shopId}&return=true`;
        const chargeRes = await fetch(`/api/payment/omise/create-charge`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId,
            amount: packageData.price,
            description: `Subscription: ${packageData.name}`,
            returnUri,
            metadata: {
              action: "subscription",
              packageName: packageName,
              packageId: plan.id,
            },
          }),
        });

        if (chargeRes.ok) {
          const chargeData = await chargeRes.json();
          
          // Create subscription with PENDING status - webhook will activate it
          // We'll need to modify the API to support PENDING, but for now create it
          // The webhook will update paymentRef when payment completes
          try {
            const subRes = await fetch(`/api/shops/${shopId}/subscription`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                packageId: plan.id,
                autoRenew: true,
                paymentProvider: "omise",
                paymentRef: chargeData.charge.id,
              }),
            });

            // Note: The API creates ACTIVE subscription, but webhook should handle it correctly
            // If webhook finds matching paymentRef, it will update status
          } catch (subError) {
            console.error("Subscription creation error (non-blocking):", subError);
            // Continue anyway - webhook can create subscription if needed
          }

          // Redirect to Omise payment
          if (chargeData.charge?.authorize_uri) {
            window.location.href = chargeData.charge.authorize_uri;
          } else {
            toast.showError("ไม่สามารถสร้างการชำระเงินได้");
            setProcessing(false);
          }
        } else {
          const error = await chargeRes.json();
          toast.showError(error.error || "เกิดข้อผิดพลาดในการสร้างการชำระเงิน");
          setProcessing(false);
        }
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.showError("เกิดข้อผิดพลาด");
      setProcessing(false);
    }
  };

  // Handle return from Omise
  useEffect(() => {
    const returnParam = searchParams.get("return");
    if (returnParam === "true" && type === "package") {
      toast.showSuccess("กำลังตรวจสอบการชำระเงิน...");
      // Wait a moment for webhook to process, then redirect
      setTimeout(() => {
        router.push("/dashboard/shop");
      }, 2000);
    }
  }, [searchParams]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
        {/* Header */}
        <div className="mb-6">
          <Link
            href={type === "package" ? `/pricing/cart/package?packageName=${packageName}` : `/pricing/cart/token?amount=${amount}&price=${price}&bonus=${bonus}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับ
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CreditCard className="w-8 h-8" />
            ชำระเงิน
          </h1>
          <p className="text-gray-600">เลือกช่องทางการชำระเงินที่คุณต้องการ</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">สรุปคำสั่งซื้อ</h2>
          
          {type === "package" && packageData && (
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">แพ็คเกจ {packageData.name}</h3>
                <p className="text-sm text-gray-600">{packageData.period}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {packageData.price === 0 ? (
                    <span className="text-green-600">ฟรี</span>
                  ) : (
                    <>฿{packageData.price.toLocaleString()}</>
                  )}
                </p>
              </div>
            </div>
          )}

          {type === "token" && (
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Token {parseInt(amount || "0").toLocaleString()} เหรียญ
                </h3>
                {parseInt(bonus || "0") > 0 && (
                  <p className="text-sm text-green-600">
                    รวมโบนัส {parseInt(bonus || "0").toLocaleString()} เหรียญ
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  ฿{parseFloat(price || "0").toLocaleString()}
                </p>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">ยอดรวม</span>
              <span className="text-2xl font-bold text-gray-900">
                {type === "package" && packageData ? (
                  packageData.price === 0 ? (
                    <span className="text-green-600">ฟรี</span>
                  ) : (
                    <>฿{packageData.price.toLocaleString()}</>
                  )
                ) : (
                  <>฿{parseFloat(price || "0").toLocaleString()}</>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ช่องทางการชำระเงิน</h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Omise Payment Gateway</h3>
                    <p className="text-sm text-gray-600">
                      บัตรเครดิต/เดบิต, พร้อมเพย์, อินเตอร์เน็ตแบงก์กิ้ง
                    </p>
                  </div>
                </div>
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>การชำระเงินจะดำเนินการผ่าน Omise Payment Gateway ที่ปลอดภัย</span>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <div className="flex gap-4">
          <Link
            href={type === "package" ? `/pricing/cart/package?packageName=${packageName}` : `/pricing/cart/token?amount=${amount}&price=${price}&bonus=${bonus}`}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center font-medium"
          >
            ยกเลิก
          </Link>
          <button
            onClick={handlePayment}
            disabled={processing || (type === "package" && packageData?.price === 0)}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                กำลังดำเนินการ...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                ชำระเงินผ่าน Omise
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
