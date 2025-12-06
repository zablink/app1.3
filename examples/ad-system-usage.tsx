// examples/ad-system-usage.tsx
// ตัวอย่างการใช้งานระบบโฆษณาในหน้าต่างๆ

'use client';

import { AdBanner } from '@/components/AdBanner';
import { useAdBanner } from '@/hooks/useAdBanner';
import { useEffect, useState } from 'react';

// ============================================
// ตัวอย่างที่ 1: หน้าแรก (Home Page)
// ============================================
export function HomePage() {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // ดึงตำบลของ user
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const res = await fetch(`/api/user-location?lat=${latitude}&lng=${longitude}`);
      const data = await res.json();
      setUserLocation(data);
    });
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Banner - แบนเนอร์ใหญ่ด้านบน */}
      <section className="mb-8">
        <AdBanner
          placement="hero"
          tambonId={userLocation?.tambon_id}
          amphureId={userLocation?.amphure_id}
          provinceId={userLocation?.province_id}
          limit={1}
          layout="carousel"
          className="w-full"
        />
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 grid grid-cols-12 gap-6">
        {/* Content Area */}
        <main className="col-span-12 lg:col-span-9">
          <h1>ร้านค้าแนะนำ</h1>
          {/* Shop listings... */}
        </main>

        {/* Sidebar with Ads */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="sticky top-4">
            <h3 className="text-lg font-semibold mb-4">โฆษณา</h3>
            <AdBanner
              placement="sidebar"
              tambonId={userLocation?.tambon_id}
              limit={3}
              layout="stack"
            />
          </div>
        </aside>
      </div>

      {/* Footer Banner */}
      <section className="mt-12 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <AdBanner
            placement="footer"
            provinceId={userLocation?.province_id}
            limit={2}
            layout="grid"
          />
        </div>
      </section>
    </div>
  );
}

// ============================================
// ตัวอย่างที่ 2: หน้าหมวดหมู่ (Category Page)
// ============================================
export function CategoryPage({ categorySlug }: { categorySlug: string }) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get user location...
  }, []);

  return (
    <div>
      {/* Category Top Banner */}
      <AdBanner
        placement="category_top"
        tambonId={userLocation?.tambon_id}
        amphureId={userLocation?.amphure_id}
        limit={1}
        layout="carousel"
        className="mb-8"
      />

      {/* Category Content */}
      <div className="container mx-auto px-4">
        <h1>หมวดหมู่: {categorySlug}</h1>
        {/* Shop listings... */}
      </div>

      {/* Category Bottom Banner */}
      <AdBanner
        placement="category_bottom"
        provinceId={userLocation?.province_id}
        limit={1}
        layout="carousel"
        className="mt-8"
      />
    </div>
  );
}

// ============================================
// ตัวอย่างที่ 3: หน้ารายละเอียดร้านค้า (Shop Detail)
// ============================================
export function ShopDetailPage({ shopId }: { shopId: string }) {
  const [shop, setShop] = useState(null);

  return (
    <div>
      {/* Shop Info */}
      <div className="container mx-auto px-4 py-8">
        <h1>{shop?.name}</h1>
        {/* Shop details... */}
      </div>

      {/* Related Shop Ads */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-semibold mb-4">ร้านค้าแนะนำในพื้นที่</h2>
          <AdBanner
            placement="shop_detail"
            tambonId={shop?.tambon_id}
            amphureId={shop?.amphure_id}
            limit={4}
            layout="grid"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// ตัวอย่างที่ 4: หน้าผลการค้นหา (Search Results)
// ============================================
export function SearchResultsPage({ query }: { query: string }) {
  const [userLocation, setUserLocation] = useState(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1>ผลการค้นหา: {query}</h1>

      {/* Search Results Ad */}
      <div className="my-6">
        <AdBanner
          placement="search_results"
          tambonId={userLocation?.tambon_id}
          amphureId={userLocation?.amphure_id}
          provinceId={userLocation?.province_id}
          limit={2}
          layout="grid"
        />
      </div>

      {/* Search results list... */}
    </div>
  );
}

// ============================================
// ตัวอย่างที่ 5: ใช้ Hook แบบ Custom
// ============================================
export function CustomAdComponent() {
  const { banners, loading, trackClick } = useAdBanner({
    placement: 'hero',
    tambonId: 123,
    limit: 3,
    autoTrackView: true
  });

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {banners.map((banner) => (
        <div key={banner.id} className="relative">
          <a
            href={banner.linkUrl || '#'}
            onClick={(e) => {
              if (banner.linkUrl) {
                trackClick(banner.id);
              } else {
                e.preventDefault();
              }
            }}
            className="block group"
          >
            <div className="overflow-hidden rounded-lg">
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            {banner.description && (
              <div className="mt-2">
                <h3 className="font-semibold">{banner.title}</h3>
                <p className="text-sm text-gray-600">{banner.description}</p>
              </div>
            )}
          </a>
          
          {/* Debug Info (แสดงเฉพาะใน development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-400 mt-1">
              Views: {banner.stats.views} | 
              Clicks: {banner.stats.clicks} | 
              CTR: {banner.stats.ctr}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// ตัวอย่างที่ 6: Admin - จัดการโฆษณา
// ============================================
export function AdminAdManager() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // ดึงสถิติทั้งหมด
    fetch('/api/ads/stats?groupBy=placement')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">จัดการโฆษณา</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats?.data?.map((placement: any) => (
          <div key={placement.placement} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold capitalize mb-2">
              {placement.placement.replace('_', ' ')}
            </h3>
            <div className="space-y-2 text-sm">
              <div>จำนวนโฆษณา: {placement.totalBanners}</div>
              <div>Views: {placement.views.toLocaleString()}</div>
              <div>Clicks: {placement.clicks.toLocaleString()}</div>
              <div className="font-semibold text-blue-600">
                CTR: {placement.ctr}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ad List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">รายการโฆษณา</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Placement</th>
              <th className="px-4 py-2 text-left">Target Area</th>
              <th className="px-4 py-2 text-right">Views</th>
              <th className="px-4 py-2 text-right">Clicks</th>
              <th className="px-4 py-2 text-right">CTR</th>
              <th className="px-4 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {/* Render ad rows... */}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// ตัวอย่างที่ 7: Responsive Ads
// ============================================
export function ResponsiveAdBanner() {
  return (
    <div>
      {/* Desktop: Sidebar */}
      <div className="hidden lg:block">
        <AdBanner placement="sidebar" limit={3} layout="stack" />
      </div>

      {/* Mobile: Footer */}
      <div className="lg:hidden">
        <AdBanner placement="footer" limit={1} layout="carousel" />
      </div>
    </div>
  );
}

// ============================================
// ตัวอย่างที่ 8: Lazy Load Ads
// ============================================
export function LazyAdBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('lazy-ad');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div id="lazy-ad" className="min-h-[200px]">
      {isVisible && (
        <AdBanner
          placement="category_bottom"
          limit={1}
          layout="carousel"
        />
      )}
    </div>
  );
}
