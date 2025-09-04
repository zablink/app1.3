// src/lib/geocoding.ts

export async function reverseGeocode(lat: number, lng: number) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=th&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    return null;
  }

  const addressComponents = data.results[0].address_components;

  let subdistrict = "";
  let district = "";
  let province = "";

  for (const comp of addressComponents) {
    if (comp.types.includes("sublocality_level_1") || comp.types.includes("locality")) {
      subdistrict = comp.long_name;
    }
    if (comp.types.includes("administrative_area_level_2")) {
      district = comp.long_name;
    }
    if (comp.types.includes("administrative_area_level_1")) {
      province = comp.long_name;
    }
  }

  return { subdistrict, district, province };
}
