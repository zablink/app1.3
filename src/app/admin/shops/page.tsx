'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminBreadcrumb from '@/components/admin/Breadcrumb';
import {
  Store,
  User,
  Package,
  Coins,
  Search,
  Filter,
  Edit,
  ChevronLeft,
  ChevronRight,
  X,
  Tag,
  TestTube,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  description?: string;
  status: string;
  isMockup?: boolean;
  owner?: {
    id: string;
    name?: string;
    email?: string;
  };
  categories?: Array<{
    id: string;
    name: string;
    slug?: string;
    icon?: string;
  }>;
  subscription?: {
    id: string;
    packageId: string;
    status: string;
    startDate?: string;
    endDate?: string;
    package?: {
      name: string;
      tier?: string;
    };
  };
  subscriptions?: any[];
  tokenWallet?: {
    balance: number;
  };
  createdAt: string;
}

interface SubscriptionPackage {
  id: string;
  name: string;
  price: number;
  periodDays: number;
  tokenAmount?: number;
  tier?: string;
}

interface UserOption {
  id: string;
  name?: string;
  email?: string;
}

// Package tier colors matching home page
const tierStyles = {
  PREMIUM: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-l-4 border-amber-400',
    badge: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
  },
  PRO: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    border: 'border-l-4 border-purple-400',
    badge: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
  },
  BASIC: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    border: 'border-l-4 border-blue-400',
    badge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
  },
  FREE: {
    bg: 'bg-gray-50',
    border: 'border-l-4 border-gray-300',
    badge: 'bg-gray-500 text-white',
  }
};

// Helper function to get tier from subscription
const getShopTier = (shop: Shop): keyof typeof tierStyles => {
  const tier = shop.subscription?.package?.tier;
  if (tier && tier in tierStyles) {
    return tier as keyof typeof tierStyles;
  }
  return 'FREE';
};

