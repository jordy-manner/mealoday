# Déploiement Vercel

Stack : Next.js 16 · Prisma 7 · Neon (Postgres) · hébergement Vercel.

Le déploiement utilise l'**intégration Git native de Vercel** :

- push sur **`main`** → déploiement **Production**
- push sur une autre branche (ex. `v0.1`) → déploiement **Preview** (URL par branche/PR)

## Ce qui est déjà géré côté code

- `postinstall: prisma generate` → le client Prisma (gitignoré) est régénéré à chaque install.
- `vercel-build: prisma migrate deploy && next build` → Vercel applique les **migrations**
  puis build. (Le `build` local reste `next build`, non impacté.)
- `dotenv` est en dépendance directe (requis par `prisma.config.ts` au build).
- `APP_RELEASE` est dans le `.env` commité (= tag courant) → affiché dans le footer, rien à configurer.

## Variables d'environnement à définir dans Vercel

Dans **Project → Settings → Environment Variables**, définir `DATABASE_URL` **par environnement** :

| Environnement Vercel | `DATABASE_URL` = connection string de… |
| --- | --- |
| **Production** | branche Neon **production** (host `ep-fancy-dream-…`) |
| **Preview** | branche Neon **development** (host `ep-empty-cake-…`) |

> Récupérer les strings (pooled) dans le dashboard Neon → Branches → Connection string.
> Ne **jamais** les committer : elles ne vivent que dans Vercel (prod/preview) et `.env.local` (local).
> Ainsi les previews tapent la base dev, la prod tape la prod.

## Connexion du repo (action manuelle, une fois)

1. [vercel.com](https://vercel.com) → **Add New… → Project → Import Git Repository**.
2. Sélectionner **`jordy-manner/recipe-manager`** (autoriser l'accès GitHub si demandé).
3. Framework détecté : **Next.js** (laisser les réglages par défaut — `vercel-build` est pris en compte automatiquement).
4. Ajouter les variables d'environnement ci-dessus (au moins `DATABASE_URL` pour Production et Preview).
5. **Deploy**.

## Mode maintenance (« En construction »)

`proxy.ts` (ex-middleware Next 16) protège le site : quand **`APP_MAINTENANCE="true"`**, toute requête renvoie une **503** avec une page « En construction » (`noindex`, donc pas indexée par Google).

**Mettre la PROD en maintenance** (tant que l'app n'est pas prête) — dans Vercel, env **Production** uniquement :

| Variable | Valeur |
| --- | --- |
| `APP_MAINTENANCE` | `true` |
| `APP_MAINTENANCE_BYPASS` | un secret de ton choix (ex. chaîne aléatoire) |

Puis **redeploy** (l'env du proxy est résolu au build → toggler demande un redeploy).

- **Ne pas** définir `APP_MAINTENANCE` en **Preview** → le staging (`meal-preview`) reste ouvert pour bosser.
- **Bypass propriétaire** : visiter `https://meal.presstify.com/?unlock=<APP_MAINTENANCE_BYPASS>` → pose un cookie → tu vois le vrai site malgré la maintenance.
- **Lever la maintenance** au lancement : `APP_MAINTENANCE=false` (ou supprimer la variable) en Production → redeploy.

## Base de données

- La branche **production** contient déjà le schéma (4 migrations) + les 12 unités du seed
  (elle était la base d'origine avant le split dev/prod). `prisma migrate deploy` au build est **idempotent**.
- Pour (re)semer les unités sur une base donnée : `DATABASE_URL=<string> npm run seed`.

## Après le premier déploiement

- Vérifier le footer du site : `© <année> — Release: vX.Y.Z` (valeur d'`APP_RELEASE`).
- À chaque merge sur `main`, Vercel redéploie la prod et applique les migrations en attente.
