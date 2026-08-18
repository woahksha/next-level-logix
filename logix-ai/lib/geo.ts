// ==================================================
// Logix AI — Geo utilities
// Static Indian city coordinate dataset + Haversine
// distance calculation. No external maps API, no key
// required. Used server-side when an Order is created
// so every order gets a real distanceKm.
// ==================================================

export interface CityCoords {
  lat: number;
  lng: number;
}

// Coordinates are approximate city-centre points — accurate enough for
// a great-circle distance estimate between pickup and drop locations.
export const CITY_COORDS: Record<string, CityCoords> = {
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Surat: { lat: 21.1702, lng: 72.8311 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Indore: { lat: 22.7196, lng: 75.8577 },
  Bhopal: { lat: 23.2599, lng: 77.4126 },
  Nagpur: { lat: 21.1458, lng: 79.0882 },
  Patna: { lat: 25.5941, lng: 85.1376 },
  Ludhiana: { lat: 30.901, lng: 75.8573 },
  Coimbatore: { lat: 11.0168, lng: 76.9558 },
  Vadodara: { lat: 22.3072, lng: 73.1812 },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  Guwahati: { lat: 26.1445, lng: 91.7362 },
  Chandigarh: { lat: 30.7333, lng: 76.7794 },
  Kochi: { lat: 9.9312, lng: 76.2673 },
  Ghaziabad: { lat: 28.6692, lng: 77.4538 },
  Gurugram: { lat: 28.4595, lng: 77.0266 },
  Noida: { lat: 28.5355, lng: 77.391 },
};

export const CITY_NAMES = Object.keys(CITY_COORDS).sort();

export type CityName = keyof typeof CITY_COORDS;

/**
 * Great-circle distance between two Indian cities in kilometres,
 * using the standard Haversine formula. Returns null if either city
 * isn't in the known dataset.
 */
export function haversineDistanceKm(fromCity: string, toCity: string): number | null {
  const from = CITY_COORDS[fromCity];
  const to = CITY_COORDS[toCity];
  if (!from || !to) return null;

  const R = 6371; // Earth radius in km
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}
