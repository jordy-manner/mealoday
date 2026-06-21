"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Icon, type IconName } from "../../components/icons";
import { RecipeForm, type IngredientOption, type RecipeFormValues, type UnitOption } from "../recipe-form";
import type { FormState } from "../actions";
import { extractRecipeFromUrl, extractRecipeFromImagesAction } from "../import-actions";

// Method picker shown before the recipe form: import from the web, scan a photo
// (Gemini), or fill it in by hand. Web import and manual entry are always live;
// photo scan is enabled only when a Gemini API key is configured (else the card
// is disabled). The selected method is mirrored to the URL (?method=).

type Method = "choose" | "manual" | "web" | "scan";

type FormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  ingredientOptions: IngredientOption[];
  unitOptions: UnitOption[];
  utensilOptions: string[];
  tagOptions: string[];
  categoryOptions: string[];
  unitTypeOptions: { id: string; name: string }[];
  servingUnitOptions: string[];
  mediaEnabled: boolean;
  /** Photo scan is available only when a Gemini key is configured. */
  scanEnabled: boolean;
};

function MethodCard({
  icon,
  title,
  desc,
  onClick,
  disabled,
  badge,
  accent,
}: {
  icon: IconName;
  title: string;
  desc: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
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
          {disabled && badge && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-faint">
              <Icon name="lock" size={10} /> {badge}
            </span>
          )}
        </b>
        <span className="text-[13px] text-ink-soft">{desc}</span>
      </span>
      {disabled ? (
        <Icon name="lock" size={16} className="shrink-0 text-ink-faint" />
      ) : (
        <Icon name="arrow" size={18} className="shrink-0 text-ink-faint" />
      )}
    </button>
  );
}

/** Downscales an image client-side (longest side ≤ max, JPEG) to keep the
 *  Server Action payload small and speed up the vision call. Falls back to the
 *  original file if the browser can't decode it (e.g. some HEIC). */
async function downscaleImage(file: File, max = 1600, quality = 0.8): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    // Already small enough and decoded: keep as-is.
    if (scale === 1 && file.size < 900_000) {
      bitmap.close?.();
      return file;
    }
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Photo-scan sub-step: import (or shoot on mobile) one or more photos, send them
 *  to Gemini (server-side) and prefill the form from the structured result. */
