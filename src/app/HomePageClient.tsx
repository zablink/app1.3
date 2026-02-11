// src/app/HomePageClient.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Notification from '@/components/Notification';

// Assuming interfaces are moved to a types file, but keeping them here for self-containment
interface Shop {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  image?: string;
  subscriptionTier?: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM' | null;
  isOG?: boolean;
  ogBadgeEnabled?: boolean;
  distance?: number | null;
}

interface HeroBanner {
  id: string;
  imageUrl: string;
}

interface HomePageClientProps {
  initialShops: Shop[];
  initialBanners: HeroBanner[];
}

export default function HomePageClient({ initialShops, initialBanners }: HomePageClientProps) {
  const router = useRouter();

  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [shopsNearby, setShopsNearby] = useState<Shop[] | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreShops, setHasMoreShops] = useState(initialShops.length >= 24);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [locationState, setLocationState] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', error?: string }>({ status: 'idle' });
  const [showLocationNotif, setShowLocationNotif] = useState(true);

  const SHOPS_PER_PAGE = 24;

  // Request location on initial mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Infinite scroll effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      if (isLoadingMore || !hasMoreShops) return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 800) {
          loadMoreShops();
        }
      }, 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', handleScroll);
    }
  }, [isLoadingMore, hasMoreShops, currentPage]);

  // Banner rotation effect
  useEffect(() => {
    if (initialBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % initialBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [initialBanners.length]);

  const loadMoreShops = async () => {
    if (isLoadingMore || !hasMoreShops) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const offset = (nextPage - 1) * SHOPS_PER_PAGE;
      const res = await fetch(`/api/shops?limit=${SHOPS_PER_PAGE}&offset=${offset}`);
      const data = await res.json();
      if (data.shops && data.shops.length > 0) {
        setShops(prev => [...prev, ...data.shops]);
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

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationState({ status: 'error', error: 'Geolocation not supported' });
      return;
    }
    setLocationState({ status: 'loading' });
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setLocationState({ status: 'success' });
      try {
        const resp = await fetch(`/api/shops?lat=${latitude}&lng=${longitude}&limit=50&sortBy=distance`);
        const data = await resp.json();
        setShopsNearby(data.shops || []);
      } catch (err) {
        console.error('Error fetching nearby shops:', err);
        setShopsNearby([]); 
      }
    }, (error) => {
      setLocationState({ status: 'error', error: 'Permission denied' });
    });
  };

  const shopImage = (shop: Shop) => shop.image || shop.logo || '/placeholder.png';
  const normalizeTier = (tier: any) => {
    const t = String(tier || 'FREE').toUpperCase();
    return ['PREMIUM', 'PRO', 'BASIC', 'FREE'].includes(t) ? t : 'FREE';
  };

  // Determine which list of shops to display
  const shopsToShow = shopsNearby !== null ? shopsNearby : shops;

  const groupedShops = {
      premium: shopsToShow.filter(s => normalizeTier(s.subscriptionTier) === 'PREMIUM').slice(0, 6),
      pro: shopsToShow.filter(s => normalizeTier(s.subscriptionTier) === 'PRO').slice(0, 3),
      basic: shopsToShow.filter(s => normalizeTier(s.subscriptionTier) === 'BASIC').slice(0, 3),
      free: shopsToShow.filter(s => normalizeTier(s.subscriptionTier) === 'FREE').slice(0, 12),
  };

  // ShopCard and PlaceholderCard can be further extracted into their own components
  const ShopCard = ({ shop, tierColor }: { shop: Shop; tierColor?: string }) => (
      <div
        className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${tierColor ? `ring-2 ${tierColor}` : ''} relative`}
        onClick={() => router.push(`/shop/${shop.id}`)}
      >
          {shop.isOG && shop.ogBadgeEnabled && (
              <div className="absolute top-2 left-2 z-10 px-2 py-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-full shadow-md flex items-center gap-1">
                  🎖️ OG
              </div>
          )}
          <div className="w-full h-48 bg-gray-200 rounded-t-lg overflow-hidden">
              <img src={shopImage(shop)} alt={shop.name} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{shop.name}</h3>
              {shop.distance !== null && typeof shop.distance === 'number' && (
                  <div className="flex items-center text-sm text-gray-500">
                      <span>{shop.distance < 1 ? `${(shop.distance * 1000).toFixed(0)} ม.` : `${shop.distance.toFixed(1)} กม.`}</span>
                  </div>
              )}
          </div>
      </div>
  );

  const PlaceholderCard = ({ tier, icon, gradientFrom, gradientTo }: any) => (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center h-full min-h-[280px] opacity-60">
          <div className="text-6xl mb-3 opacity-40">{icon}</div>
          <p className="text-gray-500 text-sm font-medium">ยังไม่มีร้านค้า {tier}</p>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {initialBanners.length > 0 && (
        <div className="relative w-full h-[600px] overflow-hidden bg-gray-900">
          <div className="flex h-full transition-transform duration-1000 ease-in-out" style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}>
            {initialBanners.map((banner, index) => (
              <div key={banner.id} className="relative flex-shrink-0 w-full h-full">
                <img src={banner.imageUrl} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/30"></div>
              </div>
            ))}
          </div>
          {initialBanners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
              {initialBanners.map((_, index) => (
                <button key={index} onClick={() => setCurrentBannerIndex(index)} className={`transition-all duration-300 rounded-full ${index === currentBannerIndex ? 'bg-white w-10 h-2.5 shadow-lg' : 'bg-white/50 w-2.5 h-2.5'}`} />
              ))}
            </div>
          )}
        </div>
      )}

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-8">
            {/* Premium Group */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border-2 border-yellow-300">
                <h2 className="text-2xl font-bold text-yellow-500 mb-4">⭐ Premium Shops</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedShops.premium.map((shop) => <ShopCard key={shop.id} shop={shop} tierColor="ring-yellow-400" />)}
                    {[...Array(6 - groupedShops.premium.length)].map((_, i) => <PlaceholderCard key={i} tier="Premium" icon="⭐" />)}
                </div>
            </div>

            {/* Other groups (Pro, Basic, Free) would follow a similar structure */}

        </div>

        {isLoadingMore && (
          <div className="flex justify-center items-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div></div>
        )}

        {!hasMoreShops && shops.length > SHOPS_PER_PAGE && (
          <div className="text-center py-8"><p className="text-gray-600">🎉 You've reached the end!</p></div>
        )}
      </main>

      {/* Location Notifications */}
      {showLocationNotif && locationState.status !== 'idle' && (
         <div className="fixed top-20 right-4 z-50 max-w-sm">
            {locationState.status === 'success' && <Notification message="เรียงร้านค้าตามระยะทางแล้ว" type="success" onClose={() => setShowLocationNotif(false)} />}
            {locationState.status === 'error' && <Notification message={`ไม่สามารถโหลดตำแหน่งได้: ${locationState.error}`} type="error" onClose={() => setShowLocationNotif(false)} />}
            {locationState.status === 'loading' && <div className="bg-white rounded-lg shadow-lg p-4"><p>กำลังโหลดตำแหน่ง...</p></div>}
         </div>
      )}
    </div>
  );
}
