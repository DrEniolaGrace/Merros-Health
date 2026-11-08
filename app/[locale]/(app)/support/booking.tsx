"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Buildings, Phone, VideoCamera } from "@phosphor-icons/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/controls";
import { bookSession } from "@/lib/actions/patient";

export function Booking({ slots }: { slots: { iso: string; label: string }[] }) {
  const t = useTranslations("support");
  const [mode, setMode] = useState<"in_person" | "video" | "phone">("video");
  const [slot, setSlot] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <GlassCard className="flex flex-col gap-8">
      <h2 className="text-xl font-medium">{t("book")}</h2>
      <ChoiceGroup
        legend={t("mode")}
        columns={3}
        value={mode}
        onChange={setMode}
        options={[
          { value: "in_person", label: t("inPerson"), description: t("inPersonDesc"), icon: <Buildings /> },
          { value: "video", label: t("video"), description: t("videoDesc"), icon: <VideoCamera /> },
          { value: "phone", label: t("phone"), description: t("phoneDesc"), icon: <Phone /> },
        ]}
      />
      <ChoiceGroup legend={t("slot")} columns={2} value={slot} onChange={setSlot} options={slots.map((s) => ({ value: s.iso, label: s.label }))} />
      <div className="flex flex-col gap-2">
        <Button size="lg" disabled={!slot} pending={pending} onClick={() => slot && start(() => bookSession({ mode, startsAt: slot }))} className="self-start">
          {t("confirm")}
        </Button>
        <p className="text-sm text-muted">{t("simulated")}</p>
      </div>
    </GlassCard>
  );
}
