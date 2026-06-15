"use client";

import { useRef, useState, useTransition } from "react";
import { Icon, type IconName } from "../../components/icons";
import {
  EMPTY_RECIPE_VALUES,
  RecipeForm,
  type IngredientOption,
  type RecipeFormValues,
  type UnitOption,
} from "../recipe-form";
import type { FormState } from "../actions";
import { extractRecipeFromUrl } from "../import-actions";
import { parseIngredientLine } from "@/lib/recipe-parse";

/** Splits raw OCR text into a recipe (heuristic; fields stay editable). The first
 *  line is the title; lines with a leading quantity or short label are ingredients,
 *  longer sentences are steps. Source defaults to "Photo importée". */
function parseOcrText(text: string): RecipeFormValues {
  const values: RecipeFormValues = { ...EMPTY_RECIPE_VALUES };
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (!lines.length) return values;

  values.title = lines[0];
  const hasQty = (l: string) =>
    /^([0-9]+(?:[.,][0-9]+)?(?:\s*\/\s*[0-9]+)?|[½¼¾⅓⅔])\b/.test(l);
  const ings: string[] = [];
  const steps: string[] = [];
  for (const l of lines.slice(1)) {
    const words = l.split(/\s+/).length;
    if (hasQty(l) || (words <= 5 && !/[.!?]$/.test(l))) ings.push(l);
    else steps.push(l);
  }
  values.ingredients = ings.map((l) => ({ ...parseIngredientLine(l), isPrimary: false }));
  values.steps = steps;
  values.sources = ["Photo importée"];
  return values;
}

/** OCR scan sub-step: import (or shoot on mobile) one or more photos, run
 *  Tesseract client-side (fra+eng, the image never leaves the device), then
 *  parse the recognized text into a prefilled recipe. */
