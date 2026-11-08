"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Sparkle, LockKey } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Pill, SafetyPill } from "@/components/ui/pill";
import { Input } from "@/components/ui/input";
import { ChoiceGroup, Steps, Switch } from "@/components/ui/controls";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/ui/states";
import { Monogram } from "@/components/ui/avatar";
import { Sheet } from "@/components/ui/sheet";
import { CountUp } from "@/components/ui/motion";
import { Rise, RiseItem } from "@/components/ui/rise";
import { FourSquareGrid, HundredGrid, Legend } from "@/components/risk/grids";
import { HelixStage } from "@/components/three/helix-stage";

export function DsInteractive({ locale }: { locale: string }) {
  const t = useTranslations("ds");
  const tc = useTranslations("common");
  const ts = useTranslations("safety");
  const [level, setLevel] = useState<"simple" | "standard" | "detailed" | null>("standard");
  const [share, setShare] = useState(false);
  const [sheet, setSheet] = useState(false);

  return (
    <>
      <Block title={t("helix")} note={t("helixNote")}>
        <GlassCard hero className="grid min-h-96 items-center gap-8 overflow-hidden md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <h3 className="text-3xl font-semibold">{tc("appName")}</h3>
            <p className="measure text-muted">{tc("principle")}</p>
            <div>
              <Button size="lg" iconEnd={<ArrowRight />}>{t("primary")}</Button>
            </div>
          </div>
          <HelixStage className="h-80 md:h-96" />
        </GlassCard>
      </Block>

      <Block title={t("buttons")} note={t("statesNote")}>
        <div className="glass flex flex-col gap-6 rounded-card p-6">
          <div className="flex flex-wrap gap-3">
            <Button iconEnd={<ArrowRight />}>{t("primary")}</Button>
            <Button variant="secondary">{t("secondary")}</Button>
            <Button variant="ghost">{t("ghost")}</Button>
            <Button variant="gold" icon={<Sparkle />}>{t("gold")}</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled>{t("disabled")}</Button>
            <Button variant="secondary" disabled>{t("disabled")}</Button>
            <Button pending>{t("pending")}</Button>
            <Button size="lg" block className="sm:w-auto">{t("primary")}</Button>
          </div>
        </div>
      </Block>

      <Block title={t("cards")}>
        <Rise className="grid gap-4 md:grid-cols-2">
          <RiseItem>
            <GlassCard tilt className="h-full">
              <h3 className="mb-2 text-xl font-medium">{t("cardTitle")}</h3>
              <p className="text-muted">{t("cardBody")}</p>
            </GlassCard>
          </RiseItem>
          <RiseItem>
            <GlassCard tilt tone="gold" className="h-full">
              <div className="mb-2 flex items-center gap-2 text-gold-ink">
                <LockKey />
                <h3 className="text-xl font-medium">{t("goldCardTitle")}</h3>
              </div>
              <p className="text-muted">{t("goldCardBody")}</p>
            </GlassCard>
          </RiseItem>
        </Rise>
      </Block>

      <Block title={t("pills")} note={t("pillsNote")}>
        <div className="flex flex-wrap gap-3">
          <SafetyPill kind="education" label={ts("education")} />
          <SafetyPill kind="decision_support" label={ts("decision_support")} />
          <SafetyPill kind="clinical_advice" label={ts("clinical_advice")} />
          <Pill>HBB</Pill>
          <Pill tone="gold">GJB2</Pill>
          <Pill tone="cyan">25%</Pill>
        </div>
      </Block>

      <Block title={t("inputs")}>
        <div className="glass grid gap-6 rounded-card p-6 md:grid-cols-2">
          <Input label={t("inputLabel")} hint={t("inputHint")} />
          <Input label={t("inputLabel")} error={t("inputError")} defaultValue="?" />
          <Input label={t("inputLabel")} disabled />
        </div>
      </Block>

      <Block title={t("choices")}>
        <div className="glass flex flex-col gap-8 rounded-card p-6">
          <ChoiceGroup
            legend={t("choiceLegend")}
            columns={3}
            value={level}
            onChange={setLevel}
            options={[
              { value: "simple", label: t("simple"), description: t("simpleDesc") },
              { value: "standard", label: t("standard"), description: t("standardDesc") },
              { value: "detailed", label: t("detailed"), description: t("detailedDesc") },
            ]}
          />
          <Switch checked={share} onChange={setShare} label={t("switchLabel")} description={t("switchDesc")} tone="gold" />
          <Switch checked={false} onChange={() => {}} label={t("switchLabel")} description={t("disabled")} disabled />
          <Steps total={5} current={2} label={t("steps")} />
        </div>
      </Block>

      <Block title={t("data")} note={t("dataNote")}>
        <div className="grid gap-4 md:grid-cols-2">
          <GlassCard className="flex flex-col gap-6">
            <div className="flex items-baseline gap-2" dir="ltr">
              <CountUp value={25} suffix="%" locale={locale} className="font-display text-5xl font-semibold text-cyan-ink" />
            </div>
            <p className="text-muted">{t("perPregnancy")}</p>
            <h3 className="text-lg font-medium">{t("fourSquare")}</h3>
            <FourSquareGrid
              labels={{
                title: t("fourSquare"),
                parentA: t("parentA"),
                parentB: t("parentB"),
                nonCarrier: t("nonCarrier"),
                carrier: t("carrier"),
                affected: t("affected"),
                summary: t("fourSummary"),
              }}
            />
          </GlassCard>
          <GlassCard className="flex flex-col gap-6">
            <div className="flex items-baseline gap-2" dir="ltr">
              <CountUp value={43.75} decimals={2} suffix="%" locale={locale} className="font-display text-5xl font-semibold text-cyan-ink" />
            </div>
            <p className="-mt-4 text-muted">{t("combinedNote")}</p>
            <HundredGrid affected={44} summary={t("combinedSummary")} />
            <h3 className="text-lg font-medium">{t("perPregnancyGrid")}</h3>
            <HundredGrid affected={25} carrier={50} summary={t("hundredSummary")} />
            <Legend
              items={[
                { kind: "affected", label: t("affected") },
                { kind: "carrier", label: t("carrier") },
                { kind: "non", label: t("nonCarrier") },
              ]}
            />
          </GlassCard>
        </div>
      </Block>

      <Block title={t("avatar")}>
        <div className="glass flex items-center gap-4 rounded-card p-6">
          <Monogram name={locale === "ar" ? "د. ليلى حداد" : "Dr. Layla Haddad"} size={56} />
          <div>
            <p className="font-medium">{locale === "ar" ? "د. ليلى حداد" : "Dr. Layla Haddad"}</p>
            <p className="text-sm text-muted">{locale === "ar" ? "مستشارة وراثية معتمدة (افتراضية)" : "Certified genetic counsellor (fictional)"}</p>
          </div>
        </div>
      </Block>

      <Block title={t("feedback")}>
        <div className="grid gap-4 md:grid-cols-3">
          <CardSkeleton label={tc("loading")} />
          <GlassCard>
            <EmptyState title={t("emptyTitle")} body={t("emptyBody")} action={<Button variant="secondary">{t("emptyAction")}</Button>} />
          </GlassCard>
          <GlassCard>
            <ErrorState title={t("errorTitle")} body={t("errorBody")} action={<Button variant="secondary">{t("errorAction")}</Button>} />
          </GlassCard>
        </div>
      </Block>

      <Block title={t("sheet")} note={t("motionNote")}>
        <div>
          <Button variant="secondary" onClick={() => setSheet(true)}>{t("openSheet")}</Button>
        </div>
        <Sheet open={sheet} onClose={() => setSheet(false)} title={t("sheetTitle")} closeLabel={tc("close")}>
          <p className="mb-6 text-muted">{t("sheetBody")}</p>
          <Button block onClick={() => setSheet(false)}>{t("primary")}</Button>
        </Sheet>
      </Block>
    </>
  );
}

function Block({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-medium">{title}</h2>
        {note && <p className="measure text-sm text-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}
