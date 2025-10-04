// src/app/shop/edit/[id]/page.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type * as L from 'leaflet';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// -------------------------------------------------------------------------
// 1. DATA AND INTERFACES
// -------------------------------------------------------------------------

interface LatLong {
  lat: number;
  lng: number;
}

// Interface for the shop data, aligned with your database schema
interface ShopData {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  lat: number | null; // double precision
  lng: number | null; // double precision
  address: string | null;
  categoryId: string;
  image: string | null; // Feature image
  
  // NEW FIELDS based on requirements
  hasPhysicalStore: boolean; // มีหน้าร้านหรือไม่
  showLocationOnMap: boolean; // ร้านจะให้โชว์พิกัดร้านก็ได้หรือไม่
  links: { type: string, url: string }[]; // Grab/Lineman/Website links
  gallery: string[]; // Additional images
}

// Mock initial data (Simulating API Fetch)
const MOCK_SHOP_ID = 'shop_123';
const INITIAL_SHOP_DATA: ShopData = {
  id: MOCK_SHOP_ID,
  ownerId: 'user_456',
  name: 'ร้านอาหารเจริญดี',
  description: 'ร้านนี้อร่อยมาก',
  lat: 13.7563, // Mock existing coordinate (Central Bangkok)
  lng: 100.5018, // Mock existing coordinate
  address: '123 ถนนสุขุมวิท กรุงเทพฯ',
  categoryId: 'food',
  image: '/path/to/feature_image.jpg',
  hasPhysicalStore: true,
  showLocationOnMap: false, // Default is false
  links: [
    { type: 'GrabFood', url: 'https://grab.com/shop123' },
    { type: 'Website', url: 'https://jareondee.com' }
  ],
  gallery: ['/path/to/img2.jpg', '/path/to/img3.jpg']
};


const InitialMapCenter: LatLong = { lat: 13.7367, lng: 100.5231 }; // Bangkok center (Fallback)
const InitialZoom = 13;


// -------------------------------------------------------------------------
// 2. MAP PICKER COMPONENT (No Search/Nominatim)
// -------------------------------------------------------------------------

interface MapPickerProps {
    initialCoords: LatLong | null;
    onCoordinateChange: (latLng: LatLong) => void;
}

