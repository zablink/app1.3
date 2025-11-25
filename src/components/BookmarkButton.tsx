// src/components/BookmarkButton.tsx
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useBookmark } from "@/hooks/useBookmark";

interface BookmarkButtonProps {
  shopId: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export default function BookmarkButton({
  shopId,
  size = "md",
  showLabel = false,
  className = "",
}: BookmarkButtonProps) {
  const { isBookmarked, isLoading, toggleBookmark } = useBookmark(shopId);
  const [isAnimating, setIsAnimating] = useState(false);

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 28,
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    const success = await toggleBookmark();
    if (success) {
      // อาจแสดง toast notification ได้
      console.log(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-110 active:scale-95
        ${className}
      `}
      title={isBookmarked ? "ลบออกจากบุ๊คมาร์ค" : "เพิ่มเข้าบุ๊คมาร์ค"}
    >
      <Star
        size={iconSizes[size]}
        fill={isBookmarked ? "#FCD34D" : "none"}
        stroke={isBookmarked ? "#FCD34D" : "#9CA3AF"}
        strokeWidth={2}
        className={`
          transition-all duration-200 drop-shadow-lg
          ${isAnimating ? 'animate-bounce-scale' : ''}
        `}
      />
      <style jsx>{`
        @keyframes bounce-scale {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.3) rotate(-10deg);
          }
          50% {
            transform: scale(0.9) rotate(10deg);
          }
          75% {
            transform: scale(1.2) rotate(-5deg);
          }
        }
        :global(.animate-bounce-scale) {
          animation: bounce-scale 0.6s ease-in-out;
        }
      `}</style>
    </button>
  );
}
