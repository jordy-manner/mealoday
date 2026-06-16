import type { Metadata } from "next";
import { pexelsConfigured, geminiConfigured } from "@/lib/settings";
import { ApiKeyForm } from "../_general-form";
import { savePexelsKey, saveGeminiKey } from "../settings-actions";

export const metadata: Metadata = { title: "Général" };
export const dynamic = "force-dynamic";

export default async function GeneralPage() {
  const [pexels, gemini] = await Promise.all([pexelsConfigured(), geminiConfigured()]);

  return (
    <section className="animate-fade-up">
      <header className="mb-5">
        <h1 className="font-display text-2xl text-ink">Général</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Clés d’API et réglages globaux de l’application.
        </p>
      </header>

      <div className="space-y-4">
        <ApiKeyForm
          configured={pexels}
          icon="key"
          title="Clé API Pexels"
          description="Photos automatiques des recettes et des produits de saison."
          placeholder="Collez votre clé Pexels"
          save={savePexelsKey}
        />
        <ApiKeyForm
          configured={gemini}
          icon="sparkle"
          title="Clé API Gemini"
          description="Scan de recettes par photo (lecture et structuration par l’IA)."
          placeholder="Collez votre clé Gemini"
          save={saveGeminiKey}
        />
      </div>
    </section>
  );
}
