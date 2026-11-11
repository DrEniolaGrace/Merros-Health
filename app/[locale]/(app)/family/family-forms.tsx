"use client";

import { useId, useState, useTransition } from "react";
import { Check, Copy, LinkSimple, Plus, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { addRelative, createInvite, removeRelative } from "@/lib/actions/family";
import { SIDED, type Relation } from "@/lib/family/engine";

function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-muted">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="glass h-12 w-full appearance-none rounded-control px-4 text-base text-ink outline-none transition-[box-shadow] duration-500 focus:shadow-[0_0_0_1px_var(--rose-light),0_0_24px_-6px_var(--burgundy-glow)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-bg-raised text-ink">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export interface FamilyFormLabels {
  relation: string;
  side: string;
  tested: string;
  planning: string;
  add: string;
  relations: Record<Relation, string>;
  sides: Record<"maternal" | "paternal" | "unknown", string>;
  testedOptions: Record<"unknown" | "carrier" | "not_carrier", string>;
}

export function AddRelative({ labels: L }: { labels: FamilyFormLabels }) {
  const [relation, setRelation] = useState<Relation>("sibling");
  const [side, setSide] = useState<"maternal" | "paternal" | "unknown">("unknown");
  const [tested, setTested] = useState<"unknown" | "carrier" | "not_carrier">("unknown");
  const [planning, setPlanning] = useState(false);
  const [pending, start] = useTransition();
  const sided = SIDED.includes(relation);
  const pid = useId();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label={L.relation} value={relation} onChange={setRelation} options={(Object.keys(L.relations) as Relation[]).map((r) => ({ value: r, label: L.relations[r] }))} />
        {sided && <Select label={L.side} value={side} onChange={setSide} options={(["unknown", "maternal", "paternal"] as const).map((s) => ({ value: s, label: L.sides[s] }))} />}
        <Select label={L.tested} value={tested} onChange={setTested} options={(["unknown", "carrier", "not_carrier"] as const).map((s) => ({ value: s, label: L.testedOptions[s] }))} />
      </div>
      <label htmlFor={pid} className="flex min-h-12 cursor-pointer items-center gap-3 text-sm text-ink">
        <input id={pid} type="checkbox" checked={planning} onChange={(e) => setPlanning(e.target.checked)} className="h-5 w-5 accent-[var(--burgundy-glow)]" />
        {L.planning}
      </label>
      <Button
        icon={<Plus />}
        pending={pending}
        className="self-start"
        onClick={() => start(() => addRelative({ relation, side: sided ? side : "na", planning, tested }))}
      >
        {L.add}
      </Button>
    </div>
  );
}

export function RemoveRelative({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() => start(() => removeRelative(id))}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-500 hover:bg-glass hover:text-ink disabled:opacity-40"
    >
      <Trash size={18} />
    </button>
  );
}

export function InviteLink({ labels: L, locale }: { labels: { create: string; copy: string; copied: string; hint: string }; locale: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      {!url ? (
        <Button variant="gold" icon={<LinkSimple />} pending={pending} className="self-start" onClick={() => start(async () => setUrl(`${window.location.origin}/${locale}/invite/${(await createInvite()).token}`))}>
          {L.create}
        </Button>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code dir="ltr" data-invite-url className="glass min-w-0 flex-1 truncate rounded-control px-4 py-3 text-sm text-ink">{url}</code>
          <Button
            variant="secondary"
            icon={copied ? <Check /> : <Copy />}
            onClick={async () => {
              await navigator.clipboard?.writeText(url).catch(() => undefined);
              setCopied(true);
            }}
          >
            {copied ? L.copied : L.copy}
          </Button>
        </div>
      )}
      <p className="text-sm text-muted">{L.hint}</p>
    </div>
  );
}
