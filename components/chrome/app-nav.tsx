"use client";

import { useEffect, useState } from "react";
import {
  BookOpenText,
  CaretDown,
  ChartLineUp,
  Compass,
  DotsThreeCircle,
  Dna,
  FilmStrip,
  HandHeart,
  House,
  Lifebuoy,
  ListChecks,
  MagnifyingGlass,
  MapPinLine,
  Path,
  Scales,
  ShieldCheck,
  Sparkle,
  TreeStructure,
  UsersThree,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { Link, usePathname } from "@/i18n/navigation";
import { Sheet } from "@/components/ui/sheet";
import { cn } from "@/lib/cn";

export type NavKey =
  | "home" | "copilot" | "family" | "findCare" | "result" | "couple" | "learn" | "options" | "care" | "pathway" | "privacy" | "screening" | "cases" | "programme" | "values" | "wellbeing" | "video";

const ICONS: Record<NavKey, typeof House> = {
  home: House, copilot: Sparkle, family: TreeStructure, findCare: MapPinLine, result: Dna, couple: UsersThree, learn: BookOpenText, options: Compass, care: Lifebuoy,
  pathway: Path, privacy: ShieldCheck, screening: MagnifyingGlass, cases: ListChecks, programme: ChartLineUp, values: Scales, wellbeing: HandHeart, video: FilmStrip,
};

export interface NavItem {
  key: NavKey;
  href: string;
  label: string;
}

export type NavGroupKey = "result" | "together" | "family" | "care" | "screening";

const GROUP_ICONS: Record<NavGroupKey, typeof House> = { result: Dna, together: UsersThree, family: TreeStructure, care: Lifebuoy, screening: MagnifyingGlass };

export interface NavGroup {
  group: NavGroupKey;
  label: string;
  items: NavItem[];
}

/** The menu: single items (Home, Privacy) and groups. A group with one item is shown as that item. */
export type NavEntry = NavItem | NavGroup;
const isGroup = (e: NavEntry): e is NavGroup => "group" in e;

/** Extra paths that belong to a nav item (the result import screen belongs to My result). */
const ALSO: Record<string, string[]> = { "/result": ["/import"], "/support": ["/session"], "/counsellor": ["/session"] };

function isActive(pathname: string, href: string) {
  return [href, ...(ALSO[href] ?? [])].some((h) => pathname === h || pathname.startsWith(`${h}/`));
}

const groupActive = (pathname: string, g: NavGroup) => g.items.some((i) => isActive(pathname, i.href));

function RailLink({ it, pathname, nested = false }: { it: NavItem; pathname: string; nested?: boolean }) {
  const Icon = ICONS[it.key];
  const active = isActive(pathname, it.href);
  return (
    <Link
      href={it.href}
      aria-current={active ? "page" : undefined}
      data-nav-item={it.key}
      className={cn(
        "relative flex items-center gap-3 rounded-control px-4 text-sm transition-colors duration-500 ease-calm",
        nested ? "h-11 ps-11" : "h-12",
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
      {!nested && <Icon size={20} weight={active ? "duotone" : "light"} className={active ? "text-rose-ink" : undefined} />}
      {it.label}
    </Link>
  );
}

/**
 * Calm left navigation rail on desktop (DESIGN.md section 9), in groups. The group that holds the
 * current page is open; the others are collapsed until opened.
 */
export function NavRail({ entries, label }: { entries: NavEntry[]; label: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<Set<NavGroupKey>>(() => new Set(entries.filter(isGroup).filter((g) => groupActive(pathname, g)).map((g) => g.group)));
  useEffect(() => {
    // Moving to a page in another group opens that group, and only that one.
    const active = entries.filter(isGroup).find((g) => groupActive(pathname, g));
    if (active) setOpen(new Set([active.group]));
  }, [pathname, entries]);

  return (
    <nav aria-label={label} className="sticky top-24 hidden h-fit w-56 shrink-0 flex-col gap-1 md:flex" data-nav-rail>
      {entries.map((e) => {
        if (!isGroup(e)) return <RailLink key={e.key} it={e} pathname={pathname} />;
        if (e.items.length === 1) return <RailLink key={e.group} it={{ ...e.items[0], label: e.label }} pathname={pathname} />;
        const Icon = GROUP_ICONS[e.group];
        const isOpen = open.has(e.group);
        const active = groupActive(pathname, e);
        const id = `nav-group-${e.group}`;
        return (
          <div key={e.group} data-nav-group={e.group} data-open={isOpen ? "true" : "false"}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={id}
              onClick={() =>
                setOpen((s) => {
                  const n = new Set(s);
                  if (n.has(e.group)) n.delete(e.group);
                  else n.add(e.group);
                  return n;
                })
              }
              className={cn(
                "flex h-12 w-full items-center gap-3 rounded-control px-4 text-start text-sm transition-colors duration-500 ease-calm hover:bg-glass",
                active ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              <Icon size={20} weight={active ? "duotone" : "light"} className={active ? "text-rose-ink" : undefined} />
              <span className="flex-1">{e.label}</span>
              <CaretDown size={14} className={cn("shrink-0 transition-transform duration-500 ease-calm", isOpen && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={id}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col gap-0.5 overflow-hidden"
                >
                  {e.items.map((it) => <RailLink key={it.key} it={it} pathname={pathname} nested />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}

/**
 * Bottom bar on a phone, within thumb reach: Home, three groups and More. A group opens a short
 * list of its pages; More holds the remaining groups and single items, so every page is reachable.
 */
export function BottomBar({ entries, label, moreLabel, closeLabel }: { entries: NavEntry[]; label: string; moreLabel: string; closeLabel: string }) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<{ title: string; items: NavItem[] } | null>(null);
  useEffect(() => setSheet(null), [pathname]);

  const home = entries.find((e): e is NavItem => !isGroup(e) && e.key === "home");
  const groups = entries.filter(isGroup);
  const bar = groups.filter((g) => g.group === "result" || g.group === "together" || g.group === "care");
  const rest: NavItem[] = [
    ...groups.filter((g) => !bar.includes(g)).flatMap((g) => (g.items.length === 1 ? [{ ...g.items[0], label: g.label }] : g.items)),
    ...entries.filter((e): e is NavItem => !isGroup(e) && e.key !== "home"),
  ];
  const restActive = rest.some((i) => isActive(pathname, i.href));

  const slot = (key: string, Icon: typeof House, text: string, active: boolean, action: { href: string } | { onClick: () => void }) => (
    <li key={key} className="flex-1">
      {"href" in action ? (
        <Link href={action.href} aria-current={active ? "page" : undefined} data-bottom={key} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-xs transition-colors duration-500", active ? "text-rose-ink" : "text-muted")}>
          <Icon size={22} weight={active ? "duotone" : "light"} />
          {text}
        </Link>
      ) : (
        <button type="button" onClick={action.onClick} data-bottom={key} aria-haspopup="dialog" className={cn("flex h-16 w-full flex-col items-center justify-center gap-1 text-xs transition-colors duration-500", active ? "text-rose-ink" : "text-muted")}>
          <Icon size={22} weight={active ? "duotone" : "light"} />
          {text}
        </button>
      )}
    </li>
  );

  return (
    <>
      <nav
        aria-label={label}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-glass-border bg-[color-mix(in_oklab,var(--bg-deep)_78%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around">
          {home && slot("home", House, home.label, isActive(pathname, home.href), { href: home.href })}
          {bar.map((g) => slot(g.group, GROUP_ICONS[g.group], g.label, groupActive(pathname, g), { onClick: () => setSheet({ title: g.label, items: g.items }) }))}
          {rest.length > 0 && slot("more", DotsThreeCircle, moreLabel, restActive, { onClick: () => setSheet({ title: moreLabel, items: rest }) })}
        </ul>
      </nav>
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheet?.title ?? ""} closeLabel={closeLabel}>
        <ul className="flex flex-col gap-1" data-nav-sheet>
          {sheet?.items.map((it) => {
            const Icon = ICONS[it.key];
            const active = isActive(pathname, it.href);
            return (
              <li key={it.key}>
                <Link href={it.href} aria-current={active ? "page" : undefined} data-nav-item={it.key} className={cn("flex h-14 items-center gap-3 rounded-control px-4 text-base", active ? "glass text-ink" : "text-muted hover:bg-glass hover:text-ink")}>
                  <Icon size={22} weight={active ? "duotone" : "light"} className={active ? "text-rose-ink" : undefined} />
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}
