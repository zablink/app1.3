// src/app/page.tsx 

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Hero from '@/components/Hero';

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
  subscription_tier?: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM' | null;
}

interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaLink?: string;
  link?: string;
  imageUrl: string;
  enableOverlay?: boolean;
  priority: number;
  isActive: boolean;
}

export default function HomePage() {
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [locationState, setLocationState] = useState({ status: 'idle' } as any);
  const [showLocationNotif, setShowLocationNotif] = useState(true);

  useEffect(() => { loadShops(); }, []);
  useEffect(() => { loadBanners(); }, []);
  useEffect(() => { requestLocation(); }, []);

  // Auto-rotate banners every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (data.success && data.banners) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.error('Error loading banners:', err);
    }
  };

  const loadShops = async () => {
    try {
      setIsLoadingShops(true);
      const res = await fetch('/api/shops?limit=50');
      const data = await res.json();
      console.log('Loaded shops:', data.shops?.length, 'shops');
      console.log('First shop:', data.shops?.[0]);
      console.log('Subscription tiers:', data.shops?.map((s: Shop) => ({ name: s.name, tier: s.subscription_tier })));
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

  // Group shops by subscription tier
  const groupShopsByTier = (shops: Shop[]) => {
    console.log('Grouping shops, total:', shops.length);
    const premium = shops.filter(s => s.subscription_tier === 'PREMIUM').slice(0, 6);
    const pro = shops.filter(s => s.subscription_tier === 'PRO').slice(0, 3);
    const basic = shops.filter(s => s.subscription_tier === 'BASIC').slice(0, 3);
    const free = shops.filter(s => !s.subscription_tier || s.subscription_tier === 'FREE').slice(0, 12);
    
    console.log('Grouped:', { 
      premium: premium.length, 
      pro: pro.length, 
      basic: basic.length, 
      free: free.length 
    });
    
    return { premium, pro, basic, free };
  };

  const groupedShops = groupShopsByTier(shops);

  // Render shop card component
  const ShopCard = ({ shop, tierColor }: { shop: Shop; tierColor?: string }) => (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${tierColor ? `ring-2 ${tierColor}` : ''}`}
      onClick={() => router.push(`/shop/${shop.id}`)}
    >
      <div className="w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
        <img
          src={shopImage(shop)}
          alt={shop.name || 'ร้านค้า'}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
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
  );

  // Render placeholder card
  const PlaceholderCard = ({ tier, icon, gradientFrom, gradientTo }: { tier: string; icon: string; gradientFrom: string; gradientTo: string }) => (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center h-full min-h-[280px] opacity-60">
      <div className={`text-6xl mb-3 opacity-40`}>{icon}</div>
      <p className="text-gray-500 text-sm font-medium mb-1">ยังไม่มีร้านค้า</p>
      <p className="text-gray-400 text-xs">แพ็กเกจ {tier}</p>
      <div className={`mt-3 h-1 w-16 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full opacity-50`}></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-orange-600">Zablink</h1>
        </div>
      </header>

      {/* Hero Banner */}
      {banners.length > 0 && (
        <Hero 
          title={banners[currentBannerIndex].title}
          subtitle={banners[currentBannerIndex].subtitle || "ค้นหาร้านค้าและบริการที่คุณชื่นชอบได้ง่ายๆ ในพื้นที่ใกล้คุณ"}
          ctaLabel={banners[currentBannerIndex].ctaLabel}
          onCtaClick={banners[currentBannerIndex].ctaLink ? () => {
            router.push(banners[currentBannerIndex].ctaLink!);
          } : undefined}
          backgroundImage={banners[currentBannerIndex].imageUrl}
          enableOverlay={banners[currentBannerIndex].enableOverlay ?? true}
          link={banners[currentBannerIndex].link}
        />
      )}

      {/* Banner Indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 py-4 bg-gray-100">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBannerIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentBannerIndex 
                  ? 'bg-orange-600 w-8' 
                  : 'bg-gray-400 hover:bg-gray-600'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        {isLoadingShops && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        )}

        {!isLoadingShops && shops.length > 0 && (
          <div className="space-y-8">
            {/* Premium Group - Always show */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-4 py-1 rounded-full font-bold text-sm">
                  ⭐ PREMIUM
                </div>
                <span className="text-sm text-gray-600">ร้านค้าพรีเมียม - แสดงผลสูงสุด</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedShops.premium.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} tierColor="ring-yellow-400" />
                ))}
                {[...Array(Math.max(0, 6 - groupedShops.premium.length))].map((_, i) => (
                  <PlaceholderCard 
                    key={`premium-placeholder-${i}`} 
                    tier="Premium" 
                    icon="⭐" 
                    gradientFrom="from-yellow-400" 
                    gradientTo="to-amber-500" 
                  />
                ))}
              </div>
            </div>

            {/* Pro Group - Always show */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-full font-bold text-sm">
                  💎 PRO
                </div>
                <span className="text-sm text-gray-600">ร้านค้าโปร - แสดงผลลำดับต้น</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedShops.pro.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} tierColor="ring-blue-400" />
                ))}
                {[...Array(Math.max(0, 3 - groupedShops.pro.length))].map((_, i) => (
                  <PlaceholderCard 
                    key={`pro-placeholder-${i}`} 
                    tier="Pro" 
                    icon="💎" 
                    gradientFrom="from-blue-500" 
                    gradientTo="to-indigo-600" 
                  />
                ))}
              </div>
            </div>

            {/* Basic Group - Always show */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full font-bold text-sm">
                  ✓ BASIC
                </div>
                <span className="text-sm text-gray-600">ร้านค้าเบสิก - แสดงผลพื้นฐาน</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedShops.basic.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} tierColor="ring-green-400" />
                ))}
                {[...Array(Math.max(0, 3 - groupedShops.basic.length))].map((_, i) => (
                  <PlaceholderCard 
                    key={`basic-placeholder-${i}`} 
                    tier="Basic" 
                    icon="✓" 
                    gradientFrom="from-green-500" 
                    gradientTo="to-emerald-600" 
                  />
                ))}
              </div>
            </div>

            {/* Free Group */}
            {groupedShops.free.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gray-400 text-white px-4 py-1 rounded-full font-bold text-sm">
                    FREE
                  </div>
                  <span className="text-sm text-gray-600">ร้านค้าฟรี</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedShops.free.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} />
                  ))}
                </div>
              </div>
            )}
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