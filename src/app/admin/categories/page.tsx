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
  { emoji: '🍔', keywords: 'burger hamburger อาหาร food' },
  { emoji: '🍕', keywords: 'pizza พิซซ่า อาหาร food' },
  { emoji: '🍗', keywords: 'chicken ไก่ทอด อาหาร food' },
  { emoji: '🍖', keywords: 'meat steak เนื้อ อาหาร food' },
  { emoji: '🌭', keywords: 'hotdog ฮอตดอก อาหาร food' },
  { emoji: '🥪', keywords: 'sandwich แซนวิช อาหาร food' },
  { emoji: '🌮', keywords: 'taco ทาโก้ อาหาร food' },
  { emoji: '🌯', keywords: 'burrito อาหาร food' },
  { emoji: '🥙', keywords: 'kebab อาหาร food' },
  { emoji: '🥗', keywords: 'salad สลัด อาหาร food' },
  { emoji: '🍝', keywords: 'pasta สปาเกตตี้ อาหาร food' },
  { emoji: '🍜', keywords: 'noodle ramen ก่วยเตี๋ยว บะหมี่ อาหาร food' },
  { emoji: '🍲', keywords: 'soup pot ซุป อาหาร food' },
  { emoji: '🍛', keywords: 'curry แกง อาหาร food' },
  { emoji: '🍣', keywords: 'sushi ซูชิ อาหาร food' },
  { emoji: '🍱', keywords: 'bento เบนโตะ อาหาร food' },
  { emoji: '🥟', keywords: 'dumpling เกี๊ยว อาหาร food' },
  { emoji: '🍢', keywords: 'oden อาหาร food' },
  { emoji: '🍡', keywords: 'dango ของหวาน dessert' },
  { emoji: '🍧', keywords: 'shaved ice น้ำแข็งใส ของหวาน dessert' },
  { emoji: '🍨', keywords: 'ice cream ไอศกรีม ของหวาน dessert' },
  { emoji: '🍦', keywords: 'soft serve ไอศกรีม ของหวาน dessert' },
  { emoji: '🥧', keywords: 'pie พาย ของหวาน dessert' },
  { emoji: '🧁', keywords: 'cupcake คัพเค้ก ของหวาน dessert' },
  { emoji: '🍰', keywords: 'cake เค้ก ของหวาน dessert' },
  { emoji: '🎂', keywords: 'birthday cake เค้ก ของหวาน dessert' },
  { emoji: '🍮', keywords: 'pudding พุดดิ้ง ของหวาน dessert' },
  { emoji: '🍭', keywords: 'lollipop อมยิ้ม ของหวาน dessert' },
  { emoji: '🍬', keywords: 'candy ลูกอม ของหวาน dessert' },
  { emoji: '🍫', keywords: 'chocolate ช็อกโกแลต ของหวาน dessert' },
  { emoji: '🍿', keywords: 'popcorn ป๊อปคอร์น snack ขนม' },
  { emoji: '🍩', keywords: 'donut โดนัท ของหวาน dessert' },
  { emoji: '🍪', keywords: 'cookie คุกกี้ ของหวาน dessert' },
  { emoji: '🌰', keywords: 'chestnut snack ขนม' },
  { emoji: '🥜', keywords: 'peanut ถ่วว snack ขนม' },
  { emoji: '🍯', keywords: 'honey น้ำผึ้ง' },
  { emoji: '🥛', keywords: 'milk นม เครื่องดื่ม drink' },
  { emoji: '🍼', keywords: 'baby bottle นม เครื่องดื่ม drink' },
  { emoji: '☕', keywords: 'coffee กาแฟ เครื่องดื่ม drink cafe' },
  { emoji: '🍵', keywords: 'tea ชา เครื่องดื่ม drink' },
  { emoji: '🧃', keywords: 'juice น้ำผลไม้ เครื่องดื่ม drink' },
  { emoji: '🥤', keywords: 'soda soft drink น้ำอัดลม เครื่องดื่ม drink' },
  { emoji: '🍶', keywords: 'sake เครื่องดื่ม drink alcohol' },
  { emoji: '🍺', keywords: 'beer เบียร์ เครื่องดื่ม drink alcohol' },
  { emoji: '🍻', keywords: 'beers cheers เบียร์ เครื่องดื่ม drink alcohol' },
  { emoji: '🥂', keywords: 'champagne wine เครื่องดื่ม drink alcohol' },
  { emoji: '🍷', keywords: 'wine ไวน์ เครื่องดื่ม drink alcohol' },
  { emoji: '🥃', keywords: 'whiskey เครื่องดื่ม drink alcohol' },
  { emoji: '🍸', keywords: 'cocktail ค็อกเทล เครื่องดื่ม drink alcohol' },
  { emoji: '🍹', keywords: 'tropical drink ค็อกเทล เครื่องดื่ม drink alcohol' },
  { emoji: '🍾', keywords: 'champagne เครื่องดื่ม drink alcohol' },
  { emoji: '🧉', keywords: 'mate tea เครื่องดื่ม drink' },
  { emoji: '🧊', keywords: 'ice น้ำแข็ง เครื่องดื่ม drink' },
  { emoji: '🥢', keywords: 'chopsticks ตะเกียบ' },
  { emoji: '🍴', keywords: 'fork knife ส้อม มีด' },
  { emoji: '🥄', keywords: 'spoon ช้อน' },
  { emoji: '🔪', keywords: 'knife มีด' },
  { emoji: '🏺', keywords: 'vase แจกัน' },
  { emoji: '🎨', keywords: 'art ศิลปะ palette' },
  { emoji: '👗', keywords: 'dress เสื้อผ้า fashion clothing' },
  { emoji: '📚', keywords: 'books หนังสือ education' },
  { emoji: '🏠', keywords: 'home house บ้าน' },
  { emoji: '🔧', keywords: 'tool wrench ซ่อม maintenance' },
  { emoji: '💻', keywords: 'computer laptop คอมพิวเตอร์ tech technology' },
  { emoji: '🎮', keywords: 'game gaming เกม' },
  { emoji: '🏋️', keywords: 'gym fitness exercise ออกกำลังกาย' },
  { emoji: '🌺', keywords: 'flower ดอกไม้ beauty' },
  { emoji: '🐾', keywords: 'pet สัตว์เลี้ยง animal' },
  { emoji: '🚗', keywords: 'car รถยนต์ vehicle' },
  { emoji: '✈️', keywords: 'plane travel เที่ยว transport' },
  { emoji: '🏨', keywords: 'hotel โรงแรม accommodation' },
  { emoji: '💼', keywords: 'business briefcase ธุรกิจ' },
  { emoji: '📦', keywords: 'package box delivery ส่งของ' },
  { emoji: '🎵', keywords: 'music เพลง' },
  { emoji: '🎬', keywords: 'movie film cinema หนัง' },
  { emoji: '📷', keywords: 'camera photo กล้อง' },
  { emoji: '💍', keywords: 'ring diamond แหวน jewelry' },
  { emoji: '⚽', keywords: 'soccer football กีฬา sport' },
  { emoji: '🏊', keywords: 'swim swimming ว่ายน้ำ sport' },
  { emoji: '🎯', keywords: 'target goal' },
  { emoji: '🌟', keywords: 'star ดาว' },
  { emoji: '💊', keywords: 'pill medicine ยา health' },
  { emoji: '🔬', keywords: 'microscope science วิทยาศาสตร์' }
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emojiSearch, setEmojiSearch] = useState('');
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
      setEmojiSearch(''); // Reset search when opening form
    } else if (showAddForm) {
      setFormData({
        name: '',
        slug: '',
        icon: '📦',
        description: ''
      });
      setEmojiSearch(''); // Reset search when opening form
    }
  }, [editingCategory, showAddForm]);

  async function fetchCategories() {
    console.log('🔍 Starting to fetch categories...');
    setLoading(true);
    
    try {
      console.log('🌐 About to fetch from /api/categories');
      const response = await fetch('/api/categories');
      console.log('📡 Response received, status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      setCategories(data.categories || []);
      console.log('✅ Categories loaded:', data.categories?.length || 0);
    } catch (error: any) {
      console.error('💥 Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
      console.log('🏁 Fetch complete, loading set to false');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); // Clear previous errors
    setSaving(true);
    
    try {
      if (editingCategory) {
        // Update existing category
        const response = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          await fetchCategories();
          setEditingCategory(null);
          setSuccessMessage('แก้ไขหมวดหมู่สำเร็จ');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setError(data.error || 'เกิดข้อผิดพลาดในการอัปเดต');
          setEditingCategory(null);
          setTimeout(() => setError(''), 3000);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // Create new category
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          await fetchCategories();
          setShowAddForm(false);
          setSuccessMessage('เพิ่มหมวดหมู่สำเร็จ');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          setError(data.error || 'เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่');
          setTimeout(() => setError(''), 3000);
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!deleteConfirm) {
      setDeleteConfirm(category);
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remove from local state without refetching
        setCategories(prev => prev.filter(cat => cat.id !== category.id));
        setDeleteConfirm(null);
        
        // Show success message
        setSuccessMessage('ลบหมวดหมู่สำเร็จ');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'เกิดข้อผิดพลาดในการลบ');
        setTimeout(() => setError(''), 3000);
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('เกิดข้อผิดพลาด');
      setTimeout(() => setError(''), 3000);
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
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
        
        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !editingCategory && !showAddForm && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

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
                        disabled={deleting}
                        className={`text-red-600 hover:text-red-900 ${deleting ? 'opacity-50 cursor-wait' : ''}`}
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
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Icon Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ไอคอน
                    </label>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-5xl">{formData.icon}</div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={emojiSearch}
                          onChange={(e) => setEmojiSearch(e.target.value)}
                          placeholder="ค้นหา... เช่น อาหาร, coffee, กาแฟ"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-10 gap-2 p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                      {EMOJI_OPTIONS
                        .filter(item => 
                          emojiSearch === '' || 
                          item.keywords.toLowerCase().includes(emojiSearch.toLowerCase()) ||
                          item.emoji.includes(emojiSearch)
                        )
                        .map((item) => (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: item.emoji })}
                          className={`text-2xl p-2 rounded hover:bg-gray-200 transition ${
                            formData.icon === item.emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                          }`}
                          title={item.keywords}
                        >
                          {item.emoji}
                        </button>
                      ))}
                    </div>
                    {emojiSearch && EMOJI_OPTIONS.filter(item => 
                      item.keywords.toLowerCase().includes(emojiSearch.toLowerCase()) ||
                      item.emoji.includes(emojiSearch)
                    ).length === 0 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">ไม่พบไอคอนที่ค้นหา</p>
                    )}
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
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="food-and-drink"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ใช้ตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข และ - เท่านั้น (จะแปลงอัตโนมัติ)
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
                        setError('');
                      }}
                      disabled={saving}
                      className={`flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 ${saving ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          กำลังบันทึก...
                        </>
                      ) : (
                        editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'
                      )}
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
              <p className="text-gray-600 mb-4">
                คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ <strong>{deleteConfirm.name}</strong>?
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className={`flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 ${deleting ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังลบ...
                    </>
                  ) : (
                    'ลบหมวดหมู่'
                  )}
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
