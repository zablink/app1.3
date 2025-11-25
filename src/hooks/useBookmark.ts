// src/hooks/useBookmark.ts
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export function useBookmark(shopId: string) {
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkBookmarkStatus();
  }, [shopId, session]);

  const checkBookmarkStatus = async () => {
    if (!session) {
      setIsBookmarked(false);
      return;
    }

    try {
      const res = await fetch(`/api/user/bookmarks/${shopId}`);
      const data = await res.json();
      setIsBookmarked(data.isBookmarked || false);
    } catch (error) {
      console.error("Error checking bookmark status:", error);
      setIsBookmarked(false);
    }
  };

  const toggleBookmark = async (notes?: string, tags?: string[]) => {
    if (!session) {
      alert("กรุณาเข้าสู่ระบบก่อนใช้งาน");
      return false;
    }

    setIsLoading(true);

    try {
      if (isBookmarked) {
        // ลบ bookmark
        const res = await fetch(`/api/user/bookmarks/${shopId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setIsBookmarked(false);
          return true;
        }
      } else {
        // เพิ่ม bookmark
        const res = await fetch("/api/user/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, notes, tags }),
        });

        if (res.ok) {
          setIsBookmarked(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookmark = async (notes?: string, tags?: string[]) => {
    if (!session || !isBookmarked) return false;

    setIsLoading(true);

    try {
      const res = await fetch(`/api/user/bookmarks/${shopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, tags }),
      });

      return res.ok;
    } catch (error) {
      console.error("Error updating bookmark:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isBookmarked,
    isLoading,
    toggleBookmark,
    updateBookmark,
    refresh: checkBookmarkStatus,
  };
}
