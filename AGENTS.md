<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design system

`DESIGN.md` (repo root) is the **single source of truth** for the visual system
("Gourmand Arrondi · Terracotta"): colours, typography, spacing/radii/shadows,
themes, accents, components, tone. Read it before any UI work. **Never hardcode
colours/typography** — always use the theme tokens (`bg-surface`, `text-ink-soft`,
`rounded-card`, `shadow-card`, `text-carbon-*`…) generated from the `@theme` in
`app/globals.css`.

**Token sync rule (mandatory):** any change to a design token must be applied **in
the same change** to (a) `DESIGN.md` and (b) the `@theme` in `app/globals.css`
(plus `app/components/theme.ts` for the dark theme / alternate accents). The
running CSS is the source; `DESIGN.md` mirrors it. `npm run check:design` enforces
this (parses the hex/values of DESIGN.md §2/§4, fails on any divergence) and is
wired into `vercel-build`, so a drift breaks the deploy.
