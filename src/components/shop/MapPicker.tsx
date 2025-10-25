// components/shop/MapPicker.tsx
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPickerProps {
  initialPosition: { lat: number; lng: number };
  onLocationChange: (location: { lat: number; lng: number }) => void;
}

export default function MapPicker({
  initialPosition,
  onLocationChange,
}: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map("map").setView(
        [initialPosition.lat, initialPosition.lng],
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // Custom marker icon
      const customIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Add marker
      markerRef.current = L.marker(
        [initialPosition.lat, initialPosition.lng],
        {
          draggable: true,
          icon: customIcon,
        }
      ).addTo(mapRef.current);

      // Handle marker drag
      markerRef.current.on("dragend", function (e) {
        const position = e.target.getLatLng();
        onLocationChange({
          lat: position.lat,
          lng: position.lng,
        });
      });

      // Handle map click
      mapRef.current.on("click", function (e) {
        if (markerRef.current && mapRef.current) {
          markerRef.current.setLatLng(e.latlng);
          onLocationChange({
            lat: e.latlng.lat,
            lng: e.latlng.lng,
          });
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div>
      <div id="map" className="h-64 rounded-lg border border-gray-300"></div>
      <p className="text-sm text-gray-600 mt-2">
        คลิกบนแผนที่หรือลากปักหมุดเพื่อเลือกตำแหน่ง
      </p>
    </div>
  );
}