# Changelog

Toutes les évolutions notables du projet, par release. Versions au format `vMAJEUR.MINEUR.CORRECTIF` ; chaque release correspond à un tag git et à un déploiement Preview/Production Vercel.

## [v0.1.13] — 2026-06-10

- Ajout de ce `CHANGELOG.md` récapitulant les évolutions par release.
- Correctif : `id` stable sur chaque zone de glisser-déposer pour supprimer un mismatch d'hydratation React.

## [v0.1.12] — 2026-06-10

- Gestion des ustensiles de cuisine : relation many-to-many `Recipe`↔`Utensil` (jonction `RecipeUtensil` avec quantité et position).
- Catalogue d'ustensiles prérempli (ustensiles de base + déclinaisons par diamètre : moules, casseroles, poêles, crêpières…).
- Saisie réordonnable dans le formulaire, affichage en page détail, prise en charge dans les Server Actions et l'API REST.

## [v0.1.11] — 2026-06-10

- Réordonnancement des ingrédients et des étapes par glisser-déposer (poignée « burger » ☰), à la souris, au tactile et au clavier.

## [v0.1.10] — 2026-06-10

- Étapes en Markdown : éditeur dédié par étape (barre d'outils au focus) et rendu enrichi.

## [v0.1.9] — 2026-06-10

- Mode maintenance plus tolérant, nettoyage et sortie du dossier `.claude` du dépôt.

## [v0.1.8] — 2026-06-10

- Mode maintenance (`proxy.ts`) avec bypass propriétaire.

## [v0.1.7] — 2026-06-10

- Découplage commit / déploiement via les skills `preview-release` (Preview) et `prod-release` (Production).

## [v0.1.6] — 2026-06-10

- Préparation du déploiement Vercel et ajustements de l'outillage.

## [v0.1.5] — 2026-06-10

- Affichage de la version dans le pied de page (`APP_RELEASE`).

## [v0.1.4] — 2026-06-09

- Champ tags en autocomplétion (Headless UI Combobox).

## [v0.1.3] — 2026-06-09

- Ingrédients structurés : catalogues `Ingredient` / `Unit` avec quantité.

## [v0.1.2] — 2026-06-09

- Skill de commit versionné ; exclusion de `settings.local.json`.

## [v0.1.1] — 2026-06-09

- Ingrédients et tags en tables dédiées.

## [v0.1.0] — 2026-06-09

- CRUD des recettes.

## [v0.0.0] — 2026-06-09

- Initialisation de l'application et configuration de la base de données.
