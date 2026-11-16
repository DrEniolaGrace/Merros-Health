import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Independence statement and a link to the sources, on every page. */
export async function SiteFooter() {
  const t = await getTranslations("sources");
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 text-xs text-muted sm:px-8 md:pb-10" data-site-footer>
      <p className="measure">
        {t("footer")}{" "}
        <Link href="/sources" className="text-ink underline underline-offset-4">{t("footerLink")}</Link>
      </p>
    </footer>
  );
}
