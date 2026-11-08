"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldWarning, Trash } from "@phosphor-icons/react";
import { Switch } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { deleteMyData, setConsent, verifyIntegrityAction } from "@/lib/actions/patient";
import type { ConsentPurpose } from "@/lib/consent/purposes";

export function ConsentToggles({ items }: { items: { purpose: ConsentPurpose; title: string; body: string; on: boolean; until: string | null }[] }) {
  const [state, setState] = useState(() => Object.fromEntries(items.map((i) => [i.purpose, i.on])));
  const [, start] = useTransition();
  return (
    <div className="flex flex-col gap-6">
      {items.map((i) => (
        <Switch
          key={i.purpose}
          checked={!!state[i.purpose]}
          onChange={(on) => {
            setState((s) => ({ ...s, [i.purpose]: on }));
            start(() => setConsent(i.purpose, on));
          }}
          label={i.title}
          description={state[i.purpose] && i.until ? `${i.body} · ${i.until}` : i.body}
          tone={i.purpose === "couple_comparison" ? "gold" : "default"}
        />
      ))}
    </div>
  );
}

export function IntegrityCheck() {
  const t = useTranslations("privacy");
  const [pending, start] = useTransition();
  const [r, setR] = useState<Awaited<ReturnType<typeof verifyIntegrityAction>> | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" icon={<ShieldCheck />} pending={pending} className="self-start" onClick={() => start(async () => setR(await verifyIntegrityAction()))}>
        {t("verify")}
      </Button>
      {r && (
        <p role="status" className={r.ok ? "flex items-center gap-2 text-cyan-ink" : "flex items-center gap-2 text-gold-ink"}>
          {r.ok ? <ShieldCheck size={18} /> : <ShieldWarning size={18} />}
          <span className="tabular">{r.ok ? t("intact", { count: r.checked }) : t("broken", { seq: r.brokenAtSeq })}</span>
        </p>
      )}
    </div>
  );
}

export function DeleteData() {
  const t = useTranslations("privacy");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const ok = ["DELETE", "حذف"].includes(text.trim());
  return (
    <>
      <Button variant="ghost" icon={<Trash />} className="mt-auto self-start" onClick={() => setOpen(true)}>
        {t("delete")}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("delete")} closeLabel={tc("close")}>
        <p className="mb-6 text-sm text-muted">{t("deleteBody")}</p>
        <Input label={t("deleteConfirmLabel")} value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button disabled={!ok} pending={pending} onClick={() => start(() => deleteMyData(text))}>{t("deleteConfirm")}</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>{tc("cancel")}</Button>
        </div>
      </Sheet>
    </>
  );
}
