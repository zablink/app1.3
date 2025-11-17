// src/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Shop {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  image?: string;
  address?: string;
  phone?: string;
  website?: string;
  distance?: number | null;
  activeSubscription?: any;
}

export default function HomePage() {
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [locationState, setLocationState] = useState({ status: 'idle' } as any);
  const [showLocationNotif, setShowLocationNotif] = useState(true);

  useEffect(() => { loadShops(); }, []);
  useEffect(() => { requestLocation(); }, []);

  const loadShops = async () => {
    try {
      setIsLoadingShops(true);
      const res = await fetch('/api/shops?limit=50');
      const data = await res.json();
      setShops(data.shops || []);
    } catch (err) {
      console.error('Error loading shops:', err);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocationState({ status: 'error', error: 'เบราว์เซอร์ไม่รองรับ Geolocation' });
      return;
    }
    setLocationState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setLocationState({ status: 'success', lat: latitude, lng: longitude });
      try {
        const resp = await fetch(`/api/shops?lat=${latitude}&lng=${longitude}&limit=50&sortBy=distance`);
        const data = await resp.json();
        setShops(data.shops || []);
      } catch (err) {
        console.error('Error updating shops with distance:', err);
      }
    }, (error) => {
      setLocationState({ status: 'error', error: error.message || 'ไม่สามารถเข้าถึงตำแหน่งได้' });
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  };

  // Helper to choose image: prefer image field, then logo, then placeholder
  const shopImage = (shop: Shop) => {
    return shop.image || shop.logo || '/placeholder.png'; 
    //
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-orange-600">Zablink</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Packages showcase (presentational) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Free</h4>
              <p className="text-sm text-gray-600">Basic listing, no priority</p>
            </div>
            <div className="text-xs text-gray-500">Free</div>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-700">Pro</h4>
              <p className="text-sm text-blue-600">Priority listing and featured</p>
            </div>
            <div className="text-xs text-blue-700">Pro</div>
          </div>
          <div className="p-4 rounded-lg bg-yellow-50 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-yellow-700">Premium</h4>
              <p className="text-sm text-yellow-600">Pinned highlight and top placement</p>
            </div>
            <div className="text-xs text-yellow-700">Premium</div>
          </div>
        </section>

        {isLoadingShops && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        )}

        {!isLoadingShops && shops.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/shop/${shop.id}`)}
              >
                {/* Image (shop.image preferred) */}
                <div className="w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={shopImage(shop)}
                    alt={shop.name || 'ร้านค้า'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    loading="lazy"
                  />
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{shop.name}</h3>
                  {shop.description && <p className="text-gray-600 text-sm line-clamp-2 mb-3">{shop.description}</p>}

                  {typeof shop.distance === 'number' && (
                    <div className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{shop.distance < 1 ? `${(shop.distance * 1000).toFixed(0)} ม.` : `${shop.distance.toFixed(1)} กม.`}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoadingShops && shops.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">ไม่พบร้านค้า</p>
          </div>
        )}
      </main>

      {showLocationNotif && locationState.status !== 'idle' && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-from-right">
          <div className={`bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm ${locationState.status === 'loading' ? 'border-blue-500' : ''} ${locationState.status === 'success' ? 'border-green-500' : ''} ${locationState.status === 'error' ? 'border-red-500' : ''}`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {locationState.status === 'loading' && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
                {locationState.status === 'success' && (
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                )}
                {locationState.status === 'error' && (
                  <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {locationState.status === 'loading' && 'กำลังโหลดตำแหน่ง...'}
                  {locationState.status === 'success' && 'อัปเดตตำแหน่งเรียบร้อย'}
                  {locationState.status === 'error' && 'ไม่สามารถโหลดตำแหน่งได้'}
                </p>
                {locationState.status === 'success' && <p className="mt-1 text-xs text-gray-600">ร้านค้าถูกเรียงตามระยะทางแล้ว</p>}
                {locationState.status === 'error' && (
                  <div>
                    <p className="mt-1 text-xs text-gray-600">{locationState.error}</p>
                    <button onClick={requestLocation} className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">ลองอีกครั้ง</button>
                  </div>
                )}
              </div>
              <button onClick={() => setShowLocationNotif(false)} className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}