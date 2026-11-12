"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { publishSignals } from "@/lib/actions/signals";

export function PublishButton({ label, exhausted, disabled }: { label: string; exhausted: string; disabled: boolean }) {
  const [pending, start] = useTransition();
  const [refused, setRefused] = useState(disabled);
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        icon={<ShieldCheck />}
        pending={pending}
        disabled={refused}
        className="self-start"
        onClick={() =>
          start(async () => {
            const r = await publishSignals();
            if (r.ok) window.location.reload();
            else setRefused(true);
          })
        }
      >
        {label}
      </Button>
      {refused && <p role="status" data-budget-exhausted className="text-sm text-gold-ink">{exhausted}</p>}
    </div>
  );
}
