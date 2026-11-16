import { getTranslations } from "next-intl/server";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { OPTIONAL_STEPS, PATHWAY_STEPS, currentStep, furthestStep } from "@/lib/pathway/steps";
import { cn } from "@/lib/cn";

/** Care Pathway Tracker (SPEC 4.9): timestamped journey, current step highlighted. */
export async function PathwayTimeline({ events, locale, compact = false }: { events: { step: string; at: string }[]; locale: string; compact?: boolean }) {
  const t = await getTranslations("pathway");
  const done = new Map(events.map((e) => [e.step, e.at]));
  const furthest = furthestStep([...done.keys()]);
  const here = currentStep([...done.keys()]);
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(new Date(iso));
  const steps = compact ? PATHWAY_STEPS.slice(0, 4) : PATHWAY_STEPS;

  return (
    <ol className="relative flex flex-col">
      {steps.map((s, i) => {
        const at = done.get(s);
        const current = !at && i === here;
        // An optional step that was passed without being needed.
        const skipped = !at && i < furthest && OPTIONAL_STEPS.includes(s);
        return (
          <li key={s} className="relative flex gap-4 pb-8 last:pb-0">
            {i < steps.length - 1 && (
              <span aria-hidden className={cn("absolute start-4 top-8 h-full w-px -translate-x-1/2 rtl:translate-x-1/2", at ? "bg-[linear-gradient(var(--burgundy-glow),var(--rose-light))]" : "bg-glass-border")} />
            )}
            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                at && "border-transparent bg-burgundy text-on-burgundy shadow-[0_0_18px_-6px_var(--burgundy-glow)]",
                current && "border-gold bg-[color-mix(in_oklab,var(--pearl-gold)_16%,transparent)] shadow-[0_0_24px_-6px_var(--pearl-gold)]",
                !at && !current && "border-glass-border bg-glass",
              )}
            >
              {at ? <Check size={14} weight="bold" /> : <span className="text-xs text-muted tabular">{i + 1}</span>}
            </span>
            <div className="flex min-w-0 flex-col pt-1">
              <span className={cn("text-base", at || current ? "text-ink" : "text-muted")}>{t(s)}</span>
              <span className={cn("text-sm", current ? "text-gold-ink" : "text-muted")}>
                {at ? t("done", { date: fmt(at) }) : current ? t("current") : skipped ? t("notNeeded") : OPTIONAL_STEPS.includes(s) ? t("ifNeeded") : t("upcoming")}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
