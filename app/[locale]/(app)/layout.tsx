import { getLocale, getTranslations } from "next-intl/server";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { requireUser } from "@/lib/auth/session";
import { signOut } from "@/lib/actions/auth";
import { TopBar } from "@/components/chrome/top-bar";
import { BottomBar, NavRail, type NavItem } from "@/components/chrome/app-nav";
import { JudgeTour } from "@/components/tour/judge-tour";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const name = locale === "ar" ? user.displayNameAr : user.displayNameEn;

  const items: NavItem[] =
    user.role === "counsellor"
      ? [{ key: "cases", href: "/counsellor", label: t("cases"), primary: true }]
      : user.role === "admin"
        ? [{ key: "programme", href: "/admin", label: t("programme"), primary: true }]
        : [
            { key: "home", href: "/home", label: t("home"), primary: true },
            { key: "result", href: "/result", label: t("result"), primary: true },
            { key: "couple", href: "/couple", label: t("couple") },
            { key: "copilot", href: "/copilot", label: t("copilot"), primary: true },
            { key: "learn", href: "/learn", label: t("learn") },
            { key: "options", href: "/options", label: t("options") },
            { key: "values", href: "/values", label: t("values") },
            { key: "family", href: "/family", label: t("family") },
            { key: "wellbeing", href: "/wellbeing", label: t("wellbeing") },
            { key: "care", href: "/support", label: t("care"), primary: true },
            { key: "findCare", href: "/find-care", label: t("findCare") },
            { key: "pathway", href: "/pathway", label: t("pathway") },
            { key: "screening", href: "/screening", label: t("screening") },
            { key: "privacy", href: "/privacy", label: t("privacy"), primary: true },
          ];

  return (
    <>
      <TopBar>
        <form action={signOut} className="flex items-center">
          <button
            type="submit"
            title={tc("signOut")}
            className="inline-flex h-12 items-center gap-2 rounded-full px-3 text-sm text-muted transition-colors duration-500 hover:bg-glass hover:text-ink"
          >
            <span className="hidden max-w-32 truncate sm:inline">{name}</span>
            <SignOut size={20} weight="light" aria-label={tc("signOut")} className="rtl:-scale-x-100" />
          </button>
        </form>
      </TopBar>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-bg-raised focus:p-3">
        {tc("skipToContent")}
      </a>
      <div className="mx-auto flex max-w-6xl gap-12 px-4 pb-40 pt-8 sm:px-8 md:pb-24">
        {items.length > 1 && <NavRail items={items} label={t("main")} />}
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
      {items.length > 1 && <BottomBar items={items} label={t("main")} />}
      <JudgeTour raised={items.length > 1} />
    </>
  );
}
