// src/app/admin/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminBreadcrumb from '@/components/admin/Breadcrumb';

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  _count?: {
    shops: number;
  };
};

const EMOJI_OPTIONS = [
  '🍔', '🍕', '☕', '🍜', '🍱', '🎨', '👗', '📚', '🏠', '🔧', 
  '💻', '🎮', '🏋️', '🌺', '🐾', '🚗', '✈️', '🏨', '💼', '📦',
  '🎵', '🎬', '📷', '💍', '⚽', '🏊', '🎯', '🌟', '💊', '🔬'
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '📦',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  // Update form when editing category
  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        slug: editingCategory.slug,
        icon: editingCategory.icon || '📦',
        description: editingCategory.description || ''
      });
    } else if (showAddForm) {
      setFormData({
        name: '',
        slug: '',
        icon: '📦',
        description: ''
      });
    }
  }, [editingCategory, showAddForm]);

  async function fetchCategories() {
    try {
      console.log('🔍 Starting to fetch categories...');
      setLoading(true);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sec timeout
      
      const response = await fetch('/api/categories', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        setCategories(data.categories || []);
        console.log('✅ Categories loaded:', data.categories?.length || 0);
      } else {
        console.error('❌ API returned success: false', data);
        setCategories([]); // Set empty array to stop loading
      }
    } catch (error: any) {
      console.error('💥 Error fetching categories:', error);
      if (error.name === 'AbortError') {
        console.error('⏱️ Request timeout after 10 seconds');
      }
      setCategories([]); // Set empty array to stop loading
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          await fetchCategories();
          setEditingCategory(null);
          alert('อัปเดตหมวดหมู่สำเร็จ');
        } else {
          alert('เกิดข้อผิดพลาดในการอัปเดต');
        }
      } else {
        // Create new category
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          await fetchCategories();
          setShowAddForm(false);
          alert('เพิ่มหมวดหมู่สำเร็จ');
        } else {
          alert('เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่');
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('เกิดข้อผิดพลาด');
    }
  }

  async function handleDelete(category: Category) {
    if (!deleteConfirm) {
      setDeleteConfirm(category);
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchCategories();
        setDeleteConfirm(null);
        alert('ลบหมวดหมู่สำเร็จ');
      } else {
        const data = await response.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการลบ');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('เกิดข้อผิดพลาด');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <AdminBreadcrumb /> */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">จัดการหมวดหมู่</h1>
            <p className="text-gray-600 text-sm mt-1">
              ทั้งหมด {categories.length} หมวดหมู่
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← กลับ
            </Link>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + เพิ่มหมวดหมู่
            </button>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Icon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  คำอธิบาย
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวนร้าน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-2xl">
                    {category.icon || '📦'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <code className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {category.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {category._count?.shops || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <Link
                        href={`/category/${category.slug}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดู
                      </Link>
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="text-green-600 hover:text-green-900"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(category)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">ยังไม่มีหมวดหมู่</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              เพิ่มหมวดหมู่แรก
            </button>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddForm || editingCategory) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Icon Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ไอคอน
                    </label>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-5xl">{formData.icon}</div>
                      <div className="text-sm text-gray-500">เลือกไอคอนด้านล่าง</div>
                    </div>
                    <div className="grid grid-cols-10 gap-2 p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: emoji })}
                          className={`text-2xl p-2 rounded hover:bg-gray-200 transition ${
                            formData.icon === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อหมวดหมู่ *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="เช่น อาหารและเครื่องดื่ม"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (URL) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="food-and-drink"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ใช้ตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข และ - เท่านั้น
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      คำอธิบาย
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="คำอธิบายสั้นๆ เกี่ยวกับหมวดหมู่นี้"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setShowAddForm(false);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ยืนยันการลบ
              </h3>
              <p className="text-gray-600 mb-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ <strong>{deleteConfirm.name}</strong>?
              </p>
              {deleteConfirm._count && deleteConfirm._count.shops > 0 && (
                <p className="text-red-600 text-sm mb-4">
                  ⚠️ มีร้านค้า {deleteConfirm._count.shops} รายในหมวดหมู่นี้
                </p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  ลบหมวดหมู่
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
