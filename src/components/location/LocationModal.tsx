// components/location/LocationModal.tsx
"use client";

import { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import GPSButton from './GPSButton';
import LocationPicker from './LocationPicker';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const { setManualLocation, location } = useLocation();
  const [activeTab, setActiveTab] = useState<'gps' | 'manual'>('gps');

  const handleManualSelect = async (provinceId: number, amphureId: number, tambonId: number) => {
    await setManualLocation(provinceId, amphureId, tambonId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              เลือกพื้นที่ของคุณ
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Location Display */}
        {location && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-900">
              ตำแหน่งปัจจุบัน: <span className="font-semibold">
                {location.tambonName && `ต.${location.tambonName} `}
                {location.amphureName && `อ.${location.amphureName} `}
                {location.provinceName && `จ.${location.provinceName}`}
              </span>
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('gps')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'gps'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            ใช้ GPS (แนะนำ)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'manual'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            เลือกเอง
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          {activeTab === 'gps' ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                เราจะใช้ตำแหน่ง GPS ของคุณเพื่อแสดงร้านค้าและโฆษณาที่อยู่ใกล้คุณมากที่สุด
              </p>
              <GPSButton />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                เลือกจังหวัด อำเภอ และตำบลที่คุณอยู่ หรือต้องการค้นหาร้านค้า
              </p>
              <LocationPicker
                onLocationSelect={handleManualSelect}
                initialProvince={location?.provinceId || undefined}
                initialAmphure={location?.amphureId || undefined}
                initialTambon={location?.tambonId || undefined}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
