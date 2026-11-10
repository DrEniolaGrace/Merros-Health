import { Key, LockKey, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

/**
 * Dual Key visual: two partners as orbs of light, each with their own key. When both have agreed,
 * a gold beam joins them and only the shared genes appear between them.
 */
export function DualKey({
  you,
  partner,
  youAgreed,
  partnerAgreed,
  shared,
  label,
}: {
  you: { name: string; status: string };
  partner: { name: string; status: string };
  youAgreed: boolean;
  partnerAgreed: boolean;
  shared?: string[];
  label: string;
}) {
  const both = youAgreed && partnerAgreed;
  return (
    <div role="img" aria-label={label} className="flex w-72 max-w-full flex-col items-center gap-4 sm:w-80">
      <div className="relative flex w-full items-center justify-between">
        <span
          aria-hidden
          className={cn(
            "absolute inset-x-12 top-1/2 h-px -translate-y-1/2",
            both ? "bg-[linear-gradient(90deg,var(--rose-light),var(--pearl-gold),var(--rose-light))] shadow-[0_0_14px_var(--pearl-gold)]" : "bg-[repeating-linear-gradient(90deg,var(--glass-border)_0_6px,transparent_6px_12px)]",
          )}
        />
        <Orb name={you.name} agreed={youAgreed} />
        {shared && shared.length > 0 ? (
          <span className="relative z-10 flex flex-col items-center gap-1" dir="ltr">
            {shared.map((g) => (
              <span key={g} className="inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#e9d6a6,var(--pearl-gold))] px-3 py-1 text-xs font-semibold text-[#1e0e14] shadow-[0_0_24px_-4px_var(--pearl-gold)]">
                <Sparkle size={10} weight="fill" />
                {g}
              </span>
            ))}
          </span>
        ) : (
          <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-glass-strong text-muted">
            <LockKey size={16} />
          </span>
        )}
        <Orb name={partner.name} agreed={partnerAgreed} />
      </div>
      <div className="grid w-full grid-cols-2 gap-2 text-center text-xs">
        <span className={youAgreed ? "text-gold-ink" : "text-muted"}>{you.status}</span>
        <span className={partnerAgreed ? "text-gold-ink" : "text-muted"}>{partner.status}</span>
      </div>
    </div>
  );
}

function Orb({ name, agreed }: { name: string; agreed: boolean }) {
  return (
    <span className="relative z-10 flex flex-col items-center gap-2">
      <span
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-full font-display text-xl font-semibold text-on-burgundy",
          "bg-[radial-gradient(circle_at_35%_30%,color-mix(in_oklab,var(--burgundy-glow)_75%,white),var(--burgundy)_65%,var(--bg-deep))]",
          agreed ? "shadow-[0_0_0_1.5px_var(--pearl-gold),0_0_46px_-6px_var(--burgundy-glow)]" : "shadow-[0_0_0_1px_var(--glass-border)] opacity-70",
        )}
      >
        {name.replace(/^(Dr\.?|د\.)\s*/u, "").slice(0, 1)}
        <span
          className={cn(
            "absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-full border",
            agreed ? "border-transparent bg-[linear-gradient(135deg,#e9d6a6,var(--pearl-gold))] text-[#1e0e14]" : "border-glass-border bg-bg-raised text-muted",
          )}
        >
          <Key size={14} weight={agreed ? "fill" : "light"} />
        </span>
      </span>
      <span className="max-w-24 truncate text-sm text-ink">{name}</span>
    </span>
  );
}
