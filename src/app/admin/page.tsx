// app/admin/page.tsx

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminBreadcrumb from '@/components/admin/Breadcrumb';
import {
  Settings,
  Users,
  Store,
  Star,
  BarChart3,
  ImageIcon,
  Palette,
  FileText,
  TrendingUp,
  Shield,
  Gift
} from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  const adminMenuItems = [
    {
      title: 'การตั้งค่าเว็บไซต์',
      description: 'จัดการ Hero Banners, Logo, Favicon, SEO และการตั้งค่าต่างๆ',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-purple-500',
      iconColor: 'text-purple-500'
    },
    {
      title: 'จัดการผู้ใช้งาน',
      description: 'ดูและจัดการข้อมูลผู้ใช้ทั้งหมด',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
      iconColor: 'text-blue-500'
    },
    {
      title: 'จัดการร้านค้า',
      description: 'อนุมัติ แก้ไข และจัดการร้านค้า',
      icon: Store,
      href: '/admin/shops',
      color: 'bg-green-500',
      iconColor: 'text-green-500'
    },
    {
      title: 'จัดการ Creators',
      description: 'อนุมัติและจัดการ Content Creators',
      icon: Star,
      href: '/admin/creators',
      color: 'bg-yellow-500',
      iconColor: 'text-yellow-500'
    },
    {
      title: 'Dashboard & Analytics',
      description: 'ดูข้อมูลสถิติ รายงาน และการวิเคราะห์ต่างๆ',
      icon: BarChart3,
      href: '/admin/dashboard',
      color: 'bg-indigo-500',
      iconColor: 'text-indigo-500'
    },
    {
      title: 'จัดการหมวดหมู่',
      description: 'จัดการหมวดหมู่ร้านค้า',
      icon: Palette,
      href: '/admin/categories',
      color: 'bg-pink-500',
      iconColor: 'text-pink-500'
    },
    {
      title: 'Promotion Campaigns',
      description: 'สร้างและจัดการโปรโมชั่นส่วนลดต่างๆ',
      icon: Gift,
      href: '/admin/campaigns',
      color: 'bg-red-500',
      iconColor: 'text-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminBreadcrumb />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                ยินดีต้อนรับ, {session.user.name || 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="ผู้ใช้งานทั้งหมด"
            value="--"
            icon={Users}
            color="bg-blue-500"
          />
          <StatCard
            title="ร้านค้าทั้งหมด"
            value="--"
            icon={Store}
            color="bg-green-500"
          />
          <StatCard
            title="Creators"
            value="--"
            icon={Star}
            color="bg-yellow-500"
          />
          <StatCard
            title="Hero Banners"
            value="--"
            icon={ImageIcon}
            color="bg-purple-500"
          />
        </div>

        {/* Admin Menu Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">เมนูการจัดการ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminMenuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${item.color} rounded-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">กิจกรรมล่าสุด</h2>
          <div className="space-y-3">
            <ActivityItem
              icon={Store}
              text="มีร้านค้าใหม่รอการอนุมัติ"
              time="5 นาทีที่แล้ว"
              color="text-green-600"
            />
            <ActivityItem
              icon={Star}
              text="มี Creator ใหม่สมัครเข้าระบบ"
              time="1 ชั่วโมงที่แล้ว"
              color="text-yellow-600"
            />
            <ActivityItem
              icon={Users}
              text="ผู้ใช้งานใหม่ลงทะเบียน 15 คน"
              time="วันนี้"
              color="text-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// Activity Item Component
interface ActivityItemProps {
  icon: any;
  text: string;
  time: string;
  color: string;
}

function ActivityItem({ icon: Icon, text, time, color }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="flex-1">
        <p className="text-sm text-gray-900">{text}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}