function ScanStep({
  onBack,
  onExtracted,
}: {
  onBack: () => void;
  onExtracted: (values: RecipeFormValues) => void;
}) {
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [progress, setProgress] = useState<number | null>(null); // null = idle
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    setImages((xs) => [...xs, ...files.map((file) => ({ url: URL.createObjectURL(file), file }))]);
    e.target.value = "";
  };
  const removeImage = (i: number) =>
    setImages((xs) => {
      URL.revokeObjectURL(xs[i]?.url);
      return xs.filter((_, x) => x !== i);
    });

  const run = async () => {
    if (!images.length || progress !== null) return;
    setError(null);
    setProgress(0);
    try {
      const { createWorker } = await import("tesseract.js");
      const total = images.length;
      const done = { count: 0 };
      const worker = await createWorker("fra+eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(((done.count + m.progress) / total) * 100));
          }
        },
      });
      let text = "";
      for (const img of images) {
        const { data } = await worker.recognize(img.file);
        text += data.text + "\n";
        done.count += 1;
        setProgress(Math.round((done.count / total) * 100));
      }
      await worker.terminate();
      onExtracted(parseOcrText(text));
    } catch {
      setError("La reconnaissance a échoué. Réessayez ou saisissez la recette à la main.");
      setProgress(null);
    }
  };

  const busy = progress !== null;

  return (
    <div className="max-w-2xl animate-fade-up">
      <BackToChoices onClick={onBack} />
      <h1 className="mb-2 font-display text-[clamp(24px,3vw,32px)] font-medium tracking-[-0.02em]">
        Scanner une recette
      </h1>
      <p className="mb-5 text-[15px] text-ink-soft">
        Importez une ou plusieurs photos (livre, fiche manuscrite…). Le texte est reconnu sur votre
        appareil puis structuré en recette. Tout reste modifiable ensuite.
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
        {images.map((img, i) => (
          <div key={img.url} className="relative aspect-square overflow-hidden rounded-input border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              aria-label="Supprimer l'image"
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/55 text-surface transition hover:bg-ink"
            >
              <Icon name="x" size={13} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-input border-2 border-dashed border-line text-center text-ink-faint transition hover:border-accent hover:bg-accent-soft"
        >
          <Icon name="image" size={22} />
          <span className="text-[12px]">Importer</span>
        </button>
        {/* Mobile camera capture (native). Hidden on desktop where there's no camera. */}
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-input border-2 border-dashed border-line text-center text-ink-faint transition hover:border-accent hover:bg-accent-soft sm:hidden"
        >
          <Icon name="camera" size={22} />
          <span className="text-[12px]">Photo</span>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addFiles} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={addFiles} />

      <p className="mt-3 text-[13px] text-ink-faint">
        {images.length
          ? `${images.length} image${images.length > 1 ? "s" : ""} à analyser`
          : "Importez la ou les photos de votre recette — reconnaissance par Tesseract."}
      </p>

      {error && (
        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-input bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent-ink">
          <Icon name="alert" size={14} /> {error}
        </p>
      )}

      <div className="mt-5">
        <button
          type="button"
          onClick={run}
          disabled={!images.length || busy}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[15px] font-bold text-white shadow-card transition hover:bg-accent-deep disabled:opacity-60"
        >
          {busy ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Lecture du texte… {progress}%
            </>
          ) : (
            <>
              <Icon name="image" size={17} /> Analyser {images.length || ""}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Method picker shown before the recipe form: import from the web, scan a photo
// (OCR), or fill it in by hand. Stage 1 wires the chooser + manual entry; the
// web-crawl and OCR sub-steps land in later v0.3 releases (cards disabled
// "Bientôt" until then). Selected method is mirrored to the URL (?method=).

type Method = "choose" | "manual" | "web" | "scan";

type FormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  ingredientOptions: IngredientOption[];
  unitOptions: UnitOption[];
  utensilOptions: string[];
  tagOptions: string[];
  categoryOptions: string[];
  unitTypeOptions: { id: string; name: string }[];
  mediaEnabled: boolean;
};

function MethodCard({
  icon,
  title,
  desc,
  onClick,
  soon,
  accent,
}: {
  icon: IconName;
  title: string;
  desc: string;
  onClick?: () => void;
  soon?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={soon}
      onClick={onClick}
      className={
        "flex w-full items-center gap-4 rounded-card border p-4 text-left transition disabled:cursor-default disabled:opacity-60 " +
        (accent
          ? "border-accent bg-accent-soft/40 hover:bg-accent-soft"
          : "border-line bg-surface hover:bg-surface-muted")
      }
    >
      <span
        className={
          "grid h-12 w-12 shrink-0 place-items-center rounded-input " +
          (accent ? "bg-accent text-white" : "bg-surface-muted text-ink-soft")
        }
      >
        <Icon name={icon} size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <b className="flex items-center gap-2 text-[15px] font-bold text-ink">
          {title}
          {soon && (
            <span className="rounded-full bg-surface-muted px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-faint">
              Bientôt
            </span>
          )}
        </b>
        <span className="text-[13px] text-ink-soft">{desc}</span>
      </span>
      {!soon && <Icon name="arrow" size={18} className="shrink-0 text-ink-faint" />}
    </button>
  );
}

function BackToChoices({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-2 text-[15px] font-semibold text-ink-soft transition hover:text-accent"
    >
      <Icon name="back" size={18} /> Retour aux choix
    </button>
  );
}

/** Web-import sub-step: paste a URL → server-side extraction → prefilled form. */
function CrawlStep({
  onBack,
  onExtracted,
}: {
  onBack: () => void;
  onExtracted: (values: RecipeFormValues) => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = () => {
    if (!url.trim() || pending) return;
    setError(null);
    start(async () => {
      const res = await extractRecipeFromUrl(url);
      if (res.ok) onExtracted(res.values);
      else setError(res.error);
    });
  };

  return (
    <div className="max-w-2xl animate-fade-up">
      <BackToChoices onClick={onBack} />
      <h1 className="mb-2 font-display text-[clamp(24px,3vw,32px)] font-medium tracking-[-0.02em]">
        Importer depuis le web
      </h1>
      <p className="mb-5 text-[15px] text-ink-soft">
        Collez l&apos;adresse d&apos;une recette en ligne. On extrait le titre, les ingrédients et
        les étapes — la source est conservée. Tout reste modifiable ensuite.
      </p>
      <div className="flex items-center gap-2 rounded-input border border-line bg-surface px-3 py-2.5 focus-within:border-accent">
        <Icon name="globe" size={18} className="shrink-0 text-ink-faint" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="https://un-site-de-cuisine.fr/ma-recette"
          inputMode="url"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-faint"
        />
      </div>
      {error && (
        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-input bg-accent-soft px-3 py-1.5 text-[13px] font-semibold text-accent-ink">
          <Icon name="alert" size={14} /> {error}
        </p>
      )}
      <div className="mt-5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={run}
          disabled={!url.trim() || pending}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[15px] font-bold text-white shadow-card transition hover:bg-accent-deep disabled:opacity-60"
        >
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Extraction…
            </>
          ) : (
            <>
              <Icon name="search" size={17} /> Extraire la recette
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function CreateFlow({
  initialMethod,
  ...formProps
}: FormProps & { initialMethod?: Method }) {
  const [method, setMethod] = useState<Method>(initialMethod ?? "choose");
  const [webValues, setWebValues] = useState<RecipeFormValues | null>(null);
  const [scanValues, setScanValues] = useState<RecipeFormValues | null>(null);

  const select = (m: Method) => {
    setMethod(m);
    if (m !== "web") setWebValues(null);
    if (m !== "scan") setScanValues(null);
    const url = m === "choose" ? "/recettes/nouvelle" : `/recettes/nouvelle?method=${m}`;
    window.history.replaceState(null, "", url);
  };

  if (method === "manual") {
    return (
      <>
        <BackToChoices onClick={() => select("choose")} />
        <RecipeForm {...formProps} submitLabel="Publier la recette" />
      </>
    );
  }

  if (method === "web") {
    if (!webValues) {
      return <CrawlStep onBack={() => select("choose")} onExtracted={setWebValues} />;
    }
    return (
      <>
        <BackToChoices onClick={() => select("choose")} />
        <RecipeForm
          {...formProps}
          submitLabel="Publier la recette"
          defaultValues={webValues}
          sourcePrefilled
        />
      </>
    );
  }

  if (method === "scan") {
    if (!scanValues) {
      return <ScanStep onBack={() => select("choose")} onExtracted={setScanValues} />;
    }
    return (
      <>
        <BackToChoices onClick={() => select("choose")} />
        <RecipeForm
          {...formProps}
          submitLabel="Publier la recette"
          defaultValues={scanValues}
          sourcePrefilled
        />
      </>
    );
  }

  return (
    <div className="animate-fade-up">
      <p className="eyebrow">Nouvelle recette</p>
      <h1 className="mb-2 mt-1 font-display text-[clamp(26px,3.4vw,38px)] font-medium tracking-[-0.02em]">
        Comment ajouter votre recette ?
      </h1>
      <p className="mb-7 text-[15px] text-ink-soft">
        Partez d&apos;une page web, d&apos;une photo à scanner, ou saisissez tout à la main.
      </p>
      <div className="flex max-w-2xl flex-col gap-3">
        <MethodCard
          icon="globe"
          title="Importer depuis le web"
          desc="Coller l'URL d'une recette en ligne — extraction automatique."
          onClick={() => select("web")}
        />
        <MethodCard
          icon="camera"
          title="Scanner une photo"
          desc="Livre ou fiche manuscrite — reconnaissance de texte (OCR)."
          onClick={() => select("scan")}
        />
        <MethodCard
          icon="plus"
          title="Saisie manuelle"
          desc="Remplir le formulaire vous-même."
          accent
          onClick={() => select("manual")}
        />
      </div>
    </div>
  );
}
