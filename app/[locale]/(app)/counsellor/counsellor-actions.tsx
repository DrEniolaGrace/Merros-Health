"use client";

import { useState, useTransition } from "react";
import { ArrowsClockwise, CheckCircle, PencilSimpleLine, SealCheck, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PresenterControl } from "@/components/tour/presenter";
import { checkClinvarNow, releaseReclassification, simulateClinvarUpdate } from "@/lib/actions/living";
import { completeSession, markReportIssued, saveNotesAndDraft, signSummary } from "@/lib/actions/counsellor";

export function SimulateUpdate({ label, done }: { label: string; done: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <PresenterControl>
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" icon={<ArrowsClockwise />} pending={pending} onClick={() => start(async () => { const r = await simulateClinvarUpdate(); setMsg(done.replace("{affected}", String(r.affected)).replace("{tasks}", String(r.tasks))); window.location.reload(); })}>
        {label}
      </Button>
      {msg && <p role="status" className="text-sm text-cyan-ink tabular">{msg}</p>}
    </div>
    </PresenterControl>
  );
}

export function CheckClinvarNow({ label, done, failed }: { label: string; done: string; failed: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="ghost" icon={<ArrowsClockwise />} pending={pending} onClick={() => start(async () => { const r = await checkClinvarNow(); setMsg(r.error ? failed : done.replace("{checked}", String(r.checked)).replace("{changed}", String(r.changed))); })}>
        {label}
      </Button>
      {msg && <p role="status" data-variantwatch-status className="text-sm text-cyan-ink tabular">{msg}</p>}
    </div>
  );
}

export function ReleaseButton({ taskId, label }: { taskId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="gold" icon={<SealCheck />} pending={pending} className="self-start" onClick={() => start(async () => { await releaseReclassification(taskId); window.location.reload(); })}>
      {label}
    </Button>
  );
}

export function CompleteButton({ appointmentId, label }: { appointmentId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="ghost" icon={<CheckCircle />} pending={pending} className="self-start" onClick={() => start(async () => { await completeSession(appointmentId); window.location.reload(); })}>
      {label}
    </Button>
  );
}

export function ReportIssuedButton({ patientId, label }: { patientId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" icon={<CheckCircle />} pending={pending} className="self-start" onClick={() => start(async () => { await markReportIssued(patientId); window.location.reload(); })}>
      {label}
    </Button>
  );
}

export interface SummaryLabels {
  notesLabel: string;
  notesPlaceholder: string;
  draft: string;
  draftLabel: string;
  draftHint: string;
  sign: string;
  signed: string;
  offline: string;
  dir: "rtl" | "ltr";
}

/** Notes -> Copilot draft -> counsellor review and signature. The counsellor always decides. */
export function SummaryComposer({ appointmentId, initialNotes, initialSummary, labels: L }: { appointmentId: string; initialNotes: string; initialSummary: string; labels: SummaryLabels }) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState(initialSummary);
  const [provider, setProvider] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [pending, start] = useTransition();
  const field = "glass w-full rounded-control p-4 text-base text-ink outline-none transition-[box-shadow] duration-500 placeholder:text-muted focus:shadow-[0_0_0_1px_var(--rose-light),0_0_24px_-6px_var(--burgundy-glow)]";
  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="c-notes" className="text-sm text-muted">{L.notesLabel}</label>
      <textarea id="c-notes" rows={5} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={L.notesPlaceholder} className={field} />
      <Button
        variant="secondary"
        icon={<Sparkle />}
        disabled={!notes.trim()}
        pending={pending}
        className="self-start"
        onClick={() => start(async () => { const r = await saveNotesAndDraft({ appointmentId, notes }); setDraft(r.draft); setProvider(r.provider); setSigned(false); })}
      >
        {L.draft}
      </Button>
      {draft && (
        <>
          <label htmlFor="c-draft" className="flex items-center gap-2 text-sm text-muted"><PencilSimpleLine size={16} />{L.draftLabel}</label>
          <textarea id="c-draft" dir={L.dir} rows={9} maxLength={4000} value={draft} onChange={(e) => { setDraft(e.target.value); setSigned(false); }} className={field} />
          <p className="text-xs text-muted">{L.draftHint}{provider === "offline-demo" ? ` ${L.offline}` : ""}</p>
          <Button variant="gold" icon={<SealCheck />} disabled={draft.trim().length < 20 || signed} pending={pending} className="self-start" onClick={() => start(async () => { await signSummary({ appointmentId, text: draft }); setSigned(true); })}>
            {L.sign}
          </Button>
          {signed && <p role="status" className="flex items-center gap-2 text-sm text-cyan-ink"><CheckCircle size={18} />{L.signed}</p>}
        </>
      )}
    </div>
  );
}
