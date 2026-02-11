// src/app/page.tsx

import { Suspense } from 'react';
import HomePageClient from "./HomePageClient";
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma'; // Import the Prisma client singleton

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

async function getInitialData(): Promise<{ shops: Shop[], banners: HeroBanner[] }> {
    try {
        // Fetch initial shops directly from the database using Prisma
        const shops = await prisma.shop.findMany({
            where: {
                isActive: true, // Assuming you only want to show active shops
                isPublished: true, // Assuming shops must be published
            },
            take: 24, // Fetch the first 24 shops
            orderBy: [
                {
                    subscriptionTier: 'desc', // Premium, Pro, Basic, Free
                },
                {
                    createdAt: 'desc',
                },
            ],
            select: {
                id: true,
                name: true,
                description: true,
                logo: true,
                image: true,
                subscriptionTier: true,
                isOG: true,
                ogBadgeEnabled: true,
            },
        });

        // Banner data can remain static or be fetched from a DB as well
        const banners: HeroBanner[] = [
            { id: '1', imageUrl: '/images/banner/1.jpg' },
            { id: '2', imageUrl: '/images/banner/2.jpg' },
            { id: '3', imageUrl: '/images/banner/4.jpg' },
            { id: '4', imageUrl: '/images/banner/3.jpg' },
        ];

        return { shops, banners };

    } catch (error) {
        console.error('Error fetching initial data for HomePage:', error);
        // In case of a database error, return empty arrays to prevent crashing.
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
