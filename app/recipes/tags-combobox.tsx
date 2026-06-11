"use client";

import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { useState } from "react";

/**
 * Multi-value tags field: chips + autocomplete (Headless UI Combobox) with
 * free creation. Each selected tag is posted via a hidden <input> sharing the
 * same `name`, so it's readable on the Server Action side via formData.getAll(name).
 */
export function TagsCombobox({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: string[];
  defaultValue: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const [query, setQuery] = useState("");

  const q = query.trim();
  const ql = q.toLowerCase();

  const filtered = options.filter(
    (o) => o.toLowerCase().includes(ql) && !selected.includes(o),
  );
  const canCreate =
    q.length > 0 &&
    !options.some((o) => o.toLowerCase() === ql) &&
    !selected.some((s) => s.toLowerCase() === ql);

  function handleChange(values: string[]) {
    setSelected(Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))));
    setQuery("");
  }

  function remove(tag: string) {
    setSelected((s) => s.filter((t) => t !== tag));
  }

  return (
    <div>
      {/* Values posted to the Server Action: one input per tag (getAll(name)). */}
      {selected.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}

      <Combobox multiple value={selected} onChange={handleChange} immediate>
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2 py-1.5 focus-within:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
          {selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                aria-label={`Retirer ${tag}`}
                className="text-zinc-400 hover:text-red-600"
              >
                ✕
              </button>
            </span>
          ))}
          <ComboboxInput
            className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
            placeholder={selected.length === 0 ? "Ajouter un tag…" : ""}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        <ComboboxOptions
          anchor="bottom start"
          className="z-10 mt-1 w-[var(--input-width)] rounded-md border border-zinc-200 bg-white py-1 shadow-lg empty:invisible dark:border-zinc-700 dark:bg-zinc-900"
        >
          {filtered.map((o) => (
            <ComboboxOption
              key={o}
              value={o}
              className="cursor-pointer px-3 py-1.5 text-sm text-zinc-700 data-[focus]:bg-zinc-100 dark:text-zinc-200 dark:data-[focus]:bg-zinc-800"
            >
              {o}
            </ComboboxOption>
          ))}
          {canCreate && (
            <ComboboxOption
              value={q}
              className="cursor-pointer px-3 py-1.5 text-sm text-zinc-700 data-[focus]:bg-zinc-100 dark:text-zinc-200 dark:data-[focus]:bg-zinc-800"
            >
              Créer « <span className="font-medium">{q}</span> »
            </ComboboxOption>
          )}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
}
