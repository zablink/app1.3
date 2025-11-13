// components/location/GPSButton.tsx
"use client";

import { useState } from 'react';
import { Navigation, Loader, AlertTriangle, Target, RefreshCw } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

export default function GPSButton() {
  const { requestLocation, isLoading, error, gpsValidation, clearError } = useLocation();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    clearError();
    requestLocation();
  };

  return (
    <div className="space-y-3">
      <button
        onClick={requestLocation}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            กำลังค้นหาตำแหน่ง...
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5" />
            ใช้ตำแหน่งปัจจุบันของคุณ
          </>
        )}
      </button>

      {/* GPS Accuracy Warning */}
      {gpsValidation && gpsValidation.warning && (
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          gpsValidation.isValid
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">
              {gpsValidation.warning}
            </p>
            <div className="flex items-center gap-2 text-xs">
              <Target className="w-4 h-4" />
              ความแม่นยำ: ±{Math.round(gpsValidation.accuracy)} เมตร
            </div>
            {gpsValidation.shouldRetry && (
              <button
                onClick={handleRetry}
                className="mt-2 flex items-center gap-1 text-sm font-medium hover:underline"
              >
                <RefreshCw className="w-4 h-4" />
                ลองใหม่ ({retryCount > 0 ? `ครั้งที่ ${retryCount + 1}` : 'ครั้งแรก'})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !gpsValidation && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              {error.includes('ปิดการเข้าถึง') && (
                <p className="text-xs mt-2">
                  วิธีแก้ไข: ไปที่การตั้งค่าเบราว์เซอร์ &gt; สิทธิ์ &gt; เปิดใช้งานตำแหน่ง
                </p>
              )}
              <button
                onClick={handleRetry}
                className="mt-2 flex items-center gap-1 text-sm font-medium hover:underline"
              >
                <RefreshCw className="w-4 h-4" />
                ลองอีกครั้ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 เคล็ดลับ:</p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>เปิด GPS บนอุปกรณ์ของคุณ</li>
          <li>ออกไปข้างนอกอาคารเพื่อสัญญาณที่ดีขึ้น</li>
          <li>อนุญาตให้เบราว์เซอร์เข้าถึงตำแหน่งของคุณ</li>
        </ul>
      </div>
    </div>
  );
}
