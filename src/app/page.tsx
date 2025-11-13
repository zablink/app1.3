// app/main/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { MapPin, Loader, AlertCircle, SlidersHorizontal } from 'lucide-react';
import LocationModal from '@/components/location/LocationModal';
import ShopCard from '@/components/home/ShopCard';
import PlaceholderShopCard from '@/components/home/PlaceholderShopCard';

interface ShopData {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  address?: string;
  phone?: string;
  website?: string;
  distance_km?: number;
  activeSubscription?: any;
}

interface ShopsByTier {
  PREMIUM: ShopData[];
  PRO: ShopData[];
  BASIC: ShopData[];
  FREE: ShopData[];
}

export default function HomePage() {
  const { location, isLoading: locationLoading } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [shopsByTier, setShopsByTier] = useState<ShopsByTier | null>(null);
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'province' | 'amphure' | 'tambon'>('all');
  const [radiusKm, setRadiusKm] = useState(20);

  // Tier configuration
  const TIER_SLOTS = {
    PREMIUM: 3,
    PRO: 6,
    BASIC: 6,
    FREE: 3 // Show only first 3 FREE shops
  };

  const tierConfig = [
    {
      tier: 'PREMIUM' as const,
      name: 'Premium',
      emoji: '👑',
      color: 'from-amber-400 to-orange-500'
    },
    {
      tier: 'PRO' as const,
      name: 'Pro',
      emoji: '💎',
      color: 'from-purple-500 to-pink-500'
    },
    {
      tier: 'BASIC' as const,
      name: 'Basic',
      emoji: '⭐',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      tier: 'FREE' as const,
      name: 'Free',
      emoji: '🆓',
      color: 'from-gray-400 to-gray-500'
    }
  ];

  // Fetch shops based on location
  useEffect(() => {
    if (!location) return;

    const fetchShops = async () => {
      setIsLoadingShops(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        // ถ้ามี GPS coordinates ให้ใช้
        if (location.coordinates.lat && location.coordinates.lng) {
          params.set('lat', location.coordinates.lat.toString());
          params.set('lng', location.coordinates.lng.toString());
          params.set('radiusKm', radiusKm.toString());
        }
        // ไม่งั้นใช้ location IDs
        else if (location.provinceId && location.amphureId && location.tambonId) {
          params.set('provinceId', location.provinceId.toString());
          params.set('amphureId', location.amphureId.toString());
          params.set('tambonId', location.tambonId.toString());
        }

        params.set('filterLevel', filterLevel);
        params.set('limit', '100');

        const response = await fetch(`/api/shops?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch shops');
        }

        const data = await response.json();
        setShopsByTier(data.shopsByTier);

      } catch (err) {
        console.error('Error fetching shops:', err);
        setError('ไม่สามารถโหลดร้านค้าได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsLoadingShops(false);
      }
    };

    fetchShops();
  }, [location, filterLevel, radiusKm]);

  // Render tier section
  const renderTierSection = (config: typeof tierConfig[0]) => {
    const shops = shopsByTier?.[config.tier] || [];
    const maxSlots = TIER_SLOTS[config.tier];
    const displayShops = shops.slice(0, maxSlots);
    const emptySlots = Math.max(0, maxSlots - displayShops.length);

    return (
      <section key={config.tier} className="mb-12">
        {/* Tier Header */}
        <div className={`bg-gradient-to-r ${config.color} text-white px-6 py-4 rounded-xl mb-6 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{config.emoji}</span>
              <div>
                <h2 className="text-2xl font-bold">{config.name}</h2>
                <p className="text-sm opacity-90">
                  {displayShops.length} ร้านใกล้คุณ
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">สูงสุด {maxSlots} ร้าน</p>
            </div>
          </div>
        </div>

        {/* Shop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} tier={config.tier} />
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <PlaceholderShopCard key={`placeholder-${i}`} tier={config.tier} />
          ))}
        </div>
      </section>
    );
  };

  // Loading state
  if (locationLoading && !location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">กำลังค้นหาตำแหน่งของคุณ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Location */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Location Display */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-2 text-left hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
            >
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">พื้นที่ของคุณ</p>
                <p className="font-medium text-gray-900">
                  {location ? (
                    <>
                      {location.tambonName && `ต.${location.tambonName} `}
                      {location.amphureName && `อ.${location.amphureName} `}
                      {location.provinceName && `จ.${location.provinceName}`}
                    </>
                  ) : (
                    'เลือกพื้นที่'
                  )}
                </p>
              </div>
            </button>

            {/* Filter Controls */}
            <div className="flex items-center gap-2">
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="tambon">ในตำบล</option>
                <option value="amphure">ในอำเภอ</option>
                <option value="province">ในจังหวัด</option>
              </select>

              {location?.coordinates.lat && location?.coordinates.lng && (
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="5">5 กม.</option>
                  <option value="10">10 กม.</option>
                  <option value="20">20 กม.</option>
                  <option value="50">50 กม.</option>
                  <option value="100">100 กม.</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm underline hover:no-underline mt-1"
              >
                โหลดใหม่
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingShops && (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-600">กำลังค้นหาร้านค้าใกล้คุณ...</p>
          </div>
        )}

        {/* Shops by Tier */}
        {!isLoadingShops && shopsByTier && (
          <>
            {tierConfig.map((config) => renderTierSection(config))}
          </>
        )}

        {/* No Shops */}
        {!isLoadingShops && shopsByTier && 
          Object.values(shopsByTier).every(shops => shops.length === 0) && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">ไม่พบร้านค้าในพื้นที่นี้</p>
            <p className="text-sm text-gray-500">ลองขยายรัศมีการค้นหาหรือเปลี่ยนพื้นที่</p>
          </div>
        )}
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
}