function ScanStep({
  onBack,
  onExtracted,
}: {
  onBack: () => void;
  onExtracted: (values: RecipeFormValues) => void;
}) {
  const [images, setImages] = useState<{ url: string; file: File }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
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

  const run = () => {
    if (!images.length || pending) return;
    setError(null);
    start(async () => {
      const fd = new FormData();
      for (const img of images) fd.append("image", await downscaleImage(img.file));
      const res = await extractRecipeFromImagesAction(fd);
      if (res.ok) onExtracted(res.values);
      else setError(res.error);
    });
  };

  return (
    <div className="max-w-2xl animate-fade-up">
      <BackToChoices onClick={onBack} />
      <h1 className="mb-2 font-display text-[clamp(24px,3vw,32px)] font-extrabold tracking-[-0.02em]">
        Scanner une recette
      </h1>
      <p className="mb-5 text-[15px] text-ink-soft">
        Importez une ou plusieurs photos (livre, fiche manuscrite…). La recette est lue et
        structurée par l&apos;IA, puis pré-remplie — tout reste modifiable ensuite.
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
          ? `${images.length} image${images.length > 1 ? "s" : ""} à analyser · envoyée${images.length > 1 ? "s" : ""} à Google (Gemini) pour analyse.`
          : "Importez la ou les photos de votre recette. L'image est envoyée à Google (Gemini) pour analyse."}
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
          disabled={!images.length || pending}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[15px] font-bold text-white shadow-card transition hover:bg-accent-deep disabled:opacity-60"
        >
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Analyse en cours…
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

/** Web-import sub-step: paste a URL → server-side extraction → prefilled form.
 *  An AI switch (Gemini) gives a cleaner field split; disabled without a key. */
function CrawlStep({
  onBack,
  onExtracted,
  aiAvailable,
}: {
  onBack: () => void;
  onExtracted: (values: RecipeFormValues) => void;
  aiAvailable: boolean;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [useAi, setUseAi] = useState(aiAvailable);
  const [pending, start] = useTransition();

  const run = () => {
    if (!url.trim() || pending) return;
    setError(null);
    start(async () => {
      const res = await extractRecipeFromUrl(url, useAi && aiAvailable);
      if (res.ok) onExtracted(res.values);
      else setError(res.error);
    });
  };

  return (
    <div className="max-w-2xl animate-fade-up">
      <BackToChoices onClick={onBack} />
      <h1 className="mb-2 font-display text-[clamp(24px,3vw,32px)] font-extrabold tracking-[-0.02em]">
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
      {/* AI switch: structure with Gemini (cleaner). Disabled without a key. */}
      <div className="mt-4 flex items-start justify-between gap-3 rounded-input border border-line bg-surface px-3.5 py-3">
        <div className="min-w-0">
          <span className="block text-[14px] font-semibold text-ink">Structurer avec l&apos;IA (Gemini)</span>
          <span className="block text-[12.5px] text-ink-soft">
            {aiAvailable
              ? "Meilleure répartition des champs. L'extrait de page est envoyé à Google."
              : "Clé API Gemini requise (Paramètres › Général)."}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useAi && aiAvailable}
          aria-label="Structurer avec l'IA"
          disabled={!aiAvailable}
          onClick={() => setUseAi((v) => !v)}
          className={
            "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 " +
            (useAi && aiAvailable ? "bg-accent" : "bg-surface-muted")
          }
        >
          <span
            className={
              "inline-block h-5 w-5 transform rounded-full bg-surface shadow-card transition " +
              (useAi && aiAvailable ? "translate-x-[22px]" : "translate-x-0.5")
            }
          />
        </button>
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
  scanEnabled,
  ...formProps
}: FormProps & { initialMethod?: Method }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Guard: a deep link to ?method=scan is ignored when scanning is disabled.
  const start: Method = initialMethod === "scan" && !scanEnabled ? "choose" : (initialMethod ?? "choose");
  const [method, setMethod] = useState<Method>(start);
  const [webValues, setWebValues] = useState<RecipeFormValues | null>(null);
  const [scanValues, setScanValues] = useState<RecipeFormValues | null>(null);

  // Reset to choose screen when the URL drops the ?method= param — happens when
  // the user clicks "+ Créer une recette" from the top-bar or tab-bar mid-flow.
  const urlMethod = searchParams.get("method");
  useEffect(() => {
    if (!urlMethod) {
      setMethod("choose");
      setWebValues(null);
      setScanValues(null);
    }
  }, [urlMethod]);

  const select = (m: Method) => {
    setMethod(m);
    if (m !== "web") setWebValues(null);
    if (m !== "scan") setScanValues(null);
    const url = m === "choose" ? "/recettes/nouvelle" : `/recettes/nouvelle?method=${m}`;
    router.replace(url);
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
      return <CrawlStep onBack={() => select("choose")} onExtracted={setWebValues} aiAvailable={scanEnabled} />;
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

  if (method === "scan" && scanEnabled) {
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
      <Link
        href="/recettes"
        className="mb-5 inline-flex items-center gap-2 text-[15px] font-semibold text-ink-soft transition hover:text-accent"
      >
        <Icon name="back" size={18} /> Retour
      </Link>
      <p className="eyebrow">Nouvelle recette</p>
      <h1 className="mb-2 mt-1 font-display text-[clamp(26px,3.4vw,38px)] font-extrabold tracking-[-0.02em]">
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
          desc={
            scanEnabled
              ? "Livre ou fiche manuscrite — lecture par l'IA (Gemini)."
              : "Nécessite une clé API Gemini (Paramètres › Général)."
          }
          disabled={!scanEnabled}
          badge="Clé requise"
          onClick={scanEnabled ? () => select("scan") : undefined}
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
