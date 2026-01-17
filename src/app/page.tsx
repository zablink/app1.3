// src/app/page.tsx 

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Hero from '@/components/Hero';
import Notification from '@/components/Notification';

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
  isMockup?: boolean;
  activeSubscription?: any;
  subscriptionTier?: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM' | null;
  isOG?: boolean;
  ogBadgeEnabled?: boolean;
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

  const [shopsDefault, setShopsDefault] = useState<Shop[]>([]); // ร้านค้าทั่วไป
  const [shopsNearby, setShopsNearby] = useState<Shop[] | null>(null); // ร้านค้าใกล้เคียง (location)
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreShops, setHasMoreShops] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [locationState, setLocationState] = useState({ status: 'idle' } as any);
  const [showLocationNotif, setShowLocationNotif] = useState(true);

  const SHOPS_PER_PAGE = 24; // ลดลงจาก 50 เป็น 24 เพื่อโหลดเร็วขึ้น

  useEffect(() => { loadShops(); }, []);
  useEffect(() => { loadBanners(); }, []);
  useEffect(() => { requestLocation(); }, []);

  // Infinite scroll: auto-load when scrolling near bottom (with debounce)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (isLoadingMore || !hasMoreShops || isLoadingShops) return;
      
      // Debounce scroll event
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        
        // Load more when user is 800px from bottom
        if (scrollHeight - scrollTop - clientHeight < 800) {
          loadMoreShops();
        }
      }, 200); // Debounce 200ms
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isLoadingMore, hasMoreShops, isLoadingShops, currentPage]);

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
      if (!res.ok) {
        console.error('Failed to load banners:', res.status);
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.banners)) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.error('Error loading banners:', err);
      // Set empty array to prevent crash
      setBanners([]);
    }
  };

  const loadShops = async () => {
    try {
      setIsLoadingShops(true);
      const res = await fetch(`/api/shops?limit=${SHOPS_PER_PAGE}`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to load shops:', res.status, errorText);
        setShopsDefault([]);
        return;
      }
      const data = await res.json();
      console.log('[page.tsx] Shops response:', {
        success: data.success,
        shopsCount: data.shops?.length || 0,
        hasLocation: data.hasLocation,
        queryTime: data.queryTime
      });
      setShopsDefault(Array.isArray(data.shops) ? data.shops : []);
      setHasMoreShops((data.shops?.length || 0) >= SHOPS_PER_PAGE);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error loading shops:', err);
      setShopsDefault([]);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const loadMoreShops = async () => {
    if (isLoadingMore || !hasMoreShops) return;
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const offset = currentPage * SHOPS_PER_PAGE;
      const res = await fetch(`/api/shops?limit=${SHOPS_PER_PAGE}&offset=${offset}`);
      const data = await res.json();
      if (data.shops && data.shops.length > 0) {
        setShopsDefault(prev => [...prev, ...data.shops]);
        setHasMoreShops(data.shops.length >= SHOPS_PER_PAGE);
        setCurrentPage(nextPage);
      } else {
        setHasMoreShops(false);
      }
    } catch (err) {
      console.error('Error loading more shops:', err);
    } finally {
      setIsLoadingMore(false);
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
        if (!resp.ok) {
          console.error('Failed to load nearby shops:', resp.status);
          return;
        }
        const data = await resp.json();
        setShopsNearby(Array.isArray(data.shops) ? data.shops : []);
      } catch (err) {
        console.error('Error updating shops with distance:', err);
        setShopsNearby([]);
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

  // Normalize tier string
  const normalizeTier = (tier: any): 'PREMIUM' | 'PRO' | 'BASIC' | 'FREE' | null => {
    if (!tier) return 'FREE';
    const t = String(tier).toUpperCase();
    if (['PREMIUM', 'PRO', 'BASIC', 'FREE'].includes(t)) return t as any;
    return 'FREE';
  };

  // Group shops by subscription tier (always robust)
  const groupShopsByTier = (shops: Shop[]) => {
    const premium = shops.filter(s => normalizeTier(s.subscriptionTier) === 'PREMIUM').slice(0, 6);
    const pro = shops.filter(s => normalizeTier(s.subscriptionTier) === 'PRO').slice(0, 3);
    const basic = shops.filter(s => normalizeTier(s.subscriptionTier) === 'BASIC').slice(0, 3);
    const free = shops.filter(s => normalizeTier(s.subscriptionTier) === 'FREE').slice(0, 12);
    return { premium, pro, basic, free };
  };

  // เลือก source ที่จะแสดง: ถ้ามี location และมีร้าน nearby ให้ใช้, ไม่งั้น fallback เป็น default
  const shopsToShow = shopsNearby && shopsNearby.length > 0 ? shopsNearby : shopsDefault;
  const groupedShops = groupShopsByTier(shopsToShow);

  // Render shop card component
  const ShopCard = ({ shop, tierColor }: { shop: Shop; tierColor?: string }) => (
    <div
      className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${tierColor ? `ring-2 ${tierColor}` : ''} relative`}
      onClick={() => router.push(`/shop/${shop.id}`)}
    >
      {/* Badges Container */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
        {shop.isMockup && (
          <div className="px-2 py-1 text-xs font-bold bg-orange-500 text-white rounded-full shadow-md flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            DEMO
          </div>
        )}
        {/* OG Badge */}
        {shop.isOG && shop.ogBadgeEnabled && (
          <div className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full shadow-md flex items-center gap-1">
            🎖️ OG
          </div>
        )}
      </div>
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

        {!isLoadingShops && shopsToShow.length > 0 && (
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

        {/* Load More Section */}
        {!isLoadingShops && shopsToShow.length > 0 && (
          <div className="mt-8 mb-12">
            {isLoadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-gray-600">กำลังโหลดร้านค้าเพิ่มเติม...</span>
              </div>
            )}
            
            {!isLoadingMore && hasMoreShops && (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={loadMoreShops}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  โหลดร้านค้าเพิ่มเติม
                </button>
                <p className="text-sm text-gray-500">
                  กำลังแสดง {shopsToShow.length} ร้าน • เลื่อนลงเพื่อโหลดอัตโนมัติ
                </p>
              </div>
            )}
            
            {!hasMoreShops && shopsToShow.length > SHOPS_PER_PAGE && (
              <div className="text-center py-8">
                <p className="text-gray-600">🎉 แสดงร้านค้าครบทั้งหมดแล้ว ({shopsToShow.length} ร้าน)</p>
              </div>
            )}
          </div>
        )}

        {!isLoadingShops && shopsToShow.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">ไม่พบร้านค้า</p>
          </div>
        )}
      </main>

      {/* Location Notification */}
      {showLocationNotif && locationState.status === 'success' && (
        <div className="fixed top-20 right-4 z-50 max-w-sm">
          <Notification
            message="อัปเดตตำแหน่งเรียบร้อย - ร้านค้าถูกเรียงตามระยะทางแล้ว"
            type="success"
            duration={5000}
            onClose={() => setShowLocationNotif(false)}
          />
        </div>
      )}

      {showLocationNotif && locationState.status === 'error' && (
        <div className="fixed top-20 right-4 z-50 max-w-sm">
          <Notification
            message={`ไม่สามารถโหลดตำแหน่งได้: ${locationState.error || 'กรุณาลองอีกครั้ง'}`}
            type="error"
            duration={6000}
            onClose={() => setShowLocationNotif(false)}
          />
        </div>
      )}

      {showLocationNotif && locationState.status === 'loading' && (
        <div className="fixed top-20 right-4 z-50 max-w-sm">
          <div className="bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm font-medium text-gray-900">กำลังโหลดตำแหน่ง...</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}