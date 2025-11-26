// app/shop/select/page.tsx - Shop Selection Page
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Store, ChevronRight, Plus } from "lucide-react";
import Image from "next/image";

interface Shop {
  id: string;
  name: string;
  image: string | null;
  status: string | null;
  createdAt: string;
  categories: {
    category: {
      name: string;
    };
  }[];
}

export default function ShopSelectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    if (status === "authenticated") {
      fetchShops();
    }
  }, [status, router]);

  const fetchShops = async () => {
    try {
      const res = await fetch("/api/user/shops");
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops);
        
        // If only one shop, redirect directly to edit page
        if (data.shops.length === 1) {
          router.push(`/shop/edit/${data.shops[0].id}`);
        }
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
    } finally {
      setLoading(false);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">เลือกร้านค้าที่ต้องการจัดการ</h1>
          <p className="text-gray-600">คุณมี {shops.length} ร้านค้า</p>
        </div>

        {/* Shop List */}
        <div className="space-y-4">
          {shops.map((shop) => (
            <div
              key={shop.id}
              onClick={() => router.push(`/shop/edit/${shop.id}`)}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  {/* Shop Image */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {shop.image ? (
                      <Image
                        src={shop.image}
                        alt={shop.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Shop Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                      {shop.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      {shop.categories.length > 0 && (
                        <span className="truncate">
                          {shop.categories.map((c) => c.category.name).join(", ")}
                        </span>
                      )}
                      <span className="text-gray-400">•</span>
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          shop.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : shop.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {shop.status === "APPROVED"
                          ? "อนุมัติแล้ว"
                          : shop.status === "PENDING"
                          ? "รออนุมัติ"
                          : shop.status || "รอตรวจสอบ"}
                      </span>
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition flex-shrink-0" />
                </div>
              </div>
            </div>
          ))}

          {/* Add New Shop Button */}
          <div
            onClick={() => router.push("/shop/register")}
            className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-blue-500 hover:shadow-md transition cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition">
                  <Plus className="w-10 h-10 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">เพิ่มร้านค้าใหม่</h3>
                  <p className="text-sm text-gray-600">ลงทะเบียนร้านค้าเพิ่มเติม</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
