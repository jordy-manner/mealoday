"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormState } from "./actions";
import { TagsCombobox } from "./tags-combobox";
import { StepEditor } from "./step-editor";

type IngredientRow = { key: number; name: string; quantity: string; unit: string };
type UtensilRow = { key: number; name: string; quantity: string };
type StepRow = { key: number; value: string };

export type RecipeFormValues = {
  title: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  ingredients: { name: string; quantity: string; unit: string }[];
  utensils: { name: string; quantity: string }[];
  steps: string[]; // one step (Markdown) per element
  tags: string[]; // selected tags
};

const EMPTY: RecipeFormValues = {
  title: "",
  description: "",
  servings: "",
  prepTime: "",
  cookTime: "",
  ingredients: [],
  utensils: [],
  steps: [],
  tags: [],
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
    >
      {pending ? "Enregistrement…" : label}
    </button>
  );
}

const field =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";
const labelCls = "block text-sm font-medium mb-1";

/** "Burger" handle (☰) used to drag-and-drop a row. */
function DragHandleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 4h12M2 8h12M2 12h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Sortable row: drag handle (☰) + content. `id` must be stable and unique
 * within the SortableContext. `className` carries the row's layout.
 */
function SortableRow({
  id,
  className,
  handleClassName,
  children,
}: {
  id: number;
  className: string;
  handleClassName?: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} className={className}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Glisser pour réordonner"
        className={`flex shrink-0 cursor-grab touch-none items-center justify-center text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-200 ${handleClassName ?? "h-9 w-6"}`}
      >
        <DragHandleIcon />
      </button>
      {children}
    </div>
  );
}

