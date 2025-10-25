// app/dashboard/page.tsx - User Dashboard
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Store, 
  Video, 
  User as UserIcon, 
  Heart, 
  Clock,
  ChevronRight,
  Plus
} from "lucide-react";

interface UserStats {
  favoriteShops: number;
  recentViews: number;
  reviews: number;
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    favoriteShops: 0,
    recentViews: 0,
    reviews: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Heart className="text-red-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">ร้านที่ชอบ</p>
                <p className="text-2xl font-bold text-gray-900">{stats.favoriteShops}</p>
              </div>
            </div>
          </div>

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

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserIcon className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-gray-600 text-sm">รีวิวของฉัน</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reviews}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">เริ่มต้นกับ Zablink</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Register as Shop Owner */}
            <div
              onClick={() => router.push("/shop/register")}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/20 transition cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                  <Store className="text-white" size={24} />
                </div>
                <ChevronRight className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ลงทะเบียนร้านค้า</h3>
              <p className="text-white/80 text-sm">
                เพิ่มร้านค้าของคุณเข้าสู่ระบบ Zablink และเริ่มเข้าถึงลูกค้ามากขึ้น
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Plus size={16} className="text-white" />
                <span className="text-white font-medium text-sm">สมัครเลย</span>
              </div>
            </div>

            {/* Register as Creator */}
            <div
              onClick={() => router.push("/creator/register")}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/20 transition cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                  <Video className="text-white" size={24} />
                </div>
                <ChevronRight className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">สมัครเป็นนักรีวิว</h3>
              <p className="text-white/80 text-sm">
                รับงานรีวิวร้านอาหารและสร้างรายได้จากการทำคอนเทนต์
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Plus size={16} className="text-white" />
                <span className="text-white font-medium text-sm">เริ่มเลย</span>
              </div>
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