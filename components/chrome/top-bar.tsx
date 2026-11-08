import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";
import { LocaleSwitch } from "./locale-switch";
import { SyntheticBadge } from "./synthetic-badge";
import { ThemeToggle } from "./theme-toggle";

/** Top bar for public and standalone pages: brand, synthetic data badge, theme and language. */
export async function TopBar({ children }: { children?: React.ReactNode }) {
  const t = await getTranslations("common");
  return (
    <header className="sticky top-0 z-40 border-b border-glass-border bg-[color-mix(in_oklab,var(--bg-deep)_72%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="shrink-0 rounded-control">
            <Logo name={t("appName")} />
          </Link>
          <span className="hidden sm:inline-flex">
            <SyntheticBadge />
          </span>
        </div>
        <div className="flex items-center gap-1">
          {children}
          <ThemeToggle labels={{ toNight: t("toNight"), toPearl: t("toPearl") }} />
          <LocaleSwitch label={t("language")} />
        </div>
      </div>
      <div className="flex justify-center px-4 pb-2 sm:hidden">
        <SyntheticBadge />
      </div>
    </header>
  );
}
