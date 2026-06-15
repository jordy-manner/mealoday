"use client";

import { useState, useTransition } from "react";
import { Icon, type IconName } from "../../components/icons";
import { RecipeForm, type IngredientOption, type RecipeFormValues, type UnitOption } from "../recipe-form";
import type { FormState } from "../actions";
import { extractRecipeFromUrl } from "../import-actions";

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

  const select = (m: Method) => {
    setMethod(m);
    if (m !== "web") setWebValues(null);
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
          soon
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
