"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Heart, Phone } from "@phosphor-icons/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { recordDistress, requestCallback } from "@/lib/actions/wellbeing";
import type { CallbackKind, DistressBand } from "@/lib/wellbeing/distress";

export interface DistressLabels {
  question: string;
  hint: string;
  low: string;
  high: string;
  valueText: string; // "{n} out of 10"
  save: string;
  again: string;
  callbackTitle: string;
  callbackBody: string;
  counsellor: string;
  psychologist: string;
  callbackDone: Record<CallbackKind, string>;
  crisisTitle: string;
  crisis: string[];
  crisisNote: string;
  book: string;
  support: Record<DistressBand, { title: string; body: string; tips: string[] }>;
}

/** Single item Distress Thermometer (0 to 10), then calm support matched to the answer. */
export function DistressCheck({ labels: L, initial }: { labels: DistressLabels; initial: { score: number; band: DistressBand; callback: CallbackKind | null } | null }) {
  const [score, setScore] = useState<number | null>(initial?.score ?? null);
  const [result, setResult] = useState<{ band: DistressBand; callbackOffered: boolean } | null>(initial ? { band: initial.band, callbackOffered: initial.band !== "low" } : null);
  const [callback, setCallback] = useState<CallbackKind | null>(initial?.callback ?? null);
  const [pending, start] = useTransition();
  const support = result ? L.support[result.band] : null;

  return (
    <div className="flex flex-col gap-6">
      <GlassCard hero className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 id="distress-q" className="text-xl font-medium text-ink">{L.question}</h2>
          <p className="text-sm text-muted">{L.hint}</p>
        </div>
        <div className="flex flex-col gap-3">
          <p aria-hidden className="font-display text-5xl font-semibold text-ink tabular" dir="ltr">{score ?? "–"}</p>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={score ?? 0}
            aria-labelledby="distress-q"
            aria-valuetext={score === null ? undefined : L.valueText.replace("{n}", String(score))}
            onChange={(e) => {
              setScore(Number(e.target.value));
              setResult(null);
            }}
            onPointerDown={() => score === null && setScore(0)}
            onKeyDown={() => score === null && setScore(0)}
            className="h-12 w-full cursor-pointer accent-[var(--rose-light)]"
            dir="ltr"
          />
          <div className="flex justify-between text-xs text-muted" dir="ltr">
            <span>0 · {L.low}</span>
            <span>{L.high} · 10</span>
          </div>
        </div>
        <Button
          size="lg"
          className="self-start"
          disabled={score === null || !!result}
          pending={pending}
          onClick={() =>
            score !== null &&
            start(async () => {
              setCallback(null);
              setResult(await recordDistress(score));
            })
          }
        >
          {L.save}
        </Button>
      </GlassCard>

      {result && support && (
        <div className="flex flex-col gap-4" data-distress-band={result.band} role="status">
          <GlassCard tone={result.band === "high" ? "gold" : "default"} className="flex flex-col gap-4">
            <h2 className="flex items-center gap-2 text-xl font-medium text-ink"><Heart size={22} className="shrink-0 text-rose-ink" />{support.title}</h2>
            <p className="measure text-ink">{support.body}</p>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              {support.tips.map((t) => <li key={t} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />{t}</li>)}
            </ul>
          </GlassCard>

          {result.callbackOffered && (
            <GlassCard className="flex flex-col gap-4" data-callback>
              <div>
                <h2 className="text-lg font-medium text-ink">{L.callbackTitle}</h2>
                <p className="mt-1 text-sm text-muted">{L.callbackBody}</p>
              </div>
              {callback ? (
                <p role="status" data-callback-done className="flex items-center gap-2 text-sm text-cyan-ink"><CheckCircle size={18} />{L.callbackDone[callback]}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(["counsellor", "psychologist"] as const).map((k) => (
                    <Button key={k} variant={k === "counsellor" ? "gold" : "secondary"} icon={<Phone />} pending={pending} onClick={() => start(async () => { if ((await requestCallback(k)).ok) setCallback(k); })}>
                      {L[k]}
                    </Button>
                  ))}
                </div>
              )}
            </GlassCard>
          )}

          {result.band === "high" && (
            <GlassCard className="flex flex-col gap-3" data-crisis>
              <h2 className="text-lg font-medium text-ink">{L.crisisTitle}</h2>
              <ul className="flex flex-col gap-1 text-sm text-ink">{L.crisis.map((c) => <li key={c}>{c}</li>)}</ul>
              <p className="text-xs text-gold-ink">{L.crisisNote}</p>
            </GlassCard>
          )}

          <div className="flex flex-wrap gap-2">
            <LinkButton href="/support" variant="secondary">{L.book}</LinkButton>
            <Button variant="ghost" onClick={() => { setResult(null); setScore(null); }}>{L.again}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
