"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Lifebuoy, ShieldCheck } from "@phosphor-icons/react";
import { askCopilot } from "@/lib/actions/copilot";
import type { ChatTurn, CopilotReply } from "@/lib/ai/types";
import { Link } from "@/i18n/navigation";
import { SafetyPill } from "@/components/ui/pill";
import { Disclosure } from "@/components/ui/disclosure";
import { LinkButton } from "@/components/ui/link-button";
import { Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/cn";

export interface ChatLabels {
  placeholder: string;
  send: string;
  thinking: string;
  suggestions: string[];
  suggestionsTitle: string;
  education: string;
  decision_support: string;
  sources: string;
  how: string;
  blocked: string;
  counsellor: string;
  counsellorCta: string;
  offline: string;
  you: string;
  copilot: string;
  agents: Record<string, string>;
  maxLength: number;
}

type Item = { role: "user"; text: string } | { role: "assistant"; text: string; reply: CopilotReply };

const EASE = [0.22, 1, 0.36, 1] as const;

/** Removes [id] citation markers from the visible text; they are shown as source chips instead. */
const visible = (text: string) => text.replace(/\s*\[[a-z0-9.#-]+\]/gi, "").trim();

/** Breathing orb of light: the Copilot's presence (DESIGN.md 7.7). Pulses faster while working. */
export function CopilotOrb({ active, size = 48 }: { active?: boolean; size?: number }) {
  return (
    <span aria-hidden className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <span className={cn("absolute inset-0 rounded-full bg-burgundy-glow/40 blur-md", active ? "animate-[orb_1.4s_ease-in-out_infinite]" : "animate-[orb_4.5s_ease-in-out_infinite]")} />
      <span className="relative h-2/3 w-2/3 rounded-full bg-[radial-gradient(circle_at_35%_30%,white,var(--rose-light)_35%,var(--burgundy-glow)_70%,var(--burgundy))] shadow-[0_0_24px_var(--burgundy-glow)]" />
    </span>
  );
}

export function Chat({ labels: L }: { labels: ChatLabels }) {
  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items, pending]);

  function send(q: string) {
    const question = q.trim();
    if (!question || pending) return;
    const history: ChatTurn[] = items.map((i) => ({ role: i.role, text: i.text })).slice(-8);
    setItems((prev) => [...prev, { role: "user", text: question }]);
    setText("");
    start(async () => {
      const reply = await askCopilot({ question, history });
      setItems((prev) => [...prev, { role: "assistant", text: reply.text, reply }]);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {items.length === 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">{L.suggestionsTitle}</p>
          <ul className="flex flex-wrap gap-2">
            {L.suggestions.map((s) => (
              <li key={s}>
                <button onClick={() => send(s)} className="glass corner-dots rounded-control px-4 py-3 text-start text-sm text-ink transition-[background,transform] duration-500 ease-calm hover:-translate-y-px hover:bg-glass-strong">
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="flex flex-col gap-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <motion.li key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className={cn("flex gap-3", it.role === "user" && "justify-end")}>
              {it.role === "assistant" && <CopilotOrb size={36} />}
              {it.role === "user" ? (
                <p className="max-w-[85%] rounded-card rounded-ee-sm bg-burgundy px-4 py-3 text-on-burgundy">
                  <span className="sr-only">{L.you}: </span>
                  {it.text}
                </p>
              ) : (
                <div className={cn("glass flex max-w-[92%] flex-col gap-3 rounded-card rounded-ss-sm p-4", it.reply.blocked && "border-[color-mix(in_oklab,var(--pearl-gold)_40%,transparent)]")} data-copilot-answer>
                  <span className="sr-only">{L.copilot}: </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <SafetyPill kind={it.reply.label} label={L[it.reply.label]} />
                    {it.reply.blocked && (
                      <span className="inline-flex items-center gap-1 text-xs text-gold-ink">
                        <ShieldCheck size={14} />
                        {L.blocked}
                      </span>
                    )}
                  </div>
                  {visible(it.text).split(/\n{2,}/).map((para, k) => (
                    <p key={k} className="measure text-ink">{para}</p>
                  ))}
                  {it.reply.citations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>{L.sources}</span>
                      {it.reply.citations.map((c) =>
                        c.href ? (
                          <Link key={c.id} href={c.href} className="rounded-full border border-glass-border px-3 py-1 text-cyan-ink transition-colors duration-500 hover:bg-glass">{c.title}</Link>
                        ) : (
                          <span key={c.id} className="rounded-full border border-glass-border px-3 py-1">{c.title}</span>
                        ),
                      )}
                    </div>
                  )}
                  {it.reply.escalations.length > 0 && (
                    <div className="flex flex-col gap-3 rounded-control border border-[color-mix(in_oklab,var(--pearl-gold)_35%,transparent)] bg-[color-mix(in_oklab,var(--pearl-gold)_8%,transparent)] p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 text-sm text-ink"><Lifebuoy size={18} className="shrink-0 text-gold-ink" />{L.counsellor}</p>
                      <LinkButton href="/support" variant="gold">{L.counsellorCta}</LinkButton>
                    </div>
                  )}
                  <div className="-mx-4 -mb-4 border-t border-glass-border">
                    <Disclosure title={L.how}>
                      <ol className="flex flex-col gap-2 text-xs text-muted">
                        {it.reply.steps.map((s, k) => (
                          <li key={k} className="flex gap-2">
                            <span className="shrink-0 text-rose-ink">{L.agents[s.agent] ?? s.agent}</span>
                            <span dir="ltr" className="tabular">{s.detail}</span>
                          </li>
                        ))}
                        {it.reply.provider === "offline-demo" && <li className="text-gold-ink">{L.offline}</li>}
                      </ol>
                    </Disclosure>
                  </div>
                </div>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
        {pending && (
          <li className="flex items-center gap-3" role="status">
            <CopilotOrb size={36} active />
            <div className="glass flex w-56 flex-col gap-2 rounded-card p-4">
              <span className="sr-only">{L.thinking}</span>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </li>
        )}
      </ol>
      <div ref={endRef} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="glass sticky bottom-40 z-10 flex items-end gap-2 rounded-hero p-2 shadow-[var(--glow-float)] md:bottom-24"
      >
        <label htmlFor="copilot-q" className="sr-only">{L.placeholder}</label>
        <textarea
          id="copilot-q"
          rows={1}
          value={text}
          maxLength={L.maxLength}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(text);
            }
          }}
          placeholder={L.placeholder}
          className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-4 py-3 text-base text-ink outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={!text.trim() || pending}
          aria-label={L.send}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-burgundy text-on-burgundy shadow-[var(--glow-primary)] transition-[filter,transform,opacity] duration-500 ease-calm hover:brightness-115 active:scale-95 disabled:opacity-40 disabled:shadow-none"
        >
          <ArrowUp size={20} weight="bold" />
        </button>
      </form>
    </div>
  );
}