export function RecipeForm({
  action,
  defaultValues = EMPTY,
  submitLabel,
  ingredientOptions,
  unitOptions,
  utensilOptions,
  tagOptions,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  defaultValues?: RecipeFormValues;
  submitLabel: string;
  ingredientOptions: string[];
  unitOptions: string[];
  utensilOptions: string[];
  tagOptions: string[];
}) {
  const [state, formAction] = useActionState(action, { error: null });

  // Shared sensors (mouse/touch + keyboard for accessibility). A small
  // activation distance avoids triggering a sort on a plain click.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Ingredient rows managed in state (at least one visible row). The initial
  // keys are the index; the counter starts after that for subsequent additions.
  const initialRows = defaultValues.ingredients.length
    ? defaultValues.ingredients
    : [{ name: "", quantity: "", unit: "" }];
  const keyCounter = useRef(initialRows.length);
  const [rows, setRows] = useState<IngredientRow[]>(
    initialRows.map((r, i) => ({ key: i, ...r })),
  );

  const updateRow = (key: number, patch: Partial<IngredientRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((rs) => [
      ...rs,
      { key: keyCounter.current++, name: "", quantity: "", unit: "" },
    ]);
  const removeRow = (key: number) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs));
  const reorderRows = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setRows((rs) => {
      const from = rs.findIndex((r) => r.key === active.id);
      const to = rs.findIndex((r) => r.key === over.id);
      return from === -1 || to === -1 ? rs : arrayMove(rs, from, to);
    });
  };

  // Utensil rows (name + quantity), optional list (can be empty).
  const initialUtensils = defaultValues.utensils;
  const utensilKey = useRef(initialUtensils.length);
  const [utensils, setUtensils] = useState<UtensilRow[]>(
    initialUtensils.map((u, i) => ({ key: i, ...u })),
  );
  const updateUtensil = (key: number, patch: Partial<UtensilRow>) =>
    setUtensils((us) => us.map((u) => (u.key === key ? { ...u, ...patch } : u)));
  const addUtensil = () =>
    setUtensils((us) => [
      ...us,
      { key: utensilKey.current++, name: "", quantity: "" },
    ]);
  const removeUtensil = (key: number) =>
    setUtensils((us) => us.filter((u) => u.key !== key));
  const reorderUtensils = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setUtensils((us) => {
      const from = us.findIndex((u) => u.key === active.id);
      const to = us.findIndex((u) => u.key === over.id);
      return from === -1 || to === -1 ? us : arrayMove(us, from, to);
    });
  };

  // Step rows (Markdown), at least one visible.
  const initialSteps = defaultValues.steps.length ? defaultValues.steps : [""];
  const stepKey = useRef(initialSteps.length);
  const [steps, setSteps] = useState<StepRow[]>(
    initialSteps.map((value, i) => ({ key: i, value })),
  );
  const updateStep = (key: number, value: string) =>
    setSteps((ss) => ss.map((s) => (s.key === key ? { ...s, value } : s)));
  const addStep = () =>
    setSteps((ss) => [...ss, { key: stepKey.current++, value: "" }]);
  const removeStep = (key: number) =>
    setSteps((ss) => (ss.length > 1 ? ss.filter((s) => s.key !== key) : ss));
  const reorderSteps = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setSteps((ss) => {
      const from = ss.findIndex((s) => s.key === active.id);
      const to = ss.findIndex((s) => s.key === over.id);
      return from === -1 || to === -1 ? ss : arrayMove(ss, from, to);
    });
  };

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="title" className={labelCls}>
          Titre *
        </label>
        <input id="title" name="title" defaultValue={defaultValues.title} className={`${field} w-full`} required />
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaultValues.description}
          rows={2}
          className={`${field} w-full`}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="servings" className={labelCls}>
            Parts
          </label>
          <input id="servings" name="servings" type="number" min="0" defaultValue={defaultValues.servings} className={`${field} w-full`} />
        </div>
        <div>
          <label htmlFor="prepTime" className={labelCls}>
            Préparation (min)
          </label>
          <input id="prepTime" name="prepTime" type="number" min="0" defaultValue={defaultValues.prepTime} className={`${field} w-full`} />
        </div>
        <div>
          <label htmlFor="cookTime" className={labelCls}>
            Cuisson (min)
          </label>
          <input id="cookTime" name="cookTime" type="number" min="0" defaultValue={defaultValues.cookTime} className={`${field} w-full`} />
        </div>
      </div>

      {/* Ingredients: dynamic reorderable rows (handle · name · quantity · unit) */}
      <div>
        <span className={labelCls}>Ingrédients</span>
        <div className="flex flex-col gap-2">
          {/* Column headers (the initial w-6 space matches the handle) */}
          <div className="hidden gap-2 text-xs text-zinc-500 sm:flex">
            <span className="w-6" />
            <span className="flex-1">Ingrédient</span>
            <span className="w-24">Quantité</span>
            <span className="w-36">Unité</span>
            <span className="w-8" />
          </div>

          <DndContext
            id="dnd-ingredients"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={reorderRows}
          >
            <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
              {rows.map((row) => (
                <SortableRow key={row.key} id={row.key} className="flex flex-wrap items-center gap-2">
                  <input
                    name="ingredientName"
                    list="ingredient-options"
                    placeholder="ex. farine"
                    value={row.name}
                    onChange={(e) => updateRow(row.key, { name: e.target.value })}
                    className={`${field} min-w-40 flex-1`}
                    autoComplete="off"
                  />
                  <input
                    name="ingredientQuantity"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="250"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                    className={`${field} w-24`}
                  />
                  <input
                    name="ingredientUnit"
                    list="unit-options"
                    placeholder="g"
                    value={row.unit}
                    onChange={(e) => updateRow(row.key, { unit: e.target.value })}
                    className={`${field} w-36`}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    aria-label="Supprimer cette ligne"
                    className="flex h-9 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                  >
                    ✕
                  </button>
                </SortableRow>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-2 text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
        >
          + Ajouter un ingrédient
        </button>

        {/* Autocomplete suggestions (free creation allowed) */}
        <datalist id="ingredient-options">
          {ingredientOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <datalist id="unit-options">
          {unitOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </div>

      {/* Utensils: dynamic reorderable rows (handle · name · quantity) */}
      <div>
        <span className={labelCls}>
          Ustensiles <span className="text-zinc-500">(facultatif)</span>
        </span>
        <div className="flex flex-col gap-2">
          {utensils.length > 0 && (
            <div className="hidden gap-2 text-xs text-zinc-500 sm:flex">
              <span className="w-6" />
              <span className="flex-1">Ustensile</span>
              <span className="w-24">Quantité</span>
              <span className="w-8" />
            </div>
          )}

          <DndContext
            id="dnd-utensils"
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={reorderUtensils}
          >
            <SortableContext items={utensils.map((u) => u.key)} strategy={verticalListSortingStrategy}>
              {utensils.map((row) => (
                <SortableRow key={row.key} id={row.key} className="flex flex-wrap items-center gap-2">
                  <input
                    name="utensilName"
                    list="utensil-options"
                    placeholder="ex. moule à manqué 24 cm"
                    value={row.name}
                    onChange={(e) => updateUtensil(row.key, { name: e.target.value })}
                    className={`${field} min-w-40 flex-1`}
                    autoComplete="off"
                  />
                  <input
                    name="utensilQuantity"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="1"
                    value={row.quantity}
                    onChange={(e) => updateUtensil(row.key, { quantity: e.target.value })}
                    className={`${field} w-24`}
                  />
                  <button
                    type="button"
                    onClick={() => removeUtensil(row.key)}
                    aria-label="Supprimer cet ustensile"
                    className="flex h-9 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                  >
                    ✕
                  </button>
                </SortableRow>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <button
          type="button"
          onClick={addUtensil}
          className="mt-2 text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
        >
          + Ajouter un ustensile
        </button>

        <datalist id="utensil-options">
          {utensilOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </div>

      {/* Steps: dynamic reorderable rows, each step in Markdown */}
      <div>
        <span className={labelCls}>
          Étapes <span className="text-zinc-500">(Markdown · une étape par bloc)</span>
        </span>
        <DndContext
          id="dnd-steps"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={reorderSteps}
        >
          <SortableContext items={steps.map((s) => s.key)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {steps.map((step, i) => (
                <SortableRow
                  key={step.key}
                  id={step.key}
                  className="flex items-start gap-2"
                  handleClassName="mt-2 h-6 w-6"
                >
                  <span className="mt-2 w-4 shrink-0 text-sm tabular-nums text-zinc-400">
                    {i + 1}.
                  </span>
                  <StepEditor
                    name="step"
                    value={step.value}
                    onChange={(value) => updateStep(step.key, value)}
                    placeholder={`Étape ${i + 1}…`}
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(step.key)}
                    aria-label="Supprimer cette étape"
                    className="mt-1 flex h-9 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                  >
                    ✕
                  </button>
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <button
          type="button"
          onClick={addStep}
          className="mt-2 text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
        >
          + Ajouter une étape
        </button>
      </div>

      <div>
        <span className={labelCls}>Tags</span>
        <TagsCombobox name="tag" options={tagOptions} defaultValue={defaultValues.tags} />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton label={submitLabel} />
        <Link href="/recipes" className="text-sm text-zinc-500 hover:underline">
          Annuler
        </Link>
      </div>
    </form>
  );
}
