// src/app/location-finder/page.tsx

'use client';

import { useState } from 'react';
import { LocationInfo } from '@/lib/supabase'; // Reuse the interface definition

export default function LocationFinderPage() {
  const [lat, setLat] = useState<string>('13.7563'); // Default to Bangkok for testing
  const [lng, setLng] = useState<string>('100.5018'); // Default to Bangkok for testing
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async (latitude: number, longitude: number) => {
    setLoading(true);
    setError(null);
    setLocationInfo(null);
    try {
      // Call the API Route we created
      const response = await fetch(`/api/location-finder?lat=${latitude}&lng=${longitude}`);
      const data = await response.json();

      if (response.ok) {
        setLocationInfo(data as LocationInfo);
      } else {
        // Handle 400, 404, 500 errors from the API
        setError(data.error || 'Failed to fetch location data');
      }
    } catch (err) {
      setError('An unknown error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      setError('Please enter valid numerical coordinates.');
      return;
    }
    fetchLocation(latitude, longitude);
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLat(latitude.toFixed(6));
          setLng(longitude.toFixed(6));
          fetchLocation(latitude, longitude);
        },
        (err) => {
          setError(`Geolocation error: ${err.message}. Please enter manually.`);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
          🇹🇭 หาตำบลจาก GPS โดย ลุงเวอร์จ้า
        </h1>

        {/* Geolocation Button */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-lg font-semibold mb-3 text-blue-800">1. ค้นหาจาก GPS</p>
          <button
            onClick={handleGeolocation}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition duration-150 disabled:bg-blue-300"
          >
            {loading && !locationInfo ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Use My Current GPS Location'}
          </button>
        </div>

        {/* Manual Input */}
        <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-lg font-semibold mb-3 text-gray-800">2. กรอกข้อมูลเอง</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <label className="block w-full">
                    <span className="text-gray-700">Latitude (Lat):</span>
                    <input
                        type="text"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        disabled={loading}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        placeholder="e.g., 13.594025"
                    />
                </label>
                <label className="block w-full">
                    <span className="text-gray-700">Longitude (Lng):</span>
                    <input
                        type="text"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        disabled={loading}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        placeholder="e.g., 100.513568"
                    />
                </label>
            </div>
            <button
                onClick={handleManualSearch}
                disabled={loading}
                className="mt-4 w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition duration-150 disabled:bg-green-300"
            >
                {loading && locationInfo === null ? 'อยู่ไหนน๊าาา...' : 'ค้นหา Location'}
            </button>
        </div>

        {/* Status and Results */}
        {(loading || error || locationInfo) && (
            <div className="mt-8 p-6 rounded-xl shadow-inner bg-white border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Search Status</h2>
                
                {error && <p className="text-red-600 font-semibold">{error}</p>}
                
                {locationInfo && (
                    <div className="space-y-3">
                        <p className="text-green-600 font-semibold text-lg">✅ เจอแว้ววว!</p>
                        <p><strong>ข้อมูล:</strong> Lat {lat}, Lng {lng}</p>
                        <hr className="my-2"/>
                        <p><strong>จังหวัด</strong> <span className="font-medium text-gray-800">{locationInfo.province_name_th}</span></p>
                        <p><strong>อำเภอ/เขต</strong> <span className="font-medium text-gray-800">{locationInfo.amphure_name_th}</span></p>
                        <p><strong>ตำบล/แขวง</strong> <span className="font-medium text-gray-800">{locationInfo.tambon_name_th}</span></p>
                        <p className="text-sm text-gray-500 mt-2">Tambon ID: {locationInfo.tambon_id}</p>
                    </div>
                )}
            </div>
        )}

        {/* Credit/Source */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            Powered by PostGIS & Supabase RPC | Data from loc_tambons table.
          </p>
          <p className="text-xs mt-1">
            ไฟล์ทดสอบการค้นหาตำบล โดยลุงเว่อร์เองจ้า
          </p>
       </div>
      </div>
    </div>
  );
}
