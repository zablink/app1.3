// components/shop/CreatorSelection.tsx
"use client";

import { useState, useEffect } from "react";
import { MapPin, Star, Users, TrendingUp, ExternalLink, Coins } from "lucide-react";

interface Creator {
  id: string;
  displayName: string;
  bio: string;
  rating: number;
  completedReviews: number;
  tokenPrice: number;
  tier: string;
  
  // Location
  distance: number; // km
  provinceName: string;
  amphureName: string | null;
  
  // Social stats
  tiktokUrl: string | null;
  tiktokFollowers: number | null;
  youtubeUrl: string | null;
  youtubeSubscribers: number | null;
  instagramUrl: string | null;
  instagramFollowers: number | null;
}

interface CreatorSelectionProps {
  shopId: string;
  availableTokens: number;
  onSelect: (creatorId: string, tokenCost: number) => void;
}

export default function CreatorSelection({
  shopId,
  availableTokens,
  onSelect,
}: CreatorSelectionProps) {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [sortBy, setSortBy] = useState<string>("distance"); // distance, price, rating

  useEffect(() => {
    fetchCreators();
  }, [shopId, sortBy]);

  const fetchCreators = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/shops/${shopId}/creators/available?sort=${sortBy}`
      );
      const data = await res.json();
      setCreators(data.creators || []);
    } catch (error) {
      console.error("Error fetching creators:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (creator: Creator) => {
    if (creator.tokenPrice > availableTokens) {
      alert(`ไม่เพียงพอ! คุณมี ${availableTokens} tokens แต่ต้องใช้ ${creator.tokenPrice} tokens`);
      return;
    }
    setSelectedCreator(creator);
  };

  const confirmSelection = () => {
    if (!selectedCreator) return;
    if (
      confirm(
        `ยืนยันการเลือก ${selectedCreator.displayName}?\nจะใช้ ${selectedCreator.tokenPrice} tokens`
      )
    ) {
      onSelect(selectedCreator.id, selectedCreator.tokenPrice);
    }
  };

  const getTierBadge = (tier: string) => {
    const badges = {
      micro: { color: "bg-gray-100 text-gray-700", label: "Micro" },
      small: { color: "bg-blue-100 text-blue-700", label: "Small" },
      medium: { color: "bg-purple-100 text-purple-700", label: "Medium" },
      large: { color: "bg-yellow-100 text-yellow-700", label: "Large" },
    };
    const badge = badges[tier as keyof typeof badges] || badges.micro;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const formatFollowers = (count: number | null) => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังค้นหา Creators...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">เลือก Content Creator</h2>
          <p className="text-gray-600 mt-1">
            คุณมี <span className="font-semibold text-blue-600">{availableTokens} tokens</span>
          </p>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="distance">ใกล้ที่สุด</option>
          <option value="price">ราคาถูกสุด</option>
          <option value="rating">คะแนนสูงสุด</option>
          <option value="popular">ยอดนิยม</option>
        </select>
      </div>

      {/* Creators List */}
      {creators.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ไม่พบ Content Creator
          </h3>
          <p className="text-gray-600">
            ขณะนี้ยังไม่มี Creator ในพื้นที่ของคุณ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all hover:shadow-xl ${
                creator.tokenPrice > availableTokens
                  ? "border-gray-200 opacity-60"
                  : "border-transparent hover:border-blue-500 cursor-pointer"
              }`}
              onClick={() => handleSelect(creator)}
            >
              {/* Creator Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {creator.displayName}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      {getTierBadge(creator.tier)}
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-sm font-medium text-gray-900">
                          {creator.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-blue-600 font-bold text-xl">
                      <Coins className="h-5 w-5 mr-1" />
                      {creator.tokenPrice}
                    </div>
                    <span className="text-xs text-gray-500">tokens</span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {creator.bio}
                </p>

                {/* Location */}
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {creator.distance.toFixed(1)} km • {creator.amphureName || creator.provinceName}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>{creator.completedReviews} รีวิวสำเร็จ</span>
                </div>
              </div>

              {/* Social Stats */}
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-center">
                  {/* TikTok */}
                  {creator.tiktokFollowers && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">TikTok</div>
                      <div className="font-semibold text-sm text-gray-900">
                        {formatFollowers(creator.tiktokFollowers)}
                      </div>
                    </div>
                  )}

                  {/* YouTube */}
                  {creator.youtubeSubscribers && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">YouTube</div>
                      <div className="font-semibold text-sm text-gray-900">
                        {formatFollowers(creator.youtubeSubscribers)}
                      </div>
                    </div>
                  )}

                  {/* Instagram */}
                  {creator.instagramFollowers && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Instagram</div>
                      <div className="font-semibold text-sm text-gray-900">
                        {formatFollowers(creator.instagramFollowers)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-2 mt-3">
                  {creator.tiktokUrl && (
                    <a
                      href={creator.tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 bg-black text-white text-xs rounded-lg hover:bg-gray-800 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      TikTok <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  )}
                  {creator.youtubeUrl && (
                    <a
                      href={creator.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      YouTube <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>

              {/* Insufficient Tokens Warning */}
              {creator.tokenPrice > availableTokens && (
                <div className="bg-red-50 px-6 py-3 border-t border-red-100">
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ Tokens ไม่เพียงพอ (ต้องการอีก {creator.tokenPrice - availableTokens} tokens)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selection Modal */}
      {selectedCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ยืนยันการเลือก Creator
            </h3>

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">
                    {selectedCreator.displayName}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedCreator.completedReviews} รีวิวสำเร็จ • {selectedCreator.rating.toFixed(1)} ⭐
                  </p>
                  <div className="flex items-center text-blue-600 font-bold">
                    <Coins className="h-5 w-5 mr-1" />
                    {selectedCreator.tokenPrice} tokens
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Tokens ที่มี:</span>
                <span className="font-semibold">{availableTokens} tokens</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Tokens ที่ใช้:</span>
                <span className="font-semibold text-red-600">
                  -{selectedCreator.tokenPrice} tokens
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Tokens คงเหลือ:</span>
                  <span className="font-bold text-blue-600">
                    {availableTokens - selectedCreator.tokenPrice} tokens
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCreator(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmSelection}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}