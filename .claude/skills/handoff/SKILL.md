---
name: handoff
description: Intégration d'un design handoff fourni dans .design/. À utiliser dès que l'utilisateur indique un « handoff » (ex. « handoff saisons », « fais le handoff notifications », « intègre ce handoff », « voici un nouveau handoff »). Localise le dossier .design/design_handoff_*, lit son README.md EN ENTIER, puis exécute le prompt « Prompt Claude Code (prêt à coller) » situé en fin de README. NE commence à coder qu'après avoir restitué le PLAN demandé par ce prompt.
---

# handoff — intégrer un design handoff

L'utilisateur prépare des maquettes/références visuelles dans le dossier **`.design/`** à la racine du projet. Chaque livraison est un sous-dossier **`design_handoff_<sujet>/`** qui contient une **`README.md`**. Le **README se termine par une section `## Prompt Claude Code (prêt à coller)`** : un bloc de code qui est **le brief d'implémentation rédigé pour toi**.

Quand l'utilisateur dit « **handoff** » (avec ou sans précision du sujet), c'est ce flux qu'il déclenche.

## Procédure

1. **Localiser le dossier.** Lister `.design/` et repérer les sous-dossiers `design_handoff_*`.

2. **Identifier le bon handoff :**
   - Si l'utilisateur précise un sujet (« handoff saisons », « notifications »…), faire correspondre au `design_handoff_*` le plus proche.
   - Si un seul handoff est ambigu/récent et qu'il n'a pas précisé, prendre le plus récemment modifié, mais **annoncer lequel** tu prends.
   - Si plusieurs correspondent et que c'est réellement ambigu, **demander lequel** avant de continuer.

3. **Lire le README EN ENTIER** (`design_handoff_<sujet>/README.md`) : contexte, tokens du thème, liste des fichiers de référence (`.html`, `.jsx`, `tailwind/`…). Ce sont des **références visuelles**, pas du code à recopier tel quel.

4. **Récupérer le prompt final.** Extraire le contenu du bloc sous `## Prompt Claude Code (prêt à coller)`. **C'est l'instruction qui fait foi** : suivre ses consignes (fichiers à lire, objectif, étapes numérotées, contraintes lint/build/CONTEXT/CHANGELOG…).

5. **Exécuter ce prompt.** Lire d'abord les fichiers qu'il demande (AGENTS.md, CONTEXT.md, sources concernées…). Comme la plupart de ces prompts se terminent par « Donne-moi d'abord un PLAN avant de coder », **présenter le PLAN et attendre la validation** avant d'écrire du code — sauf si le prompt dit explicitement le contraire.

## Règles

- **Tokens du thème uniquement**, **UI en français**, **commentaires/code en anglais** (conventions projet).
- Le handoff fournit le *quoi* visuel et fonctionnel ; l'intégration réelle se fait dans le code de l'app Next, pas dans `.design/` (qui reste une référence en lecture seule).
- Ne pas inventer de comportement absent du README/prompt : si une consigne manque, demander.
