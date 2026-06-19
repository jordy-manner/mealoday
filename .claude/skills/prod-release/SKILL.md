---
name: prod-release
description: Promotion en PRODUCTION du projet. À utiliser quand on décide de livrer en prod (ex. « prod-release », « mets en prod », « livre en production », « release prod »). Merge la branche de version (vX.Y) dans `main` puis pousse `main`, ce qui déclenche le déploiement Production sur Vercel ; attend la fin du build Preview avant de merger et VÉRIFIE qu'un déploiement Production aboutit (sinon promotion du déploiement existant), jusqu'à ce que le footer prod = tag. Ne crée AUCUN commit (promotion d'un état déjà commité/taggé). Impose une validation explicite avant le push prod, quel que soit le mode de permission.
---

# prod-release — promotion en production

Met en **production** l'état courant de la branche de version. La prod (`main` → Vercel Production) est alimentée **délibérément**, jamais automatiquement à chaque commit.

Prérequis : le travail a été commité/taggé et poussé en Preview via la skill **`preview-release`**, et validé (idéalement testé sur l'URL Preview).

## ⚠️ Règle absolue — validation du déploiement prod

Quel que soit le mode de permission (`acceptEdits`, auto-accept, `bypassPermissions`), **NE JAMAIS pousser sur `main` sans une validation EXPLICITE de l'utilisateur dans le tour courant**. Le push sur `main` déclenche un déploiement **production**.

- Montrer ce qui va être promu : `git log --oneline main..<branche-version>` (commits que la prod va recevoir).
- Attendre un accord clair (« go », « prod », « livre »…).
- En l'absence de validation explicite → s'arrêter.

## ⚠️ Piège connu — déduplication Vercel (même SHA Preview puis Production)

`preview-release` pousse `vX.Y` → SHA `X` (build **Preview**), puis `prod-release` merge en `main` **le même SHA `X`**. Si le push `main` arrive **pendant** que le build Preview de `X` tourne encore, Vercel **déduplique** : il n'crée **aucun déploiement Production**, et l'alias prod reste sur l'ancienne version (le `git push main` réussit pourtant, et le statut GitHub passe « success » — pour le build Preview). Symptôme : `main` poussé + build « success » **mais le footer prod ne change pas**.

Parade (intégrée aux étapes) : **attendre la fin du build Preview du SHA avant de merger** (étape 3), puis **vérifier qu'un déploiement Production a bien été créé** (étape 7) et le **promouvoir** sinon. Une release n'est terminée que quand le **footer prod = tag**.

## Étapes

1. **Garde-fou identité (OBLIGATOIRE avant tout push).** `git config --local user.name "jordy-manner"` et `git config --local user.email "jordy.manner@milkcreation.fr"`.
2. **Vérifier l'état.** Être sur la branche de version, working tree propre (sinon faire d'abord `preview-release`). Mémoriser le SHA (`git rev-parse <branche-version>`) et l'URL prod (`gh repo view jordy-manner/mealoday --json homepageUrl -q .homepageUrl`). Lister les commits à promouvoir : `git log --oneline main..<branche-version>` et les tags concernés.
3. **Anti-déduplication : attendre la fin du build Preview du SHA.** Avant de merger, s'assurer que le déploiement **Preview** du SHA est **terminé** (pas « in progress »), pour que le push `main` déclenche son propre build Production :
   ```bash
   sha=$(git rev-parse <branche-version>)
   for i in $(seq 1 40); do
     s=$(gh api "repos/jordy-manner/mealoday/deployments?sha=$sha&environment=Preview&per_page=1" --jq '.[0].id' 2>/dev/null)
     [ -n "$s" ] && st=$(gh api "repos/jordy-manner/mealoday/deployments/$s/statuses?per_page=1" --jq '.[0].state' 2>/dev/null)
     echo "preview state: ${st:-pending}"; [ "$st" = success ] || [ "$st" = failure ] || [ "$st" = error ] && break; sleep 15
   done
   ```
4. **Demander validation** (cf. règle absolue) : présenter les commits/tags qui partiront en prod.
5. **Merge dans `main`** (uniquement après validation) : `git checkout main` puis `git merge <branche-version> --ff-only`.
6. **Push `main` → Production.** `git push origin main`, puis `git push origin --tags` (pour publier les tags promus). Ce push déclenche normalement le déploiement **Production** Vercel.
7. **Vérifier qu'un déploiement Production existe pour le SHA** (sinon : déduplication). Attendre qu'un déploiement `environment=Production` du SHA apparaisse et passe `success` :
   ```bash
   for i in $(seq 1 24); do
     gh api "repos/jordy-manner/mealoday/deployments?sha=$sha&environment=Production&per_page=1" --jq '.[0].id' 2>/dev/null | grep -q . && break
     echo "pas encore de déploiement Production…"; sleep 15
   done
   ```
   **Si aucun déploiement Production n'apparaît** (≈6 min) → **promouvoir le déploiement Preview existant** en Production :
   - Dashboard Vercel → projet `mealoday` → Deployments → déploiement du SHA → **⋯ → Promote to Production** ; **ou** `vercel promote <url-preview>` si le CLI Vercel est authentifié.
   - L'URL Preview du SHA : `gh api "repos/jordy-manner/mealoday/deployments?sha=$sha&environment=Preview&per_page=1" --jq '.[0].id'` puis `…/statuses` (`environment_url`).
8. **Vérifier le footer prod (OBLIGATOIRE).** La release n'est **pas** terminée tant que le footer prod ≠ tag :
   ```bash
   PROD=$(gh repo view jordy-manner/mealoday --json homepageUrl -q .homepageUrl)
   curl -s "$PROD/?cb=$(date +%s)" | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' | sort -u | tail -1   # doit == vX.Y.Z
   ```
   Si ≠ tag → revenir à l'étape 7 (promotion).
9. **Revenir sur la branche de version** : `git checkout <branche-version>`. Toujours **finir** sur la branche de version.

> Remote `origin` = repo public `jordy-manner/mealoday` en **HTTPS** (jeton `gh`). Merge en **fast-forward** (`--ff-only`) : `main` avance jusqu'au HEAD de la branche de version. Pas de force-push en temps normal. Les commandes `gh api …/deployments` lisent les déploiements Vercel via l'intégration GitHub (aucun token Vercel requis pour la *vérification* ; la *promotion* manuelle se fait au dashboard ou via `vercel` CLI authentifié).

## Rappel modèle de déploiement

- `preview-release` (quotidien) → push branche de version → **Preview** (base Neon dev).
- `prod-release` (ponctuel, ici) → merge + push `main` → **Production** (base Neon prod), **vérifié** (étapes 7–8).
- `APP_RELEASE` (donc le footer) reflète le tag : la prod affiche le dernier `vX.Y.Z` promu.
