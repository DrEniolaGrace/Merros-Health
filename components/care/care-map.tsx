"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  key: string;
  lat: number;
  lng: number;
  label: string;
  count: number;
}

/**
 * Map of clinics (Leaflet with OpenStreetMap tiles, SPEC 4.10). Coordinates are synthetic.
 * Markers are drawn as glowing circles in the brand colours; no image assets are needed.
 */
export function CareMap({ points, selected, onSelect, label }: { points: MapPoint[]; selected: string | null; onSelect: (key: string) => void; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef<{ map: import("leaflet").Map; layer: import("leaflet").LayerGroup; L: typeof import("leaflet") } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((mod) => {
      const L = mod.default ?? mod;
      if (cancelled || !host.current || state.current) return;
      const map = L.map(host.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true }).setView([24.2, 54.4], 8);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 16, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
      state.current = { map, layer: L.layerGroup().addTo(map), L };
      draw();
    });
    return () => {
      cancelled = true;
      state.current?.map.remove();
      state.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const s = state.current;
    if (!s) return;
    s.layer.clearLayers();
    const css = getComputedStyle(document.documentElement);
    const rose = css.getPropertyValue("--burgundy-glow").trim() || "#c2415f";
    const gold = css.getPropertyValue("--pearl-gold").trim() || "#e2c98f";
    for (const p of points) {
      const active = p.key === selected;
      s.L.circleMarker([p.lat, p.lng], { radius: active ? 13 : 9, color: active ? gold : rose, weight: 2, fillColor: active ? gold : rose, fillOpacity: 0.55 })
        .bindTooltip(`${p.label} (${p.count})`, { direction: "top" })
        .on("click", () => onSelectRef.current(p.key))
        .addTo(s.layer);
    }
    if (points.length) s.map.fitBounds(s.L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])).pad(0.25), { maxZoom: 12 });
  }

  useEffect(draw);

  return <div ref={host} role="application" aria-label={label} className="care-map h-80 w-full overflow-hidden rounded-card border border-glass-border" />;
}
