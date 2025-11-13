// components/home/ShopCard.tsx
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Phone, Globe } from 'lucide-react';

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    address?: string;
    phone?: string;
    website?: string;
    distance_km?: number;
    activeSubscription?: {
      subscription_packages: {
        tier: string;
        name: string;
        badge_text?: string;
        badge_emoji?: string;
      };
    };
  };
  tier: 'PREMIUM' | 'PRO' | 'BASIC' | 'FREE';
}

const tierStyles = {
  PREMIUM: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200',
    badge: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
    badgeRing: 'ring-2 ring-amber-300'
  },
  PRO: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    border: 'border-purple-200',
    badge: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    badgeRing: 'ring-2 ring-purple-300'
  },
  BASIC: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    badge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
    badgeRing: 'ring-2 ring-blue-300'
  },
  FREE: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-500 text-white',
    badgeRing: 'ring-2 ring-gray-300'
  }
};

export default function ShopCard({ shop, tier }: ShopCardProps) {
  const styles = tierStyles[tier];
  const subscription = shop.activeSubscription;

  return (
    <Link href={`/shop/${shop.id}`}>
      <div className={`group relative ${styles.bg} ${styles.border} border rounded-xl p-5 hover:shadow-xl transition-all duration-300 cursor-pointer h-full`}>
        {/* Tier Badge */}
        {subscription && (
          <div className={`absolute top-3 right-3 ${styles.badge} ${styles.badgeRing} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
            {subscription.subscription_packages.badge_emoji && (
              <span>{subscription.subscription_packages.badge_emoji}</span>
            )}
            {subscription.subscription_packages.badge_text || subscription.subscription_packages.tier}
          </div>
        )}

        <div className="flex gap-4">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 relative rounded-xl overflow-hidden bg-white shadow-md">
              {shop.logo ? (
                <Image
                  src={shop.logo}
                  alt={shop.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 text-2xl font-bold">
                  {shop.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors truncate">
              {shop.name}
            </h3>
            
            {shop.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {shop.description}
              </p>
            )}

            <div className="space-y-1.5 text-sm text-gray-500">
              {/* Distance */}
              {shop.distance_km !== undefined && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    ห่างจากคุณ {shop.distance_km < 1 
                      ? `${Math.round(shop.distance_km * 1000)} ม.`
                      : `${shop.distance_km.toFixed(1)} กม.`
                    }
                  </span>
                </div>
              )}

              {/* Address */}
              {shop.address && (
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1 text-xs">{shop.address}</span>
                </div>
              )}

              {/* Phone */}
              {shop.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{shop.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400 rounded-xl pointer-events-none transition-colors" />
      </div>
    </Link>
  );
}
