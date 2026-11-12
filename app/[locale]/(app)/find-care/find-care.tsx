"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { Buildings, CalendarBlank, MapPin, Stethoscope, VideoCamera } from "@phosphor-icons/react";
import { filterProviders, type Provider } from "@/lib/care/directory";
import { linkFamilyDoctor, unlinkFamilyDoctor } from "@/lib/actions/care";
import { GlassCard } from "@/components/ui/glass-card";
import { Monogram } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Pill } from "@/components/ui/pill";
import { Select } from "@/components/ui/select";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/controls";
import { EmptyState, Skeleton } from "@/components/ui/states";
import type { MapPoint } from "@/components/care/care-map";

const CareMap = dynamic(() => import("@/components/care/care-map").then((m) => m.CareMap), { ssr: false, loading: () => <Skeleton className="h-80 w-full rounded-card" /> });

export interface CareProvider extends Provider {
  name: string;
  credentials: string;
  clinicKey: string;
  clinicName: string;
  cityName: string;
  insurance: string[];
  experienceYears: number;
}

export interface FindCareLabels {
  service: string;
  language: string;
  gender: string;
  near: string;
  distance: string;
  sort: string;
  any: string;
  anyDistance: string;
  videoOnly: string;
  services: Record<string, string>;
  languages: Record<string, string>;
  genders: Record<string, string>;
  cities: Record<string, string>;
  sortDistance: string;
  sortSoonest: string;
  km: string; // "{n} km"
  within: string; // "Within {n} km"
  results: string; // "{n} providers"
  years: string; // "{n} years"
  nextSlot: string; // "{n}"
  today: string;
  video: string;
  inPerson: string;
  insurance: string;
  book: string;
  setDoctor: string;
  myDoctor: string;
  removeDoctor: string;
  doctorSheetTitle: string;
  doctorSheetBody: string;
  doctorShare: string;
  doctorShareDesc: string;
  doctorConfirm: string;
  mapLabel: string;
  emptyTitle: string;
  emptyBody: string;
  clear: string;
  close: string;
  synthetic: string;
}

