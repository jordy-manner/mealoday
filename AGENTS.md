<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Design system

`DESIGN.md` (repo root) is the **single source of truth** for the visual system
("Gourmand Arrondi · Jaune Vintage"): colours, typography, spacing/radii/shadows,
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

# Development workflow

## One task = one issue = one branch = one worktree

Before starting any work, verify a **GitHub issue** exists for the task — create one if not. Branch naming:

```
feat/{number}-{short-slug}   ← new feature
fix/{number}-{short-slug}    ← bug fix
chore/{number}-{short-slug}  ← maintenance / refactor
```

## Worktrees

Multiple tasks run in parallel across multiple Claude windows, each in its own worktree:

```bash
git worktree add ../{folder-name} {branch-name}
# then in that worktree:
PORT=300X npm run dev
```

Never work directly on `main`.

## Atomic commits

Every commit must:
- Cover a single intention
- Reference the issue: `feat: add portion stepper refs #42`
- Use `closes #XX` in the **last** commit of a feature branch

## Prisma migrations

If two active worktrees both have pending migrations, **flag it before creating a new one**. Migrations must be sequenced to avoid conflicts.

## End of task

1. Update `CONTEXT.md` if the data model, routes, architecture, or conventions changed
2. Run `npm run check:design` to validate token consistency
3. Open a Pull Request referencing the issue
4. After merge → `git worktree remove {path}`
