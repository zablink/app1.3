// app/dashboard/shop/select-reviewers/page.tsx
// หน้าร้านค้าเลือก Reviewer พร้อม Filter ราคา

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  DollarSign,
  MapPin,
  Star,
  CheckCircle,
  Youtube,
  Facebook,
  Instagram,
  Music,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface Creator {
  id: string;
  displayName: string;
  bio: string;
  phone: string;
  socialMedia: any;
  currentPriceMin: number;
  currentPriceMax: number;
  avgPrice: number;
  priceTier: string;
  hasExperience: boolean;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  user: {
    name: string;
    email: string;
    image: string;
  };
}

export default function SelectReviewersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [pricePreset, setPricePreset] = useState("");
  const [sortBy, setSortBy] = useState("price");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchReviewers();
    }
  }, [status, router]);

  const fetchReviewers = async () => {
    try {
      const params = new URLSearchParams();
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      params.append("sortBy", sortBy);

      const res = await fetch(`/api/shop/reviewers?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setCreators(data.data);
        setFilteredCreators(data.data);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error fetching reviewers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...creators];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((creator) =>
        creator.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filter
    if (minPrice) {
      filtered = filtered.filter(
        (creator) => creator.currentPriceMin >= parseInt(minPrice)
      );
    }

    if (maxPrice) {
      filtered = filtered.filter(
        (creator) => creator.currentPriceMax <= parseInt(maxPrice)
      );
    }

    // Sort
    if (sortBy === "price") {
      filtered.sort((a, b) => a.currentPriceMin - b.currentPriceMin);
    } else if (sortBy === "price_desc") {
      filtered.sort((a, b) => b.currentPriceMax - a.currentPriceMax);
    }

    setFilteredCreators(filtered);
  }, [searchQuery, minPrice, maxPrice, sortBy, creators]);

  const handlePricePreset = (preset: string) => {
    setPricePreset(preset);
    switch (preset) {
      case "budget":
        setMinPrice("0");
        setMaxPrice("2000");
        break;
      case "mid":
        setMinPrice("2000");
        setMaxPrice("5000");
        break;
      case "premium":
        setMinPrice("5000");
        setMaxPrice("10000");
        break;
      case "pro":
        setMinPrice("10000");
        setMaxPrice("");
        break;
      default:
        setMinPrice("");
        setMaxPrice("");
    }
  };

  const toggleSelectCreator = (creatorId: string) => {
    setSelectedCreators((prev) =>
      prev.includes(creatorId)
        ? prev.filter((id) => id !== creatorId)
        : [...prev, creatorId]
    );
  };

  const handleConfirmSelection = () => {
    if (selectedCreators.length === 0) {
      alert("กรุณาเลือก Reviewer อย่างน้อย 1 คน");
      return;
    }

    // TODO: Navigate to campaign creation or save selection
    console.log("Selected creators:", selectedCreators);
    alert(`เลือก ${selectedCreators.length} Reviewer เรียบร้อยแล้ว`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            เลือก Reviewer
          </h1>
          <p className="text-gray-600">
            เลือก Reviewer ที่เหมาะสมกับร้านของคุณ
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline mr-2" size={16} />
                ค้นหาชื่อ Reviewer
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ..."
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline mr-2" size={16} />
                ราคาต่ำสุด (บาท)
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPricePreset("");
                }}
                placeholder="0"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคาสูงสุด (บาท)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPricePreset("");
                }}
                placeholder="ไม่จำกัด"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Price Presets */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ช่วงราคาแนะนำ:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "ทั้งหมด", desc: "" },
                { id: "budget", label: "งบน้อย", desc: "< 2,000 บาท" },
                { id: "mid", label: "ปานกลาง", desc: "2,000-5,000 บาท" },
                { id: "premium", label: "พรีเมี่ยม", desc: "5,000-10,000 บาท" },
                { id: "pro", label: "มืออาชีพ", desc: "> 10,000 บาท" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePricePreset(preset.id)}
                  className={`px-4 py-2 rounded-lg border transition ${
                    pricePreset === preset.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                  }`}
                >
                  <div className="font-medium">{preset.label}</div>
                  {preset.desc && (
                    <div className="text-xs opacity-80">{preset.desc}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="mt-4 flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              เรียงตาม:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="price">ราคาต่ำสุด → สูงสุด</option>
              <option value="price_desc">ราคาสูงสุด → ต่ำสุด</option>
              <option value="newest">ล่าสุด</option>
              <option value="rating">คะแนนสูงสุด</option>
            </select>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            พบ <strong>{filteredCreators.length}</strong> Reviewer
            {selectedCreators.length > 0 && (
              <span className="ml-2 text-blue-600">
                (เลือกแล้ว {selectedCreators.length} คน)
              </span>
            )}
          </p>
          {selectedCreators.length > 0 && (
            <button
              onClick={handleConfirmSelection}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ยืนยันการเลือก ({selectedCreators.length})
            </button>
          )}
        </div>

        {/* Creators Grid */}
        {filteredCreators.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ไม่พบ Reviewer
            </h3>
            <p className="text-gray-600">
              ลองปรับเงื่อนไขการค้นหาใหม่อีกครั้ง
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator) => (
              <div
                key={creator.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer border-2 ${
                  selectedCreators.includes(creator.id)
                    ? "border-blue-500"
                    : "border-transparent"
                }`}
                onClick={() => toggleSelectCreator(creator.id)}
              >
                <div className="p-6">
                  {/* Selection Indicator */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {creator.displayName}
                      </h3>
                      {creator.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {creator.bio}
                        </p>
                      )}
                    </div>
                    {selectedCreators.includes(creator.id) && (
                      <CheckCircle className="text-blue-600 ml-2" size={24} />
                    )}
                  </div>

                  {/* Price Badge */}
                  <div className="mb-4">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        creator.priceTier === "มืออาชีพ"
                          ? "bg-purple-100 text-purple-800"
                          : creator.priceTier === "ระดับกลาง"
                          ? "bg-blue-100 text-blue-800"
                          : creator.priceTier === "ปานกลาง"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {creator.priceTier}
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-gray-900">
                        ฿{creator.currentPriceMin.toLocaleString()}
                      </span>
                      <span className="text-gray-600">
                        {" "}
                        - ฿{creator.currentPriceMax.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 block">
                        ต่องาน
                      </span>
                    </div>
                  </div>

                  {/* Experience Badge */}
                  {!creator.hasExperience && (
                    <div className="mb-3 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
                      🌟 มือใหม่ - เหมาะสำหรับงบน้อย
                    </div>
                  )}

                  {/* Social Media Icons */}
                  <div className="flex items-center space-x-2 mb-4">
                    {creator.socialMedia?.youtube && (
                      <a
                        href={creator.socialMedia.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-red-50 rounded-full hover:bg-red-100 transition"
                      >
                        <Youtube size={18} className="text-red-600" />
                      </a>
                    )}
                    {creator.socialMedia?.facebook && (
                      <a
                        href={creator.socialMedia.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-blue-50 rounded-full hover:bg-blue-100 transition"
                      >
                        <Facebook size={18} className="text-blue-600" />
                      </a>
                    )}
                    {creator.socialMedia?.instagram && (
                      <a
                        href={creator.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-pink-50 rounded-full hover:bg-pink-100 transition"
                      >
                        <Instagram size={18} className="text-pink-600" />
                      </a>
                    )}
                    {creator.socialMedia?.tiktok && (
                      <a
                        href={creator.socialMedia.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition"
                      >
                        <Music size={18} className="text-gray-900" />
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="border-t pt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-500 mr-1" />
                      <span>4.8 (12 รีวิว)</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={16} className="text-gray-400 mr-1" />
                      <span>กรุงเทพฯ</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sticky Bottom Bar */}
        {selectedCreators.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  เลือกแล้ว {selectedCreators.length} Reviewer
                </p>
                <p className="text-sm text-gray-600">
                  ราคารวมประมาณ: ฿
                  {filteredCreators
                    .filter((c) => selectedCreators.includes(c.id))
                    .reduce((sum, c) => sum + c.avgPrice, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedCreators([])}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                >
                  ล้างทั้งหมด
                </button>
                <button
                  onClick={handleConfirmSelection}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  ยืนยันการเลือก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}