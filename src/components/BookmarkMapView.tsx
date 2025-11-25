// src/components/BookmarkMapView.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation, MapPin, X } from "lucide-react";
import Image from "next/image";

interface Shop {
  id: string;
  name: string;
  category: string;
  image: string;
  lat: number | null;
  lng: number | null;
  address: string;
  rating: number;
  reviewCount: number;
  notes?: string;
  tags?: string[];
}

interface BookmarkMapViewProps {
  bookmarks: Shop[];
  userLocation?: { lat: number; lng: number } | null;
}

// Haversine formula สำหรับคำนวณระยะทาง
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // รัศมีโลกเป็น km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function BookmarkMapView({
  bookmarks,
  userLocation,
}: BookmarkMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopsWithDistance, setShopsWithDistance] = useState<
    (Shop & { distance?: number })[]
  >([]);
  const [mapInitialized, setMapInitialized] = useState(false);

  // กรองร้านที่มีพิกัด
  const shopsWithCoords = bookmarks.filter(
    (shop) => shop.lat !== null && shop.lng !== null
  );

  // สร้างแผนที่แค่ครั้งเดียว
  useEffect(() => {
    if (mapInitialized || !shopsWithCoords.length) return;

    const centerLat = userLocation?.lat || shopsWithCoords[0].lat!;
    const centerLng = userLocation?.lng || shopsWithCoords[0].lng!;

    const map = L.map("bookmark-map", {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true,
      dragging: true,
      tap: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      minZoom: 10,
    }).addTo(map);

    mapRef.current = map;
    setMapInitialized(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapInitialized(false);
      }
    };
  }, []);

  // อัพเดต markers เมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    if (!mapRef.current || !mapInitialized || shopsWithCoords.length === 0) return;

  // อัพเดต markers เมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    if (!mapRef.current || !mapInitialized || shopsWithCoords.length === 0) return;

    // คำนวณระยะทางถ้ามี user location
    const shopsData = shopsWithCoords.map((shop) => {
      if (userLocation && shop.lat && shop.lng) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          shop.lat,
          shop.lng
        );
        return { ...shop, distance };
      }
      return shop;
    });

    setShopsWithDistance(shopsData);

    // ลบ markers เก่าทั้งหมด
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // เพิ่ม marker สำหรับแต่ละร้าน
    shopsData.forEach((shop) => {
      if (!shop.lat || !shop.lng) return;

      const customIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div class="relative">
            <div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
              🍴
            </div>
            ${
              shop.distance
                ? `<div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap shadow">
                ${shop.distance.toFixed(1)} km
              </div>`
                : ""
            }
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([shop.lat, shop.lng], { icon: customIcon }).addTo(
        mapRef.current!
      );

      marker.on("click", () => {
        setSelectedShop(shop);
      });

      const popupContent = `
        <div class="p-2 min-w-[200px]">
          <h3 class="font-bold text-sm mb-1">${shop.name}</h3>
          <p class="text-xs text-gray-600 mb-1">${shop.category}</p>
          ${
            shop.distance
              ? `<p class="text-xs font-semibold text-blue-600">ระยะทาง: ${shop.distance.toFixed(2)} กม.</p>`
              : ""
          }
          <button 
            onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}', '_blank')"
            class="mt-2 w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
          >
            นำทาง
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    // เพิ่ม marker สำหรับตำแหน่งผู้ใช้
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      const userIcon = L.divIcon({
        className: "user-marker",
        html: `
          <div class="relative">
            <div class="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-4 border-white animate-pulse">
              📍
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
              คุณ
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
      }).addTo(mapRef.current!);

      userMarker.bindPopup(
        '<div class="text-center font-semibold">ตำแหน่งของคุณ</div>'
      );

      userMarkerRef.current = userMarker;

      // ปรับ bounds ให้เห็นทั้งตำแหน่งผู้ใช้และร้านทั้งหมด (ทำครั้งเดียวตอนโหลด)
      if (shopsData.length > 0) {
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          ...shopsData.map((s) => [s.lat!, s.lng!] as [number, number]),
        ]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      if (userMarkerRef.current) userMarkerRef.current.remove();
    };
  }, [shopsWithCoords, userLocation, mapInitialized]);

  const handleNavigate = (shop: Shop) => {
    if (shop.lat && shop.lng) {
      // เปิด Google Maps สำหรับนำทาง
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`,
        "_blank"
      );
    }
  };

  if (shopsWithCoords.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <MapPin className="mx-auto mb-4 text-gray-400" size={64} />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          ไม่มีร้านที่มีข้อมูลพิกัด
        </h3>
        <p className="text-gray-600">
          ร้านที่คุณบันทึกไว้ยังไม่มีข้อมูลตำแหน่งบนแผนที่
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* แผนที่ */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div id="bookmark-map" className="w-full h-[500px]"></div>
      </div>

      {/* รายการร้านที่เรียงตามระยะทาง */}
      {userLocation && shopsWithDistance.some((s) => s.distance) && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-bold text-lg mb-4">
            ร้านที่ใกล้คุณที่สุด (เรียงตามระยะทาง)
          </h3>
          <div className="space-y-3">
            {shopsWithDistance
              .filter((s) => s.distance !== undefined)
              .sort((a, b) => (a.distance || 0) - (b.distance || 0))
              .slice(0, 5)
              .map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => setSelectedShop(shop)}
                >
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={shop.image || "/placeholder-shop.jpg"}
                      alt={shop.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{shop.name}</h4>
                    <p className="text-sm text-gray-600">{shop.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-blue-600">
                      {shop.distance?.toFixed(1)} km
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(shop);
                      }}
                      className="mt-1 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Navigation size={12} />
                      นำทาง
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Shop Detail Modal */}
      {selectedShop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">รายละเอียดร้าน</h3>
              <button
                onClick={() => setSelectedShop(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative w-full h-48">
                <Image
                  src={selectedShop.image || "/placeholder-shop.jpg"}
                  alt={selectedShop.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>

              <div>
                <h4 className="font-bold text-xl mb-1">{selectedShop.name}</h4>
                <p className="text-gray-600">{selectedShop.category}</p>
              </div>

              {selectedShop.distance && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">ระยะทางจากคุณ</p>
                  <p className="font-bold text-lg text-blue-600">
                    {selectedShop.distance.toFixed(2)} กิโลเมตร
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">ที่อยู่</p>
                <p className="text-gray-800">{selectedShop.address}</p>
              </div>

              {selectedShop.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">บันทึกส่วนตัว</p>
                  <p className="text-gray-800 bg-yellow-50 p-3 rounded">
                    {selectedShop.notes}
                  </p>
                </div>
              )}

              {selectedShop.tags && selectedShop.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">แท็ก</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedShop.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <a
                  href={`/shop/${selectedShop.id}`}
                  className="flex-1 py-2 text-center bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  ดูรายละเอียด
                </a>
                <button
                  onClick={() => handleNavigate(selectedShop)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Navigation size={18} />
                  นำทาง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
