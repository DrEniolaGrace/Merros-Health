"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

/** Arabic / English switch. Each option is written in its own language. */
export function LocaleSwitch({ label, className }: { label: string; className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label={label} className={cn("glass inline-flex h-12 items-center rounded-full p-1", pending && "opacity-70", className)}>
      {(["ar", "en"] as const).map((l) => (
        <button
          key={l}
          lang={l}
          aria-pressed={locale === l}
          onClick={() => start(() => router.replace(pathname, { locale: l }))}
          className={cn(
            "h-10 min-w-12 rounded-full px-3 text-sm transition-[background,color] duration-500 ease-calm",
            locale === l ? "bg-burgundy text-on-burgundy shadow-[0_0_16px_-6px_var(--burgundy-glow)]" : "text-muted hover:text-ink",
          )}
        >
          {l === "ar" ? "عربي" : "EN"}
        </button>
      ))}
    </div>
  );
}
