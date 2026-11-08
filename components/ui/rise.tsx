import { cn } from "@/lib/cn";

/**
 * Screen entrance (DESIGN.md section 6): children rise gently and fade in, staggered 50ms.
 * Pure CSS so content is visible as soon as HTML arrives, even before JavaScript loads;
 * reduced motion turns it into an instant, still appearance (see globals.css).
 */
export function Rise({
  children,
  className,
  delay = 0,
  as: Comp = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "ul" | "ol" | "section";
}) {
  return (
    <Comp className={cn("rise-group", className)} style={delay ? ({ "--rise-delay": `${delay}s` } as React.CSSProperties) : undefined}>
      {children}
    </Comp>
  );
}

export function RiseItem({
  children,
  className,
  as: Comp = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "section" | "p" | "h1" | "h2";
}) {
  return <Comp className={cn("rise-item", className)}>{children}</Comp>;
}
