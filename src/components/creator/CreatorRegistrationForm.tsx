// src/components/creator/CreatorRegistrationForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LocationData {
  provinces: any[];
  amphures: any[];
  tambons: any[];
}

export const CreatorRegistrationForm: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: '',
    phone: '',
    lineId: '',
    tiktokUrl: '',
    youtubeUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    provinceId: 0,
    amphureId: 0,
    tambonId: 0,
    coverageLevel: 'tambon' as 'tambon' | 'amphure' | 'province',
  });

  // Location data
  const [locations, setLocations] = useState<LocationData>({
    provinces: [],
    amphures: [],
    tambons: [],
  });

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Fetch amphures when province changes
  useEffect(() => {
    if (formData.provinceId) {
      fetchAmphures(formData.provinceId);
    }
  }, [formData.provinceId]);

  // Fetch tambons when amphure changes
  useEffect(() => {
    if (formData.amphureId) {
      fetchTambons(formData.amphureId);
    }
  }, [formData.amphureId]);

  const fetchProvinces = async () => {
    try {
      const response = await fetch('/api/locations?type=provinces');
      const result = await response.json();
      if (result.success) {
        setLocations(prev => ({ ...prev, provinces: result.data }));
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const fetchAmphures = async (provinceId: number) => {
    try {
      const response = await fetch(`/api/locations?type=amphures&provinceId=${provinceId}`);
      const result = await response.json();
      if (result.success) {
        setLocations(prev => ({ ...prev, amphures: result.data, tambons: [] }));
        setFormData(prev => ({ ...prev, amphureId: 0, tambonId: 0 }));
      }
    } catch (error) {
      console.error('Error fetching amphures:', error);
    }
  };

  const fetchTambons = async (amphureId: number) => {
    try {
      const response = await fetch(`/api/locations?type=tambons&amphureId=${amphureId}`);
      const result = await response.json();
      if (result.success) {
        setLocations(prev => ({ ...prev, tambons: result.data }));
        setFormData(prev => ({ ...prev, tambonId: 0 }));
      }
    } catch (error) {
      console.error('Error fetching tambons:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/creator/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert('สมัครสำเร็จ! รอการอนุมัติจากแอดมิน');
        window.location.href = '/creator/dashboard';
      } else {
        alert(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">สมัครเป็น Content Creator</h1>
        <p className="text-gray-600 mb-8">กรอกข้อมูลเพื่อเริ่มรับงานรีวิวร้านอาหารในพื้นที่ของคุณ</p>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>1</div>
            <span className="ml-2 hidden sm:inline">ข้อมูลส่วนตัว</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200"></div>
          <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>2</div>
            <span className="ml-2 hidden sm:inline">Social Media</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200"></div>
          <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>3</div>
            <span className="ml-2 hidden sm:inline">พื้นที่บริการ</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">ข้อมูลส่วนตัว</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อที่แสดง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="ชื่อที่จะแสดงในระบบ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เกี่ยวกับคุณ
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="บอกเล่าเกี่ยวกับประสบการณ์ทำคอนเทนต์ของคุณ..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0xx-xxx-xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LINE ID
                </label>
                <input
                  type="text"
                  value={formData.lineId}
                  onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="@your-line-id"
                />
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                ถัดไป
              </button>
            </div>
          )}

          {/* Step 2: Social Media */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Social Media</h2>
              <p className="text-sm text-gray-600 mb-4">กรอกลิงก์โซเชียลมีเดียของคุณ (อย่างน้อย 1 ช่อง)</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TikTok URL
                </label>
                <input
                  type="url"
                  value={formData.tiktokUrl}
                  onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://www.tiktok.com/@username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://www.youtube.com/@channelname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://www.facebook.com/pagename"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://www.instagram.com/username"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Coverage Area */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">พื้นที่บริการ</h2>
              <p className="text-sm text-gray-600 mb-4">เลือกพื้นที่ที่คุณสะดวกรับงานรีวิว</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จังหวัด <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.provinceId}
                  onChange={(e) => setFormData({ ...formData, provinceId: parseInt(e.target.value) })}
                  required
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">เลือกจังหวัด</option>
                  {locations.provinces.map((p) => (
                    <option key={p.id} value={p.id}>{p.name_th}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อำเภอ {formData.coverageLevel !== 'province' && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={formData.amphureId}
                  onChange={(e) => setFormData({ ...formData, amphureId: parseInt(e.target.value) })}
                  required={formData.coverageLevel !== 'province'}
                  disabled={!formData.provinceId}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  <option value="">เลือกอำเภอ</option>
                  {locations.amphures.map((a) => (
                    <option key={a.id} value={a.id}>{a.name_th}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ตำบล {formData.coverageLevel === 'tambon' && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={formData.tambonId}
                  onChange={(e) => setFormData({ ...formData, tambonId: parseInt(e.target.value) })}
                  required={formData.coverageLevel === 'tambon'}
                  disabled={!formData.amphureId}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  <option value="">เลือกตำบล</option>
                  {locations.tambons.map((t) => (
                    <option key={t.id} value={t.id}>{t.name_th}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  ระดับพื้นที่ที่รับงาน <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="tambon"
                      checked={formData.coverageLevel === 'tambon'}
                      onChange={(e) => setFormData({ ...formData, coverageLevel: e.target.value as any })}
                      className="mr-2"
                    />
                    <span className="text-sm">เฉพาะตำบลที่เลือก</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="amphure"
                      checked={formData.coverageLevel === 'amphure'}
                      onChange={(e) => setFormData({ ...formData, coverageLevel: e.target.value as any })}
                      className="mr-2"
                    />
                    <span className="text-sm">ทั้งอำเภอที่เลือก</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="province"
                      checked={formData.coverageLevel === 'province'}
                      onChange={(e) => setFormData({ ...formData, coverageLevel: e.target.value as any })}
                      className="mr-2"
                    />
                    <span className="text-sm">ทั้งจังหวัดที่เลือก</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'กำลังส่งข้อมูล...' : 'ส่งใบสมัคร'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};