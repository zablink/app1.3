// components/shop/ShopLinksManager.tsx
"use client";

import { useState } from 'react';
import { Plus, X, Facebook, Instagram, ExternalLink, Phone } from 'lucide-react';

interface ShopLink {
  id: string;
  type: string;
  url: string;
}

interface ShopLinksManagerProps {
  shopId: string;
  initialLinks?: ShopLink[];
}

const LINK_TYPES = [
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'line', label: 'LINE', icon: Phone, color: 'text-green-600' },
  { value: 'website', label: 'Website', icon: ExternalLink, color: 'text-gray-600' },
  { value: 'tiktok', label: 'TikTok', icon: ExternalLink, color: 'text-gray-900' },
];

export default function ShopLinksManager({ shopId, initialLinks = [] }: ShopLinksManagerProps) {
  const [links, setLinks] = useState<ShopLink[]>(initialLinks);
  const [newLink, setNewLink] = useState({ type: 'facebook', url: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newLink.url.trim()) {
      setError('กรุณากรอก URL');
      return;
    }

    // Validate URL
    try {
      new URL(newLink.url);
    } catch (e) {
      setError('URL ไม่ถูกต้อง');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/shop/${shopId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      });

      if (!response.ok) {
        throw new Error('Failed to add link');
      }

      const savedLink = await response.json();
      setLinks([...links, savedLink]);
      setNewLink({ type: 'facebook', url: '' });
    } catch (err) {
      setError('ไม่สามารถเพิ่มลิงก์ได้');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (linkId: string) => {
    if (!confirm('คุณต้องการลบลิงก์นี้หรือไม่?')) return;

    try {
      const response = await fetch(`/api/shop/${shopId}/links?id=${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      setLinks(links.filter(link => link.id !== linkId));
    } catch (err) {
      setError('ไม่สามารถลบลิงก์ได้');
    }
  };

  const getLinkIcon = (type: string) => {
    const linkType = LINK_TYPES.find(t => t.value === type);
    if (!linkType) return ExternalLink;
    return linkType.icon;
  };

  const getLinkColor = (type: string) => {
    const linkType = LINK_TYPES.find(t => t.value === type);
    return linkType?.color || 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        ลิงก์โซเชียลมีเดีย
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Existing Links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link) => {
            const Icon = getLinkIcon(link.type);
            const color = getLinkColor(link.type);
            
            return (
              <div
                key={link.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
              >
                <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 capitalize">{link.type}</p>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate block"
                  >
                    {link.url}
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Link */}
      <div className="border-t pt-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">เพิ่มลิงก์ใหม่</p>
        
        <div className="flex gap-2">
          <select
            value={newLink.type}
            onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={saving}
          >
            {LINK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <input
            type="url"
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            placeholder="https://..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={saving}
          />

          <button
            onClick={handleAdd}
            disabled={saving || !newLink.url.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่ม
          </button>
        </div>

        <p className="text-xs text-gray-500">
          ตัวอย่าง: https://www.facebook.com/yourpage
        </p>
      </div>
    </div>
  );
}