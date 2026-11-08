"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/** Segmented reading level control. Changes the explanation without changing saved preferences. */
export function LevelSwitch({ current, label, options }: { current: string; label: string; options: { value: string; label: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div role="radiogroup" aria-label={label} className="glass inline-flex rounded-full p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={current === o.value}
          onClick={() => router.replace({ pathname, query: { level: o.value } }, { scroll: false })}
          className={cn(
            "h-10 rounded-full px-4 text-sm transition-[background,color] duration-500 ease-calm",
            current === o.value ? "bg-burgundy text-on-burgundy" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
