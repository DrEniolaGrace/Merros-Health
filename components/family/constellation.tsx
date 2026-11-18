import type { RelativeRisk, Relation } from "@/lib/family/engine";

const RING: Record<Relation, number> = {
  parent: 0, sibling: 0, child: 0,
  half_sibling: 1, grandparent: 1, aunt_uncle: 1, niece_nephew: 1, grandchild: 1,
  first_cousin: 2,
};
const RADII = [74, 122, 166];

/**
 * Family Constellation (DESIGN.md 7.4): relatives as stars around the person, joined by lines of
 * light. Brightness and size show carrier probability. Relationship labels only, never names.
 */
export function Constellation({ risks, labels, you, summary }: { risks: (RelativeRisk & { planning: boolean })[]; labels: Record<Relation, string>; you: string; summary: string }) {
  const byRing = [0, 1, 2].map((ring) => risks.filter((r) => RING[r.relation] === ring));
  const stars = byRing.flatMap((group, ring) =>
    group.map((r, i) => {
      const angle = (i / Math.max(group.length, 1)) * Math.PI * 2 - Math.PI / 2 + ring * 0.5;
      return { r, x: Math.round((200 + Math.cos(angle) * RADII[ring]) * 10) / 10, y: Math.round((190 + Math.sin(angle) * RADII[ring]) * 10) / 10 };
    }),
  );
  return (
    <figure className="w-full">
      <figcaption className="sr-only">{summary}</figcaption>
      <svg viewBox="-20 0 440 410" className="w-full" aria-hidden>
        <defs>
          <radialGradient id="fc-core">
            <stop offset="0" stopColor="var(--rose-light)" />
            <stop offset="1" stopColor="var(--burgundy)" />
          </radialGradient>
          <filter id="fc-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {RADII.map((rad) => (
          <circle key={rad} cx="200" cy="190" r={rad} fill="none" stroke="var(--rose-light)" strokeOpacity="0.28" strokeWidth="1" strokeDasharray="3 5" />
        ))}
        {stars.map(({ r, x, y }) => (
          <line key={`l-${r.id}`} x1="200" y1="190" x2={x} y2={y} stroke={r.planning ? "var(--pearl-gold)" : "var(--rose-light)"} strokeOpacity={0.35 + r.probability * 0.5} strokeWidth="1.5" />
        ))}
        {stars.map(({ r, x, y }) => {
          const tested = r.basis === "tested";
          // Every relative stays clearly visible; brightness and size still grow with the chance.
          const size = 7 + r.probability * 9;
          const fill = tested ? (r.probability === 1 ? "var(--data-cyan)" : "var(--glass-border)") : r.planning ? "var(--pearl-gold)" : "var(--rose-light)";
          return (
            <g key={r.id} filter="url(#fc-glow)">
              <circle cx={x} cy={y} r={size} fill={fill} opacity={0.6 + r.probability * 0.4} />
              <text x={x} y={y + size + 14} textAnchor="middle" fontSize="12" fill="var(--text-secondary)">{labels[r.relation]}</text>
              <text x={x} y={y + size + 28} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-primary)" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(r.probability * 100)}%</text>
            </g>
          );
        })}
        <circle cx="200" cy="190" r="20" fill="url(#fc-core)" filter="url(#fc-glow)" />
        <text x="200" y="228" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--text-primary)">{you}</text>
      </svg>
    </figure>
  );
}
