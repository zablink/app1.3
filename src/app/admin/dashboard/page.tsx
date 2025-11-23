'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Users,
  Star,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Heart,
  MessageSquare,
  Zap
} from 'lucide-react';

interface DashboardStats {
  shops: {
    total: number;
    pending: number;
    approved: number;
    rejected?: number;
  };
  creators: {
    total: number;
    pending: number;
    approved: number;
  };
  campaigns: {
    total: number;
    active: number;
  };
  users: {
    total: number;
  };
  subscriptions: {
    active: number;
    expired?: number;
    revenue?: number;
  };
  reviews?: {
    total: number;
    avgRating: number;
  };
  recentActivities?: Array<{
    type: string;
    message: string;
    time: string;
  }>;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'users' | 'revenue'>('overview');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/');
    } else {
      fetchStats();
    }
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard & Analytics</h1>
              <p className="text-sm text-gray-600 mt-1">
                ภาพรวมและสถิติการใช้งานของระบบ
              </p>
            </div>
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Activity className="w-4 h-4" />
              รีเฟรชข้อมูล
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-1">
          <div className="flex gap-2">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={BarChart3}
            >
              ภาพรวม
            </TabButton>
            <TabButton
              active={activeTab === 'shops'}
              onClick={() => setActiveTab('shops')}
              icon={Store}
            >
              ร้านค้า
            </TabButton>
            <TabButton
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
              icon={Users}
            >
              ผู้ใช้งาน
            </TabButton>
            <TabButton
              active={activeTab === 'revenue'}
              onClick={() => setActiveTab('revenue')}
              icon={DollarSign}
            >
              รายได้
            </TabButton>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="ร้านค้าทั้งหมด"
                value={stats?.shops.total || 0}
                change="+12%"
                trend="up"
                icon={Store}
                color="bg-blue-500"
              />
              <MetricCard
                title="ผู้ใช้งานทั้งหมด"
                value={stats?.users.total || 0}
                change="+8%"
                trend="up"
                icon={Users}
                color="bg-green-500"
              />
              <MetricCard
                title="Creators"
                value={stats?.creators.total || 0}
                change="+5%"
                trend="up"
                icon={Star}
                color="bg-yellow-500"
              />
              <MetricCard
                title="Subscription ที่ใช้งาน"
                value={stats?.subscriptions.active || 0}
                change="+15%"
                trend="up"
                icon={Zap}
                color="bg-purple-500"
              />
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Shop Status */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  สถานะร้านค้า
                </h3>
                <div className="space-y-3">
                  <StatusRow
                    label="อนุมัติแล้ว"
                    value={stats?.shops.approved || 0}
                    total={stats?.shops.total || 0}
                    color="bg-green-500"
                    icon={CheckCircle}
                    iconColor="text-green-600"
                  />
                  <StatusRow
                    label="รออนุมัติ"
                    value={stats?.shops.pending || 0}
                    total={stats?.shops.total || 0}
                    color="bg-yellow-500"
                    icon={Clock}
                    iconColor="text-yellow-600"
                  />
                  <StatusRow
                    label="ปฏิเสธ"
                    value={stats?.shops.rejected || 0}
                    total={stats?.shops.total || 0}
                    color="bg-red-500"
                    icon={XCircle}
                    iconColor="text-red-600"
                  />
                </div>
              </div>

              {/* Creator Status */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  สถานะ Creators
                </h3>
                <div className="space-y-3">
                  <StatusRow
                    label="อนุมัติแล้ว"
                    value={stats?.creators.approved || 0}
                    total={stats?.creators.total || 0}
                    color="bg-green-500"
                    icon={CheckCircle}
                    iconColor="text-green-600"
                  />
                  <StatusRow
                    label="รออนุมัติ"
                    value={stats?.creators.pending || 0}
                    total={stats?.creators.total || 0}
                    color="bg-yellow-500"
                    icon={Clock}
                    iconColor="text-yellow-600"
                  />
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ActivityCard
                title="แคมเปญทั้งหมด"
                value={stats?.campaigns.total || 0}
                subtitle={`${stats?.campaigns.active || 0} แคมเปญที่ Active`}
                icon={ShoppingBag}
                color="bg-indigo-500"
              />
              <ActivityCard
                title="รีวิวทั้งหมด"
                value={stats?.reviews?.total || 0}
                subtitle={`เรตติ้งเฉลี่ย ${stats?.reviews?.avgRating?.toFixed(1) || 0} ดาว`}
                icon={MessageSquare}
                color="bg-pink-500"
              />
              <ActivityCard
                title="Subscription Active"
                value={stats?.subscriptions.active || 0}
                subtitle="กำลังใช้งาน"
                icon={Zap}
                color="bg-purple-500"
              />
            </div>
          </div>
        )}

        {/* Shops Tab */}
        {activeTab === 'shops' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="ร้านค้าทั้งหมด"
                value={stats?.shops.total || 0}
                icon={Store}
                color="bg-blue-500"
                description="จำนวนร้านค้าทั้งหมดในระบบ"
              />
              <StatsCard
                title="รออนุมัติ"
                value={stats?.shops.pending || 0}
                icon={Clock}
                color="bg-yellow-500"
                description="ร้านค้าที่รอการอนุมัติ"
              />
              <StatsCard
                title="อนุมัติแล้ว"
                value={stats?.shops.approved || 0}
                icon={CheckCircle}
                color="bg-green-500"
                description="ร้านค้าที่อนุมัติแล้ว"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                สถิติร้านค้าตามสถานะ
              </h3>
              <div className="space-y-4">
                <ProgressBar
                  label="อนุมัติแล้ว"
                  value={stats?.shops.approved || 0}
                  total={stats?.shops.total || 0}
                  color="bg-green-500"
                />
                <ProgressBar
                  label="รออนุมัติ"
                  value={stats?.shops.pending || 0}
                  total={stats?.shops.total || 0}
                  color="bg-yellow-500"
                />
                <ProgressBar
                  label="ปฏิเสธ"
                  value={stats?.shops.rejected || 0}
                  total={stats?.shops.total || 0}
                  color="bg-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="ผู้ใช้งานทั้งหมด"
                value={stats?.users.total || 0}
                icon={Users}
                color="bg-blue-500"
                description="จำนวนผู้ใช้งานทั้งหมด"
              />
              <StatsCard
                title="Creators"
                value={stats?.creators.total || 0}
                icon={Star}
                color="bg-yellow-500"
                description="Content Creators ทั้งหมด"
              />
              <StatsCard
                title="เจ้าของร้านค้า"
                value={stats?.shops.total || 0}
                icon={Store}
                color="bg-green-500"
                description="ผู้ใช้ที่เป็นเจ้าของร้านค้า"
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                การเติบโตของผู้ใช้งาน
              </h3>
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>กราฟการเติบโตจะแสดงที่นี่</p>
                <p className="text-sm">ข้อมูลจะพร้อมใช้งานในเร็วๆ นี้</p>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="Subscription Active"
                value={stats?.subscriptions.active || 0}
                icon={Zap}
                color="bg-purple-500"
                description="แพ็กเกจที่ใช้งานอยู่"
              />
              <StatsCard
                title="Subscription หมดอายุ"
                value={stats?.subscriptions.expired || 0}
                icon={AlertCircle}
                color="bg-red-500"
                description="แพ็กเกจที่หมดอายุแล้ว"
              />
              <StatsCard
                title="รายได้โดยประมาณ"
                value={`฿${(stats?.subscriptions.revenue || 0).toLocaleString()}`}
                icon={DollarSign}
                color="bg-green-500"
                description="รายได้จาก Subscription"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  รายได้รายเดือน
                </h3>
                <div className="text-center py-12 text-gray-500">
                  <PieChart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>กราฟรายได้จะแสดงที่นี่</p>
                  <p className="text-sm">ข้อมูลจะพร้อมใช้งานในเร็วๆ นี้</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Subscription ตาม Package
                </h3>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>กราฟการกระจายตัวจะแสดงที่นี่</p>
                  <p className="text-sm">ข้อมูลจะพร้อมใช้งานในเร็วๆ นี้</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tab Button Component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
}

function TabButton({ active, onClick, icon: Icon, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
        active
          ? 'bg-orange-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: string;
}

function MetricCard({ title, value, change, trend, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${color} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}

// Status Row Component
interface StatusRowProps {
  label: string;
  value: number;
  total: number;
  color: string;
  icon: any;
  iconColor: string;
}

function StatusRow({ label, value, total, color, icon: Icon, iconColor }: StatusRowProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Activity Card Component
interface ActivityCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: any;
  color: string;
}

function ActivityCard({ title, value, subtitle, icon: Icon, color }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-4">
        <div className={`p-4 ${color} rounded-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  description: string;
}

function StatsCard({ title, value, icon: Icon, color, description }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 ${color} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
}

// Progress Bar Component
interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

function ProgressBar({ label, value, total, color }: ProgressBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {value} / {total} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
