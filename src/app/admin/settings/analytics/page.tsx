// src/app/admin/settings/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import AdminBreadcrumb from '@/components/admin/Breadcrumb';

export default function AnalyticsSettingsPage() {
  const [settings, setSettings] = useState({
    google_analytics_id: '',
    google_tag_manager_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch('/api/settings/analytics');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'บันทึกการตั้งค่าสำเร็จ! โปรดรีเฟรชหน้าเว็บเพื่อให้การเปลี่ยนแปลงมีผล' });
      } else {
        setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminBreadcrumb customItems={[
        { label: 'แอดมิน', href: '/admin' },
        { label: 'การตั้งค่า', href: '/admin/settings' },
        { label: 'Analytics', href: '/admin/settings/analytics' },
      ]} />
      <div className="p-8">
        <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Google Analytics Settings</h1>
        <p className="text-gray-600 mb-8">
          จัดการการตั้งค่า Google Analytics และ Google Tag Manager สำหรับเว็บไซต์
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {/* Google Analytics */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Google Analytics Measurement ID
              </label>
              <input
                type="text"
                value={settings.google_analytics_id}
                onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                รูปแบบ: G-XXXXXXXXXX (ค้นหาได้ใน Google Analytics {'>'} Admin {'>'} Data Streams)
              </p>
            </div>

            {/* Google Tag Manager */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Google Tag Manager Container ID
              </label>
              <input
                type="text"
                value={settings.google_tag_manager_id}
                onChange={(e) => setSettings({ ...settings, google_tag_manager_id: e.target.value })}
                placeholder="GTM-XXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                รูปแบบ: GTM-XXXXXXX (ค้นหาได้ใน Google Tag Manager {'>'} Container Settings)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <span>💡</span>
                <span>วิธีการตั้งค่า</span>
              </h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>สร้าง Google Analytics Property ที่ <a href="https://analytics.google.com" target="_blank" className="underline">analytics.google.com</a></li>
                <li>คัดลอก Measurement ID (G-XXXXXXXXXX)</li>
                <li>(ถ้าใช้ GTM) สร้าง Container ที่ <a href="https://tagmanager.google.com" target="_blank" className="underline">tagmanager.google.com</a></li>
                <li>วาง ID ด้านบนและบันทึก</li>
                <li>รีเฟรชหน้าเว็บเพื่อให้การเปลี่ยนแปลงมีผล</li>
              </ol>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
            <button
              type="button"
              onClick={fetchSettings}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              รีเซ็ต
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
