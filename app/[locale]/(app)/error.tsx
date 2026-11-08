"use client";

import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/glass-card";
import { ErrorState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";

/** Designed error state: calm, never red, with a way forward. */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("errors");
  const tc = useTranslations("common");
  return (
    <GlassCard>
      <ErrorState title={t("title")} body={t("body")} action={<Button variant="secondary" onClick={reset}>{tc("tryAgain")}</Button>} />
    </GlassCard>
  );
}
