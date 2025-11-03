// components/CoverageAreaSelector.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Plus, MapPin, AlertCircle } from "lucide-react";

interface Location {
  id: number;
  name_th: string;
  name_en: string;
}

interface SelectedArea {
  id: number;
  name: string;
  type: 'province' | 'amphure' | 'tambon';
}

interface CoverageAreaSelectorProps {
  coverageLevel: 'tambon' | 'amphure' | 'province';
  selectedAreas: SelectedArea[];
  onAreasChange: (areas: SelectedArea[]) => void;
  maxSelections?: number;
}

export default function CoverageAreaSelector({
  coverageLevel,
  selectedAreas,
  onAreasChange,
  maxSelections = 5,
}: CoverageAreaSelectorProps) {
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [amphures, setAmphures] = useState<Location[]>([]);
  const [tambons, setTambons] = useState<Location[]>([]);
  
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedAmphureId, setSelectedAmphureId] = useState<string>("");
  const [selectedTambonId, setSelectedTambonId] = useState<string>("");

  // Load provinces
  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      const res = await fetch("/api/locations?type=provinces");
      const data = await res.json();
      setProvinces(data.data || []);
    } catch (error) {
      console.error("Error fetching provinces:", error);
    }
  };

  // Load amphures when province selected
  useEffect(() => {
    if (selectedProvinceId && coverageLevel !== 'province') {
      fetchAmphures(selectedProvinceId);
    }
  }, [selectedProvinceId, coverageLevel]);

  const fetchAmphures = async (provinceId: string) => {
    try {
      const res = await fetch(`/api/locations?type=amphures&provinceId=${provinceId}`);
      const data = await res.json();
      setAmphures(data.data || []);
    } catch (error) {
      console.error("Error fetching amphures:", error);
    }
  };

  // Load tambons when amphure selected
  useEffect(() => {
    if (selectedAmphureId && coverageLevel === 'tambon') {
      fetchTambons(selectedAmphureId);
    }
  }, [selectedAmphureId, coverageLevel]);

  const fetchTambons = async (amphureId: string) => {
    try {
      const res = await fetch(`/api/locations?type=tambons&amphureId=${amphureId}`);
      const data = await res.json();
      setTambons(data.data || []);
    } catch (error) {
      console.error("Error fetching tambons:", error);
    }
  };

  // Add selected area
  const handleAddArea = () => {
    if (selectedAreas.length >= maxSelections) {
      alert(`เลือกได้สูงสุด ${maxSelections} พื้นที่`);
      return;
    }

    let newArea: SelectedArea | null = null;

    if (coverageLevel === 'province' && selectedProvinceId) {
      const province = provinces.find(p => p.id.toString() === selectedProvinceId);
      if (province) {
        // Check if already selected
        if (selectedAreas.some(a => a.id === province.id && a.type === 'province')) {
          alert('จังหวัดนี้ถูกเลือกแล้ว');
          return;
        }
        newArea = {
          id: province.id,
          name: province.name_th,
          type: 'province',
        };
      }
    } else if (coverageLevel === 'amphure' && selectedAmphureId) {
      const amphure = amphures.find(a => a.id.toString() === selectedAmphureId);
      if (amphure) {
        if (selectedAreas.some(a => a.id === amphure.id && a.type === 'amphure')) {
          alert('อำเภอนี้ถูกเลือกแล้ว');
          return;
        }
        newArea = {
          id: amphure.id,
          name: amphure.name_th,
          type: 'amphure',
        };
      }
    } else if (coverageLevel === 'tambon' && selectedTambonId) {
      const tambon = tambons.find(t => t.id.toString() === selectedTambonId);
      if (tambon) {
        if (selectedAreas.some(a => a.id === tambon.id && a.type === 'tambon')) {
          alert('ตำบลนี้ถูกเลือกแล้ว');
          return;
        }
        newArea = {
          id: tambon.id,
          name: tambon.name_th,
          type: 'tambon',
        };
      }
    }

    if (newArea) {
      onAreasChange([...selectedAreas, newArea]);
      // Reset selections
      if (coverageLevel === 'province') {
        setSelectedProvinceId("");
      } else if (coverageLevel === 'amphure') {
        setSelectedAmphureId("");
      } else if (coverageLevel === 'tambon') {
        setSelectedTambonId("");
      }
    }
  };

  // Remove area
  const handleRemoveArea = (index: number) => {
    const newAreas = selectedAreas.filter((_, i) => i !== index);
    onAreasChange(newAreas);
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 mb-1">
            เลือกพื้นที่ที่ต้องการรับงาน
          </p>
          <p className="text-sm text-blue-800">
            {coverageLevel === 'province' && `เลือกจังหวัดที่คุณพร้อมรับงาน (สูงสุด ${maxSelections} จังหวัด)`}
            {coverageLevel === 'amphure' && `เลือกอำเภอที่คุณพร้อมรับงาน (สูงสุด ${maxSelections} อำเภอ)`}
            {coverageLevel === 'tambon' && `เลือกตำบลที่คุณพร้อมรับงาน (สูงสุด ${maxSelections} ตำบล)`}
          </p>
        </div>
      </div>

      {/* Selection Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Province Selector */}
        {coverageLevel === 'province' ? (
          // For province level, only show province dropdown
          <>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกจังหวัด
              </label>
              <select
                value={selectedProvinceId}
                onChange={(e) => setSelectedProvinceId(e.target.value)}
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
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddArea}
                disabled={!selectedProvinceId || selectedAreas.length >= maxSelections}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                เพิ่ม
              </button>
            </div>
          </>
        ) : coverageLevel === 'amphure' ? (
          // For amphure level, show province and amphure dropdowns
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จังหวัด
              </label>
              <select
                value={selectedProvinceId}
                onChange={(e) => {
                  setSelectedProvinceId(e.target.value);
                  setSelectedAmphureId("");
                }}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกอำเภอ
              </label>
              <select
                value={selectedAmphureId}
                onChange={(e) => setSelectedAmphureId(e.target.value)}
                disabled={!selectedProvinceId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">เลือกอำเภอ</option>
                {amphures.map((amphure) => (
                  <option key={amphure.id} value={amphure.id}>
                    {amphure.name_th}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddArea}
                disabled={!selectedAmphureId || selectedAreas.length >= maxSelections}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                เพิ่ม
              </button>
            </div>
          </>
        ) : (
          // For tambon level, show all three dropdowns
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จังหวัด
              </label>
              <select
                value={selectedProvinceId}
                onChange={(e) => {
                  setSelectedProvinceId(e.target.value);
                  setSelectedAmphureId("");
                  setSelectedTambonId("");
                }}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                อำเภอ
              </label>
              <select
                value={selectedAmphureId}
                onChange={(e) => {
                  setSelectedAmphureId(e.target.value);
                  setSelectedTambonId("");
                }}
                disabled={!selectedProvinceId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">เลือกอำเภอ</option>
                {amphures.map((amphure) => (
                  <option key={amphure.id} value={amphure.id}>
                    {amphure.name_th}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกตำบล
              </label>
              <select
                value={selectedTambonId}
                onChange={(e) => setSelectedTambonId(e.target.value)}
                disabled={!selectedAmphureId}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">เลือกตำบล</option>
                {tambons.map((tambon) => (
                  <option key={tambon.id} value={tambon.id}>
                    {tambon.name_th}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddArea}
                disabled={!selectedTambonId || selectedAreas.length >= maxSelections}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                เพิ่ม
              </button>
            </div>
          </>
        )}
      </div>

      {/* Selected Areas Display */}
      {selectedAreas.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            พื้นที่ที่เลือก ({selectedAreas.length}/{maxSelections})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedAreas.map((area, index) => (
              <div
                key={`${area.type}-${area.id}-${index}`}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg"
              >
                <MapPin size={16} />
                <span className="text-sm font-medium">{area.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveArea(index)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Message */}
      {selectedAreas.length === 0 && (
        <p className="text-sm text-red-600">
          ⚠️ กรุณาเลือกพื้นที่อย่างน้อย 1 แห่ง
        </p>
      )}
    </div>
  );
}