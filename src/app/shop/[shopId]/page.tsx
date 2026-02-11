// src/app/shop/[shopId]/page.tsx

import { notFound } from 'next/navigation';
import ShopDetailPageClient from './ShopDetailPageClient';
import { Suspense } from 'react';
import type { Metadata } from 'next';

// Assuming types are in a shared file
type Shop = { id: string; name: string; description?: string; image?: string; [key: string]: any; };
type Review = { id: number; [key: string]: any; };

async function getShopData(shopId: string): Promise<{ shop: Shop | null; reviews: Review[] }> {
    if (!shopId) {
        return { shop: null, reviews: [] };
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    try {
        const [shopRes, reviewsRes] = await Promise.all([
            fetch(`${apiBaseUrl}/api/shops/${shopId}`, { next: { revalidate: 300 } }),
            fetch(`${apiBaseUrl}/api/shops/${shopId}/reviews`, { next: { revalidate: 600 } })
        ]);

        if (!shopRes.ok) {
            if (shopRes.status === 404) return { shop: null, reviews: [] };
            console.error(`Failed to fetch shop data: ${shopRes.status}`);
            return { shop: null, reviews: [] };
        }

        const shopData = await shopRes.json();
        const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { reviews: [] };

        return {
            shop: shopData,
            reviews: reviewsData.reviews || [],
        };

    } catch (error) {
        console.error(`Error in getShopData for shopId ${shopId}:`, error);
        return { shop: null, reviews: [] };
    }
}

// Generate rich metadata for social sharing
export async function generateMetadata({ params }: { params: { shopId: string } }): Promise<Metadata> {
    const { shop } = await getShopData(params.shopId);

    if (!shop) {
        return {
            title: 'ไม่พบร้านค้า',
        };
    }

    const title = `ร้าน ${shop.name} บน Zablink`;
    const description = shop.description?.substring(0, 150) || `ดูข้อมูล, รีวิว, และโปรโมชั่นของร้าน ${shop.name} บนแพลตฟอร์ม Zablink`;
    const imageUrl = shop.image || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/images/placeholder.jpg`;
    const pageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/shop/${shop.id}`;

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: pageUrl,
            siteName: 'Zablink',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: `รูปภาพของร้าน ${shop.name}`,
                },
            ],
            locale: 'th_TH',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: title,
            description: description,
            images: [imageUrl],
        },
    };
}


export default async function ShopDetailPage({ params }: { params: { shopId: string } }) {
    const { shopId } = params;
    const { shop, reviews } = await getShopData(shopId);

    if (!shop) {
        notFound();
    }

    return (
        <Suspense fallback={<ShopDetailLoadingSkeleton />}>
            <ShopDetailPageClient shop={shop} initialReviews={reviews} />
        </Suspense>
    );
}

function ShopDetailLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="h-96 bg-gray-300 animate-pulse"></div>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="h-8 bg-gray-300 rounded w-1/3 mb-4 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
