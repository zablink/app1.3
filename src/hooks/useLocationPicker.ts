// hooks/useLocationPicker.ts
"use client";

import { useState, useEffect, useCallback } from 'react';

interface Province {
  id: number;
  name_th: string;
  name_en: string;
}

interface Amphure {
  id: number;
  name_th: string;
  name_en: string;
  province_id: number;
}

interface Tambon {
  id: number;
  name_th: string;
  name_en: string;
  amphure_id: number;
  zip_code: string | null;
}

interface UseLocationPickerReturn {
  provinces: Province[];
  amphures: Amphure[];
  tambons: Tambon[];
  
  selectedProvince: number | null;
  selectedAmphure: number | null;
  selectedTambon: number | null;
  
  setProvince: (id: number) => void;
  setAmphure: (id: number) => void;
  setTambon: (id: number) => void;
  
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook สำหรับเลือกจังหวัด/อำเภอ/ตำบล แบบ cascade
 */
export function useLocationPicker(
  initialProvince?: number,
  initialAmphure?: number,
  initialTambon?: number
): UseLocationPickerReturn {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [amphures, setAmphures] = useState<Amphure[]>([]);
  const [tambons, setTambons] = useState<Tambon[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<number | null>(initialProvince || null);
  const [selectedAmphure, setSelectedAmphure] = useState<number | null>(initialAmphure || null);
  const [selectedTambon, setSelectedTambon] = useState<number | null>(initialTambon || null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // โหลดจังหวัดทั้งหมด
  useEffect(() => {
    async function fetchProvinces() {
      try {
        const response = await fetch('/api/location/provinces');
        if (!response.ok) throw new Error('Failed to fetch provinces');
        const data = await response.json();
        setProvinces(data);
      } catch (err) {
        console.error('Error fetching provinces:', err);
        setError('ไม่สามารถโหลดข้อมูลจังหวัดได้');
      }
    }
    fetchProvinces();
  }, []);

  // โหลดอำเภอเมื่อเลือกจังหวัด
  useEffect(() => {
    if (!selectedProvince) {
      setAmphures([]);
      return;
    }

    async function fetchAmphures() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/location/amphures?provinceId=${selectedProvince}`);
        if (!response.ok) throw new Error('Failed to fetch amphures');
        const data = await response.json();
        setAmphures(data);
      } catch (err) {
        console.error('Error fetching amphures:', err);
        setError('ไม่สามารถโหลดข้อมูลอำเภอได้');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAmphures();
  }, [selectedProvince]);

  // โหลดตำบลเมื่อเลือกอำเภอ
  useEffect(() => {
    if (!selectedAmphure) {
      setTambons([]);
      return;
    }

    async function fetchTambons() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/location/tambons?amphureId=${selectedAmphure}`);
        if (!response.ok) throw new Error('Failed to fetch tambons');
        const data = await response.json();
        setTambons(data);
      } catch (err) {
        console.error('Error fetching tambons:', err);
        setError('ไม่สามารถโหลดข้อมูลตำบลได้');
      } finally {
        setIsLoading(false);
      }
    }
    fetchTambons();
  }, [selectedAmphure]);

  const setProvince = useCallback((id: number) => {
    setSelectedProvince(id);
    setSelectedAmphure(null); // Reset
    setSelectedTambon(null); // Reset
  }, []);

  const setAmphure = useCallback((id: number) => {
    setSelectedAmphure(id);
    setSelectedTambon(null); // Reset
  }, []);

  const setTambon = useCallback((id: number) => {
    setSelectedTambon(id);
  }, []);

  return {
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
  };
}
