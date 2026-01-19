// components/home/PlaceholderShopCard.tsx
"use client";

import Link from 'next/link';
import { Store, ArrowRight } from 'lucide-react';

interface PlaceholderShopCardProps {
  tier: 'PREMIUM' | 'PRO' | 'BASIC' | 'FREE';
}

const tierStyles = {
  PREMIUM: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    border: 'border-amber-200 border-dashed',
    text: 'text-amber-700',
    button: 'bg-amber-600 hover:bg-amber-700'
  },
  PRO: {
    bg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    border: 'border-purple-200 border-dashed',
    text: 'text-purple-700',
    button: 'bg-purple-600 hover:bg-purple-700'
  },
  BASIC: {
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    border: 'border-blue-200 border-dashed',
    text: 'text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700'
  },
  FREE: {
    bg: 'bg-gray-50',
    border: 'border-gray-300 border-dashed',
    text: 'text-gray-600',
    button: 'bg-gray-600 hover:bg-gray-700'
  }
};

export default function PlaceholderShopCard({ tier }: PlaceholderShopCardProps) {
  const styles = tierStyles[tier];

  return (
    <div className={`${styles.bg} ${styles.border} border-2 rounded-xl p-6 flex flex-col items-center justify-center text-center h-full min-h-[180px]`}>
      <Store className={`w-12 h-12 ${styles.text} mb-3 opacity-50`} />
      <p className={`${styles.text} font-medium mb-2`}>
        พื้นที่ว่างสำหรับร้านค้า
      </p>
      <p className="text-sm text-gray-500 mb-4">
        นี่อาจจะเป็นร้านของคุณ!
      </p>
      <Link 
        href="/subscriptions"
        className={`${styles.button} text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors`}
      >
        ดูแพ็กเกจ
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
