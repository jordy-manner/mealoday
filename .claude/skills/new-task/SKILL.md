---
name: new-task
description: Crée une nouvelle issue GitHub + branche + worktree pour une tâche (feat/fix/chore). À utiliser dès qu'on commence une nouvelle tâche (ex. « new-task », « nouvelle tâche », « crée une issue », « commence un fix »).
---

# new-task — nouvelle issue + branche + worktree

Workflow complet pour démarrer une tâche : issue GitHub → branche conventionnelle → worktree isolé.

## ⚠️ Règle absolue — rester sur v0.X dans main/

Le répertoire `main/` reste **toujours sur la branche de version** (`v0.X`). Le worktree de la nouvelle tâche est créé en **sibling** de `main/` dans `recipe-manager/`.

## Étapes

### 1. Collecter les informations

Poser ces questions via `AskUserQuestion` (toutes en une seule fois) :

- **Type** : `feat` / `fix` / `chore`
- **Port dev** : `3001` / `3002` / `3003` (port distinct pour ce worktree)

Puis demander en texte libre (deux questions séparées si AskUserQuestion ne permet pas l'input libre) :

- **Titre de l'issue** : phrase courte en français décrivant la tâche
- **Slug** : kebab-case court pour la branche et le dossier worktree (ex. `portion-stepper`, `auth-fix`)

### 2. Créer l'issue GitHub

```bash
gh issue create \
  --title "{titre}" \
  --body "{description courte de la tâche}" \
  --repo jordy-manner/recipe-manager
```

Récupérer le **numéro** retourné (ex. `#12`).

### 3. Construire le nom de branche

```
{type}/{numéro}-{slug}
```

Exemples :
- `feat/12-portion-stepper`
- `fix/1-season-select-all-month`
- `chore/7-cleanup-prisma-seed`

### 4. Créer la branche et la pousser

S'assurer d'être sur `v0.X` dans `main/` :

```bash
git checkout v0.X   # si pas déjà dessus
git checkout -b {type}/{numéro}-{slug}
git push -u origin {type}/{numéro}-{slug}
git checkout v0.X   # revenir sur la branche de version
```

### 5. Créer le worktree

Le worktree va en **sibling de `main/`**, donc dans `recipe-manager/` :

```bash
git worktree add ../{slug} {type}/{numéro}-{slug}
```

Résultat :
```
recipe-manager/
├── main/                          ← v0.X (toujours)
└── {slug}/                        ← fix/feat/chore branch
```

### 6. Rapport final

Afficher un récapitulatif :

```
✓ Issue     : #{numéro} — {titre}
✓ Branche   : {type}/{numéro}-{slug}
✓ Worktree  : ../recipe-manager/{slug}/
✓ Dev       : cd ../recipe-manager/{slug} && PORT={port} npm run dev
```

## Notes

- Ne jamais créer le worktree avec `../../{slug}` (sortirait de `recipe-manager/`).
- Si une branche du même nom existe déjà sur le remote, utiliser `git checkout --track origin/{branche}` au lieu de `-b`.
- Migrations Prisma : si un autre worktree a des migrations en cours, **signaler le conflit** avant de créer ce worktree.
