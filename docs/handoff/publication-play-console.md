# HANDOFF DEVAN — Publication Google Play Console (5 applications)

## Objectif

Vérifier l'état réel de chaque fiche Google Play (`grandpublic`, `pro`,
`command`, `intelligence`), créer la nouvelle fiche `investor`, et importer
les `.aab` signés une fois disponibles (voir
`docs/handoff/signature-production.md`).

## Pourquoi je ne peux pas l'exécuter

Aucun accès à Google Play Console (aucune session, aucune clé API Play
Developer) n'est disponible dans l'environnement où ce code a été construit.
Je ne peux ni lire ni modifier l'état réel des fiches existantes — le
tableau ci-dessous ne contient donc que des faits vérifiables depuis le
code, jamais un statut Play deviné.

## Ce qui est déjà terminé

- Voir `docs/handoff/google-play-preparation.md` pour le tableau de
  contrôle complet (package, versionCode, versionName, API, état de build).
- `mobile/variants.json` contient les 5 applications avec un
  `applicationId` unique chacune, vérifié sans collision.
- Description technique de chaque application déjà rédigée dans
  `mobile/variants.json` (champ `description`) — utilisable comme base
  pour la fiche Play, mais la direction doit valider le texte marketing
  final avant publication (je n'invente aucun texte commercial).

## Ce que Devan doit faire

1. Se connecter à Google Play Console avec le compte développeur MKA.P-MS.
2. Pour chacune de `grandpublic`, `pro`, `command`, `intelligence` :
   a. Rechercher la fiche par `applicationId` (voir tableau).
   b. Noter : la fiche existe-t-elle déjà ? Sous quel nom ? Quel est le
      dernier `versionCode` publié ? Sur quel track (interne / test fermé /
      test ouvert / production) ? Y a-t-il des alertes actives (API cible
      expirée, permissions non justifiées, politique non respectée) ?
   c. Compléter le tableau de `docs/handoff/google-play-preparation.md`
      avec ces réponses réelles.
3. Pour `investor` (`com.mkapms.investor`) : créer une **nouvelle**
   application dans Play Console — jamais dans la fiche existante de
   `intelligence`, `command`, `pro` ou `grandpublic`.
   a. Renseigner nom, description courte/longue, catégorie — en attente de
      validation direction/marketing avant publication (voir « ce qui
      manque » dans `google-play-preparation.md`).
   b. Renseigner la politique de confidentialité (URL) une fois fournie
      par la direction/le service juridique.
4. Une fois chaque `.aab` signé disponible (`mobile/dist/`), l'importer sur
   le track choisi (commencer par un track interne/fermé pour `investor`,
   nouvelle application, avant toute mise en production).
5. Soumettre la release et suivre sa validation dans Play Console.

## Application concernée

Les 5 : `com.mkapms.app` (grandpublic), `com.mkapms.pro`,
`com.mkapms.command`, `com.mkapms.intelligence`, `com.mkapms.investor`
(nouvelle).

## Fichier à utiliser

`.aab` signés produits selon `docs/handoff/signature-production.md`, dans
`mobile/dist/com.mkapms.<app|pro|command|intelligence|investor>.aab`.

## Valeurs attendues

Voir le tableau dans `docs/handoff/google-play-preparation.md` —
`versionCode` 10705, `targetSdkVersion` 36 pour les 5 applications.

## Contrôles après action

- Play Console affiche le nouveau `versionCode` (10705 ou supérieur) sur le
  track choisi, sans alerte de conformité API (36 est une cible à jour).
- L'application `investor` apparaît comme une fiche **distincte** des 4
  autres dans la liste des applications du compte développeur.
- Les 4 fiches existantes ne montrent aucune régression (nom, icône,
  description inchangés) après l'import du nouvel `.aab`.

## Ce qu'il ne doit surtout pas faire

- **Ne jamais supprimer une fiche existante** ni son historique de
  versions.
- **Ne jamais publier `investor` en production directement** — passer par
  un track de test (interne ou fermé) d'abord, c'est une toute nouvelle
  application sans historique.
- **Ne jamais changer le `applicationId`** d'une fiche existante pour
  résoudre un problème d'import.
- **Ne jamais remplir la description, la catégorie ou la politique de
  confidentialité avec un texte inventé** — attendre la validation de la
  direction si elle n'a pas encore fourni ces éléments.