const MapPickerComponent: React.FC<MapPickerProps> = ({ initialCoords, onCoordinateChange }) => {
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null); 
  const markerRef = useRef<L.Marker | null>(null);
  
  // Determine starting point: Use existing data, or default fallback
  const startingCoords = initialCoords || InitialMapCenter;

  const setupMap = useCallback((coordsToUse: LatLong, zoomToUse: number, LInstance: typeof L) => {
    if (mapRef.current) return;

    if (!document.getElementById('shop-map-container')) {
        console.error("Map container div not found!");
        return;
    }
    
    const map = LInstance.map('shop-map-container').setView([coordsToUse.lat, coordsToUse.lng], zoomToUse);
    mapRef.current = map;

    LInstance.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const marker = LInstance.marker([coordsToUse.lat, coordsToUse.lng]).addTo(map);
    markerRef.current = marker;
    onCoordinateChange(coordsToUse); // Set initial coordinates to form state

    // Handle map click event to update marker position
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = e.latlng.lat;
      const newLng = e.latlng.lng;
      
      markerRef.current?.setLatLng([newLat, newLng]);
      onCoordinateChange({ lat: newLat, lng: newLng });
    });
  }, [onCoordinateChange]);


  const handleLocateMe = useCallback(() => {
    if (!mapRef.current || !markerRef.current || !navigator.geolocation) {
        alert("ไม่รองรับ Geolocation หรือแผนที่ยังไม่พร้อม");
        return;
    }

    setIsLocating(true);
    
    // Request high accuracy for mobile devices
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const currentCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Move map and marker to the new location
        mapRef.current!.setView([currentCoords.lat, currentCoords.lng], 18); // Zoom very close
        markerRef.current!.setLatLng([currentCoords.lat, currentCoords.lng]);
        onCoordinateChange(currentCoords);
        setIsLocating(false);
      },
      (err: GeolocationPositionError) => {
        console.warn(`Geolocation Error (${err.code}): ${err.message}.`);
        alert("ไม่สามารถหาตำแหน่งปัจจุบันได้ โปรดตรวจสอบว่าอนุญาตให้เข้าถึงตำแหน่งในเบราว์เซอร์แล้ว");
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [onCoordinateChange]);


  // Initialization Effect
  useEffect(() => {
    import('leaflet').then(L => { 
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      
      const defaultZoom = initialCoords ? 16 : InitialZoom;

      // Use existing coordinates if available, otherwise attempt geolocation (optional)
      if (initialCoords) {
        setupMap(initialCoords, defaultZoom, L);
      } else if (navigator.geolocation) {
         // Fallback to Geolocation only if no initial coords found
         navigator.geolocation.getCurrentPosition(
            (position: GeolocationPosition) => {
                const currentCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
                setupMap(currentCoords, 16, L); 
            },
            () => {
                setupMap(InitialMapCenter, InitialZoom, L);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
          setupMap(InitialMapCenter, InitialZoom, L);
      }

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
          mapRef.current = null;
          markerRef.current = null;
        }
      };
    }).catch(error => console.error("Error loading Leaflet:", error));
  }, [initialCoords, setupMap]);


  return (
    <div className="space-y-4">
        <div id="shop-map-container" className="w-full h-[50vh] rounded-xl shadow-md border border-gray-200">
            {/* Map will be rendered here */}
        </div>
        <button
            onClick={handleLocateMe}
            disabled={isLocating}
            type="button"
            className={`w-full py-3 text-white rounded-lg transition duration-150 shadow-md ${isLocating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
            {isLocating ? 'กำลังค้นหาพิกัด...' : '📍 Reset พิกัดปัจจุบัน'}
        </button>
    </div>
  );
};

// Dynamic Import to disable Server-Side Rendering
const DynamicMapPicker = dynamic(() => Promise.resolve(MapPickerComponent), {
  ssr: false,
  loading: () => (
    <div className="p-4 w-full h-[55vh] flex items-center justify-center bg-gray-100 rounded-xl shadow-lg">
      <p className="text-lg text-gray-500 animate-pulse">กำลังโหลดแผนที่...</p>
    </div>
  ),
});


// -------------------------------------------------------------------------
// 3. MAIN SHOP ADMIN PAGE
// -------------------------------------------------------------------------

export default function ShopAdminEditPage() {
    const router = useRouter();
    // Use initial mock data for state management
    const [shop, setShop] = useState<ShopData>(INITIAL_SHOP_DATA);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            setShop(prev => ({ 
                ...prev, 
                [name]: (e.target as HTMLInputElement).checked 
            }));
        } else {
            setShop(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // Handler for map component
    const handleCoordinateChange = (latLng: LatLong) => {
        setShop(prev => ({
            ...prev,
            lat: latLng.lat,
            lng: latLng.lng,
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (shop.lat === null || shop.lng === null) {
            alert('กรุณาปักหมุดพิกัดร้านค้าก่อนบันทึก');
            return;
        }

        setStatus('saving');
        console.log('--- SAVING SHOP DATA ---');
        console.log(JSON.stringify(shop, null, 2));
        
        // Simulate API call to Supabase/Backend
        setTimeout(() => {
            setStatus('saved');
            console.log('Shop data saved successfully!');
            // In a real app, you might redirect here or show a success message
        }, 1500);
    };
    
    // Prepare initial coordinates for the map
    const initialMapCoords = (shop.lat !== null && shop.lng !== null) 
        ? { lat: shop.lat, lng: shop.lng } 
        : null;


    return (
        <div className="min-h-screen bg-gray-50 font-[Inter] p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    แก้ไขข้อมูลร้านค้า: {shop.name}
                </h1>
                <p className="text-gray-500 mb-8 border-b pb-4">
                    ID: {shop.id} | จัดการโดย Owner: {shop.ownerId}
                </p>

                <form onSubmit={handleSubmit} className="space-y-10">
                    
                    {/* --- SECTION 1: MAP AND COORDINATES --- */}
                    <div className="space-y-4 border p-6 rounded-xl bg-blue-50">
                        <h2 className="text-2xl font-bold text-blue-800">1. กำหนดพิกัดร้านค้า (จำเป็น)</h2>
                        <p className="text-sm text-blue-600">
                           ร้านทุกร้านต้องปักหมุดพิกัดเพื่อใช้ในการคำนวณระยะห่างในการจัดส่ง หากไม่มีพิกัดเก่า ระบบจะพยายามหาพิกัดปัจจุบันของคุณ
                        </p>
                        
                        <DynamicMapPicker 
                            initialCoords={initialMapCoords}
                            onCoordinateChange={handleCoordinateChange}
                        />

                        {/* Coordinate Display */}
                        <div className="bg-white p-4 rounded-lg shadow-inner border border-blue-200">
                            <h3 className="text-lg font-medium text-blue-600 mb-2">พิกัดที่เลือก</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex flex-col">
                                    <label className="font-medium text-gray-700">Latitude</label>
                                    <input 
                                        type="text"
                                        value={shop.lat !== null ? shop.lat.toFixed(6) : 'N/A'}
                                        readOnly
                                        className="p-2 border border-gray-300 bg-gray-50 rounded-lg font-mono"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-gray-700">Longitude</label>
                                    <input 
                                        type="text"
                                        value={shop.lng !== null ? shop.lng.toFixed(6) : 'N/A'}
                                        readOnly
                                        className="p-2 border border-gray-300 bg-gray-50 rounded-lg font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- SECTION 2: SHOP DETAILS & OPTIONS --- */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">2. ข้อมูลร้านค้าและตัวเลือก</h2>

                        {/* Basic Info (Name, Description, Address) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 mb-1">ชื่อร้านค้า (Name)</label>
                                <input type="text" name="name" value={shop.name} onChange={handleFormChange} required className="p-3 border border-gray-300 rounded-lg" />
                            </div>
                            <div className="flex flex-col">
                                <label className="font-medium text-gray-700 mb-1">ที่อยู่ (Address)</label>
                                <input type="text" name="address" value={shop.address || ''} onChange={handleFormChange} className="p-3 border border-gray-300 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                             <label className="font-medium text-gray-700 mb-1">รายละเอียด (Description)</label>
                             <textarea name="description" value={shop.description || ''} onChange={handleFormChange} rows={3} className="p-3 border border-gray-300 rounded-lg"></textarea>
                        </div>
                        
                        {/* Location/Store Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50">
                             <div className="flex items-center space-x-3">
                                <input 
                                    type="checkbox" 
                                    name="hasPhysicalStore" 
                                    checked={shop.hasPhysicalStore} 
                                    onChange={handleFormChange}
                                    id="hasPhysicalStore"
                                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded"
                                />
                                <label htmlFor="hasPhysicalStore" className="font-medium text-gray-700">
                                    มีหน้าร้านจริงหรือไม่
                                </label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <input 
                                    type="checkbox" 
                                    name="showLocationOnMap" 
                                    checked={shop.showLocationOnMap} 
                                    onChange={handleFormChange}
                                    id="showLocationOnMap"
                                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded"
                                />
                                <label htmlFor="showLocationOnMap" className="font-medium text-gray-700">
                                    แสดงพิกัดร้านบนแผนที่สาธารณะ
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- SECTION 3: DELIVERY LINKS (Links) --- */}
                    <div className="space-y-4 border p-6 rounded-xl bg-yellow-50">
                         <h2 className="text-2xl font-bold text-yellow-800">3. ลิงก์ Food Delivery และเว็บไซต์</h2>
                         <p className="text-sm text-yellow-600">
                            เช่น ลิงก์ Grab Food, Lineman หรือเว็บไซต์หลักของร้าน (รองรับมากกว่า 1 ลิงก์)
                         </p>
                         {/* This area requires complex state management (add/remove links), simplified here */}
                         
                         {shop.links.map((link, index) => (
                              <div key={index} className="flex space-x-3">
                                <input 
                                    type="text" 
                                    value={link.type} 
                                    readOnly 
                                    className="p-3 border border-gray-300 rounded-lg w-1/4 bg-gray-100"
                                    placeholder="ชื่อบริการ (e.g., GrabFood)"
                                />
                                <input 
                                    type="url" 
                                    value={link.url} 
                                    onChange={(e) => {
                                        const newLinks = [...shop.links];
                                        newLinks[index].url = e.target.value;
                                        setShop(prev => ({ ...prev, links: newLinks }));
                                    }}
                                    className="p-3 border border-gray-300 rounded-lg flex-grow"
                                    placeholder="URL (e.g., https://grab.com/...)"
                                />
                                {/* In a real app, you would add a button here to remove this link */}
                            </div>
                         ))}
                         {/* In a real app, you would add a button here to add a new link */}
                    </div>

                    {/* --- SECTION 4: ACTIONS --- */}
                    <div className="pt-6 space-y-4 border-t">
                        {/* Save Button */}
                        <button
                            type="submit"
                            disabled={status === 'saving'}
                            className={`w-full py-3 text-lg font-semibold rounded-lg shadow-lg transition duration-150 ${status === 'saving' ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                            {status === 'saving' ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกการเปลี่ยนแปลงร้านค้า'}
                        </button>
                        
                        {/* Status Message */}
                        {status === 'saved' && <p className="text-center text-green-600 font-medium">✅ บันทึกข้อมูลสำเร็จแล้ว!</p>}
                        
                        {/* Package and Ad Links */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <Link 
                                href="/shop/packages" 
                                className="text-center py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                            >
                                📦 เปลี่ยน Package ร้านค้า
                            </Link>
                            <Link 
                                href="/shop/advertise" 
                                className="text-center py-2 border border-red-400 rounded-lg text-red-600 hover:bg-red-50 transition"
                            >
                                📢 หน้าซื้อโฆษณา (บูสต์ร้าน)
                            </Link>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}