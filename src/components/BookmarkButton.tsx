// src/components/BookmarkButton.tsx
"use client";

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

  const sizeClasses = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4",
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 26,
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        ${sizeClasses[size]}
        ${
          isBookmarked
            ? "bg-yellow-500 text-white hover:bg-yellow-600"
            : "bg-white/90 text-gray-700 hover:bg-white"
        }
        backdrop-blur-sm rounded-full shadow-lg transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
        ${className}
      `}
      title={isBookmarked ? "ลบออกจากบุ๊คมาร์ค" : "เพิ่มเข้าบุ๊คมาร์ค"}
    >
      <Star
        size={iconSizes[size]}
        fill={isBookmarked ? "currentColor" : "none"}
        className="transition-all"
      />
      {showLabel && (
        <span className="text-sm font-medium pr-1">
          {isBookmarked ? "บันทึกแล้ว" : "บันทึก"}
        </span>
      )}
    </button>
  );
}
