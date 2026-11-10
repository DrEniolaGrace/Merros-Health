"use client";

import {
  BookOpenText,
  ChartLineUp,
  Compass,
  Dna,
  House,
  Lifebuoy,
  ListChecks,
  MagnifyingGlass,
  Path,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

export type NavKey =
  | "home" | "result" | "couple" | "learn" | "options" | "care" | "pathway" | "privacy" | "screening" | "cases" | "programme";

const ICONS: Record<NavKey, typeof House> = {
  home: House, result: Dna, couple: UsersThree, learn: BookOpenText, options: Compass, care: Lifebuoy,
  pathway: Path, privacy: ShieldCheck, screening: MagnifyingGlass, cases: ListChecks, programme: ChartLineUp,
};

export interface NavItem {
  key: NavKey;
  href: string;
  label: string;
  /** Shown in the mobile bottom bar (max 5). */
  primary?: boolean;
}

/** Extra paths that belong to a nav item (the result import screen belongs to My result). */
const ALSO: Record<string, string[]> = { "/result": ["/import"], "/learn": [] };

function isActive(pathname: string, href: string) {
  return [href, ...(ALSO[href] ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`));
}

/** Calm left navigation rail on desktop (DESIGN.md section 9). */
export function NavRail({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="sticky top-24 hidden h-fit w-56 shrink-0 flex-col gap-1 md:flex">
      {items.map((it) => {
        const Icon = ICONS[it.key];
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.key}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-12 items-center gap-3 rounded-control px-4 text-sm transition-colors duration-500 ease-calm",
              active ? "text-ink" : "text-muted hover:bg-glass hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="rail-active"
                className="glass absolute inset-0 -z-10 rounded-control shadow-[0_0_24px_-12px_var(--burgundy-glow)]"
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            <Icon size={20} weight={active ? "duotone" : "light"} className={active ? "text-rose-ink" : undefined} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom bar on mobile, within thumb reach. */
export function BottomBar({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  const primary = items.filter((i) => i.primary).slice(0, 5);
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-glass-border bg-[color-mix(in_oklab,var(--bg-deep)_78%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {primary.map((it) => {
          const Icon = ICONS[it.key];
          const active = isActive(pathname, it.href);
          return (
            <li key={it.key} className="flex-1">
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors duration-500",
                  active ? "text-rose-ink" : "text-muted",
                )}
              >
                <Icon size={22} weight={active ? "duotone" : "light"} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
