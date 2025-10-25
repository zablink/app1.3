// src/app/shop/edit/[id]/page.tsx

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type * as L from 'leaflet';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Upload, X, MapPin, Save, ArrowLeft } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

// Types
interface LatLong {
  lat: number;
  lng: number;
}

interface ShopData {
  id: number;
  name: string;
  category: string | null;
  image: string | null;
  lat: number | null;
  lng: number | null;
  subdistrict: string | null;
  district: string | null;
  province: string | null;
}

// Map Picker Component
interface MapPickerProps {
  initialCoords: LatLong | null;
  onCoordinateChange: (latLng: LatLong) => void;
}

const MapPickerComponent: React.FC<MapPickerProps> = ({ initialCoords, onCoordinateChange }) => {
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const setupMap = useCallback((coordsToUse: LatLong, zoomToUse: number, LInstance: typeof L) => {
    if (mapRef.current) return;
    if (!document.getElementById('shop-map-container')) {
      console.error("Map container not found!");
      return;
    }

    const map = LInstance.map('shop-map-container').setView([coordsToUse.lat, coordsToUse.lng], zoomToUse);
    mapRef.current = map;

    LInstance.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = LInstance.marker([coordsToUse.lat, coordsToUse.lng]).addTo(map);
    markerRef.current = marker;
    onCoordinateChange(coordsToUse);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = e.latlng.lat;
      const newLng = e.latlng.lng;

      markerRef.current?.setLatLng([newLat, newLng]);
      onCoordinateChange({ lat: newLat, lng: newLng });
    });
  }, [onCoordinateChange]);

  const handleLocateMe = useCallback(() => {
    if (!mapRef.current || !markerRef.current || !navigator.geolocation) {
      alert("ไม่รองรับ Geolocation");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const currentCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
        mapRef.current!.setView([currentCoords.lat, currentCoords.lng], 18);
        markerRef.current!.setLatLng([currentCoords.lat, currentCoords.lng]);
        onCoordinateChange(currentCoords);
        setIsLocating(false);
      },
      (err: GeolocationPositionError) => {
        console.warn(`Geolocation Error: ${err.message}`);
        alert("ไม่สามาร