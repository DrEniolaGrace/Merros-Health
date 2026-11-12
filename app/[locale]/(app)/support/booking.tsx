"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Buildings, Phone, VideoCamera } from "@phosphor-icons/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/controls";
import { Eyebrow } from "@/components/ui/accents";
import { bookSession } from "@/lib/actions/patient";

export function Booking({ slots, clinicianId }: { slots: { iso: string; label: string }[]; clinicianId: string | null }) {
  const t = useTranslations("support");
  const [mode, setMode] = useState<"in_person" | "video" | "phone">("video");
  const [slot, setSlot] = useState<string | null>(null);
  const [questions, setQuestions] = useState("");
  const [pending, start] = useTransition();
  return (
    <GlassCard hero className="relative flex flex-col gap-8 overflow-hidden">
      <span aria-hidden className="pointer-events-none absolute -start-24 -top-24 h-64 w-64 rounded-full bg-burgundy-glow/20 blur-3xl" />
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("bookEyebrow")}</Eyebrow>
        <h2 className="text-gradient text-2xl font-semibold">{t("book")}</h2>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.14em] text-gold-ink">{t("stepOne")}</span>
        <ChoiceGroup
          legend={t("mode")}
          columns={3}
          value={mode}
          onChange={setMode}
          options={[
            { value: "in_person", label: t("inPerson"), description: t("inPersonDesc"), icon: <Buildings size={24} /> },
            { value: "video", label: t("video"), description: t("videoDesc"), icon: <VideoCamera size={24} /> },
            { value: "phone", label: t("phone"), description: t("phoneDesc"), icon: <Phone size={24} /> },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.14em] text-gold-ink">{t("stepTwo")}</span>
        <ChoiceGroup legend={t("slot")} columns={2} value={slot} onChange={setSlot} options={slots.map((s) => ({ value: s.iso, label: s.label }))} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.14em] text-gold-ink">{t("stepThree")}</span>
        <label htmlFor="session-questions" className="text-lg font-medium text-ink">{t("questionsLabel")}</label>
        <textarea
          id="session-questions"
          rows={3}
          maxLength={1500}
          value={questions}
          onChange={(e) => setQuestions(e.target.value)}
          placeholder={t("questionsPlaceholder")}
          className="glass w-full rounded-control p-4 text-base text-ink outline-none transition-[box-shadow] duration-500 placeholder:text-muted focus:shadow-[0_0_0_1px_var(--rose-light),0_0_24px_-6px_var(--burgundy-glow)]"
        />
        <p className="text-sm text-muted">{t("questionsHint")}</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button size="lg" variant="gold" disabled={!slot} pending={pending} onClick={() => slot && start(async () => { await bookSession({ mode, startsAt: slot, clinicianId: clinicianId ?? undefined, questions: questions || undefined }); window.location.reload(); })} className="self-start">
          {t("confirm")}
        </Button>
        <p className="text-sm text-muted">{t("simulated")}</p>
      </div>
    </GlassCard>
  );
}
