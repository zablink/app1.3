// src/app/page.tsx

import { Suspense } from 'react';
import HomePageClient from "./HomePageClient";
import type { Metadata } from 'next';

// Add default Open Graph metadata for the homepage
export const metadata: Metadata = {
  title: 'Zablink - ค้นหาร้านอาหาร โปรโมชั่น และรีวิวที่ดีที่สุด',
  description: 'แพลตฟอร์มค้นหาร้านอาหาร รีวิว และแคมเปญโปรโมชั่น ค้นพบร้านอาหารที่ดีที่สุดใกล้คุณ',
  openGraph: {
    title: 'Zablink - ค้นหาร้านอาหาร โปรโมชั่น และรีวิวที่ดีที่สุด',
    description: 'แพลตฟอร์มค้นหาร้านอาหาร รีวิว และแคมเปญโปรโมชั่น ค้นพบร้านอาหารที่ดีที่สุดใกล้คุณ',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    siteName: 'Zablink',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Zablink - แพลตฟอร์มค้นหาร้านอาหาร',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zablink - ค้นหาร้านอาหาร โปรโมชั่น และรีวิวที่ดีที่สุด',
    description: 'แพลตฟอร์มค้นหาร้านอาหาร รีวิว และแคมเปญโปรโมชั่น ค้นพบร้านอาหารที่ดีที่สุดใกล้คุณ',
    images: [`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/images/og-image.jpg`],
  },
};


// Define types here or import from a shared file
interface Shop {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  image?: string;
  subscriptionTier?: 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM' | null;
  isOG?: boolean;
  ogBadgeEnabled?: boolean;
}

interface HeroBanner {
  id: string;
  imageUrl: string;
}

// This is a placeholder for a proper data fetching function.
// In a real application, this would fetch from a database or a CMS.
async function getInitialData(): Promise<{ shops: Shop[], banners: HeroBanner[] }> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    try {
        // Fetch initial shops data on the server
        const res = await fetch(`${apiBaseUrl}/api/shops?limit=24`, {
            next: { revalidate: 300 } // Cache and revalidate every 5 minutes
        });

        if (!res.ok) {
            console.error(`Failed to fetch initial shops: ${res.status}`);
            // Return empty array on failure, so the page can still render.
            return { shops: [], banners: [] };
        }

        const data = await res.json();
        const shops: Shop[] = data.shops || [];

        // As before, banner data is static. This runs on the server.
        const banners: HeroBanner[] = [
            { id: '1', imageUrl: '/images/banner/1.jpg' },
            { id: '2', imageUrl: '/images/banner/2.jpg' },
            { id: '3', imageUrl: '/images/banner/4.jpg' },
            { id: '4', imageUrl: '/images/banner/3.jpg' },
        ];

        return { shops, banners };

    } catch (error) {
        console.error('Error fetching initial data for HomePage:', error);
        // Return empty arrays on network error or other exceptions
        return { shops: [], banners: [] };
    }
}

// The main page is now an async Server Component
export default async function HomePage() {
  // Fetch data on the server before rendering
  const { shops, banners } = await getInitialData();

  return (
    // The Suspense boundary is good practice for handling loading states during navigation
    <Suspense fallback={<HomePageLoadingSkeleton />}>
      <HomePageClient initialShops={shops} initialBanners={banners} />
    </Suspense>
  );
}

function HomePageLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Banner Skeleton */}
            <div className="w-full h-[600px] bg-gray-200 animate-pulse"></div>
            {/* Content Skeleton */}
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-center items-center py-12">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
            </div>
        </div>
    );
}
