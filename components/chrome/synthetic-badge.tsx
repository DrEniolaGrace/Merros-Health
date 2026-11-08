import { Flask } from "@phosphor-icons/react/dist/ssr";

/** "Synthetic demo data" badge, shown on every screen (SPEC 0.4). Always bilingual. */
export function SyntheticBadge() {
  return (
    <span
      className="inline-flex h-8 items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--pearl-gold)_35%,transparent)] bg-glass px-3 text-xs text-gold-ink"
      role="note"
    >
      <Flask size={14} weight="light" aria-hidden />
      <span lang="en">Synthetic demo data</span>
      <span aria-hidden className="opacity-50">·</span>
      <span lang="ar">بيانات تجريبية</span>
    </span>
  );
}