export default function AdminShopsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [allCategories, setAllCategories] = useState<Array<{ id: string; name: string; icon?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [tokenAmount, setTokenAmount] = useState('0');
  const [subscriptionDays, setSubscriptionDays] = useState('30');
  const [isAssigning, setIsAssigning] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Bulk selection states
  const [selectedShopIds, setSelectedShopIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'categories' | 'package' | 'status' | null>(null);
  const [bulkStatus, setBulkStatus] = useState('APPROVED');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShopIds(filteredShops.map(s => s.id));
    } else {
      setSelectedShopIds([]);
    }
  };

  const handleSelectShop = (shopId: string, checked: boolean) => {
    if (checked) {
      setSelectedShopIds([...selectedShopIds, shopId]);
    } else {
      setSelectedShopIds(selectedShopIds.filter(id => id !== shopId));
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      loadShops();
    }
  }, [session, page, statusFilter]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      loadPackages();
      loadUsers();
      loadCategories();
    }
  }, [session]);

  const loadShops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }

      console.log('Fetching shops with params:', params.toString());
      const res = await fetch(`/api/admin/shops?${params}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      console.log('Response status:', res.status);
      
      const data = await res.json();
      console.log('Response data:', data);
      
      if (data.shops) {
        console.log('Shops loaded:', data.shops.length);
        setShops(data.shops);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.log('No shops in response');
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      const res = await fetch('/api/subscription-plans', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.packages) {
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Error loading packages:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users?limit=1000', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const data = await res.json();
      if (data.categories) {
        setAllCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAssignOwner = async () => {
    if (!selectedShop || !selectedUserId) return;

    try {
      const res = await fetch(`/api/admin/shops/${selectedShop.id}/assign-owner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: selectedUserId }),
      });

      if (res.ok) {
        showToast('เปลี่ยนเจ้าของร้านสำเร็จ!', 'success');
        setShowAssignModal(false);
        
        // Update shop in state instead of reloading
        const newOwner = users.find(u => u.id === selectedUserId);
        setShops(prevShops => 
          prevShops.map((shop): Shop => 
            shop.id === selectedShop.id 
              ? { 
                  ...shop, 
                  owner: newOwner ? { id: newOwner.id, name: newOwner.name, email: newOwner.email } : undefined
                }
              : shop
          )
        );
      } else {
        const data = await res.json();
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error assigning owner:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleAssignPackage = async () => {
    if (!selectedShop || !selectedPackageId) return;

    setIsAssigning(true);
    const tokens = parseInt(tokenAmount) || 0;
    
    try {
      console.log('Sending assign package request...');
      const res = await fetch(`/api/admin/shops/${selectedShop.id}/assign-package`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedPackageId,
          tokenAmount: tokens,
          subscriptionDays: parseInt(subscriptionDays) || 30,
        }),
      });

      const data = await res.json();
      console.log('Assign package response:', data);

      if (res.ok) {
        showToast(data.message || 'มอบหมาย Package และ Token สำเร็จ!', 'success');
        setShowPackageModal(false);
        
        // Update shop in state with new subscription and token data from API response
        const selectedPackage = packages.find(p => p.id === selectedPackageId);
        setShops(prevShops => 
          prevShops.map(shop => {
            if (shop.id === selectedShop.id) {
              return {
                ...shop,
                subscription: data.subscription ? {
                  id: data.subscription.id,
                  packageId: selectedPackageId,
                  status: 'ACTIVE',
                  startDate: new Date().toISOString(),
                  endDate: data.subscription.expiresAt,
                  package: { 
                    name: selectedPackage?.name || 'Unknown',
                    tier: selectedPackage?.tier
                  },
                } : shop.subscription,
                tokenWallet: data.tokenWallet || shop.tokenWallet
              };
            }
            return shop;
          })
        );
        
        // Reset form
        setSelectedPackageId('');
        setTokenAmount('0');
        setSubscriptionDays('30');
      } else {
        console.error('Assign package error:', data);
        showToast(`เกิดข้อผิดพลาด: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error assigning package:', error);
      showToast('เกิดข้อผิดพลาด: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUpdateCategories = async () => {
    if (!selectedShop) return;

    try {
      const res = await fetch(`/api/admin/shops/${selectedShop.id}/categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: selectedCategoryIds }),
      });

      const data = await res.json();

      if (data.success) {
        showToast('อัปเดตหมวดหมู่สำเร็จ!', 'success');
        setShowCategoriesModal(false);
        
        // Update shop categories in state
        setShops(prevShops =>
          prevShops.map(shop =>
            shop.id === selectedShop.id
              ? { ...shop, categories: data.categories }
              : shop
          )
        );
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error updating categories:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleApproveShop = async (shopId: string) => {
    try {
      const res = await fetch(`/api/admin/shops/${shopId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok) {
        showToast('อนุมัติร้านค้าสำเร็จ!', 'success');
        
        // Update shop status in state
        setShops(prevShops =>
          prevShops.map(s =>
            s.id === shopId
              ? { ...s, status: 'APPROVED' }
              : s
          )
        );
      } else {
        showToast('เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error approving shop:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleDeclineShop = async (shopId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธร้านค้านี้?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/shops/${shopId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Declined by admin' }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast('ปฏิเสธร้านค้าสำเร็จ', 'success');
        
        // Update shop status in state
        setShops(prevShops =>
          prevShops.map(s =>
            s.id === shopId
              ? { ...s, status: 'REJECTED' }
              : s
          )
        );
      } else {
        showToast('เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error declining shop:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  const handleToggleMockup = async (shop: Shop) => {
    const newMockupStatus = !shop.isMockup;
    
    try {
      const res = await fetch(`/api/admin/shops/${shop.id}/mockup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMockup: newMockupStatus }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        
        // Update shop mockup status in state
        setShops(prevShops =>
          prevShops.map(s =>
            s.id === shop.id
              ? { ...s, isMockup: newMockupStatus }
              : s
          )
        );
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error toggling mockup:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  // Bulk action handlers
  const handleBulkUpdateCategories = async () => {
    if (selectedShopIds.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const res = await fetch('/api/admin/shops/bulk-update-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shopIds: selectedShopIds,
          categoryIds: selectedCategoryIds 
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        setBulkAction(null);
        setSelectedShopIds([]);
        setSelectedCategoryIds([]);
        await loadShops();
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error bulk updating categories:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkAssignPackage = async () => {
    if (selectedShopIds.length === 0 || !selectedPackageId) return;

    setIsBulkProcessing(true);
    try {
      const res = await fetch('/api/admin/shops/bulk-assign-package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shopIds: selectedShopIds,
          packageId: selectedPackageId,
          tokenAmount: parseInt(tokenAmount) || 0,
          subscriptionDays: parseInt(subscriptionDays) || 30,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        setBulkAction(null);
        setSelectedShopIds([]);
        setSelectedPackageId('');
        setTokenAmount('0');
        setSubscriptionDays('30');
        await loadShops();
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error bulk assigning package:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkChangeStatus = async (newStatus: string) => {
    if (selectedShopIds.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const res = await fetch('/api/admin/shops/bulk-update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shopIds: selectedShopIds,
          status: newStatus 
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        setSelectedShopIds([]);
        await loadShops();
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error bulk changing status:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkToggleMockup = async (isMockup: boolean) => {
    if (selectedShopIds.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const res = await fetch('/api/admin/shops/bulk-toggle-mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shopIds: selectedShopIds,
          isMockup 
        }),
      });

      const data = await res.json();

      if (data.success) {
        showToast(data.message, 'success');
        setSelectedShopIds([]);
        await loadShops();
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error bulk toggling mockup:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminBreadcrumb />
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
              aria-label="ปิด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-lg">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">จัดการร้านค้า</h1>
                <p className="text-sm text-gray-600">
                  กำหนดเจ้าของร้าน และมอบหมาย Package
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← กลับหน้าแรก
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาร้านค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="ALL">ทุกสถานะ</option>
                <option value="PENDING">รออนุมัติ</option>
                <option value="APPROVED">อนุมัติแล้ว</option>
                <option value="REJECTED">ปฏิเสธ</option>
                <option value="SUSPENDED">ระงับ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shops Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedShopIds.length === filteredShops.length && filteredShops.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ร้านค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เจ้าของ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หมวดหมู่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      ไม่พบร้านค้า
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop) => {
                    const tier = getShopTier(shop);
                    const styles = tierStyles[tier];
                    
                    return (
                      <tr key={shop.id} className={`hover:bg-gray-100 transition-colors ${styles.bg} ${styles.border}`}>
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedShopIds.includes(shop.id)}
                          onChange={(e) => handleSelectShop(shop.id, e.target.checked)}
                          className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Store className="w-6 h-6 text-gray-500" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900">
                                {shop.name}
                              </div>
                              {shop.isMockup && (
                                <span className="px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full flex items-center gap-1">
                                  <TestTube className="w-3 h-3" />
                                  DEMO
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {shop.description?.substring(0, 40)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {shop.owner ? (
                          <div className="text-sm">
                            <div className="text-gray-900">{shop.owner.name || 'ไม่มีชื่อ'}</div>
                            <div className="text-gray-500">{shop.owner.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-red-500">ยังไม่มีเจ้าของ</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shop.categories && shop.categories.length > 0 
                          ? shop.categories.map(c => c.name).join(', ')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {shop.subscription?.package?.name ? (
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${styles.badge}`}>
                            {shop.subscription.package.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm">
                          <Coins className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">
                            {shop.tokenWallet?.balance || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            shop.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : shop.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : shop.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {shop.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {/* Approve/Decline buttons - show only for PENDING status */}
                          {shop.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApproveShop(shop.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                title="อนุมัติร้านค้า"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeclineShop(shop.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="ปฏิเสธร้านค้า"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setSelectedShop(shop);
                              setSelectedUserId(shop.owner?.id || '');
                              setShowAssignModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="กำหนดเจ้าของ"
                          >
                            <User className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedShop(shop);
                              setSelectedCategoryIds(shop.categories?.map(c => c.id) || []);
                              setShowCategoriesModal(true);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="จัดการหมวดหมู่"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedShop(shop);
                              // Pre-fill with current subscription data if exists
                              if (shop.subscription) {
                                setSelectedPackageId(shop.subscription.packageId || '');
                                const pkg = packages.find(p => p.id === shop.subscription?.packageId);
                                setTokenAmount(pkg?.tokenAmount?.toString() || '0');
                                setSubscriptionDays(pkg?.periodDays?.toString() || '30');
                              } else {
                                setSelectedPackageId('');
                                setTokenAmount('0');
                                setSubscriptionDays('30');
                              }
                              setShowPackageModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="มอบหมาย Package"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleMockup(shop)}
                            className={`p-2 rounded-lg ${
                              shop.isMockup 
                                ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={shop.isMockup ? 'ยกเลิกเครื่องหมายร้านตัวอย่าง' : 'ทำเครื่องหมายเป็นร้านตัวอย่าง'}
                          >
                            <TestTube className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                หน้า {page} จาก {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assign Owner Modal */}
      {showAssignModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                กำหนดเจ้าของร้าน
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ร้านค้า
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{selectedShop.name}</div>
                  {selectedShop.owner && (
                    <div className="text-sm text-gray-600 mt-1">
                      เจ้าของปัจจุบัน: {selectedShop.owner.name || selectedShop.owner.email}
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกเจ้าของใหม่
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- เลือกผู้ใช้ --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email || user.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAssignOwner}
                  disabled={!selectedUserId}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Package Modal */}
      {showPackageModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                มอบหมาย Package และ Token
              </h3>
              <button
                onClick={() => setShowPackageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ร้านค้า
                </label>
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="font-medium">{selectedShop.name}</div>
                  <div className="text-sm text-gray-600">
                    Token ปัจจุบัน: <span className="font-semibold text-yellow-600">{selectedShop.tokenWallet?.balance || 0}</span>
                  </div>
                  {selectedShop.subscription && (
                    <div className="text-sm text-gray-600">
                      Package ปัจจุบัน: <span className="font-semibold text-green-600">{selectedShop.subscription.package?.name || 'N/A'}</span>
                    </div>
                  )}
                  {selectedShop.subscription?.endDate && (
                    <div className="text-sm text-gray-600">
                      หมดอายุ: <span className="font-semibold">{new Date(selectedShop.subscription.endDate).toLocaleDateString('th-TH')}</span>
                    </div>
                  )}
                  {!selectedShop.subscription && (
                    <div className="text-sm text-orange-600">
                      ยังไม่มี Package
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือก Package
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => {
                    setSelectedPackageId(e.target.value);
                    const pkg = packages.find(p => p.id === e.target.value);
                    if (pkg) {
                      setTokenAmount(pkg.tokenAmount?.toString() || '0');
                      setSubscriptionDays(pkg.periodDays.toString());
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- เลือก Package --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - ฿{pkg.price} ({pkg.periodDays} วัน, {pkg.tokenAmount || 0} tokens)
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวน Token ที่จะมอบให้
                </label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลา Subscription (วัน)
                </label>
                <input
                  type="number"
                  value={subscriptionDays}
                  onChange={(e) => setSubscriptionDays(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPackageModal(false)}
                  disabled={isAssigning}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleAssignPackage}
                  disabled={!selectedPackageId || isAssigning}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>กำลังมอบหมาย...</span>
                    </>
                  ) : (
                    'มอบหมาย'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedShopIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xl z-40 border-t-4 border-orange-600">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-bold text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  เลือก {selectedShopIds.length} ร้าน
                </span>
                <button
                  onClick={() => setSelectedShopIds([])}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  ยกเลิก
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCategoryIds([]);
                    setBulkAction('categories');
                  }}
                  disabled={isBulkProcessing}
                  className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-100 flex items-center gap-2 font-medium transition-all disabled:opacity-50"
                >
                  <Tag className="w-4 h-4" />
                  จัดการหมวดหมู่
                </button>
                
                <button
                  onClick={() => {
                    setSelectedPackageId('');
                    setTokenAmount('0');
                    setSubscriptionDays('30');
                    setBulkAction('package');
                  }}
                  disabled={isBulkProcessing}
                  className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-100 flex items-center gap-2 font-medium transition-all disabled:opacity-50"
                >
                  <Package className="w-4 h-4" />
                  มอบหมาย Package
                </button>
                
                <div className="relative group">
                  <button 
                    disabled={isBulkProcessing}
                    className="px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-gray-100 flex items-center gap-2 font-medium transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    เปลี่ยนสถานะ
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-white rounded-lg shadow-xl py-2 min-w-[200px] border border-gray-200">
                    <button 
                      onClick={() => handleBulkChangeStatus('APPROVED')} 
                      className="w-full px-4 py-2 text-left hover:bg-green-50 text-green-600 font-medium flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      อนุมัติ
                    </button>
                    <button 
                      onClick={() => handleBulkChangeStatus('PENDING')} 
                      className="w-full px-4 py-2 text-left hover:bg-yellow-50 text-yellow-600 font-medium flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      รออนุมัติ
                    </button>
                    <button 
                      onClick={() => handleBulkChangeStatus('REJECTED')} 
                      className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 font-medium flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      ปฏิเสธ
                    </button>
                    <button 
                      onClick={() => handleBulkChangeStatus('SUSPENDED')} 
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-600 font-medium flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      ระงับ
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => handleBulkToggleMockup(true)}
                  disabled={isBulkProcessing}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 font-medium transition-all disabled:opacity-50"
                >
                  <TestTube className="w-4 h-4" />
                  DEMO
                </button>
                
                <button
                  onClick={() => handleBulkToggleMockup(false)}
                  disabled={isBulkProcessing}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 font-medium transition-all disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  ยกเลิก DEMO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Categories Modal */}
      {bulkAction === 'categories' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                จัดการหมวดหมู่ ({selectedShopIds.length} ร้าน)
              </h3>
              <button
                onClick={() => setBulkAction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  เลือกหมวดหมู่ที่ต้องการกำหนดให้กับร้านค้าทั้งหมดที่เลือก
                </p>
              </div>
              <div className="border rounded-lg p-3 max-h-96 overflow-y-auto space-y-2">
                {allCategories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                        } else {
                          setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                        }
                      }}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm">
                      {category.icon} {category.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setBulkAction(null)}
                disabled={isBulkProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBulkUpdateCategories}
                disabled={isBulkProcessing}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBulkProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังอัปเดต...
                  </>
                ) : (
                  `อัปเดต ${selectedShopIds.length} ร้าน`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Package Modal */}
      {bulkAction === 'package' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                มอบหมาย Package ({selectedShopIds.length} ร้าน)
              </h3>
              <button
                onClick={() => setBulkAction(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  เลือก Package และกำหนดจำนวน Token ที่จะมอบให้
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือก Package
                </label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => {
                    setSelectedPackageId(e.target.value);
                    const pkg = packages.find(p => p.id === e.target.value);
                    if (pkg) {
                      setTokenAmount(pkg.tokenAmount?.toString() || '0');
                      setSubscriptionDays(pkg.periodDays.toString());
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- เลือก Package --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - ฿{pkg.price} ({pkg.periodDays} วัน, {pkg.tokenAmount || 0} tokens)
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จำนวน Token
                </label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  min="0"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลา (วัน)
                </label>
                <input
                  type="number"
                  value={subscriptionDays}
                  onChange={(e) => setSubscriptionDays(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setBulkAction(null)}
                disabled={isBulkProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleBulkAssignPackage}
                disabled={!selectedPackageId || isBulkProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBulkProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    กำลังมอบหมาย...
                  </>
                ) : (
                  `มอบหมาย ${selectedShopIds.length} ร้าน`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCategoriesModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                จัดการหมวดหมู่
              </h3>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ร้านค้า
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{selectedShop.name}</div>
                  {selectedShop.categories && selectedShop.categories.length > 0 ? (
                    <div className="text-sm text-gray-600 mt-1">
                      หมวดหมู่ปัจจุบัน: {selectedShop.categories.map(c => c.name).join(', ')}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-1">ยังไม่มีหมวดหมู่</div>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกหมวดหมู่
                </label>
                <div className="border rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                  {allCategories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategoryIds([...selectedCategoryIds, category.id]);
                          } else {
                            setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id));
                          }
                        }}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm">
                        {category.icon} {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCategoriesModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleUpdateCategories}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
