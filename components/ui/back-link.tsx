import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";

/** Back to the parent screen, for pages one level down (mirrors in Arabic). */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex h-12 items-center gap-2 self-start rounded-full pe-4 text-sm text-muted transition-colors duration-500 hover:text-ink"
    >
      <span className="glass flex h-10 w-10 items-center justify-center rounded-full transition-[background,transform] duration-500 ease-calm group-hover:-translate-x-0.5 group-hover:bg-glass-strong rtl:group-hover:translate-x-0.5">
        <ArrowLeft size={18} weight="light" className="rtl:-scale-x-100" />
      </span>
      {label}
    </Link>
  );
}
