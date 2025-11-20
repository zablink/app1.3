// app/admin/settings/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ImageUploadZone from '@/components/admin/ImageUploadZone';

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

interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaLink?: string;
  imageUrl: string;
  priority: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

type CategorySettings = Record<string, Setting[]>;

const CATEGORY_LABELS: Record<string, string> = {
  branding: 'แบรนด์',
  seo: 'SEO',
  banners: 'Hero Banners',
  site: 'การตั้งค่าเว็บไซต์',
  features: 'ฟีเจอร์'
};

const CATEGORY_ICONS: Record<string, string> = {
  branding: '🎨',
  seo: '🔍',
  banners: '🖼️',
  site: '⚙️',
  features: '✨'
};

export default function AdminSettingsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [settings, setSettings] = useState<CategorySettings>({});
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('banners');
  const [changes, setChanges] = useState<Record<string, any>>({});
  
  // Banner form state
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [showBannerForm, setShowBannerForm] = useState(false);

  // ตรวจสอบ Admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router]);

  // โหลด Settings และ Banners
  useEffect(() => {
    loadSettings();
    loadBanners();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/banners');
      const data = await response.json();
      
      if (data.success) {
        setBanners(data.banners);
      }
    } catch (error) {
      console.error('Error loading banners:', error);
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

  const handleSaveSettings = async () => {
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

  // Banner CRUD operations
  const handleSaveBanner = async (banner: Partial<HeroBanner>) => {
    try {
      const url = editingBanner 
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners';
      
      const method = editingBanner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banner)
      });

      if (response.ok) {
        await loadBanners();
        setShowBannerForm(false);
        setEditingBanner(null);
        alert(editingBanner ? 'อัปเดต Banner เรียบร้อย!' : 'สร้าง Banner เรียบร้อย!');
      }
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('ยืนยันการลบ Banner นี้?')) return;

    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadBanners();
        alert('ลบ Banner เรียบร้อย!');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleEditBanner = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setShowBannerForm(true);
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
                จัดการ Banners, SEO, และการตั้งค่าต่างๆ ของเว็บไซต์
              </p>
            </div>

            <div className="flex items-center gap-3">
              {activeCategory === 'banners' && (
                <button
                  onClick={() => {
                    setEditingBanner(null);
                    setShowBannerForm(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  + เพิ่ม Banner
                </button>
              )}

              {activeCategory !== 'banners' && Object.keys(changes).length > 0 && (
                <>
                  <button
                    onClick={handleDiscard}
                    className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {saving ? 'กำลังบันทึก...' : `บันทึก (${Object.keys(changes).length})`}
                  </button>
                </>
              )}
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
                {Object.keys({ ...CATEGORY_LABELS, banners: 'Hero Banners' }).map(category => (
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
                    
                    {category !== 'banners' && settings[category]?.some(s => changes[s.key] !== undefined) && (
                      <span className="ml-auto w-2 h-2 bg-orange-500 rounded-full"></span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {activeCategory === 'banners' ? (
              <BannersManagement
                banners={banners}
                onEdit={handleEditBanner}
                onDelete={handleDeleteBanner}
                showForm={showBannerForm}
                editingBanner={editingBanner}
                onSave={handleSaveBanner}
                onCancel={() => {
                  setShowBannerForm(false);
                  setEditingBanner(null);
                }}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6 pb-6 border-b">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">
                      {CATEGORY_ICONS[activeCategory]}
                    </span>
                    {CATEGORY_LABELS[activeCategory]}
                  </h2>
                </div>

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
                  
                  {(!settings[activeCategory] || settings[activeCategory].length === 0) && (
                    <p className="text-gray-500 text-center py-8">
                      ยังไม่มีการตั้งค่าในหมวดหมู่นี้
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Banners Management Component
// ============================================

interface BannersManagementProps {
  banners: HeroBanner[];
  onEdit: (banner: HeroBanner) => void;
  onDelete: (id: string) => void;
  showForm: boolean;
  editingBanner: HeroBanner | null;
  onSave: (banner: Partial<HeroBanner>) => void;
  onCancel: () => void;
}

function BannersManagement({ 
  banners, 
  onEdit, 
  onDelete, 
  showForm, 
  editingBanner, 
  onSave, 
  onCancel 
}: BannersManagementProps) {
  return (
    <div className="space-y-6">
      {/* Banner Form */}
      {showForm && (
        <BannerForm
          banner={editingBanner}
          onSave={onSave}
          onCancel={onCancel}
        />
      )}

      {/* Banners List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          🖼️ Hero Banners ({banners.length})
        </h2>

        <div className="space-y-4">
          {banners.map(banner => (
            <div
              key={banner.id}
              className={`border rounded-lg p-4 ${
                banner.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Banner Image */}
                <div className="flex-shrink-0">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                </div>

                {/* Banner Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-sm text-gray-600 mt-1">{banner.subtitle}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span>ลำดับ: {banner.priority}</span>
                        <span className={banner.isActive ? 'text-green-600' : 'text-red-600'}>
                          {banner.isActive ? '● Active' : '○ Inactive'}
                        </span>
                        {banner.ctaLabel && (
                          <span>CTA: {banner.ctaLabel}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(banner)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => onDelete(banner.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {banners.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              ยังไม่มี Banner <br />
              <span className="text-sm">คลิกปุ่ม &quot;เพิ่ม Banner&quot; เพื่อสร้างใหม่</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Banner Form Component
// ============================================

interface BannerFormProps {
  banner: HeroBanner | null;
  onSave: (banner: Partial<HeroBanner>) => void;
  onCancel: () => void;
}

function BannerForm({ banner, onSave, onCancel }: BannerFormProps) {
  const [formData, setFormData] = useState<Partial<HeroBanner>>({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    ctaLabel: banner?.ctaLabel || '',
    ctaLink: banner?.ctaLink || '',
    imageUrl: banner?.imageUrl || '',
    priority: banner?.priority || 0,
    isActive: banner?.isActive !== undefined ? banner.isActive : true,
    startDate: banner?.startDate || '',
    endDate: banner?.endDate || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.imageUrl) {
      alert('กรุณากรอก Title และ Image URL');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {banner ? 'แก้ไข Banner' : 'เพิ่ม Banner ใหม่'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Title */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          {/* Subtitle */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* CTA Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Label
            </label>
            <input
              type="text"
              value={formData.ctaLabel}
              onChange={(e) => setFormData(prev => ({ ...prev, ctaLabel: e.target.value }))}
              placeholder="เช่น: เริ่มต้นใช้งาน"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* CTA Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Link
            </label>
            <input
              type="text"
              value={formData.ctaLink}
              onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
              placeholder="/search"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority (ลำดับ)
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">เลขมากแสดงก่อน</p>
          </div>

          {/* Active Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </label>
            <label className="flex items-center gap-3 mt-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
              />
              <span className="text-sm">เปิดใช้งาน</span>
            </label>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่เริ่ม
            </label>
            <input
              type="datetime-local"
              value={formData.startDate ? new Date(formData.startDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่สิ้นสุด
            </label>
            <input
              type="datetime-local"
              value={formData.endDate ? new Date(formData.endDate).toISOString().slice(0, 16) : ''}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Image Upload with Drag & Drop */}
          <div className="col-span-2">
            <ImageUploadZone
              value={formData.imageUrl || ''}
              onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              folder="banners"
              maxSize={10}
              maxWidth={1920}
              maxHeight={1080}
              quality={0.85}
              enableCompression={true}
              label="รูปภาพ Banner"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            {banner ? 'บันทึกการแก้ไข' : 'สร้าง Banner'}
          </button>
        </div>
      </form>
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
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // ใช้ folder 'logos' สำหรับ favicon, logo, icon (รองรับ .ico)
      const folder = setting.key.includes('logo') || setting.key.includes('favicon') || setting.key.includes('icon') 
        ? 'logos' 
        : 'uploads';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

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
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-16 h-16 rounded-lg cursor-pointer border border-gray-300"
            />
            
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            
            <div
              className="w-24 h-16 rounded-lg border-2 border-gray-300"
              style={{ backgroundColor: value }}
            />
          </div>
        )}

        {setting.dataType === 'image' && (
          <div className="space-y-3">
            {value && (
              <div className="relative inline-block">
                <img
                  src={value}
                  alt={setting.label}
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

            <div className="flex gap-3">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder="URL รูปภาพ"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              
              <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                <input
                  type="file"
                  accept={setting.key.includes('logo') || setting.key.includes('favicon') || setting.key.includes('icon') 
                    ? 'image/png,image/svg+xml,image/webp,image/x-icon,image/vnd.microsoft.icon,.ico' 
                    : 'image/*'}
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>
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
