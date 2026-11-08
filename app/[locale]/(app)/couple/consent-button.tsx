"use client";

import { useTransition } from "react";
import { Key } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { setConsent } from "@/lib/actions/patient";

/** Dual Key, part one: this partner's own, independent agreement to compare. */
export function ConsentButton({ label }: { label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button size="lg" variant="gold" icon={<Key />} pending={pending} onClick={() => start(() => setConsent("couple_comparison", true))}>
      {label}
    </Button>
  );
}
