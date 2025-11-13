// components/location/LocationPicker.tsx
"use client";

import { useLocationPicker } from '@/hooks/useLocationPicker';
import { MapPin, Loader } from 'lucide-react';

interface LocationPickerProps {
  onLocationSelect: (provinceId: number, amphureId: number, tambonId: number) => void;
  initialProvince?: number;
  initialAmphure?: number;
  initialTambon?: number;
}

export default function LocationPicker({
  onLocationSelect,
  initialProvince,
  initialAmphure,
  initialTambon
}: LocationPickerProps) {
  const {
    provinces,
    amphures,
    tambons,
    selectedProvince,
    selectedAmphure,
    selectedTambon,
    setProvince,
    setAmphure,
    setTambon,
    isLoading,
    error
  } = useLocationPicker(initialProvince, initialAmphure, initialTambon);

  // เมื่อเลือกครบทั้ง 3 ระดับ
  const handleTambonSelect = (tambonId: number) => {
    setTambon(tambonId);
    if (selectedProvince && selectedAmphure) {
      onLocationSelect(selectedProvince, selectedAmphure, tambonId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700 mb-2">
        <MapPin className="w-5 h-5" />
        <h3 className="font-medium">เลือกพื้นที่ของคุณ</h3>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* จังหวัด */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            จังหวัด
          </label>
          <select
            value={selectedProvince || ''}
            onChange={(e) => setProvince(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">เลือกจังหวัด</option>
            {provinces.map((province) => (
              <option key={province.id} value={province.id}>
                {province.name_th}
              </option>
            ))}
          </select>
        </div>

        {/* อำเภอ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            อำเภอ/เขต
          </label>
          <select
            value={selectedAmphure || ''}
            onChange={(e) => setAmphure(parseInt(e.target.value))}
            disabled={!selectedProvince || isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">เลือกอำเภอ/เขต</option>
            {amphures.map((amphure) => (
              <option key={amphure.id} value={amphure.id}>
                {amphure.name_th}
              </option>
            ))}
          </select>
          {isLoading && selectedProvince && !selectedAmphure && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Loader className="w-4 h-4 animate-spin" />
              กำลังโหลด...
            </div>
          )}
        </div>

        {/* ตำบล */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ตำบล/แขวง
          </label>
          <select
            value={selectedTambon || ''}
            onChange={(e) => handleTambonSelect(parseInt(e.target.value))}
            disabled={!selectedAmphure || isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">เลือกตำบล/แขวง</option>
            {tambons.map((tambon) => (
              <option key={tambon.id} value={tambon.id}>
                {tambon.name_th}
                {tambon.zip_code && ` (${tambon.zip_code})`}
              </option>
            ))}
          </select>
          {isLoading && selectedAmphure && !selectedTambon && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Loader className="w-4 h-4 animate-spin" />
              กำลังโหลด...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
