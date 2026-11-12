import { describe, expect, it } from "vitest";
import { distanceKm, filterProviders, type Filters, type Provider } from "@/lib/care/directory";
import { CITIES, CLINICIANS, CLINICS, SERVICES } from "@/content/directory";

const providers: Provider[] = CLINICIANS.map((c) => {
  const clinic = CLINICS.find((x) => x.key === c.clinic)!;
  return { id: c.key, service: c.service, languages: c.languages, gender: c.gender, video: c.video, inPerson: c.inPerson, nextSlotDays: c.nextSlotDays, city: clinic.city, lat: clinic.lat, lng: clinic.lng };
});
const base: Filters = { service: null, language: null, gender: null, videoOnly: false, from: CITIES.abu_dhabi, maxKm: null, sort: "distance" };

describe("distance", () => {
  it("is zero for the same point and symmetric", () => {
    expect(distanceKm(CITIES.abu_dhabi, CITIES.abu_dhabi)).toBe(0);
    expect(distanceKm(CITIES.abu_dhabi, CITIES.al_ain)).toBeCloseTo(distanceKm(CITIES.al_ain, CITIES.abu_dhabi), 9);
  });
  it("Abu Dhabi to Al Ain is roughly 140 km in a straight line", () => {
    const d = distanceKm(CITIES.abu_dhabi, CITIES.al_ain);
    expect(d).toBeGreaterThan(125);
    expect(d).toBeLessThan(155);
  });
});

describe("filters", () => {
  it("no filters returns everyone, nearest first", () => {
    const r = filterProviders(providers, base);
    expect(r).toHaveLength(providers.length);
    expect(r[0].city).toBe("abu_dhabi");
    for (let i = 1; i < r.length; i++) expect(r[i].km).toBeGreaterThanOrEqual(r[i - 1].km);
  });
  it("filters by service, language and clinician gender together", () => {
    const r = filterProviders(providers, { ...base, service: "genetic_counselling", language: "ar", gender: "female" });
    expect(r.map((p) => p.id)).toEqual(["layla"]);
  });
  it("video only excludes in person only clinicians", () => {
    expect(filterProviders(providers, { ...base, videoOnly: true }).every((p) => p.video)).toBe(true);
  });
  it("maximum distance keeps nearby clinics, and video appointments ignore distance", () => {
    const near = filterProviders(providers, { ...base, maxKm: 30 });
    expect(near.length).toBeGreaterThan(0);
    expect(near.every((p) => p.km <= 30)).toBe(true);
    const video = filterProviders(providers, { ...base, maxKm: 30, videoOnly: true });
    expect(video.some((p) => p.km > 30)).toBe(true);
  });
  it("sorts by soonest slot when asked", () => {
    const r = filterProviders(providers, { ...base, sort: "soonest" });
    for (let i = 1; i < r.length; i++) expect(r[i].nextSlotDays).toBeGreaterThanOrEqual(r[i - 1].nextSlotDays);
  });
  it("distance is measured from the chosen place", () => {
    expect(filterProviders(providers, { ...base, from: CITIES.al_ain })[0].city).toBe("al_ain");
  });
});

describe("synthetic directory", () => {
  it("covers every service and all three regions, and every record is marked fictional", () => {
    for (const s of SERVICES) expect(CLINICIANS.some((c) => c.service === s), s).toBe(true);
    expect(new Set(CLINICS.map((c) => c.city))).toEqual(new Set(["abu_dhabi", "al_ain", "al_dhafra"]));
    for (const c of CLINICS) expect(c.name.en).toContain("fictional");
    for (const c of CLINICIANS) expect(c.credentials.en).toContain("fictional");
    expect(CLINICIANS.filter((c) => c.isLayla)).toHaveLength(1);
  });
});
