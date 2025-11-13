// contexts/LocationContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LocationInfo, Coordinates, GPSValidation } from '@/lib/location-service';
import { DEFAULT_LOCATION } from '@/lib/location-service';

interface LocationContextType {
  // Current location
  location: LocationInfo | null;
  isLoading: boolean;
  error: string | null;
  
  // GPS validation
  gpsValidation: GPSValidation | null;
  
  // Actions
  requestLocation: () => Promise<void>;
  setManualLocation: (provinceId: number, amphureId: number, tambonId: number) => Promise<void>;
  clearError: () => void;
  
  // Settings
  hasPermission: boolean | null;
  useManualLocation: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gpsValidation, setGpsValidation] = useState<GPSValidation | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [useManualLocation, setUseManualLocation] = useState(false);

  /**
   * ขอตำแหน่ง GPS จาก browser
   */
  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // เช็ค permission API ก่อน (ถ้ามี)
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setHasPermission(result.state === 'granted');
        
        if (result.state === 'denied') {
          setError('คุณได้ปิดการเข้าถึงตำแหน่งไว้ กรุณาเปิดในการตั้งค่าเบราว์เซอร์');
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn('Permission API not supported');
      }
    }

    // ขอตำแหน่ง GPS
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ของคุณไม่รองรับ GPS');
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setError('ใช้เวลานานเกินไป กรุณาลองใหม่หรือเลือกตำแหน่งด้วยตนเอง');
      setIsLoading(false);
    }, 15000); // 15 วินาที

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        
        const coords = position.coords;
        
        // ตรวจสอบ accuracy
        const validation = validateGPSAccuracy(coords);
        setGpsValidation(validation);

        try {
          // แปลง GPS -> ตำบล/อำเภอ/จังหวัด
          const response = await fetch('/api/location/reverse-geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: coords.latitude,
              lng: coords.longitude,
              accuracy: coords.accuracy
            })
          });

          if (!response.ok) {
            throw new Error('ไม่สามารถระบุตำแหน่งได้');
          }

          const locationData: LocationInfo = await response.json();
          
          setLocation(locationData);
          setHasPermission(true);
          setError(null);
          
          // บันทึกลง localStorage
          localStorage.setItem('user_location', JSON.stringify(locationData));
          
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setError('ไม่สามารถระบุตำแหน่งได้ กรุณาเลือกตำแหน่งด้วยตนเอง');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        clearTimeout(timeoutId);
        console.error('Geolocation error:', err);
        
        let errorMessage = 'ไม่สามารถระบุตำแหน่งได้';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'คุณได้ปิดการเข้าถึงตำแหน่ง กรุณาเปิดในการตั้งค่า';
            setHasPermission(false);
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'ไม่สามารถหาตำแหน่งได้ กรุณาเปิด GPS';
            break;
          case err.TIMEOUT:
            errorMessage = 'หมดเวลาในการหาตำแหน่ง กรุณาลองใหม่';
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }, []);

  /**
   * ตั้งตำแหน่งแบบ manual (เลือกเอง)
   */
  const setManualLocation = useCallback(async (
    provinceId: number,
    amphureId: number,
    tambonId: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/location/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provinceId, amphureId, tambonId })
      });

      if (!response.ok) {
        throw new Error('ไม่สามารถบันทึกตำแหน่งได้');
      }

      const locationData: LocationInfo = await response.json();
      
      setLocation(locationData);
      setUseManualLocation(true);
      setGpsValidation(null);
      
      // บันทึกลง localStorage
      localStorage.setItem('user_location', JSON.stringify(locationData));
      localStorage.setItem('use_manual_location', 'true');
      
    } catch (err) {
      console.error('Manual location failed:', err);
      setError('ไม่สามารถบันทึกตำแหน่งได้');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * ลบ error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * โหลดตำแหน่งจาก localStorage เมื่อเริ่มต้น
   */
  useEffect(() => {
    const savedLocation = localStorage.getItem('user_location');
    const savedManual = localStorage.getItem('use_manual_location');
    
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocation(parsed);
        setUseManualLocation(savedManual === 'true');
        setIsLoading(false);
      } catch (e) {
        console.error('Failed to parse saved location');
        requestLocation(); // ลองขออีกครั้ง
      }
    } else {
      requestLocation(); // ขอครั้งแรก
    }
  }, [requestLocation]);

  const value: LocationContextType = {
    location,
    isLoading,
    error,
    gpsValidation,
    requestLocation,
    setManualLocation,
    clearError,
    hasPermission,
    useManualLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

/**
 * Hook สำหรับใช้งาน LocationContext
 */
export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}

/**
 * Helper function: ตรวจสอบความแม่นยำของ GPS
 */
function validateGPSAccuracy(coords: GeolocationCoordinates): GPSValidation {
  const accuracy = coords.accuracy;

  if (accuracy <= 50) {
    return { isValid: true, accuracy };
  }

  if (accuracy <= 200) {
    return {
      isValid: true,
      accuracy,
      warning: 'ตำแหน่ง GPS ไม่แม่นยำมาก (±' + Math.round(accuracy) + 'ม.)'
    };
  }

  if (accuracy <= 500) {
    return {
      isValid: true,
      accuracy,
      warning: 'ตำแหน่ง GPS ไม่แม่นยำ (±' + Math.round(accuracy) + 'ม.) แนะนำให้ลองใหม่',
      shouldRetry: true
    };
  }

  return {
    isValid: false,
    accuracy,
    warning: 'ตำแหน่ง GPS ไม่แม่นยำมาก (±' + Math.round(accuracy) + 'ม.) กรุณาเลือกตำแหน่งด้วยตนเอง',
    shouldRetry: true
  };
}

export default LocationContext;
