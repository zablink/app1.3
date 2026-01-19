// src/components/admin/ShopCategoryManager.tsx
"use client";

import { useState, useEffect } from "react";

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
};

type Props = {
  shopId: string;
  initialCategories?: Category[];
};

export default function ShopCategoryManager({ shopId, initialCategories = [] }: Props) {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch all available categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.success) {
          setAllCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Fetch shop's current categories
  useEffect(() => {
    async function fetchShopCategories() {
      try {
        const response = await fetch(`/api/admin/shops/${shopId}/categories`);
        const data = await response.json();
        if (data.success) {
          setSelectedCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching shop categories:', error);
      }
    }

    if (shopId && initialCategories.length === 0) {
      fetchShopCategories();
    }
  }, [shopId, initialCategories]);

  const handleToggleCategory = (category: Category) => {
    const isSelected = selectedCategories.some((c) => c.id === category.id);
    
    if (isSelected) {
      setSelectedCategories(selectedCategories.filter((c) => c.id !== category.id));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const categoryIds = selectedCategories.map((c) => c.id);
      
      const response = await fetch(`/api/admin/shops/${shopId}/categories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryIds }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('บันทึกหมวดหมู่เรียบร้อยแล้ว');
        setSelectedCategories(data.categories || []);
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving categories:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">หมวดหมู่ร้านค้า</h3>
        <span className="text-sm text-gray-500">
          เลือกแล้ว: {selectedCategories.length} หมวด
        </span>
      </div>

      {/* Selected Categories */}
      {selectedCategories.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">หมวดหมู่ที่เลือก:</p>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-sm cursor-pointer hover:bg-blue-700"
                onClick={() => handleToggleCategory(cat)}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="ml-1">×</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* All Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {allCategories.map((category) => {
          const isSelected = selectedCategories.some((c) => c.id === category.id);
          
          return (
            <button
              key={category.id}
              onClick={() => handleToggleCategory(category)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{category.icon || '📦'}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {category.name}
                  </p>
                </div>
                {isSelected && (
                  <span className="text-blue-600">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกหมวดหมู่'}
        </button>
      </div>
    </div>
  );
}
