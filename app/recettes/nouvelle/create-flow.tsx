"use client";

import { useState } from "react";
import { Icon, type IconName } from "../../components/icons";
import { RecipeForm, type IngredientOption, type UnitOption } from "../recipe-form";
import type { FormState } from "../actions";

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

export function CreateFlow({
  initialMethod,
  ...formProps
}: FormProps & { initialMethod?: Method }) {
  const [method, setMethod] = useState<Method>(initialMethod ?? "choose");

  const select = (m: Method) => {
    setMethod(m);
    const url = m === "choose" ? "/recettes/nouvelle" : `/recettes/nouvelle?method=${m}`;
    window.history.replaceState(null, "", url);
  };

  if (method === "manual") {
    return (
      <>
        <button
          type="button"
          onClick={() => select("choose")}
          className="mb-5 inline-flex items-center gap-2 text-[15px] font-semibold text-ink-soft transition hover:text-accent"
        >
          <Icon name="back" size={18} /> Retour aux choix
        </button>
        <RecipeForm {...formProps} submitLabel="Publier la recette" />
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
          soon
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
