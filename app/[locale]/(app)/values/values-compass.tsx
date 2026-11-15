"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Switch } from "@/components/ui/controls";
import { SectionTitle } from "@/components/ui/page";
import { cn } from "@/lib/cn";
import { saveValues } from "@/lib/actions/wellbeing";
import { relateOptions, sureScore, type Ratings, type SureAnswers } from "@/lib/values/compass";
import { VALUE_KEYS, type OptionId, type ValueKey } from "@/content/values";

export interface ValuesLabels {
  rateTitle: string;
  rateBody: string;
  values: Record<ValueKey, { title: string; body: string }>;
  importance: string[];
  relateTitle: string;
  relateBody: string;
  relateEmpty: string;
  options: Record<OptionId, string>;
  fits: string;
  tension: string;
  depends: string;
  noneImportant: string;
  sureTitle: string;
  sureBody: string;
  sureItems: { key: keyof SureAnswers; text: string }[];
  yes: string;
  no: string;
  shareLabel: string;
  shareDesc: string;
  save: string;
  saved: string;
  sureAll: string;
  sureSome: string;
  talk: string;
  incomplete: string;
}

type Partial7 = Partial<Record<ValueKey, number>>;
type PartialSure = Partial<Record<keyof SureAnswers, boolean>>;

/** Rate what matters, see how each option relates to it (never ranked), then the SURE screen. */
export function ValuesCompass({ labels: L, order, initial }: { labels: ValuesLabels; order: OptionId[]; initial: { ratings: Ratings; sure: SureAnswers; share: boolean } | null }) {
  const [ratings, setRatings] = useState<Partial7>(initial?.ratings ?? {});
  const [sure, setSure] = useState<PartialSure>(initial?.sure ?? {});
  const [share, setShare] = useState(initial?.share ?? false);
  const [saved, setSaved] = useState<number | null>(null);
  const [pending, start] = useTransition();

  const rated = VALUE_KEYS.every((k) => ratings[k] !== undefined);
  const answered = L.sureItems.every((i) => sure[i.key] !== undefined);
  const fit = useMemo(() => (rated ? relateOptions(ratings as Ratings, order) : null), [rated, ratings, order]);
  const anyImportant = fit ? fit.some((f) => f.fits.length + f.tension.length + f.depends.length > 0) : false;
  const names = (keys: ValueKey[]) => keys.map((k) => L.values[k].title).join(" · ");
  const dirty = () => setSaved(null);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <SectionTitle>{L.rateTitle}</SectionTitle>
          <p className="mt-1 text-sm text-muted">{L.rateBody}</p>
        </div>
        <ul className="flex flex-col gap-3">
          {VALUE_KEYS.map((k) => (
            <li key={k}>
              <GlassCard className="flex flex-col gap-3 py-5">
                <fieldset className="flex flex-col gap-3" data-value={k}>
                  <legend className="float-start mb-3 w-full">
                    <span className="block text-base font-medium text-ink">{L.values[k].title}</span>
                    <span className="block text-sm text-muted">{L.values[k].body}</span>
                  </legend>
                  <div className="grid grid-cols-5 gap-1.5">
                    {L.importance.map((label, n) => (
                      <label key={n} className={cn("flex min-h-12 cursor-pointer items-center justify-center rounded-control border px-1 py-2 text-center text-xs transition-[background,border-color,color] duration-500 has-[:focus-visible]:shadow-[var(--focus-ring)]", ratings[k] === n ? "border-transparent bg-burgundy text-on-burgundy" : "border-glass-border text-muted hover:bg-glass hover:text-ink")}>
                        <input type="radio" name={`value-${k}`} value={n} checked={ratings[k] === n} onChange={() => { setRatings((r) => ({ ...r, [k]: n })); dirty(); }} className="sr-only" />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </GlassCard>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4" data-relate>
        <div>
          <SectionTitle>{L.relateTitle}</SectionTitle>
          <p className="measure mt-1 text-sm text-muted">{L.relateBody}</p>
        </div>
        {!fit ? (
          <GlassCard><p className="text-sm text-muted">{L.relateEmpty}</p></GlassCard>
        ) : !anyImportant ? (
          <GlassCard><p className="text-sm text-muted">{L.noneImportant}</p></GlassCard>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {fit.map((f) => (
              <li key={f.optionId}>
                <GlassCard className="flex h-full flex-col gap-3" data-option-fit={f.optionId}>
                  <h3 className="text-base font-medium text-ink">{L.options[f.optionId]}</h3>
                  <dl className="flex flex-col gap-2 text-sm">
                    {(
                      [
                        [L.fits, f.fits, "text-cyan-ink"],
                        [L.tension, f.tension, "text-gold-ink"],
                        [L.depends, f.depends, "text-muted"],
                      ] as const
                    )
                      .filter(([, keys]) => keys.length > 0)
                      .map(([label, keys, tone]) => (
                        <div key={label}>
                          <dt className={cn("text-xs", tone)}>{label}</dt>
                          <dd className="text-ink">{names(keys)}</dd>
                        </div>
                      ))}
                  </dl>
                </GlassCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <SectionTitle>{L.sureTitle}</SectionTitle>
          <p className="mt-1 text-sm text-muted">{L.sureBody}</p>
        </div>
        <GlassCard className="flex flex-col divide-y divide-glass-border py-2">
          {L.sureItems.map((i) => (
            <fieldset key={i.key} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" data-sure={i.key}>
              <legend className="float-start text-base text-ink sm:max-w-[70%]">{i.text}</legend>
              <div className="flex shrink-0 gap-2">
                {([true, false] as const).map((v) => (
                  <label key={String(v)} className={cn("flex h-12 min-w-20 cursor-pointer items-center justify-center rounded-control border px-4 text-sm transition-[background,border-color,color] duration-500 has-[:focus-visible]:shadow-[var(--focus-ring)]", sure[i.key] === v ? "border-transparent bg-burgundy text-on-burgundy" : "border-glass-border text-muted hover:bg-glass hover:text-ink")}>
                    <input type="radio" name={`sure-${i.key}`} checked={sure[i.key] === v} onChange={() => { setSure((s) => ({ ...s, [i.key]: v })); dirty(); }} className="sr-only" />
                    {v ? L.yes : L.no}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </GlassCard>
      </section>

      <GlassCard tone="gold" className="flex flex-col gap-5">
        <Switch checked={share} onChange={(v) => { setShare(v); dirty(); }} label={L.shareLabel} description={L.shareDesc} tone="gold" />
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="self-start"
            disabled={!rated || !answered || saved !== null}
            pending={pending}
            onClick={() => start(async () => { const r = await saveValues({ ratings: ratings as Ratings, sure: sure as SureAnswers, share }); setSaved(r.sure); })}
          >
            {L.save}
          </Button>
          {(!rated || !answered) && <p className="text-sm text-muted">{L.incomplete}</p>}
        </div>
        {saved !== null && (
          <div role="status" data-values-saved={saved} className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm text-cyan-ink"><CheckCircle size={18} />{L.saved}</p>
            <p className="measure text-ink">{saved === sureScore({ sure: true, understand: true, riskBenefit: true, encouragement: true }) ? L.sureAll : L.sureSome}</p>
            <LinkButton href="/support" variant="secondary" className="self-start">{L.talk}</LinkButton>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
