'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type * as L from 'leaflet'; 


interface LatLong {
  lat: number;
  lng: number;
}

// INTERFACE for Nominatim API results
interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

const InitialMapCenter: LatLong = { lat: 13.7367, lng: 100.5231 }; // Bangkok center (Fallback)
const InitialZoom = 13;

const MapComponent = () => {
  const [coords, setCoords] = useState<LatLong | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isLocating, setIsLocating] = useState(false); // State for button loading

  const mapRef = useRef<L.Map | null>(null); 
  const markerRef = useRef<L.Marker | null>(null);

  // Function to setup the map instance (called only once)
  const setupMap = React.useCallback((coordsToUse: LatLong, zoomToUse: number, LInstance: typeof L) => {
    if (mapRef.current) return; // Prevent re-initialization

    if (!document.getElementById('map-container')) {
        console.error("Map container div not found!");
        return;
    }
    
    const map = LInstance.map('map-container').setView([coordsToUse.lat, coordsToUse.lng], zoomToUse);
    mapRef.current = map;

    // Add OpenStreetMap tile layer
    LInstance.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create the initial marker
    const marker = LInstance.marker([coordsToUse.lat, coordsToUse.lng]).addTo(map);
    markerRef.current = marker;
    setCoords(coordsToUse);

    // Handle map click event
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = e.latlng.lat;
      const newLng = e.latlng.lng;
      
      markerRef.current?.setLatLng([newLat, newLng]);
      setCoords({ lat: newLat, lng: newLng });
      setSearchResults([]); // Clear search results after manual click
    });
  }, []);

  // --- NEW FUNCTION: Locate User and Move Map/Marker (Reusable) ---
  const handleLocateMe = React.useCallback(() => {
    if (!mapRef.current || !markerRef.current || !navigator.geolocation) {
        alert("ไม่รองรับ Geolocation หรือแผนที่ยังไม่พร้อม");
        return;
    }

    setIsLocating(true);
    
    // Use a higher timeout and enable high accuracy for mobile devices
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const currentCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Move map and marker to the new location
        mapRef.current!.setView([currentCoords.lat, currentCoords.lng], 18); // Zoom very close
        markerRef.current!.setLatLng([currentCoords.lat, currentCoords.lng]);
        setCoords(currentCoords);
        setIsLocating(false);
      },
      (err: GeolocationPositionError) => {
        console.warn(`Geolocation Error (${err.code}): ${err.message}.`);
        alert("ไม่สามารถหาตำแหน่งปัจจุบันได้ โปรดตรวจสอบว่าอนุญาตให้เข้าถึงตำแหน่งในเบราว์เซอร์แล้ว");
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true, // Request high accuracy (better for mobile)
        timeout: 10000,          // Increase timeout to 10 seconds for mobile GPS
        maximumAge: 0            // Force a fresh request
      }
    );
  }, []);

  // --- Map Initialization (useEffect) ---
  useEffect(() => {
    import('leaflet').then(L => { 
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // --- INITIAL GEOLOCATION ATTEMPT ---
      if (navigator.geolocation) {
        const success = (position: GeolocationPosition) => {
          const currentCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          // Use current location with zoom 16
          setupMap(currentCoords, 16, L); 
        };

        const error = (err: GeolocationPositionError) => {
          console.warn(`Geolocation Error (${err.code}): ${err.message}. Falling back to default center.`);
          // If error, use the default center
          setupMap(InitialMapCenter, InitialZoom, L);
        };

        // Initial attempt to get user's location (using high accuracy for better first result)
        navigator.geolocation.getCurrentPosition(success, error, { 
            enableHighAccuracy: true, 
            timeout: 5000 
        });
      } else {
        console.log("Geolocation is not supported. Using default center.");
        setupMap(InitialMapCenter, InitialZoom, L);
      }
      // --- END INITIAL GEOLOCATION LOGIC ---

      // Cleanup function
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
  }, [setupMap]); // setupMap is a dependency because it's defined outside

  // Function to search address using Nominatim API (Open-Source Geocoding)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchTerm)}&format=json&limit=5&countrycodes=th`;

    try {
      const response = await fetch(url);
      const data = await response.json() as NominatimResult[]; 
      setSearchResults(data);

      if (data.length > 0) {
        const firstResult = data[0];
        const lat = parseFloat(firstResult.lat);
        const lng = parseFloat(firstResult.lon);

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16); 
          markerRef.current?.setLatLng([lat, lng]);
          setCoords({ lat, lng });
        }
      }
    } catch (error) {
      console.error("Nominatim Search Error:", error);
      alert("เกิดข้อผิดพลาดในการค้นหา หรือลองค้นหาเป็นภาษาอังกฤษ");
    }
  };

  // Function to select a result from the search list
  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 18); 
      markerRef.current?.setLatLng([lat, lng]);
      setCoords({ lat, lng });
    }
    setSearchResults([]); 
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">1. ค้นหาและปักหมุดตำแหน่งร้านค้า (Cost-Free)</h2>
      <p className="text-sm text-gray-600">
        **โปรดอนุญาตให้เบราว์เซอร์เข้าถึงตำแหน่ง** เพื่อให้แผนที่แสดงตำแหน่งปัจจุบันของคุณ
      </p>

      {/* Locate Me Button */}
      <button
        onClick={handleLocateMe}
        disabled={isLocating}
        className={`w-full py-3 text-white rounded-lg transition duration-150 shadow-md ${isLocating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {isLocating ? 'กำลังค้นหาพิกัด...' : '📍 Reset พิกัดปัจจุบัน'}
      </button>
      
      {/* Search Bar and Results */}
      <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
        {/* ... (Existing Search Form) ... */}
        <form onSubmit={handleSearch} className="flex-grow flex">
          <input
            type="text"
            placeholder="ค้นหาที่อยู่ (เช่น 'ร้านค้า ถนนเจริญกรุง')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 transition duration-150"
          >
            ค้นหา
          </button>
        </form>
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {searchResults.map((result, index) => (
            <div
              key={index}
              className="p-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer text-sm"
              onClick={() => handleSelectResult(result)}
            >
              <p className="font-medium text-gray-800">{result.display_name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div id="map-container" className="w-full h-[60vh] rounded-xl shadow-lg border border-gray-200">
        {/* Map will be rendered here by Leaflet */}
      </div>

      {/* Coordinate Display and Form Fields */}
      <div className="bg-white p-4 rounded-xl shadow-inner border border-green-100">
        <h3 className="text-lg font-medium text-green-600 mb-2">พิกัดที่เลือก (Lat/Lng)</h3>
        {coords ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col">
              <label className="font-medium text-gray-700">Latitude</label>
              <input 
                type="text"
                id="store_lat"
                value={coords.lat.toFixed(6)}
                readOnly
                className="p-2 border border-gray-300 bg-gray-50 rounded-lg font-mono"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium text-gray-700">Longitude</label>
              <input 
                type="text"
                id="store_lng"
                value={coords.lng.toFixed(6)}
                readOnly
                className="p-2 border border-gray-300 bg-gray-50 rounded-lg font-mono"
              />
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">กำลังโหลดแผนที่...</p>
        )}
      </div>

      <p className="text-xs text-red-500 mt-4">
        *ข้อควรระวัง: ...
      </p>
    </div>
  );
};

// Dynamic Import to disable Server-Side Rendering
const DynamicMapComponent = dynamic(() => Promise.resolve(MapComponent), {
  ssr: false,
  loading: () => (
    <div className="p-4 w-full h-[70vh] flex items-center justify-center bg-gray-100 rounded-xl shadow-lg">
      <p className="text-lg text-gray-500 animate-pulse">กำลังโหลดแผนที่ฟรี...</p>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-[Inter]">
      <div className="max-w-4xl mx-auto py-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">
          ระบบกำหนดพิกัดร้านค้า (Leaflet/Nominatim)
        </h1>
        <DynamicMapComponent />
      </div>
    </div>
  );
}