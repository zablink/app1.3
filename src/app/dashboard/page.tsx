// app/dashboard/page.tsx - User Dashboard
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Store, 
  Video, 
  User as UserIcon, 
  Clock,
  ChevronRight,
  Plus
} from "lucide-react";

interface UserStats {
  recentViews: number;
}

interface Shop {
  id: string;
  name: string;
  image: string | null;
  status: string | null;
  categories: {
    category: {
      name: string;
    };
  }[];
}

interface Creator {
  id: string;
  displayName: string;
  applicationStatus: string;
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    recentViews: 0,
  });
  const [shops, setShops] = useState<Shop[]>([]);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated") {
      fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      // Fetch user's shops
      const shopsRes = await fetch("/api/user/shops");
      if (shopsRes.ok) {
        const shopsData = await shopsRes.json();
        setShops(shopsData.shops || []);
      }

      // Fetch creator profile if user is a creator
      if (session?.user?.role === "CREATOR") {
        const creatorRes = await fetch("/api/creator/profile");
        if (creatorRes.ok) {
          const creatorData = await creatorRes.json();
          setCreator(creatorData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const hasShops = shops.length > 0;
  const isCreator = creator !== null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="text-blue-600" size={32} />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  สวัสดี, {session?.user?.name || "ผู้ใช้"}
                </h1>
                <p className="text-gray-600">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/profile")}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              แก้ไขโปรไฟล์
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">ดูล่าสุด</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentViews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">
            {hasShops || isCreator ? "จัดการบัญชีของคุณ" : "เริ่มต้นกับ Zablink"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shop Management */}
            <div
              onClick={() => {
                if (hasShops) {
                  router.push("/dashboard/shop");
                } else {
                  router.push("/shop/register");
                }
              }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/20 transition cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                  <Store className="text-white" size={24} />
                </div>
                <ChevronRight className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {hasShops ? "จัดการร้านค้า" : "เพิ่มร้านค้า"}
              </h3>
              <p className="text-white/80 text-sm mb-4">
                {hasShops
                  ? "แก้ไขข้อมูลร้านค้าของคุณ และเพิ่มร้านใหม่ได้ตลอดเวลา"
                  : "เพิ่มร้านค้าของคุณเข้าสู่ระบบ Zablink และเริ่มเข้าถึงลูกค้ามากขึ้น"}
              </p>
              {hasShops && (
                <div className="space-y-2">
                  <div className="text-white/90 text-sm font-medium">
                    ร้านค้าของคุณ ({shops.length} ร้าน):
                  </div>
                  {shops.slice(0, 2).map((shop) => (
                    <div
                      key={shop.id}
                      className="flex items-center gap-2 text-white/80 text-sm bg-white/10 rounded px-3 py-2"
                    >
                      <Store size={14} />
                      <span className="truncate">{shop.name}</span>
                      <span
                        className={`ml-auto px-2 py-0.5 rounded text-xs ${
                          shop.status === "APPROVED"
                            ? "bg-green-500/30 text-green-100"
                            : "bg-yellow-500/30 text-yellow-100"
                        }`}
                      >
                        {shop.status === "APPROVED" ? "✓" : "⏳"}
                      </span>
                    </div>
                  ))}
                  {shops.length > 2 && (
                    <div className="text-white/60 text-xs pl-3">
                      และอีก {shops.length - 2} ร้าน...
                    </div>
                  )}
                </div>
              )}
              {!hasShops && (
                <div className="mt-4 flex items-center gap-2">
                  <Plus size={16} className="text-white" />
                  <span className="text-white font-medium text-sm">เริ่มเลย</span>
                </div>
              )}
            </div>

            {/* Creator Management */}
            <div
              onClick={() => {
                if (isCreator) {
                  router.push("/dashboard/creator");
                } else {
                  router.push("/creator/register");
                }
              }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/20 transition cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                  <Video className="text-white" size={24} />
                </div>
                <ChevronRight className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {isCreator ? "จัดการบัญชีนักรีวิว" : "สมัครเป็นนักรีวิว"}
              </h3>
              <p className="text-white/80 text-sm mb-4">
                {isCreator
                  ? "ดูสถานะ งานรีวิว และรายได้ของคุณ"
                  : "รับงานรีวิวร้านอาหารและสร้างรายได้จากการทำคอนเทนต์"}
              </p>
              {isCreator && (
                <div className="space-y-2">
                  <div className="text-white/90 text-sm font-medium">สถานะ:</div>
                  <div className="flex items-center gap-2 text-white/80 text-sm bg-white/10 rounded px-3 py-2">
                    <UserIcon size={14} />
                    <span className="truncate">{creator.displayName}</span>
                    <span
                      className={`ml-auto px-2 py-0.5 rounded text-xs ${
                        creator.applicationStatus === "APPROVED"
                          ? "bg-green-500/30 text-green-100"
                          : creator.applicationStatus === "PENDING"
                          ? "bg-yellow-500/30 text-yellow-100"
                          : "bg-red-500/30 text-red-100"
                      }`}
                    >
                      {creator.applicationStatus === "APPROVED"
                        ? "อนุมัติแล้ว"
                        : creator.applicationStatus === "PENDING"
                        ? "รออนุมัติ"
                        : "ปฏิเสธ"}
                    </span>
                  </div>
                </div>
              )}
              {!isCreator && (
                <div className="mt-4 flex items-center gap-2">
                  <Plus size={16} className="text-white" />
                  <span className="text-white font-medium text-sm">เริ่มเลย</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">กิจกรรมล่าสุด</h2>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-600">ยังไม่มีกิจกรรม</p>
            <p className="text-gray-400 text-sm mt-2">
              เริ่มต้นใช้งานโดยการเข้าชมร้านค้าหรือรีวิว
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}