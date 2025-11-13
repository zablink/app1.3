// components/shop/MapPicker.tsx
"use client";

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader } from 'lucide-react';
import LocationPicker from '@/components/location/LocationPicker';

interface MapPickerProps {
  initialLocation?: {
    lat: number;
    lng: number;
    provinceId?: number;
    amphureId?: number;
    tambonId?: number;
  };
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    provinceId: number;
    amphureId: number;
    tambonId: number;
  }) => void;
}

export default function MapPicker({ initialLocation, onLocationSelect }: MapPickerProps) {
  const [useGPS, setUseGPS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGPSLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ของคุณไม่รองรับ GPS');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        try {
          // Reverse geocode to get location IDs
          const response = await fetch('/api/location/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, accuracy: position.coords.accuracy })
          });

          if (!response.ok) throw new Error('ไม่สามารถระบุตำแหน่งได้');

          const locationData = await response.json();

          onLocationSelect({
            lat,
            lng,
            provinceId: locationData.provinceId,
            amphureId: locationData.amphureId,
            tambonId: locationData.tambonId
          });

          setUseGPS(false);
        } catch (err) {
          setError('ไม่สามารถระบุตำแหน่งได้ กรุณาเลือกด้วยตนเอง');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('ไม่สามารถเข้าถึง GPS ได้ กรุณาเลือกตำแหน่งด้วยตนเอง');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleManualSelect = (provinceId: number, amphureId: number, tambonId: number) => {
    onLocationSelect({
      lat: 0,
      lng: 0,
      provinceId,
      amphureId,
      tambonId
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-700">
          ที่อยู่ร้านค้า
        </label>
        <button
          type="button"
          onClick={() => setUseGPS(!useGPS)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {useGPS ? 'เลือกเอง' : 'ใช้ GPS'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {useGPS ? (
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
      ) : (
        <LocationPicker
          onLocationSelect={handleManualSelect}
          initialProvince={initialLocation?.provinceId}
          initialAmphure={initialLocation?.amphureId}
          initialTambon={initialLocation?.tambonId}
        />
      )}

      {initialLocation && initialLocation.lat !== 0 && initialLocation.lng !== 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">ตำแหน่ง GPS ที่บันทึก:</p>
              <p className="text-xs mt-1">
                Lat: {initialLocation.lat.toFixed(6)}, Lng: {initialLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
