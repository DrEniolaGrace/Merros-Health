import { cn } from "@/lib/cn";

/** Line art helix illustration used by empty states. Inherits theme colours. */
function HelixArt({ className }: { className?: string }) {
  const rungs = Array.from({ length: 7 }, (_, i) => i);
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <defs>
        <linearGradient id="es-a" x1="0" x2="1">
          <stop offset="0" stopColor="var(--burgundy-glow)" />
          <stop offset="1" stopColor="var(--rose-light)" />
        </linearGradient>
        <radialGradient id="es-glow">
          <stop offset="0" stopColor="var(--burgundy-glow)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--burgundy-glow)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="60" rx="70" ry="50" fill="url(#es-glow)" />
      <path d="M20 30 C 50 90, 110 -30, 140 30" fill="none" stroke="url(#es-a)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 90 C 50 30, 110 150, 140 90" fill="none" stroke="url(#es-a)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      {rungs.map((i) => {
        const x = 30 + i * 16.5;
        return <line key={i} x1={x} x2={x} y1={46 + (i % 2) * 6} y2={74 - (i % 2) * 6} stroke="var(--rose-light)" strokeOpacity="0.35" strokeWidth="1" />;
      })}
      <circle cx="128" cy="40" r="3" fill="var(--pearl-gold)" />
    </svg>
  );
}

/** Calm "nothing here yet" state: illustration, plain explanation and one helpful next action. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 px-6 py-8 text-center", className)}>
      <HelixArt className="h-28 w-40" />
      <h3 className="text-lg font-medium text-ink">{title}</h3>
      <p className="measure text-sm text-muted">{body}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

/** Error state: calm, never red, always offers a way forward. */
export function ErrorState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-4 px-6 py-8 text-center", className)}>
      <svg viewBox="0 0 120 120" className="h-24 w-24" aria-hidden>
        <circle cx="60" cy="60" r="44" fill="none" stroke="var(--pearl-gold)" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="60" cy="60" r="26" fill="none" stroke="var(--rose-light)" strokeOpacity="0.6" strokeWidth="1.5" />
        <path d="M60 46 v18" stroke="var(--pearl-gold)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="60" cy="72" r="1.8" fill="var(--pearl-gold)" />
      </svg>
      <h3 className="text-lg font-medium text-ink">{title}</h3>
      <p className="measure text-sm text-muted">{body}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton h-4 w-full", className)} />;
}

/** A designed loading layout for card based screens (used by loading.tsx files). */
export function CardSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="glass flex flex-col gap-4 rounded-card p-6">
      <Skeleton className="h-6 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="mt-2 h-12 w-1/3 rounded-control" />
    </div>
  );
}
