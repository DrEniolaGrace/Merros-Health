"use client";

import { useTransition } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Monogram } from "@/components/ui/avatar";
import { Pill } from "@/components/ui/pill";
import { loginAs } from "@/lib/actions/auth";
import { cn } from "@/lib/cn";

export function PersonaCard({ personaKey, name, story, tag, cta }: { personaKey: string; name: string; story: string; tag?: string; cta: string }) {
  const [pending, start] = useTransition();
  return (
    <GlassCard tilt className="h-full p-0">
      <button
        onClick={() => start(() => loginAs(personaKey))}
        disabled={pending}
        aria-label={cta}
        className={cn("group flex h-full w-full flex-col gap-4 rounded-card p-6 text-start", pending && "opacity-70")}
      >
        <div className="flex items-center gap-3">
          <Monogram name={name} size={44} />
          <div className="min-w-0">
            <p className="truncate text-lg font-medium text-ink">{name}</p>
            {tag && <Pill className="mt-1">{tag}</Pill>}
          </div>
        </div>
        <p className="flex-1 text-sm text-muted">{story}</p>
        <span className="inline-flex items-center gap-2 text-sm text-rose-ink">
          {pending ? <span className="skeleton h-4 w-24" aria-hidden /> : cta}
          <ArrowRight size={16} className="transition-transform duration-500 group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
        </span>
      </button>
    </GlassCard>
  );
}
