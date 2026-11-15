"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowsLeftRight, Key, LockKey, ShieldCheck, Sparkle, UsersThree } from "@phosphor-icons/react";
import { psiState, psiSubmitRound1, psiSubmitRound2, psiTurnKey, shareOutcomeWithCounsellor } from "@/lib/actions/psi";
import { tourGo } from "@/lib/actions/auth";
import { intersect, newSecret, psiItemsFromSignedResult, round1, round2, PSI_SET_SIZE } from "@/lib/psi/protocol";
import { combineAffected, perPregnancy } from "@/lib/risk/engine";
import { HALF, toNumber, toPercentString } from "@/lib/risk/fraction";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { LinkButton } from "@/components/ui/link-button";
import { CountUp } from "@/components/ui/motion";
import { LiveBadge, StatRow } from "@/components/ui/accents";
import { PageHero } from "@/components/ui/page-hero";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { DualKey } from "@/components/risk/dual-key";
import type { FourSquareLabels } from "@/components/risk/grids";
import { CoupleNumbers } from "./couple-numbers";

type Phase = "loading" | "sealed" | "working" | "waiting" | "ready" | "revealed" | "error";

interface Local {
  secret: string;
  order: (string | null)[];
  blinded: string[];
}

export interface BlindMatchLabels {
  eyebrow: string;
  education: string;
  sealedTitle: string;
  sealedBody: string;
  turnKey: string;
  workingTitle: string;
  workingBody: string;
  waitingTitle: string;
  waitingBody: string;
  readyTitle: string;
  readyBody: string;
  reveal: string;
  revealedTitle: string;
  accentNone: string;
  accentOne: string;
  accentMany: string; // contains {count}
  withPartner: string;
  sealedBadge: string;
  youAgreed: string;
  bothAgreed: string;
  agreed: string;
  notYet: string;
  waiting: string;
  partner: string;
  dualKeyLabel: string;
  demoSwitch: string;
  statShared: string;
  statCombined: string;
  statSeen: string;
  sharedTitle: string; // {gene}
  perPregnancy: string; // {condition}
  carrierChance: string; // {pct}
  combinedTitle: string;
  combinedBody: string;
  combinedHow: string;
  hundredSummary: string; // {n}
  notAffected: string;
  noneSharedTitle: string;
  noneSharedBody: string;
  residual: string;
  nadTitle: string;
  nadBody: string;
  privacyNote: string;
  deviceNote: string;
  serverSees: string; // {n}
  talkShare: string;
  talkShareNote: string;
  talk: string;
  errorTitle: string;
  errorBody: string;
  tryAgain: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Blind Couple Match (SPEC 6.1). The whole comparison runs here, on the person's own device:
 * their signed result is verified, blinded with a secret that never leaves this browser, and
 * only sealed points travel through the server. The risk engine then runs locally.
 */
export function BlindMatch({
  userId,
  linkId,
  me,
  partnerName,
  partnerPersona,
  geneConditions,
  labels: L,
  gridLabels,
  locale,
}: {
  userId: string;
  linkId: string;
  me: string;
  partnerName: string;
  /** Demo mode only: lets a single browser play both phones. */
  partnerPersona: string | null;
  geneConditions: Record<string, string>;
  labels: BlindMatchLabels;
  gridLabels: FourSquareLabels;
  locale: string;
}) {
  const key = `merros-psi:${userId}:${linkId}`;
  const [phase, setPhase] = useState<Phase>("loading");
  const [shared, setShared] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const busy = useRef(false);
  const phaseRef = useRef<Phase>("loading");
  phaseRef.current = phase;

  const load = useCallback((): Local | null => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? "null");
    } catch {
      return null;
    }
  }, [key]);

  /** One step of the protocol: do whatever this device can do next. */
  const tick = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const st = await psiState();
      const local = load();
      const mineMatches = !!local && !!st.myRound1 && st.myRound1.join() === local.blinded.join();
      if (!st.selfConsented || !mineMatches) {
        if (phaseRef.current !== "working") setPhase("sealed");
        return;
      }
      if (st.partnerRound1 && !st.myRound2Done) {
        await psiSubmitRound2(round2(st.partnerRound1, local!.secret));
      }
      if (st.partnerRound1 && st.partnerRound2) {
        setShared(intersect(local!.order, st.partnerRound2, st.partnerRound1, local!.secret));
        setPhase((p) => (p === "revealed" ? p : "ready"));
      } else {
        setPhase("waiting");
      }
    } catch {
      setPhase("error");
    } finally {
      busy.current = false;
    }
  }, [load]);

  useEffect(() => {
    void tick();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible" && (phaseRef.current === "waiting" || phaseRef.current === "ready")) void tick();
    }, 2500);
    return () => window.clearInterval(id);
  }, [tick]);

  function turnKey() {
    setPhase("working");
    start(async () => {
      try {
        const input = await psiTurnKey();
        // Input integrity on the device: only a lab signed result may enter the match.
        const items = psiItemsFromSignedResult(input.bundle, input.signature, input.labPublicKey);
        const secret = newSecret();
        const r1 = round1(items, secret);
        localStorage.setItem(key, JSON.stringify({ secret, order: r1.order, blinded: r1.blinded } satisfies Local));
        await psiSubmitRound1(r1.blinded);
        await tick();
      } catch {
        setPhase("error");
      }
    });
  }

  const youAgreed = phase !== "sealed" && phase !== "loading" && phase !== "error";
  const done = phase === "ready" || phase === "revealed";
  const one = perPregnancy(HALF, HALF);
  const combined = combineAffected(shared.map(() => one.affected));
  const combinedPct = toNumber(combined) * 100;

  if (phase === "loading") {
    return (
      <div className="glass flex flex-col gap-4 rounded-hero p-8" aria-busy>
        <Skeleton className="h-8 w-40 rounded-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    );
  }
  if (phase === "error") {
    return (
      <GlassCard>
        <ErrorState title={L.errorTitle} body={L.errorBody} action={<Button variant="secondary" onClick={() => { setPhase("loading"); void tick(); }}>{L.tryAgain}</Button>} />
      </GlassCard>
    );
  }

  const hero = {
    sealed: { title: L.sealedTitle, body: L.sealedBody, accent: undefined as string | undefined },
    working: { title: L.workingTitle, body: L.workingBody, accent: undefined },
    waiting: { title: L.waitingTitle, body: L.waitingBody, accent: undefined },
    ready: { title: L.readyTitle, body: L.readyBody, accent: undefined },
    revealed: {
      title: L.revealedTitle,
      body: undefined,
      accent: shared.length === 0 ? L.accentNone : shared.length === 1 ? L.accentOne : L.accentMany.replace("{count}", String(shared.length)),
    },
  }[phase];

  return (
    <div className="flex flex-col gap-10">
      <PageHero
        eyebrow={L.eyebrow}
        title={hero.title}
        accent={hero.accent}
        body={hero.body}
        label={phase === "revealed" ? { kind: "education", text: L.education } : undefined}
        badges={
          <>
            <LiveBadge tone={done ? "gold" : youAgreed ? "cyan" : "rose"}>{done ? L.bothAgreed : youAgreed ? L.youAgreed : L.sealedBadge}</LiveBadge>
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <UsersThree size={16} />
              {L.withPartner}
            </span>
          </>
        }
        aside={
          <motion.div animate={{ scale: done ? 1.03 : 1 }} transition={{ duration: 1.2, ease: EASE }}>
            <DualKey
              label={L.dualKeyLabel}
              you={{ name: me, status: youAgreed ? L.agreed : L.notYet }}
              partner={{ name: partnerName, status: done ? L.agreed : L.waiting }}
              youAgreed={youAgreed}
              partnerAgreed={done}
              shared={phase === "revealed" ? shared : undefined}
            />
          </motion.div>
        }
      >
        {phase === "sealed" && (
          <div>
            <Button size="lg" variant="gold" icon={<Key />} pending={pending} onClick={turnKey}>{L.turnKey}</Button>
          </div>
        )}
        {phase === "working" && <Skeleton className="h-3 w-56 rounded-full" />}
        {phase === "ready" && (
          <div>
            <Button size="lg" variant="gold" icon={<Sparkle />} onClick={() => setPhase("revealed")}>{L.reveal}</Button>
          </div>
        )}
        {(phase === "waiting" || phase === "ready") && partnerPersona && (
          <div>
            <Button variant="ghost" icon={<ArrowsLeftRight />} pending={pending} className="-ms-4" onClick={() => start(async () => { window.location.assign(await tourGo(partnerPersona, "/couple")); })}>
              {L.demoSwitch}
            </Button>
          </div>
        )}
      </PageHero>

      <AnimatePresence>
        {phase === "revealed" && (
          <motion.div key="result" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE }} className="flex flex-col gap-10">
            <StatRow
              items={[
                { value: <CountUp value={shared.length} locale={locale} />, label: L.statShared },
                { value: <CountUp value={combinedPct} decimals={Number.isInteger(combinedPct) ? 0 : 2} suffix="%" locale={locale} />, label: L.statCombined },
                { value: <CountUp value={0} locale={locale} />, label: L.statSeen },
              ]}
            />
            {shared.length === 0 ? (
              <GlassCard className="flex flex-col gap-3">
                <h2 className="text-2xl font-medium">{L.noneSharedTitle}</h2>
                <p className="measure text-muted">{L.noneSharedBody}</p>
                <p className="measure text-sm text-muted">{L.residual}</p>
              </GlassCard>
            ) : (
              <CoupleNumbers
                locale={locale}
                genes={shared.map((gene) => ({
                  gene,
                  title: L.sharedTitle.replace("{gene}", gene),
                  perPregnancy: L.perPregnancy.replace("{condition}", geneConditions[gene] ?? gene),
                  affectedPct: toNumber(one.affected) * 100,
                  carrierText: L.carrierChance.replace("{pct}", toPercentString(one.carrier)),
                }))}
                combined={
                  shared.length > 1
                    ? {
                        pct: combinedPct,
                        exact: toPercentString(combined),
                        title: L.combinedTitle,
                        body: L.combinedBody,
                        how: L.combinedHow,
                        hundred: Math.round(combinedPct),
                        hundredSummary: L.hundredSummary.replace("{n}", String(Math.round(combinedPct))),
                        notAffected: L.notAffected,
                      }
                    : null
                }
                gridLabels={gridLabels}
              />
            )}
            <GlassCard tone="gold" hero className="flex flex-col gap-2">
              <h2 className="text-gradient-gold text-xl font-semibold">{L.nadTitle}</h2>
              <p className="measure">{L.nadBody}</p>
            </GlassCard>
            <div className="flex flex-col gap-3">
              {shared.length > 0 ? (
                <>
                  <Button size="lg" pending={pending} className="self-start" onClick={() => start(() => shareOutcomeWithCounsellor(shared))}>{L.talkShare}</Button>
                  <p className="text-sm text-muted">{L.talkShareNote}</p>
                </>
              ) : (
                <LinkButton href="/support" size="lg" className="self-start">{L.talk}</LinkButton>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass corner-dots flex flex-col gap-3 rounded-card p-6 text-sm text-muted">
        <p className="flex items-start gap-2 text-ink"><LockKey size={16} className="mt-1 shrink-0 text-gold-ink" />{L.privacyNote}</p>
        <p className="flex items-start gap-2"><ShieldCheck size={16} className="mt-1 shrink-0 text-cyan-ink" />{L.deviceNote}</p>
        <p className="tabular">{L.serverSees.replace("{n}", String(PSI_SET_SIZE))}</p>
      </div>
    </div>
  );
}
