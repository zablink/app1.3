'use client';

import { useState, useEffect } from 'react';

interface Ad {
  id: string;
  title?: string;
  description?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  placement?: string;
}

interface AdPlacementProps {
  placement: string;
}

export default function AdPlacement({ placement }: AdPlacementProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdForLocation = (latitude: number, longitude: number) => {
      fetch(
        `/api/ads/banners?placement=${encodeURIComponent(placement)}&limit=1`
      )
        .then((res) => {
          if (res.ok && res.status !== 204) return res.json();
          return Promise.reject(new Error('No ad available'));
        })
        .then((data) => {
          const banners = data?.banners ?? data;
          const first = Array.isArray(banners) ? banners[0] : null;
          if (first?.imageUrl) setAd(first);
          else setAd(null);
        })
        .catch(() => setAd(null))
        .finally(() => setIsLoading(false));
    };

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      fetch(`/api/ads/banners?placement=${encodeURIComponent(placement)}&limit=1`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          const banners = data?.banners ?? data;
          const first = Array.isArray(banners) ? banners[0] : null;
          if (first?.imageUrl) setAd(first);
          else setAd(null);
        })
        .catch(() => setAd(null))
        .finally(() => setIsLoading(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchAdForLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        fetch(`/api/ads/banners?placement=${encodeURIComponent(placement)}&limit=1`)
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data) => {
            const banners = data?.banners ?? data;
            const first = Array.isArray(banners) ? banners[0] : null;
            if (first?.imageUrl) setAd(first);
            else setAd(null);
          })
          .catch(() => setAd(null))
          .finally(() => setIsLoading(false));
      }
    );
  }, [placement]);

  if (isLoading || !ad) return null;

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      <a
        href={ad.linkUrl || '#'}
        target={ad.linkUrl?.startsWith('http') ? '_blank' : undefined}
        rel={ad.linkUrl?.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="block"
      >
        <img
          src={ad.imageUrl}
          alt={ad.title || 'โฆษณา'}
          className="w-full h-auto object-contain max-h-48"
        />
        {ad.title && (
          <p className="p-2 text-sm text-gray-600 text-center">{ad.title}</p>
        )}
      </a>
    </div>
  );
}
