"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

/**
 * Bottom sheet on mobile, centred floating panel from md upward (DESIGN.md section 8).
 * Accessible dialog: focus moves in, Escape closes, background is inert to clicks.
 */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  // Callers pass a new onClose on every render. Keeping it in a ref means the effect below runs
  // only when the sheet opens or closes; before, typing in a field inside the sheet re-ran it and
  // pulled focus back to the panel after every key.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <motion.div
            className="absolute inset-0 bg-[color-mix(in_oklab,var(--bg-deep)_70%,transparent)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "glass relative max-h-[85dvh] w-full overflow-y-auto rounded-t-hero bg-bg-raised/80 p-6 pb-8 shadow-[var(--glow-float)] outline-none",
              "md:max-w-lg md:rounded-hero",
              className,
            )}
          >
            <div aria-hidden className="mx-auto mb-4 h-1 w-12 rounded-full bg-glass-border md:hidden" />
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-medium">{title}</h2>
              <button
                onClick={onClose}
                aria-label={closeLabel}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full text-muted transition-colors duration-500 hover:bg-glass hover:text-ink"
              >
                <X />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
