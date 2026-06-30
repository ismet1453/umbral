"use client";

import { useEffect, type ReactNode } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

interface GameModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function GameModal({ open, title, onClose, children }: GameModalProps) {
  const t = useT().game;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="um-modal-root" role="presentation" onClick={onClose}>
      <div
        className="um-modal"
        role="dialog"
        aria-modal
        aria-labelledby="um-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="um-modal__head">
          <h2 id="um-modal-title" className="um-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="um-modal__close"
            onClick={onClose}
            aria-label={t.modalClose}
          >
            ✕
          </button>
        </header>
        <div className="um-modal__body">{children}</div>
      </div>
    </div>
  );
}
