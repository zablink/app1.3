'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Eye,
  UserCircle,
  Store,
  Star,
  Shield,
  Calendar,
  Mail,
  Trash2,
  Ban,
  CheckCircle,
} from 'lucide-react';

interface User {
  id: string;
  name?: string;
  email?: string;
  role: string;
  image?: string;
  createdAt: string;
  updatedAt?: string;
}

interface UserDetails extends User {
  emailVerified?: string;
  accounts?: any[];
  sessions?: any[];
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserDetails | null>(null);
  const [editRole, setEditRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      loadUsers();
    }
  }, [session, page, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (roleFilter !== 'ALL') {
        params.append('role', roleFilter);
      }

      const res = await fetch(`/api/admin/users?${params}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      const data = await res.json();

      if (data.users) {
        setUsers(data.users);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalUsers(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      const res = await fetch(`/admin/users/${userId}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setSelectedUserDetails(data);
    } catch (error) {
      console.error('Error loading user details:', error);
      showToast('เกิดข้อผิดพลาดในการโหลดรายละเอียดผู้ใช้', 'error');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !editRole) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'อัพเดทผู้ใช้เรียบร้อยแล้ว', 'success');
        setShowEditModal(false);
        
        // Update user in state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === selectedUser.id ? { ...user, role: editRole } : user
          )
        );
      } else {
        showToast(data.error || 'เกิดข้อผิดพลาด', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return Shield;
      case 'SHOP':
        return Store;
      case 'CREATOR':
        return Star;
      default:
        return UserCircle;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'SHOP':
        return 'bg-green-100 text-green-800';
      case 'CREATOR':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'ผู้ดูแลระบบ';
      case 'SHOP':
        return 'เจ้าของร้าน';
      case 'CREATOR':
        return 'ผู้สร้างคอนเทนต์';
      case 'MCN_MANAGER':
        return 'MCN Manager';
      case 'AD_MANAGER':
        return 'AD Manager';
      default:
        return 'ผู้ใช้ทั่วไป';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
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
              <div className="p-3 bg-blue-500 rounded-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
                <p className="text-sm text-gray-600">
                  จำนวนผู้ใช้ทั้งหมด: {totalUsers.toLocaleString()} คน
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="ผู้ใช้ทั่วไป"
            count={users.filter(u => u.role === 'USER').length}
            icon={UserCircle}
            color="bg-gray-500"
          />
          <StatCard
            title="เจ้าของร้าน"
            count={users.filter(u => u.role === 'SHOP').length}
            icon={Store}
            color="bg-green-500"
          />
          <StatCard
            title="Creators"
            count={users.filter(u => u.role === 'CREATOR').length}
            icon={Star}
            color="bg-yellow-500"
          />
          <StatCard
            title="ผู้ดูแลระบบ"
            count={users.filter(u => u.role === 'ADMIN').length}
            icon={Shield}
            color="bg-purple-500"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหรืออีเมล..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">ทุกบทบาท</option>
                <option value="USER">ผู้ใช้ทั่วไป</option>
                <option value="SHOP">เจ้าของร้าน</option>
                <option value="CREATOR">Creator</option>
                <option value="ADMIN">ผู้ดูแลระบบ</option>
                <option value="MCN_MANAGER">MCN Manager</option>
                <option value="AD_MANAGER">AD Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ใช้
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อีเมล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สมัคร
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      ไม่พบผู้ใช้
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || 'User'}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserCircle className="w-6 h-6 text-gray-500" />
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || 'ไม่มีชื่อ'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {user.email || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex items-center gap-2 text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(
                              user.role
                            )}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.createdAt).toLocaleDateString('th-TH')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                loadUserDetails(user.id);
                                setShowViewModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="ดูรายละเอียด"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setEditRole(user.role);
                                setShowEditModal(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="แก้ไขบทบาท"
                            >
                              <Edit className="w-4 h-4" />
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
                หน้า {page} จาก {totalPages} (ทั้งหมด {totalUsers} คน)
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

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">แก้ไขบทบาทผู้ใช้</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ผู้ใช้
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{selectedUser.name || 'ไม่มีชื่อ'}</div>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกบทบาท
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USER">ผู้ใช้ทั่วไป</option>
                  <option value="SHOP">เจ้าของร้าน</option>
                  <option value="CREATOR">Creator</option>
                  <option value="MCN_MANAGER">MCN Manager</option>
                  <option value="AD_MANAGER">AD Manager</option>
                  <option value="ADMIN">ผู้ดูแลระบบ</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleEditUser}
                  disabled={isUpdating || editRole === selectedUser.role}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">รายละเอียดผู้ใช้</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUserDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {selectedUser.image ? (
                  <img
                    src={selectedUser.image}
                    alt={selectedUser.name || 'User'}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    <UserCircle className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {selectedUser.name || 'ไม่มีชื่อ'}
                  </h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <span
                    className={`mt-2 inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(
                      selectedUser.role
                    )}`}
                  >
                    {getRoleLabel(selectedUser.role)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <DetailRow label="User ID" value={selectedUser.id} />
                <DetailRow
                  label="วันที่สมัคร"
                  value={new Date(selectedUser.createdAt).toLocaleString('th-TH')}
                />
                {selectedUser.updatedAt && (
                  <DetailRow
                    label="อัพเดทล่าสุด"
                    value={new Date(selectedUser.updatedAt).toLocaleString('th-TH')}
                  />
                )}
                {selectedUserDetails?.emailVerified && (
                  <DetailRow
                    label="อีเมลยืนยันแล้ว"
                    value={new Date(selectedUserDetails.emailVerified).toLocaleString('th-TH')}
                  />
                )}
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUserDetails(null);
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  count: number;
  icon: any;
  color: string;
}

function StatCard({ title, count, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
        </div>
        <div className={`p-3 ${color} rounded-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Detail Row Component
interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
