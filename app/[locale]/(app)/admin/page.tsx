import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionTitle } from "@/components/ui/page";
import { PageHero } from "@/components/ui/page-hero";
import { LiveBadge, StatRow } from "@/components/ui/accents";
import { Disclosure } from "@/components/ui/disclosure";
import { BarList, BeforeAfter, RateRow, RegionMap, fmt, pct } from "@/components/signals/charts";
import { ForecastChart } from "@/components/signals/forecast-chart";
import { PublishButton } from "@/components/signals/publish-button";
import { reliableRate, SUPPRESSION_THRESHOLD } from "@/lib/signals/dp";
import { FUNNEL_STEPS, REGIONS, WAIT_BUCKETS } from "@/lib/signals/events";
import { forecast } from "@/lib/signals/forecast";
import { medianBucket, regionShares, SIGNALS, type SignalKey } from "@/lib/signals/release";
import { budgetStatus, latestRelease } from "@/lib/signals/store";
import { IntegrityCheck } from "../privacy/privacy-controls";
import { SimulateUpdate } from "../counsellor/counsellor-actions";

/** Planning assumption for the staffing hint. Shown on screen; not a clinical standard. */
const SESSIONS_PER_COUNSELLOR = 15;

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(["admin"]);
  const t = await getTranslations("admin");
  const s = await getTranslations("signals");
  const tp = await getTranslations("page");
  const tpr = await getTranslations("privacy");
  const tc = await getTranslations("counsellor");
  const now = new Date();
  const [release, budget, events] = await Promise.all([latestRelease(), budgetStatus(now), prisma.reclassificationEvent.findMany({ orderBy: { createdAt: "desc" } })]);
  const cls = (c: string) => tc(`class.${c}` as "class.vus");
  const hidden = s("hidden");
  const date = (d: Date | string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai", numberingSystem: "latn" }).format(new Date(d));
  const releaseCost = Object.values(SIGNALS).reduce((a, b) => a + b.epsilon, 0);
  const d = release?.data;
  const noise = (k: SignalKey) => (d ? s("noiseNote", { n: Math.round(d.noiseSd[k]) }) : "");

  const fc = d ? forecast(d.weekly) : null;
  const shares = d ? regionShares(d.funnel) : null;
  const avgPerWeek = fc ? fc.mean.reduce((a, b) => a + b, 0) / fc.mean.length : null;

  return (
    <div className="flex flex-col gap-10">
      <PageHero
        eyebrow={tp("eyebrowProgramme")}
        title={t("title")}
        accent={s("accent")}
        body={t("body")}
        badges={
          <>
            <LiveBadge tone="cyan">{s("badgeDp")} · ε {release ? release.epsilon.toFixed(1) : releaseCost.toFixed(1)}</LiveBadge>
            <LiveBadge tone="gold">{s("badgeSmall")}</LiveBadge>
            <LiveBadge tone="rose">{s("badgeSynthetic")}</LiveBadge>
          </>
        }
      >
        {release && <p className="text-sm text-muted">{s("releaseOf", { date: date(release.createdAt) })} · {s("period", { date: date(new Date(new Date(d!.weeks[d!.weeks.length - 1]).getTime() + 6 * 86_400_000)) })}</p>}
      </PageHero>

      <GlassCard tone="gold"><p className="measure text-ink">{t("statement")}</p></GlassCard>

      {!d ? (
        <GlassCard><p className="text-sm text-muted">{s("noRelease")}</p></GlassCard>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-2" data-signal="map">
            <GlassCard className="flex flex-col gap-4 corner-dots">
              <div>
                <SectionTitle>{s("mapTitle")}</SectionTitle>
                <p className="mt-1 text-sm text-muted">{s("mapBody")}</p>
              </div>
              <RegionMap
                label={s("mapLabel")}
                hidden={hidden}
                regions={(["al_dhafra", "abu_dhabi", "al_ain"] as const).map((r) => ({ key: r, name: s(`regions.${r}`), value: d.funnel[r].result_received, caption: s("mapCaption") }))}
              />
              <p className="text-xs text-muted">{s("mapSchematic")} {noise("funnel")}</p>
            </GlassCard>

            <GlassCard className="flex flex-col gap-5" data-signal="budget">
              <div>
                <SectionTitle>{s("budgetTitle")}</SectionTitle>
                <p className="mt-1 text-sm text-muted">{s("budgetBody")}</p>
              </div>
              <div className="flex flex-col gap-2">
                <div role="meter" aria-label={s("budgetMeterLabel")} aria-valuemin={0} aria-valuemax={budget.budget} aria-valuenow={budget.spent} className="h-3 overflow-hidden rounded-full bg-glass-strong">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,color-mix(in_oklab,var(--pearl-gold)_60%,transparent),var(--pearl-gold))]" style={{ width: `${Math.min(100, (budget.spent / budget.budget) * 100)}%` }} />
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="text-ink tabular" data-budget-spent={budget.spent}>{s("budgetMeter", { spent: `ε ${budget.spent.toFixed(1)}`, budget: `ε ${budget.budget.toFixed(1)}`, period: budget.period })}</span>
                  <span className="text-muted tabular">{s("budgetRemaining", { n: budget.remaining.toFixed(1) })} · {s("budgetReleases", { n: budget.releases })}</span>
                </div>
              </div>
              <PublishButton label={s("publish", { n: releaseCost.toFixed(1) })} exhausted={s("exhausted")} disabled={budget.remaining + 1e-9 < releaseCost} />
              <ul className="flex flex-col gap-2 text-sm text-muted">
                {(["how1", "how2", "how3", "how4"] as const).map((k) => <li key={k} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{s(k)}</li>)}
              </ul>
            </GlassCard>
          </section>

          <section className="flex flex-col gap-4" data-signal="forecast">
            <GlassCard className="flex flex-col gap-5">
              <div>
                <SectionTitle>{s("forecastTitle")}</SectionTitle>
                <p className="measure mt-1 text-sm text-muted">{s("forecastBody")}</p>
              </div>
              {fc ? (
                <ForecastChart
                  weeks={d.weeks}
                  history={d.weekly}
                  mean={fc.mean}
                  low={fc.low}
                  high={fc.high}
                  locale={locale}
                  labels={{ aria: s("forecastAria"), history: s("forecastHistory"), forecast: s("forecastLine"), hidden, now: s("forecastNow"), sessions: s.raw("forecastSessions"), range: s.raw("forecastRange"), weekOf: s.raw("forecastWeekOf") }}
                />
              ) : (
                <p className="text-sm text-muted">{s("forecastNone")}</p>
              )}
              <ul className="grid gap-4 sm:grid-cols-3">
                {REGIONS.map((r) => {
                  const share = shares?.[r] ?? null;
                  const perWeek = share !== null && avgPerWeek !== null ? share * avgPerWeek : null;
                  return (
                    <li key={r} className="flex min-w-0 flex-col gap-1 border-s border-glass-border ps-4" data-region-forecast={r}>
                      <span className="text-sm text-muted">{s(`regions.${r}`)}</span>
                      {perWeek === null ? (
                        <span className="text-sm text-ink">{s("regionNoForecast")}</span>
                      ) : (
                        <>
                          <span className="font-display text-xl text-ink tabular">{s("regionCounsellors", { n: Math.max(1, Math.ceil(perWeek / SESSIONS_PER_COUNSELLOR)) })}</span>
                          <span className="text-xs text-muted tabular">{s("regionPerWeek", { n: Math.round(perWeek) })} · {s("regionShare", { pct: pct(share, hidden) })}</span>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-muted">{s("forecastMethod")} {s("capacityNote", { n: SESSIONS_PER_COUNSELLOR })} {noise("weekly")}</p>
            </GlassCard>
          </section>

          <section className="flex flex-col gap-4" data-signal="funnel">
            <div>
              <SectionTitle>{s("funnelTitle")}</SectionTitle>
              <p className="mt-1 text-sm text-muted">{s("funnelBody")} {noise("funnel")}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {REGIONS.map((r) => {
                const max = Math.max(...FUNNEL_STEPS.map((k) => d.funnel[r][k] ?? 0));
                const rate = reliableRate(d.funnel[r].counselling_booked, d.funnel[r].counselling_offered, d.noiseSd.funnel);
                return (
                  <GlassCard key={r} className="flex flex-col gap-4" data-funnel={r}>
                    <h3 className="text-lg font-medium text-ink">{s(`regions.${r}`)}</h3>
                    <BarList hidden={hidden} max={max} rows={FUNNEL_STEPS.map((k) => ({ label: s(`steps.${k}`), value: d.funnel[r][k] }))} />
                    <p className="text-xs text-muted tabular">{rate === null ? s("tooSmall") : s("ofOffered", { pct: pct(rate, hidden) })}</p>
                  </GlassCard>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-4" data-signal="wait">
            <div>
              <SectionTitle>{s("waitTitle")}</SectionTitle>
              <p className="mt-1 text-sm text-muted">{s("waitBody")} {noise("wait")}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {REGIONS.map((r) => {
                const m = medianBucket(d.wait[r]);
                return (
                  <GlassCard key={r} className="flex flex-col gap-4">
                    <h3 className="text-lg font-medium text-ink">{s(`regions.${r}`)}</h3>
                    <BarList hidden={hidden} max={Math.max(...d.wait[r].map((c) => c ?? 0))} rows={WAIT_BUCKETS.map((b, i) => ({ label: s(`buckets.${b.key}`), value: d.wait[r][i] }))} />
                    <p className="text-sm text-gold-ink">{m === null ? s("typicalUnknown") : s("typicalWait", { bucket: s(`buckets.${WAIT_BUCKETS[m].key}`) })}</p>
                  </GlassCard>
                );
              })}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <GlassCard className="flex flex-col gap-5" data-signal="comprehension">
              <div>
                <SectionTitle>{s("compTitle")}</SectionTitle>
                <p className="mt-1 text-sm text-muted">{s("compBody")}</p>
              </div>
              {(["ar", "en"] as const).map((lang) => (
                <div key={lang} className="flex flex-col gap-3">
                  <h3 className="text-xs uppercase tracking-[0.14em] text-gold-ink">{s(`languages.${lang}`)}</h3>
                  {d.comprehension.filter((c) => c.language === lang).map((c) => (
                    <RateRow key={c.level} label={s(`levels.${c.level}`)} rate={reliableRate(c.passedFirst, c.total, d.noiseSd.comprehension)} sub={c.total === null ? undefined : s("compOf", { n: fmt(c.total, hidden) })} hidden={s("tooSmall")} />
                  ))}
                </div>
              ))}
              <p className="text-xs text-muted">{noise("comprehension")}</p>
            </GlassCard>

            <GlassCard className="flex flex-col gap-6" data-signal="wellbeing">
              <div>
                <SectionTitle>{s("wellTitle")}</SectionTitle>
                <p className="mt-1 text-sm text-muted">{s("wellBody")} <span className="tabular">{d.wellbeing.n === null ? hidden : s("wellN", { n: fmt(d.wellbeing.n, hidden) })}</span></p>
              </div>
              <BeforeAfter title={s("sure")} before={reliableRate(d.wellbeing.surePre, d.wellbeing.n, d.noiseSd.wellbeing)} after={reliableRate(d.wellbeing.surePost, d.wellbeing.n, d.noiseSd.wellbeing)} labels={{ before: s("before"), after: s("after") }} hidden={hidden} />
              <BeforeAfter title={s("distress")} before={reliableRate(d.wellbeing.distressPre, d.wellbeing.n, d.noiseSd.wellbeing)} after={reliableRate(d.wellbeing.distressPost, d.wellbeing.n, d.noiseSd.wellbeing)} labels={{ before: s("before"), after: s("after") }} hidden={hidden} />
              <p className="text-xs text-muted">{s("wellSynthetic")} {noise("wellbeing")}</p>
            </GlassCard>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <GlassCard className="flex flex-col gap-5" data-signal="safety">
              <SectionTitle>{s("safetyTitle")}</SectionTitle>
              <StatRow
                items={[
                  { value: pct(reliableRate(d.copilot.blocked, d.copilot.questions, d.noiseSd.copilot), "–"), label: s("safetyRate") },
                  { value: fmt(d.copilot.blocked, "–"), label: s("safetyBlocked") },
                  { value: fmt(d.copilot.questions, "–"), label: s("safetyQuestions") },
                ]}
              />
              <p className="text-xs text-muted">{noise("copilot")}</p>
            </GlassCard>
            <GlassCard className="flex flex-col gap-5" data-signal="outreach">
              <SectionTitle>{s("outreachTitle")}</SectionTitle>
              <StatRow
                items={[
                  { value: fmt(d.outreach.inviteCreated, "–"), label: s("invitesCreated") },
                  { value: fmt(d.outreach.relativeTested, "–"), label: s("relativesTested") },
                  { value: pct(reliableRate(d.outreach.relativeTested, d.outreach.inviteCreated, d.noiseSd.outreach), "–"), label: s("yield") },
                  { value: fmt(d.outreach.reclassAffected, "–"), label: s("reclass") },
                ]}
              />
              <p className="text-xs text-muted">{t("countsNote")} {noise("outreach")}</p>
            </GlassCard>
          </section>

          <GlassCard className="p-0">
            <Disclosure title={s("ledgerTitle")}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] text-start text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th scope="col" className="py-2 text-start font-normal">{s("ledgerSignal")}</th>
                      <th scope="col" className="py-2 text-end font-normal">{s("ledgerSensitivity")}</th>
                      <th scope="col" className="py-2 text-end font-normal">{s("ledgerEpsilon")}</th>
                      <th scope="col" className="py-2 text-end font-normal">{s("ledgerNoise")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(SIGNALS) as SignalKey[]).map((k) => (
                      <tr key={k} className="border-t border-glass-border">
                        <th scope="row" className="py-2 text-start font-normal text-ink">{s(`signalNames.${k}`)}</th>
                        <td className="py-2 text-end tabular" dir="ltr">{SIGNALS[k].sensitivity}</td>
                        <td className="py-2 text-end tabular" dir="ltr">{SIGNALS[k].epsilon.toFixed(2)}</td>
                        <td className="py-2 text-end tabular" dir="ltr">±{d.noiseSd[k]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Disclosure>
          </GlassCard>
        </>
      )}

      <section className="flex flex-col gap-4">
        <SectionTitle>{s("operations")}</SectionTitle>
        <p className="-mt-2 text-sm text-muted">{t("livingTitle")}</p>
        {events.length === 0 ? (
          <GlassCard className="flex flex-col gap-4">
            <p className="text-sm text-muted">{t("livingEmpty")}</p>
            {env().DEMO_MODE === "true" && <SimulateUpdate label={tc("simulate")} done={tc.raw("simulateDone")} />}
          </GlassCard>
        ) : (
          events.map((e) => (
            <GlassCard key={e.id} className="flex flex-wrap items-center justify-between gap-4" data-reclass-event>
              <p className="text-ink">
                <span dir="ltr" className="tabular">{e.gene} · VCV{e.clinvarId.padStart(9, "0")}</span>
                <br />
                <span className="text-sm text-muted">{cls(e.oldClass)}</span> <ArrowRight size={14} className="inline rtl:-scale-x-100" /> <span className="text-sm text-gold-ink">{cls(e.newClass)}</span>
              </p>
              {/* An exact small count could point to a person, so it is hidden like every other small group. */}
              <p className="text-sm text-cyan-ink tabular">{e.affected < SUPPRESSION_THRESHOLD ? t("affectedHidden") : t("affected", { count: e.affected })}</p>
            </GlassCard>
          ))
        )}
      </section>

      <GlassCard className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">{t("auditTitle")}</h2>
        <p className="measure text-sm text-muted">{tpr("integrityBody")}</p>
        <IntegrityCheck />
      </GlassCard>
    </div>
  );
}
