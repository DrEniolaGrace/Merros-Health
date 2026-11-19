"use client";

import { useTransition } from "react";
import { ArrowsLeftRight, SealCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { releaseBeyondPanel, setBeyondConsent } from "@/lib/actions/beyond";
import { tourGo } from "@/lib/actions/auth";
import { PresenterControl } from "@/components/tour/presenter";
import { AUTOSOME_MB, type Segment } from "@/lib/beyond/engine";

/** Twenty two autosomes as bars, with the stretches the partners share shown in gold. */
export function ChromosomeMap({ segments, label }: { segments: Segment[]; label: string }) {
  const max = Math.max(...Object.values(AUTOSOME_MB));
  const W = 640;
  const ROW = 13;
  const chrs = Object.keys(AUTOSOME_MB).map(Number);
  const x = (mb: number) => 28 + (mb / max) * (W - 36);
  return (
    <svg viewBox={`0 0 ${W} ${chrs.length * ROW + 6}`} role="img" aria-label={label} className="h-auto w-full" style={{ direction: "ltr" }}>
      {chrs.map((c, i) => {
        const y = 4 + i * ROW;
        return (
          <g key={c}>
            <text x={20} y={y + 7} textAnchor="end" fontSize="8" fill="var(--text-secondary)" style={{ fontVariantNumeric: "tabular-nums" }}>{c}</text>
            <rect x={x(0)} y={y} width={x(AUTOSOME_MB[c]) - x(0)} height={7} rx={3.5} fill="var(--glass-strong)" />
            {segments.filter((s) => s.chr === c).map((s) => (
              <rect key={`${s.chr}-${s.startMb}`} x={x(s.startMb)} y={y} width={Math.max(2, x(s.endMb) - x(s.startMb))} height={7} rx={2} fill="var(--pearl-gold)" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function BeyondConsentSwitch({ checked, label, description }: { checked: boolean; label: string; description: string }) {
  const [pending, start] = useTransition();
  return (
    <div data-beyond-consent aria-busy={pending}>
      <Switch
        checked={checked}
        tone="gold"
        label={label}
        description={description}
        onChange={(v) => start(async () => { await setBeyondConsent(v); window.location.reload(); })}
      />
    </div>
  );
}

/** Demo only: continue as the partner, so one reviewer can play both sides of the consent. */
export function DemoSwitchPartner({ persona, label }: { persona: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <PresenterControl>
      <Button variant="ghost" icon={<ArrowsLeftRight />} pending={pending} className="-ms-4 self-start" onClick={() => start(async () => { window.location.assign(await tourGo(persona, "/couple")); })}>
        {label}
      </Button>
    </PresenterControl>
  );
}

export function ReleaseBeyondButton({ analysisId, label }: { analysisId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="gold" icon={<SealCheck />} pending={pending} className="self-start" onClick={() => start(async () => { await releaseBeyondPanel(analysisId); window.location.reload(); })}>
      {label}
    </Button>
  );
}
