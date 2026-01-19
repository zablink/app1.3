// src/components/AdBanner.tsx
'use client';

import { useAdBanner } from '@/hooks/useAdBanner';
import Image from 'next/image';
import Link from 'next/link';

interface AdBannerProps {
  placement: 'hero' | 'sidebar' | 'category_top' | 'category_bottom' | 'shop_detail' | 'search_results' | 'footer';
  tambonId?: number | null;
  amphureId?: number | null;
  provinceId?: number | null;
  limit?: number;
  className?: string;
  layout?: 'carousel' | 'grid' | 'stack'; // วิธีแสดงผล
}

/**
 * Component สำหรับแสดงโฆษณา
 * รองรับหลาย placement และ auto-tracking
 * 
 * @example
 * ```tsx
 * // Hero Banner
 * <AdBanner placement="hero" tambonId={123} />
 * 
 * // Sidebar Ads
 * <AdBanner placement="sidebar" limit={3} layout="stack" />
 * 
 * // Category Page Top Banner
 * <AdBanner placement="category_top" amphureId={45} />
 * ```
 */
export function AdBanner({
  placement,
  tambonId,
  amphureId,
  provinceId,
  limit = 5,
  className = '',
  layout = 'carousel'
}: AdBannerProps) {
  const { banners, loading, trackClick } = useAdBanner({
    placement,
    tambonId,
    amphureId,
    provinceId,
    limit,
    autoTrackView: true // อัตโนมัติบันทึก view
  });

  if (loading) {
    return (
      <div className={`ad-banner-loading ${className}`}>
        <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null; // ไม่แสดงอะไรถ้าไม่มีโฆษณา
  }

  const handleClick = (bannerId: string, linkUrl: string | null) => {
    trackClick(bannerId);
    if (linkUrl) {
      // Let the Link component handle navigation
    }
  };

  // Layout: Carousel (for hero banners)
  if (layout === 'carousel' && banners.length > 0) {
    // TODO: ใช้ library carousel เช่น Swiper หรือ Embla
    const banner = banners[0]; // แสดงแค่อันแรก (หรือใช้ carousel)
    
    return (
      <div className={`ad-banner-carousel ${className}`}>
        {banner.linkUrl ? (
          <Link 
            href={banner.linkUrl}
            onClick={() => handleClick(banner.id, banner.linkUrl)}
            className="block relative w-full h-64 md:h-96 overflow-hidden rounded-lg"
          >
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              className="object-cover"
              priority
            />
            {banner.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-white text-2xl font-bold mb-2">{banner.title}</h3>
                <p className="text-white/90">{banner.description}</p>
              </div>
            )}
          </Link>
        ) : (
          <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-lg">
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
      </div>
    );
  }

  // Layout: Grid (for multiple banners side-by-side)
  if (layout === 'grid') {
    return (
      <div className={`ad-banner-grid grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
        {banners.map((banner) => (
          <div key={banner.id} className="relative">
            {banner.linkUrl ? (
              <Link
                href={banner.linkUrl}
                onClick={() => handleClick(banner.id, banner.linkUrl)}
                className="block relative w-full h-48 overflow-hidden rounded-lg hover:opacity-90 transition"
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
              </Link>
            ) : (
              <div className="relative w-full h-48 overflow-hidden rounded-lg">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Layout: Stack (for sidebar ads)
  if (layout === 'stack') {
    return (
      <div className={`ad-banner-stack space-y-4 ${className}`}>
        {banners.map((banner) => (
          <div key={banner.id}>
            {banner.linkUrl ? (
              <Link
                href={banner.linkUrl}
                onClick={() => handleClick(banner.id, banner.linkUrl)}
                className="block relative w-full h-32 overflow-hidden rounded-lg hover:opacity-90 transition"
              >
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
              </Link>
            ) : (
              <div className="relative w-full h-32 overflow-hidden rounded-lg">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
