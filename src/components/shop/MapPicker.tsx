// components/shop/MapPicker.tsx
"use client";

import { useState } from 'react';
import { MapPin, Navigation, Loader } from 'lucide-react';

interface MapPickerProps {
  initialPosition?: {
    lat: number;
    lng: number;
  };
  onLocationChange: (location: {
    lat: number;
    lng: number;
  }) => void;
}

export default function MapPicker({ initialPosition, onLocationChange }: MapPickerProps) {
  const [useGPS, setUseGPS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState(initialPosition || { lat: 13.7563, lng: 100.5018 });

  const handleGPSLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ของคุณไม่รองรับ GPS');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const newLocation = { lat, lng };
        
        setCurrentLocation(newLocation);
        onLocationChange(newLocation);
        setError(null);
        setLoading(false);
        setUseGPS(false);
      },
      (err) => {
        console.error('GPS Error:', err);
        let errorMessage = 'ไม่สามารถเข้าถึง GPS ได้';
        
        switch(err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'กรุณาอนุญาตให้เข้าถึงตำแหน่งในการตั้งค่าเบราว์เซอร์';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'ไม่สามารถระบุตำแหน่งได้ กรุณาลองใหม่อีกครั้ง';
            break;
          case err.TIMEOUT:
            errorMessage = 'หมดเวลาในการค้นหาตำแหน่ง กรุณาลองใหม่';
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  const handleManualLocationChange = (lat: number, lng: number) => {
    const newLocation = { lat, lng };
    setCurrentLocation(newLocation);
    onLocationChange(newLocation);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          ระบุตำแหน่งร้านค้าบนแผนที่
        </label>
        <button
          type="button"
          onClick={() => setUseGPS(!useGPS)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {useGPS ? 'ปิด GPS' : 'ใช้ GPS'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {useGPS && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGPSLocation}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                กำลังค้นหาตำแหน่ง...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                ใช้ตำแหน่งปัจจุบัน
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center">
            เปิด GPS บนอุปกรณ์และอนุญาตให้เข้าถึงตำแหน่ง
          </p>
        </div>
      )}

      {/* แผนที่แสดงตำแหน่งปัจจุบัน */}
      {currentLocation && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">ตำแหน่งที่บันทึก:</p>
              <p className="text-xs mt-1">
                Latitude: {currentLocation.lat.toFixed(6)}
              </p>
              <p className="text-xs">
                Longitude: {currentLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
