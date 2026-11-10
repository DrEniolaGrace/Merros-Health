import { cn } from "@/lib/cn";
import { SafetyPill, type SafetyKind } from "./pill";
import { Eyebrow } from "./accents";

/** Page heading block: optional eyebrow, title, supporting text, optional safety label. */
export function PageHeader({
  eyebrow,
  title,
  body,
  label,
  children,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  label?: { kind: SafetyKind; text: string };
  children?: React.ReactNode;
}) {
  return (
    <header className="relative flex flex-col gap-4">
      <span aria-hidden className="pointer-events-none absolute -start-16 -top-16 -z-10 h-48 w-72 rounded-full bg-burgundy-glow/20 blur-3xl" />
      {eyebrow && (
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      )}
      <h1 className="text-gradient text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
      {body && <p className="measure text-base text-muted">{body}</p>}
      {(label || children) && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {label && <SafetyPill kind={label.kind} label={label.text} />}
          {children}
        </div>
      )}
    </header>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-xl font-medium", className)}>{children}</h2>;
}

/** Primary action dock: on mobile it sits above the bottom bar within thumb reach. */
export function ActionDock({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">{children}</div>;
}
