"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

/** The tested gene panel, searchable by current symbol or older name. */
export function PanelList({ genes, labels: L }: { genes: { symbol: string; aliases: string[] }[]; labels: { search: string; count: string; noMatch: string } }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const s = q.trim().toUpperCase();
    return s ? genes.filter((g) => g.symbol.toUpperCase().includes(s) || g.aliases.some((a) => a.toUpperCase().includes(s))) : genes;
  }, [q, genes]);
  return (
    <div className="flex flex-col gap-3" data-panel-list={genes.length}>
      <label className="glass flex h-12 items-center gap-2 rounded-control px-4">
        <MagnifyingGlass size={18} className="shrink-0 text-muted" />
        <span className="sr-only">{L.search}</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.search} dir="ltr" className="h-full w-full bg-transparent text-base text-ink outline-none placeholder:text-muted" />
      </label>
      <p className="text-xs text-muted tabular" role="status">{L.count.replace("{n}", String(shown.length)).replace("{total}", String(genes.length))}</p>
      {shown.length === 0 ? (
        <p className="text-sm text-muted">{L.noMatch}</p>
      ) : (
        <ul className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto" dir="ltr">
          {shown.map((g) => (
            <li key={g.symbol} data-panel-gene={g.symbol} className="rounded-full border border-glass-border px-2.5 py-1 text-xs text-ink">
              {g.symbol}
              {g.aliases.length > 0 && <span className="text-muted"> ({g.aliases.join(", ")})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
