// src/components/shop/ShopLinksManager.tsx

'use client';

import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import type { ShopLink } from '@/types/shop';
import { validateURL } from '@/utils/validators';

interface ShopLinksManagerProps {
  links: ShopLink[];
  onLinkChange: (index: number, field: 'type' | 'url', value: string) => void;
  onAddLink: () => void;
  onRemoveLink: (linkId: string) => void;
}

export const ShopLinksManager: React.FC<ShopLinksManagerProps> = ({
  links,
  onLinkChange,
  onAddLink,
  onRemoveLink,
}) => {
  const [urlErrors, setUrlErrors] = React.useState<Record<number, string>>({});

  const handleUrlBlur = (index: number, url: string) => {
    if (url.trim()) {
      const validation = validateURL(url);
      if (!validation.valid && validation.message) {
        setUrlErrors(prev => ({ ...prev, [index]: validation.message! }));
      } else {
        setUrlErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });
      }
    } else {
      setUrlErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  return (
    <div className="space-y-4 border p-6 rounded-xl bg-yellow-50">
      <h2 className="text-2xl font-bold text-yellow-800">
        3. ลิงก์ Food Delivery และเว็บไซต์
      </h2>
      <p className="text-sm text-yellow-600 mb-4">
        เช่น ลิงก์ Grab Food, Lineman หรือเว็บไซต์หลักของร้าน (จำกัด 0 ถึง 5 ลิงก์)
      </p>

      {links.map((link, index) => (
        <div
          key={link.id}
          className="flex flex-col sm:flex-row gap-3 p-3 bg-white rounded-lg border border-yellow-200"
        >
          <input
            type="text"
            name="type"
            value={link.type}
            onChange={e => onLinkChange(index, 'type', e.target.value)}
            className="p-3 border border-gray-300 rounded-lg w-full sm:w-1/4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="ชื่อบริการ"
          />
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex gap-2">
              <input
                type="url"
                name="url"
                value={link.url}
                onChange={e => onLinkChange(index, 'url', e.target.value)}
                onBlur={e => handleUrlBlur(index, e.target.value)}
                className={`p-3 border rounded-lg flex-grow min-w-0 focus:ring-2 focus:border-transparent ${
                  urlErrors[index]
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={() => onRemoveLink(link.id)}
                className="p-2.5 text-white bg-red-500 rounded-lg hover:bg-red-600 transition shrink-0 flex items-center justify-center w-11 h-11"
                title="ลบลิงก์นี้"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            {urlErrors[index] && (
              <p className="text-xs text-red-600 px-1">{urlErrors[index]}</p>
            )}
          </div>
        </div>
      ))}

      {links.length < 5 && (
        <button
          type="button"
          onClick={onAddLink}
          className="mt-3 flex items-center justify-center w-full py-2 border-2 border-yellow-800 border-dashed rounded-lg text-yellow-800 hover:bg-yellow-100 transition"
        >
          <Plus className="w-5 h-5 mr-2" /> เพิ่มลิงก์ใหม่
        </button>
      )}
      
      {links.length >= 5 && (
        <p className="text-red-500 text-sm mt-3 text-center">
          จำกัดลิงก์สูงสุด 5 ลิงก์
        </p>
      )}
    </div>
  );
};