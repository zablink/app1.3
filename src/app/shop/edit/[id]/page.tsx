// src/app/shop/edit/[id]/page.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type * as L from 'leaflet';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Assuming you have 'lucide-react' installed for icons
import { Trash2, Plus, Upload, X, MapPin } from 'lucide-react'; 

// -------------------------------------------------------------------------
// 1. DATA AND INTERFACES (UNCHANGED)
// -------------------------------------------------------------------------

interface LatLong {
  lat: number;
  lng: number;
}

interface ShopData {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  lat: number | null; 
  lng: number | null; 
  address: string | null;
  categoryId: string;
  image: string | null; // Feature image URL (Legacy/Main image)
  
  hasPhysicalStore: boolean;
  showLocationOnMap: boolean;
  links: { id: string, type: string, url: string }[]; // Added 'id' for keying and deletion
  gallery: { id: string, url: string, isFeatured: boolean }[]; // Structured gallery
}

const MOCK_SHOP_ID = 'shop_123';
const INITIAL_SHOP_DATA: ShopData = {
  id: MOCK_SHOP_ID,
  ownerId: 'user_456',
  name: 'ร้านอาหารเจริญดี',
  description: 'ร้านนี้อร่อยมาก',
  lat: 13.7563, 
  lng: 100.5018, 
  address: '123 ถนนสุขุมวิท กรุงเทพฯ',
  categoryId: 'food',
  image: '/path/to/feature_image.jpg',
  hasPhysicalStore: true,
  showLocationOnMap: false,
  // Mock data for dynamic links
  links: [
    { id: 'link_1', type: 'GrabFood', url: 'https://grab.com/shop123' },
    { id: 'link_2', type: 'Website', url: 'https://jareondee.com' }
  ],
  // Mock data for gallery
  gallery: [
    { id: 'img_1', url: '/path/to/feature_image.jpg', isFeatured: true },
    { id: 'img_2', url: '/path/to/gallery_img2.jpg', isFeatured: false }
  ]
};

const InitialMapCenter: LatLong = { lat: 13.7367, lng: 100.5231 };
const InitialZoom = 13;


// -------------------------------------------------------------------------
// 2. MAP PICKER COMPONENT (UNCHANGED)
// -------------------------------------------------------------------------

// ... (DynamicMapPicker and MapPickerComponent code remains the same as previous response)
// NOTE: I'm omitting the MapPicker component code for brevity, assuming it's in the file.


