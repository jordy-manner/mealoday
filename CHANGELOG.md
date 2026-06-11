# Changelog

All notable changes to the project, by release. Versions follow the `vMAJOR.MINOR.PATCH` format; each release maps to a git tag and a Vercel Preview/Production deployment.

## [v0.1.14] — 2026-06-11

- Switched all code comments and this `CHANGELOG.md` to English (UI text and seed data remain in French).
- `preview-release` skill now requires updating the `CHANGELOG.md` (in English) on every release.

## [v0.1.13] — 2026-06-10

- Added this `CHANGELOG.md` summarizing changes by release.
- Fix: stable `id` on each drag-and-drop zone to remove a React hydration mismatch.

## [v0.1.12] — 2026-06-10

- Kitchen utensils management: many-to-many relation `Recipe`↔`Utensil` (`RecipeUtensil` join model carrying quantity and position).
- Prefilled utensil catalog (basic utensils + size variants by diameter: cake pans, saucepans, frying pans, crêpe pans…).
- Reorderable input in the form, display on the detail page, support in Server Actions and the REST API.

## [v0.1.11] — 2026-06-10

- Reordering of ingredients and steps via drag-and-drop (burger handle ☰), with mouse, touch, and keyboard support.

## [v0.1.10] — 2026-06-10

- Markdown steps: dedicated per-step editor (toolbar on focus) and rich rendering.

## [v0.1.9] — 2026-06-10

- More tolerant maintenance mode, cleanup, and removal of the `.claude` folder from the repository.

## [v0.1.8] — 2026-06-10

- Maintenance mode (`proxy.ts`) with owner bypass.

## [v0.1.7] — 2026-06-10

- Decoupled commit / deployment via the `preview-release` (Preview) and `prod-release` (Production) skills.

## [v0.1.6] — 2026-06-10

- Vercel deployment preparation and tooling adjustments.

## [v0.1.5] — 2026-06-10

- Display of the app version in the footer (`APP_RELEASE`).

## [v0.1.4] — 2026-06-09

- Tags field with autocomplete (Headless UI Combobox).

## [v0.1.3] — 2026-06-09

- Structured ingredients: `Ingredient` / `Unit` catalogs with quantity.

## [v0.1.2] — 2026-06-09

- Versioned commit skill; exclusion of `settings.local.json`.

## [v0.1.1] — 2026-06-09

- Ingredients and tags as dedicated tables.

## [v0.1.0] — 2026-06-09

- Recipe CRUD.

## [v0.0.0] — 2026-06-09

- Application bootstrap and database setup.
