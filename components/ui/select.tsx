"use client";

import { useId } from "react";
import { CaretDown } from "@phosphor-icons/react";

/** Glass select with a visible label and focus glow. */
export function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-sm text-muted">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="glass h-12 w-full appearance-none rounded-control pe-10 ps-4 text-base text-ink outline-none transition-[box-shadow] duration-500 focus:shadow-[0_0_0_1px_var(--rose-light),0_0_24px_-6px_var(--burgundy-glow)]"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-bg-raised text-ink">{o.label}</option>
          ))}
        </select>
        <CaretDown size={16} className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