const MapPickerComponent: React.FC<{ initialCoords: LatLong | null, onCoordinateChange: (latLng: LatLong) => void }> = ({ initialCoords, onCoordinateChange }) => {
    // ... (Your previous working MapPickerComponent code) ...
    // Note: The logic for setupMap and handleLocateMe must be kept here or imported.

    // A minimal placeholder for demonstration
    const [isLocating, setIsLocating] = useState(false);
    const mapRef = useRef<L.Map | null>(null); 
    const markerRef = useRef<L.Marker | null>(null);

    const setupMap = useCallback((coordsToUse: LatLong, zoomToUse: number, LInstance: typeof L) => {
        // ... (Full setupMap logic here) ...
    }, [onCoordinateChange]);

    const handleLocateMe = useCallback(() => {
        // ... (Full handleLocateMe logic here) ...
        alert("Locate Me functionality triggered (MapPicker logic is assumed to be present)");
    }, []);

    useEffect(() => {
        // ... (Full map initialization logic here, simplified for display) ...
        import('leaflet').then(L => { 
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
            
            // Simplified setup call (Assume logic is here)
            const coords = initialCoords || InitialMapCenter;
            // setupMap(coords, initialCoords ? 16 : InitialZoom, L); 

            return () => {
                // ... (Cleanup logic) ...
            };
        });
    }, [initialCoords, setupMap]);


    return (
        <div className="space-y-4">
            <div id="shop-map-container" className="w-full h-[50vh] rounded-xl shadow-md border border-gray-200">
                 {/* Map Placeholder */}
                 <div className="flex items-center justify-center h-full text-gray-500 bg-gray-100/50">
                    <MapPin className="w-6 h-6 mr-2" /> แผนที่แสดงพิกัด (คลิกเพื่อปักหมุด)
                 </div>
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

const DynamicMapPicker = dynamic(() => Promise.resolve(MapPickerComponent), {
  ssr: false,
  loading: () => (
    <div className="p-4 w-full h-[55vh] flex items-center justify-center bg-gray-100 rounded-xl shadow-lg">
      <p className="text-lg text-gray-500 animate-pulse">กำลังโหลดแผนที่...</p>
    </div>
  ),
});


// -------------------------------------------------------------------------
// 3. MAIN SHOP ADMIN PAGE (NEW LOGIC)
// -------------------------------------------------------------------------

export default function ShopAdminEditPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [shop, setShop] = useState<ShopData>(INITIAL_SHOP_DATA);
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Handler for all non-dynamic form fields
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
    
    // -----------------------------------
    // LINK MANAGEMENT HANDLERS
    // -----------------------------------
    const handleLinkChange = (index: number, field: 'type' | 'url', value: string) => {
        const newLinks = [...shop.links];
        newLinks[index][field] = value;
        setShop(prev => ({ ...prev, links: newLinks }));
    };

    const handleAddLink = () => {
        setShop(prev => ({
            ...prev,
            links: [
                ...prev.links,
                { id: `new_${Date.now()}`, type: '', url: '' } // Unique temporary ID
            ]
        }));
    };

    const handleRemoveLink = (linkId: string) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบลิงก์นี้?')) {
            setShop(prev => ({
                ...prev,
                links: prev.links.filter(link => link.id !== linkId)
            }));
        }
    };

    // -----------------------------------  
    // GALLERY MANAGEMENT HANDLERS (Mock)
    // -----------------------------------
    const handleMockFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            // Mock the upload and get a temporary URL
            const newFileUrl = URL.createObjectURL(files[0]);
            
            // Find the current featured image (if any)
            const hasFeatured = shop.gallery.some(img => img.isFeatured);

            setShop(prev => ({
                ...prev,
                gallery: [
                    ...prev.gallery.map(img => 
                         // If no featured image exists yet, make the first upload the featured image
                         !hasFeatured && prev.gallery.length === 0 ? { ...img, isFeatured: true } : img
                    ),
                    { 
                        id: `file_${Date.now()}`, 
                        url: newFileUrl, 
                        isFeatured: !hasFeatured && prev.gallery.length === 0 // Make first image featured if none exists
                    }
                ]
            }));
            // In a real app, you would upload to Supabase Storage here and get the public URL.
        }
    };

    const handleRemoveImage = (imageId: string) => {
        if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้ออกจากแกลเลอรี่?')) {
             setShop(prev => ({
                ...prev,
                gallery: prev.gallery.filter(img => img.id !== imageId)
             }));
        }
    };

    const handleSetFeatured = (imageId: string) => {
        setShop(prev => ({
            ...prev,
            gallery: prev.gallery.map(img => ({
                ...img,
                isFeatured: img.id === imageId // Set only the selected image as featured
            }))
        }));
    };

    // -----------------------------------
    // SUBMISSION HANDLER
    // -----------------------------------
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (shop.lat === null || shop.lng === null) {
            alert('กรุณาปักหมุดพิกัดร้านค้าก่อนบันทึก');
            return;
        }

        setStatus('saving');
        
        const dataToSave = {
            ...shop,
            // ❗ IMPORTANT: Before sending to Supabase, filter out temporary IDs from links/gallery 
            // and handle the conversion of lat/lng to GEOMETRY on the backend.
            links: shop.links.filter(link => link.type && link.url),
            // For gallery, you only need to send the URLs and the isFeatured status
            gallery: shop.gallery.map(img => ({ url: img.url, isFeatured: img.isFeatured }))
        };

        console.log('--- FINAL DATA TO SEND TO SUPABASE ---');
        console.log(JSON.stringify(dataToSave, null, 2));
        
        // Simulate API call to Supabase/Backend
        setTimeout(() => {
            setStatus('saved');
            console.log('Shop data saved successfully!');
            // In a real app: After successful save, update the shop state with permanent IDs 
            // returned from the backend for any new links/images.
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
                        {/* ... (Map Picker and Coordinate Display UI remains the same) ... */}
                        <DynamicMapPicker 
                            initialCoords={initialMapCoords}
                            onCoordinateChange={handleCoordinateChange}
                        />
                         <div className="bg-white p-4 rounded-lg shadow-inner border border-blue-200">
                            <h3 className="text-lg font-medium text-blue-600 mb-2">พิกัดที่เลือก</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex flex-col">
                                    <label className="font-medium text-gray-700">Latitude</label>
                                    <input type="text" value={shop.lat !== null ? shop.lat.toFixed(6) : 'N/A'} readOnly className="p-2 border border-gray-300 bg-gray-50 rounded-lg font-mono"/>
                                </div>
                                <div className="flex flex-col">
                                    <label className="font-medium text-gray-700">Longitude</label>
                                    <input type="text" value={shop.lng !== null ? shop.lng.toFixed(6) : 'N/A'} readOnly className="p-2 border border-gray-300 bg-gray-50 rounded-lg font-mono"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- SECTION 2: SHOP DETAILS & OPTIONS (UNCHANGED) --- */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">2. ข้อมูลร้านค้าและตัวเลือก</h2>
                        {/* ... (Basic Info and Checkboxes remain the same) ... */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-gray-50">
                             <div className="flex items-center space-x-3">
                                <input type="checkbox" name="hasPhysicalStore" checked={shop.hasPhysicalStore} onChange={handleFormChange} id="hasPhysicalStore" className="h-5 w-5 text-indigo-600 border-gray-300 rounded"/>
                                <label htmlFor="hasPhysicalStore" className="font-medium text-gray-700">มีหน้าร้านจริงหรือไม่</label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <input type="checkbox" name="showLocationOnMap" checked={shop.showLocationOnMap} onChange={handleFormChange} id="showLocationOnMap" className="h-5 w-5 text-indigo-600 border-gray-300 rounded"/>
                                <label htmlFor="showLocationOnMap" className="font-medium text-gray-700">แสดงพิกัดร้านบนแผนที่สาธารณะ</label>
                            </div>
                        </div>
                    </div>
                    
                    {/* --- SECTION 3: DYNAMIC LINKS (NEW) --- */}
                    <div className="space-y-4 border p-6 rounded-xl bg-yellow-50">
                         <h2 className="text-2xl font-bold text-yellow-800">3. ลิงก์ Food Delivery และเว็บไซต์</h2>
                         <p className="text-sm text-yellow-600 mb-4">
                            เช่น ลิงก์ **Grab Food**, **Lineman** หรือเว็บไซต์หลักของร้าน (รองรับ 0 ถึง 5 ลิงก์)
                         </p>
                         
                         {shop.links.map((link, index) => (
                              <div key={link.id} className="flex space-x-3 items-center">
                                <input 
                                    type="text" 
                                    name="type"
                                    value={link.type} 
                                    onChange={(e) => handleLinkChange(index, 'type', e.target.value)}
                                    className="p-3 border border-gray-300 rounded-lg w-1/4"
                                    placeholder="ชื่อบริการ (e.g., GrabFood)"
                                />
                                <input 
                                    type="url" 
                                    name="url"
                                    value={link.url} 
                                    onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                                    className="p-3 border border-gray-300 rounded-lg flex-grow"
                                    placeholder="URL (e.g., https://grab.com/...)"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLink(link.id)}
                                    className="p-3 text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
                                    title="ลบลิงก์นี้"
                                >
                                    <Trash2 className="w-5 h-5"/>
                                </button>
                            </div>
                         ))}
                         
                         {/* Add Link Button */}
                         {shop.links.length < 5 && (
                             <button
                                type="button"
                                onClick={handleAddLink}
                                className="mt-3 flex items-center justify-center w-full py-2 border-2 border-yellow-800 border-dashed rounded-lg text-yellow-800 hover:bg-yellow-100 transition"
                             >
                                <Plus className="w-5 h-5 mr-2" /> เพิ่มลิงก์ใหม่
                             </button>
                         )}
                         {shop.links.length >= 5 && (
                             <p className="text-red-500 text-sm mt-3 text-center">จำกัดลิงก์สูงสุด 5 ลิงก์</p>
                         )}
                    </div>

                    {/* --- SECTION 4: GALLERY MANAGEMENT (NEW) --- */}
                    <div className="space-y-6 border p-6 rounded-xl bg-pink-50">
                        <h2 className="text-2xl font-bold text-pink-800">4. รูปภาพร้านค้า (Feature Image & Gallery)</h2>
                        <p className="text-sm text-pink-600">
                           ใช้รูปภาพแรกที่ถูกเลือกเป็น **ภาพหน้าปก** (Feature Image) กรุณาจัดเรียงภาพให้สวยงามเพื่อการแสดงผลแบบ **Pinterest-style** (Masonry)
                        </p>
                        
                        {/* Image Upload Area */}
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-pink-400 border-dashed rounded-lg cursor-pointer bg-pink-100/50 hover:bg-pink-100 transition">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-pink-500"/>
                                <p className="mb-2 text-sm text-pink-700"><span className="font-semibold">คลิกเพื่ออัพโหลด</span> หรือลากวางไฟล์ที่นี่</p>
                                <p className="text-xs text-pink-500">รองรับ JPG, PNG, GIF (สูงสุด 2MB ต่อรูป)</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" multiple accept="image/*" onChange={handleMockFileUpload} />
                        </label>
                        
                        {/* Gallery Display Area (Pinterest/Masonry style simulation) */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {shop.gallery.map((img, index) => (
                                <div key={img.id} className="relative group overflow-hidden rounded-lg shadow-md border-2" style={{ aspectRatio: '1 / 1' }}>
                                    
                                    <img 
                                        src={img.url} 
                                        alt={`Gallery Image ${index + 1}`} 
                                        className={`w-full h-full object-cover transition duration-300 ${img.isFeatured ? 'border-4 border-green-500' : 'border-gray-200'}`}
                                    />
                                    
                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="flex justify-between items-center text-xs space-x-1">
                                            {img.isFeatured ? (
                                                <span className="bg-green-600 text-white font-bold px-2 py-1 rounded-full">⭐ หน้าปก</span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetFeatured(img.id)}
                                                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-2 py-1 rounded-full transition"
                                                >
                                                    ตั้งเป็นหน้าปก
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(img.id)}
                                                className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                                                title="ลบรูปภาพ"
                                            >
                                                <X className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                         {shop.gallery.length === 0 && (
                            <p className="text-center text-gray-500 py-4 border rounded-lg">ยังไม่มีรูปภาพในแกลเลอรี่</p>
                         )}
                    </div>
                    
                    {/* --- SECTION 5: ACTIONS (Renamed/Re-indexed) --- */}
                    <div className="pt-6 space-y-4 border-t">
                        <button
                            type="submit"
                            disabled={status === 'saving'}
                            className={`w-full py-3 text-lg font-semibold rounded-lg shadow-lg transition duration-150 ${status === 'saving' ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                        >
                            {status === 'saving' ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกการเปลี่ยนแปลงร้านค้า'}
                        </button>
                        
                        {status === 'saved' && <p className="text-center text-green-600 font-medium">✅ บันทึกข้อมูลสำเร็จแล้ว!</p>}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <Link href="/shop/packages" className="text-center py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition">
                                📦 เปลี่ยน Package ร้านค้า
                            </Link>
                            <Link href="/shop/advertise" className="text-center py-2 border border-red-400 rounded-lg text-red-600 hover:bg-red-50 transition">
                                📢 หน้าซื้อโฆษณา (บูสต์ร้าน)
                            </Link>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}