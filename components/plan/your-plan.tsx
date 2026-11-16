import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { GlassCard } from "@/components/ui/glass-card";
import { LinkButton } from "@/components/ui/link-button";

export type PlanContext = "carrier" | "uncertain" | "shared" | "beyond";
export type PlanNext = "teachback" | "family" | "wellbeing";

export interface PlanLabels {
  eyebrow: string;
  title: string;
  intro: string;
  counsellingTitle: string;
  counsellingBody: string;
  counsellingCta: string;
  optionsTitle: string;
  optionsBody: string;
  optionsCta: string;
  valuesCta: string;
  nextTitle: string;
  nextBody: string;
  nextCta: string;
  note: string;
}

const BTN = "h-auto min-h-12 max-w-full whitespace-normal py-2 text-center";

const NEXT_HREF: Record<PlanNext, string> = { teachback: "/teach-back", family: "/family", wellbeing: "/wellbeing" };

/**
 * "Your plan": the closing section of every result that carries a risk. Always the same three
 * parts, in the same order: counselling, options, one next step. It lists what is available and
 * never says which option to choose. Works in server and client components.
 */
export function YourPlan({ labels: L, next, counsellingSlot, context }: { labels: PlanLabels; next: PlanNext; context: PlanContext; counsellingSlot?: React.ReactNode }) {
  const steps = [
    { n: 1, title: L.counsellingTitle, body: L.counsellingBody, action: counsellingSlot ?? <LinkButton href="/support" variant="gold" className={BTN}>{L.counsellingCta}</LinkButton> },
    {
      n: 2,
      title: L.optionsTitle,
      body: L.optionsBody,
      action: (
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/options" variant="secondary" className={BTN}>{L.optionsCta}</LinkButton>
          <LinkButton href="/values" variant="ghost" className={BTN}>{L.valuesCta}</LinkButton>
        </div>
      ),
    },
    { n: 3, title: L.nextTitle, body: L.nextBody, action: <LinkButton href={NEXT_HREF[next]} variant="secondary" iconEnd={<ArrowRight size={18} />} className={BTN}>{L.nextCta}</LinkButton> },
  ];
  return (
    <section aria-labelledby="your-plan-title" data-your-plan={context} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-gold-ink">{L.eyebrow}</p>
        <h2 id="your-plan-title" className="text-gradient text-2xl font-semibold">{L.title}</h2>
        <p className="measure text-muted">{L.intro}</p>
      </div>
      <ol className="grid gap-4 lg:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n}>
            <GlassCard className="flex h-full flex-col gap-4" data-plan-step={s.n}>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-burgundy text-sm text-on-burgundy tabular">{s.n}</span>
                <h3 className="text-lg font-medium text-ink">{s.title}</h3>
              </div>
              <p className="flex-1 text-sm text-muted">{s.body}</p>
              {s.action}
            </GlassCard>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">{L.note}</p>
    </section>
  );
}
