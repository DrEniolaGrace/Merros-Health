import { cn } from "@/lib/cn";
import { SafetyPill, type SafetyKind } from "./pill";

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
    <header className="flex flex-col gap-3">
      {eyebrow && <p className="text-sm text-gold-ink">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
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
