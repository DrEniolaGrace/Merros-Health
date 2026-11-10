import { BookOpenText, Compass, Lifebuoy, SealCheck, TreeStructure, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { LogoMark } from "@/components/chrome/logo";

export interface JourneyNode {
  title: string;
  meta: string;
}

const ICONS = [SealCheck, BookOpenText, UsersThree, Lifebuoy, Compass, TreeStructure];

/**
 * "Watch a journey run itself": the six steps of a Merros journey around one private core,
 * joined by lines of travelling light. Three nodes each side on desktop; a single column on phones.
 */
export function JourneyGraph({ nodes, coreLabel }: { nodes: JourneyNode[]; coreLabel: string }) {
  const left = nodes.slice(0, 3);
  const right = nodes.slice(3, 6);
  return (
    <div className="relative">
      {/* Desktop: two columns around a glowing core */}
      <div className="relative hidden items-center gap-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 300" preserveAspectRatio="none" aria-hidden>
          {[50, 150, 250].map((y) => (
            <g key={y}>
              <path d={`M 330 ${y} C 420 ${y}, 430 150, 470 150`} fill="none" stroke="var(--glass-border)" strokeWidth="1" />
              <path d={`M 330 ${y} C 420 ${y}, 430 150, 470 150`} fill="none" stroke="var(--rose-light)" strokeWidth="1.2" className="flow-line" opacity="0.8" />
              <path d={`M 670 ${y} C 580 ${y}, 570 150, 530 150`} fill="none" stroke="var(--glass-border)" strokeWidth="1" />
              <path d={`M 530 150 C 570 150, 580 ${y}, 670 ${y}`} fill="none" stroke="var(--pearl-gold)" strokeWidth="1.2" className="flow-line" opacity="0.7" />
            </g>
          ))}
        </svg>
        <ul className="relative flex flex-col gap-6">
          {left.map((n, i) => (
            <Node key={n.title} node={n} index={i} />
          ))}
        </ul>
        <div className="relative flex flex-col items-center gap-3 px-6">
          <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,color-mix(in_oklab,var(--burgundy-glow)_70%,white),var(--burgundy)_60%,var(--bg-deep))] shadow-[0_0_80px_-10px_var(--burgundy-glow),inset_0_0_30px_rgba(255,255,255,0.08)]">
            <span className="absolute inset-0 animate-[spin_24s_linear_infinite] rounded-full border border-dashed border-[color-mix(in_oklab,var(--pearl-gold)_45%,transparent)]" />
            <LogoMark size={40} />
          </span>
          <span className="text-xs uppercase tracking-[0.14em] text-gold-ink">{coreLabel}</span>
        </div>
        <ul className="relative flex flex-col gap-6">
          {right.map((n, i) => (
            <Node key={n.title} node={n} index={i + 3} />
          ))}
        </ul>
      </div>

      {/* Phones: a single column joined by a line of light */}
      <ol className="relative flex flex-col gap-3 md:hidden">
        <span aria-hidden className="absolute bottom-6 start-[27px] top-6 w-px bg-[linear-gradient(var(--burgundy-glow),var(--pearl-gold))] opacity-60" />
        {nodes.map((n, i) => (
          <Node key={n.title} node={n} index={i} />
        ))}
      </ol>
    </div>
  );
}

function Node({ node, index }: { node: JourneyNode; index: number }) {
  const Icon = ICONS[index];
  return (
    <li className="glass corner-dots relative flex items-center gap-3 rounded-control px-3 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-glass-strong text-rose-ink">
        <Icon size={18} weight="light" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm text-ink">{node.title}</span>
        <span className="text-xs text-muted">{node.meta}</span>
      </span>
    </li>
  );
}
