"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";

/**
 * Submit button that first asks for confirmation in a modal. Used for every
 * financial / irreversible action so nothing is submitted by accident.
 * Must be rendered inside the <form> it submits.
 */
export default function ConfirmButton({
  children,
  title,
  message,
  confirmLabel = "Confirm",
  className = "btn-primary",
  tone = "primary",
  summary,
}: {
  children: ReactNode;
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  className?: string;
  tone?: "primary" | "danger" | "success";
  /** Field names whose current values are echoed in the dialog, with labels. */
  summary?: { name: string; label: string }[];
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<[string, string][]>([]);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const ask = () => {
    const form = triggerRef.current?.form;
    if (!form) return;
    if (!form.reportValidity()) return;
    if (summary) {
      const data = new FormData(form);
      setValues(
        summary.map(({ name, label }) => {
          const field = form.elements.namedItem(name);
          let text = String(data.get(name) ?? "");
          if (field instanceof HTMLSelectElement) text = field.selectedOptions[0]?.text ?? text;
          if (field instanceof HTMLInputElement && field.type === "password") text = "•".repeat(text.length);
          return [label, text || "—"];
        })
      );
    }
    setOpen(true);
  };

  const confirm = () => {
    setOpen(false);
    triggerRef.current?.form?.requestSubmit();
  };

  const confirmClass = tone === "danger" ? "btn-danger" : tone === "success" ? "btn-success" : "btn-primary";

  return (
    <>
      <button ref={triggerRef} type="button" onClick={ask} disabled={pending} className={className}>
        {pending ? "Processing…" : children}
      </button>

      {open &&
        createPortal(
          <div className="modal-root" role="dialog" aria-modal="true" aria-label={title}>
            <button type="button" aria-label="Cancel" className="modal-backdrop" onClick={() => setOpen(false)} />
            <div className="modal">
              <h2 className="text-lg font-semibold">{title}</h2>
              {message && <div className="mt-2 text-sm text-[var(--muted)]">{message}</div>}
              {values.length > 0 && (
                <dl className="kv mt-4">
                  {values.map(([label, text]) => (
                    <div key={label} className="kv-row">
                      <dt>{label}</dt>
                      <dd>{text}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="button" onClick={confirm} autoFocus className={`${confirmClass} !px-5 !py-2.5 !text-sm`}>
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/** Plain submit button with a pending state. */
export function SubmitButton({ children, className = "btn-primary" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Processing…" : children}
    </button>
  );
}
