"use client";

import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useState } from "react";
import { Icon } from "../components/icons";

const fieldBase =
  "rounded-input border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] placeholder:text-ink-faint";

/**
 * Single-value unit field: a Headless UI Combobox listing `options` and
 * accepting a free value (kept as typed). Controlled via value/onChange — the
 * form still posts the unit through a positional hidden input placed next to it.
 */
export function UnitCombobox({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const ql = query.trim().toLowerCase();
  const filtered = ql ? options.filter((o) => o.toLowerCase().includes(ql)) : options;
  const canUse = ql.length > 0 && !options.some((o) => o.toLowerCase() === ql);

  return (
    <Combobox
      value={value}
      onChange={(v: string | null) => {
        onChange(v ?? "");
        setQuery("");
      }}
      immediate
    >
      <div className={`relative ${className ?? ""}`}>
        <ComboboxInput
          aria-label="Unité"
          displayValue={(v: string) => v}
          // Live-update the controlled value so a free entry is kept on blur.
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="g"
          autoComplete="off"
          className={`${fieldBase} w-full pr-9`}
        />
        <ComboboxButton
          aria-label="Choisir une unité"
          className="absolute inset-y-0 right-0 grid w-9 place-items-center text-ink-faint transition hover:text-ink-soft"
        >
          <Icon name="chevron" size={15} className="rotate-90" />
        </ComboboxButton>

        <ComboboxOptions
          anchor="bottom start"
          className="z-10 mt-1 max-h-64 w-[var(--input-width)] min-w-[180px] overflow-auto rounded-input border border-line bg-surface py-1 shadow-card-lg empty:invisible"
        >
          {filtered.map((o) => (
            <ComboboxOption
              key={o}
              value={o}
              className="cursor-pointer px-3 py-1.5 text-[14px] text-ink-soft data-[focus]:bg-accent-soft data-[focus]:text-accent-ink"
            >
              {o}
            </ComboboxOption>
          ))}
          {canUse && (
            <ComboboxOption
              value={query.trim()}
              className="cursor-pointer px-3 py-1.5 text-[14px] text-ink-soft data-[focus]:bg-accent-soft data-[focus]:text-accent-ink"
            >
              Utiliser « <span className="font-semibold">{query.trim()}</span> »
            </ComboboxOption>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
