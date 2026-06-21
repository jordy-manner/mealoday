"use client";

import { useState } from "react";
import { Icon } from "./icons";

// Shared "Filtres" disclosure: an adaptive-width pill (funnel icon + label + a
// summary of active filters + a count badge + chevron, accent outline when
// open/hovered, no surrounding box) that toggles an isolated panel (card border +
// rounded-card + shadow-card) shown below. Used by /saisons and the recipe
// search controls so the pattern stays identical. Children are the panel body.
export function FilterDisclosure({
  summary,
  count = 0,
  sticky = false,
  children,
}: {
  summary?: React.ReactNode;
  count?: number;
  sticky?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={sticky ? "sticky top-[68px] z-10 sm:static" : ""}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={
          "inline-flex w-full items-center gap-2.5 rounded-input border px-4 py-2.5 text-[14.5px] font-bold transition sm:w-auto " +
          (open ? "border-accent bg-surface" : "border-line bg-surface hover:border-accent")
        }
      >
        <Icon name="filter" size={17} className="text-accent" /> Filtres
        {summary && <span className="font-normal text-ink-faint">{summary}</span>}
        {count > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 font-mono text-[11px] font-bold text-[#151517]">
            {count}
          </span>
        )}
        <Icon
          name="chevron"
          size={14}
          className={`ml-auto rotate-90 text-ink-faint transition-transform sm:ml-1 ${open ? "-rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-3 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          {children}
        </div>
      )}
    </div>
  );
}
