"use client";

import { useTransition } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { completeSession } from "@/lib/actions/counsellor";

export function CompleteButton({ appointmentId, label }: { appointmentId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" icon={<CheckCircle />} pending={pending} className="self-start" onClick={() => start(() => completeSession(appointmentId))}>
      {label}
    </Button>
  );
}
