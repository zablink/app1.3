// src/app/category/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดหมวดหมู่...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">หมวดหมู่ร้านค้า</h1>
          <p className="text-gray-600">เลือกหมวดหมู่เพื่อค้นหาร้านค้าที่คุณสนใจ</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/category/${category.slug}`}>
                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6 text-center cursor-pointer group h-full">
                  {/* Icon */}
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                    {category.icon || '📦'}
                  </div>

                  {/* Name */}
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>

                  {/* Shop count */}
                  {category._count && (
                    <p className="text-sm text-gray-500">
                      {category._count.shops} ร้าน
                    </p>
                  )}

                  {/* Description (truncated) */}
                  {category.description && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">ยังไม่มีหมวดหมู่</p>
          </div>
        )}
      </div>
    </div>
  );
}
