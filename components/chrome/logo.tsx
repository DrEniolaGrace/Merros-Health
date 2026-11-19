import Image from "next/image";

/** The Merros mark (public/brand/merros-mark.png), as a rounded tile. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return <Image src="/brand/merros-mark.png" alt="Merros" width={size} height={size} className="shrink-0 rounded-[28%] shadow-[0_0_18px_-6px_var(--burgundy-glow)]" priority />;
}

export function Logo({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark />
      <span className="font-display text-lg font-medium tracking-tight text-ink">{name}</span>
    </span>
  );
}
