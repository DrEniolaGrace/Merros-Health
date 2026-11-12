/** Find Care filtering and distance (SPEC 4.10). Pure and unit tested. */

export interface Provider {
  id: string;
  service: string;
  languages: string[];
  gender: string;
  video: boolean;
  inPerson: boolean;
  nextSlotDays: number;
  city: string;
  lat: number;
  lng: number;
}

export interface Filters {
  service: string | null;
  language: string | null;
  gender: string | null;
  videoOnly: boolean;
  /** Reference point for distance, and the optional maximum distance from it in km. */
  from: { lat: number; lng: number };
  maxKm: number | null;
  sort: "distance" | "soonest";
}

/** Great circle distance in kilometres (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function filterProviders<T extends Provider>(providers: T[], f: Filters): (T & { km: number })[] {
  return providers
    .map((p) => ({ ...p, km: distanceKm(f.from, p) }))
    .filter(
      (p) =>
        (!f.service || p.service === f.service) &&
        (!f.language || p.languages.includes(f.language)) &&
        (!f.gender || p.gender === f.gender) &&
        (!f.videoOnly || p.video) &&
        // A video appointment is not limited by distance.
        (f.maxKm === null || p.km <= f.maxKm || (f.videoOnly && p.video)),
    )
    .sort((a, b) => (f.sort === "soonest" ? a.nextSlotDays - b.nextSlotDays || a.km - b.km : a.km - b.km || a.nextSlotDays - b.nextSlotDays));
}
