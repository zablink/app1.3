// src/types/shop.ts

export interface LatLong {
  lat: number;
  lng: number;
}

export interface ShopLink {
  id: string;
  type: string;
  url: string;
}

export interface ShopImage {
  id: string;
  url: string;
  isFeatured: boolean;
}

export interface ShopData {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  categoryId: string;
  image: string | null;
  hasPhysicalStore: boolean;
  showLocationOnMap: boolean;
  links: ShopLink[];
  gallery: ShopImage[];
}

// Database types (matching Supabase schema)
export interface ShopDbInsert {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  address: string | null;
  categoryId: string;
  image: string | null;
  has_physical_store: boolean;
  show_location_on_map: boolean;
  updatedAt: string;
  location: string; // PostGIS POINT
}

export interface ShopLinkDbInsert {
  shop_id: string;
  type: string;
  url: string;
}

export interface ShopGalleryDbInsert {
  shop_id: string;
  image_url: string;
  is_featured: boolean;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';