export function FindCare({ providers, familyDoctorId, cities, labels: L }: { providers: CareProvider[]; familyDoctorId: string | null; cities: Record<string, { lat: number; lng: number }>; labels: FindCareLabels }) {
  const [service, setService] = useState("");
  const [language, setLanguage] = useState("");
  const [gender, setGender] = useState("");
  const [near, setNear] = useState("abu_dhabi");
  const [maxKm, setMaxKm] = useState("");
  const [sort, setSort] = useState<"distance" | "soonest">("distance");
  const [videoOnly, setVideoOnly] = useState(false);
  const [clinic, setClinic] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<CareProvider | null>(null);
  const [share, setShare] = useState(false);
  const [pending, start] = useTransition();

  const list = useMemo(
    () => filterProviders(providers, { service: service || null, language: language || null, gender: gender || null, videoOnly, from: cities[near], maxKm: maxKm ? Number(maxKm) : null, sort }),
    [providers, service, language, gender, videoOnly, near, maxKm, sort, cities],
  );
  const shown = clinic ? list.filter((p) => p.clinicKey === clinic) : list;
  const points: MapPoint[] = useMemo(() => {
    const m = new Map<string, MapPoint>();
    for (const p of list) m.set(p.clinicKey, { key: p.clinicKey, lat: p.lat, lng: p.lng, label: p.clinicName, count: (m.get(p.clinicKey)?.count ?? 0) + 1 });
    return [...m.values()];
  }, [list]);
  const opt = (rec: Record<string, string>) => [{ value: "", label: L.any }, ...Object.entries(rec).map(([value, label]) => ({ value, label }))];
  const reset = () => {
    setService(""); setLanguage(""); setGender(""); setMaxKm(""); setVideoOnly(false); setClinic(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <GlassCard className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select label={L.service} value={service} onChange={(v) => { setService(v); setClinic(null); }} options={opt(L.services)} />
          <Select label={L.language} value={language} onChange={setLanguage} options={opt(L.languages)} />
          <Select label={L.gender} value={gender} onChange={setGender} options={opt(L.genders)} />
          <Select label={L.near} value={near} onChange={setNear} options={Object.entries(L.cities).map(([value, label]) => ({ value, label }))} />
          <Select label={L.distance} value={maxKm} onChange={setMaxKm} options={[{ value: "", label: L.anyDistance }, ...["25", "50", "150"].map((n) => ({ value: n, label: L.within.replace("{n}", n) }))]} />
          <Select label={L.sort} value={sort} onChange={setSort} options={[{ value: "distance", label: L.sortDistance }, { value: "soonest", label: L.sortSoonest }]} />
        </div>
        <Switch checked={videoOnly} onChange={setVideoOnly} label={L.videoOnly} />
      </GlassCard>

      <CareMap points={points} selected={clinic} onSelect={(k) => setClinic((c) => (c === k ? null : k))} label={L.mapLabel} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted tabular" role="status" data-result-count={shown.length}>{L.results.replace("{n}", String(shown.length))}</p>
        <p className="text-xs text-gold-ink">{L.synthetic}</p>
      </div>

      {shown.length === 0 ? (
        <GlassCard>
          <EmptyState title={L.emptyTitle} body={L.emptyBody} action={<Button variant="secondary" onClick={reset}>{L.clear}</Button>} />
        </GlassCard>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {shown.map((p) => {
            const mine = p.id === familyDoctorId;
            return (
              <li key={p.id}>
                <GlassCard tone={mine ? "gold" : "default"} className="flex h-full flex-col gap-4" data-provider={p.service}>
                  <div className="flex items-start gap-3">
                    <Monogram name={p.name} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-medium text-ink">{p.name}</p>
                      <p className="text-sm text-muted">{p.credentials}</p>
                    </div>
                    {mine && <Pill tone="gold">{L.myDoctor}</Pill>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone="cyan"><Stethoscope size={12} />{L.services[p.service]}</Pill>
                    {p.languages.map((l) => <Pill key={l}>{L.languages[l] ?? l}</Pill>)}
                    <Pill>{L.genders[p.gender]}</Pill>
                    <Pill>{L.years.replace("{n}", String(p.experienceYears))}</Pill>
                  </div>
                  <dl className="grid gap-2 text-sm text-muted">
                    <div className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /><dd>{p.clinicName} · {p.cityName} · <span className="tabular text-ink" dir="ltr">{L.km.replace("{n}", p.km < 10 ? p.km.toFixed(1) : String(Math.round(p.km)))}</span></dd></div>
                    <div className="flex items-center gap-2"><CalendarBlank size={16} className="shrink-0" /><dd>{p.nextSlotDays <= 0 ? L.today : L.nextSlot.replace("{n}", String(p.nextSlotDays))}</dd></div>
                    <div className="flex flex-wrap items-center gap-3">
                      {p.inPerson && <span className="inline-flex items-center gap-1"><Buildings size={16} />{L.inPerson}</span>}
                      {p.video && <span className="inline-flex items-center gap-1"><VideoCamera size={16} />{L.video}</span>}
                    </div>
                    <div><dt className="sr-only">{L.insurance}</dt><dd>{L.insurance}: {p.insurance.join(", ")}</dd></div>
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <LinkButton href={`/support?clinician=${p.id}`}>{L.book}</LinkButton>
                    {p.service === "family_medicine" &&
                      (mine ? (
                        <Button variant="ghost" pending={pending} onClick={() => start(async () => { await unlinkFamilyDoctor(); window.location.reload(); })}>{L.removeDoctor}</Button>
                      ) : (
                        <Button variant="secondary" onClick={() => { setShare(false); setDoctor(p); }}>{L.setDoctor}</Button>
                      ))}
                  </div>
                </GlassCard>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet open={!!doctor} onClose={() => setDoctor(null)} title={L.doctorSheetTitle} closeLabel={L.close}>
        {doctor && (
          <div className="flex flex-col gap-6">
            <p className="text-sm text-muted">{L.doctorSheetBody.replace("{name}", doctor.name)}</p>
            <Switch checked={share} onChange={setShare} label={L.doctorShare} description={L.doctorShareDesc} tone="gold" />
            <Button
              block
              pending={pending}
              onClick={() =>
                start(async () => {
                  await linkFamilyDoctor(doctor.id, share);
                  setDoctor(null);
                  window.location.reload();
                })
              }
            >
              {L.doctorConfirm}
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
