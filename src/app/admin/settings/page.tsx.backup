// app/admin/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  dataType: string;
  label: string;
  description?: string;
  parsedValue?: any;
}

type CategorySettings = Record<string, Setting[]>;

const CATEGORY_LABELS: Record<string, string> = {
  branding: 'แบรนด์',
  colors: 'สีและธีม',
  homepage: 'หน้าแรก',
  navigation: 'เมนูนำทาง',
  footer: 'ส่วนท้าย',
  seo: 'SEO',
  features: 'ฟีเจอร์'
};

const CATEGORY_ICONS: Record<string, string> = {
  branding: '🎨',
  colors: '🌈',
  homepage: '🏠',
  navigation: '🧭',
  footer: '📄',
  seo: '🔍',
  features: '⚙️'
};

export default function AdminSettingsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [settings, setSettings] = useState<CategorySettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('branding');
  const [changes, setChanges] = useState<Record<string, any>>({});
  const [previewMode, setPreviewMode] = useState(false);

  // ตรวจสอบ Admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  // โหลด Settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updates = Object.entries(changes).map(([key, value]) => ({
        key,
        value
      }));

      const response = await fetch('/api/admin/settings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates,
          reason: 'อัปเดตจาก Admin Dashboard'
        })
      });

      if (response.ok) {
        setChanges({});
        await loadSettings();
        alert('บันทึกการเปลี่ยนแปลงเรียบร้อย! 🎉');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (Object.keys(changes).length > 0) {
      if (confirm('ยกเลิกการเปลี่ยนแปลงทั้งหมด?')) {
        setChanges({});
      }
    }
  };

  const getValue = (setting: Setting) => {
    return changes[setting.key] !== undefined 
      ? changes[setting.key] 
      : (setting.parsedValue || setting.value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                การตั้งค่าเว็บไซต์
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                ปรับแต่งหน้าตาและเนื้อหาของเว็บไซต์
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Preview Toggle */}
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {previewMode ? '✅ โหมดตัวอย่าง' : '👁️ ดูตัวอย่าง'}
              </button>

              {/* Discard */}
              {Object.keys(changes).length > 0 && (
                <button
                  onClick={handleDiscard}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={Object.keys(changes).length === 0 || saving}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {saving ? 'กำลังบันทึก...' : `บันทึก ${Object.keys(changes).length > 0 ? `(${Object.keys(changes).length})` : ''}`}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Categories */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">หมวดหมู่</h3>
              
              <nav className="space-y-1">
                {Object.keys(settings).map(category => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                      ${activeCategory === category
                        ? 'bg-orange-50 text-orange-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-xl">
                      {CATEGORY_ICONS[category] || '📦'}
                    </span>
                    <span>{CATEGORY_LABELS[category] || category}</span>
                    
                    {/* Change indicator */}
                    {settings[category].some(s => changes[s.key] !== undefined) && (
                      <span className="ml-auto w-2 h-2 bg-orange-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content - Settings */}
          <div className="col-span-9">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Category Header */}
              <div className="mb-6 pb-6 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">
                    {CATEGORY_ICONS[activeCategory]}
                  </span>
                  {CATEGORY_LABELS[activeCategory]}
                </h2>
              </div>

              {/* Settings Form */}
              <div className="space-y-6">
                {settings[activeCategory]?.map(setting => (
                  <SettingField
                    key={setting.key}
                    setting={setting}
                    value={getValue(setting)}
                    onChange={(value) => handleChange(setting.key, value)}
                    hasChanged={changes[setting.key] !== undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Setting Field Component
// ============================================

interface SettingFieldProps {
  setting: Setting;
  value: any;
  onChange: (value: any) => void;
  hasChanged: boolean;
}

function SettingField({ setting, value, onChange, hasChanged }: SettingFieldProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center justify-between">
        <span className="font-medium text-gray-900">
          {setting.label}
          {hasChanged && (
            <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
              มีการเปลี่ยนแปลง
            </span>
          )}
        </span>
      </label>
      
      {setting.description && (
        <p className="text-sm text-gray-600">{setting.description}</p>
      )}

      {/* Input based on dataType */}
      <div className="mt-2">
        {setting.dataType === 'string' && (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        )}

        {setting.dataType === 'color' && (
          <ColorPicker
            value={value || '#000000'}
            onChange={onChange}
          />
        )}

        {setting.dataType === 'image' && (
          <ImageUpload
            value={value || ''}
            onChange={onChange}
            label={setting.label}
          />
        )}

        {setting.dataType === 'boolean' && (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={value === 'true' || value === true}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">เปิดใช้งาน</span>
          </label>
        )}

        {setting.dataType === 'json' && (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(parsed);
              } catch {
                onChange(e.target.value);
              }
            }}
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// Color Picker Component
// ============================================

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-16 h-16 rounded-lg cursor-pointer border border-gray-300"
      />
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      
      {/* Preview */}
      <div
        className="w-24 h-16 rounded-lg border-2 border-gray-300"
        style={{ backgroundColor: value }}
      />
    </div>
  );
}

// ============================================
// Image Upload Component
// ============================================

function ImageUpload({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // สร้าง FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'settings');

      // Upload ไปยัง API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        onChange(data.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Image Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt={label}
            className="max-w-xs max-h-48 rounded-lg border border-gray-300 object-contain"
          />
          <button
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload Button */}
      <div>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span>{uploading ? 'กำลังอัปโหลด...' : value ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* URL Input */}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="หรือใส่ URL รูปภาพ"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
    </div>
  );
}
