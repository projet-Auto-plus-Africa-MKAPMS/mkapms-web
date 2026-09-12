# HANDOFF DEVAN — Rapport d'historique véhicule (accidents, vol, gage, entretiens)

## Objectif

Permettre à l'écran `/acheter/historique-vehicule` (`client/src/pages/HistoriqueVehiculeVente.tsx`)
d'afficher un vrai rapport d'historique par VIN/immatriculation : sinistres
déclarés, déclaration de vol, gage ou opposition, carnet d'entretien,
nombre de propriétaires successifs.

## Pourquoi je ne peux pas l'exécuter

Aucune de ces informations n'existe dans une base de données accessible
depuis ce dépôt ou cet environnement de travail : elles vivent chez des
tiers (assureurs, fichier des véhicules gagés/volés — FVA/FNI en France,
constructeurs pour le carnet d'entretien officiel, HistoVec pour le
contrôle technique et les propriétaires successifs). Chacun de ces
registres exige un contrat commercial, une habilitation, une clé d'API et
souvent une facturation à l'appel — aucun de ces accès n'est présent ici,
et je ne dois inventer ni les données ni le fait qu'elles seraient
vérifiées.

## Ce qui est déjà terminé

- L'écran identifie réellement un véhicule par VIN ou immatriculation via
  `trpc.annonces.lookupPlate` (déjà en production, utilisé aussi par
  `client/src/pages/Devis.tsx`) — marque, modèle, année, carburant, boîte,
  puissance.
- L'écran affiche désormais une divulgation honnête plutôt qu'un faux
  rapport : il dit précisément ce qui est vérifié (les données techniques)
  et ce qui ne l'est pas (sinistres, vol, gage, entretiens, propriétaires),
  et pourquoi.
- L'ancienne version affichait un rapport 100 % fictif et identique pour
  n'importe quelle plaque/VIN saisi (toujours « aucun sinistre », « non
  gagé », « non volé ») — un risque de confiance direct pour un acheteur
  qui s'en serait servi pour décider d'un achat. Ce comportement a été
  supprimé, pas seulement amélioré.

## Ce que Devan doit faire

1. Choisir le(s) fournisseur(s) à intégrer selon les pays couverts. Pour la
   France : HistoVec (service public, nécessite une convention/habilitation
   pour un usage professionnel au-delà de la consultation manuelle) pour le
   contrôle technique et les changements de propriétaire ; un accès au
   fichier des véhicules gagés (FVA) et volés passe généralement par un
   partenaire agréé (ex. AAA Data, SIV Auto, ou équivalent) plutôt qu'un
   accès direct.
2. Une fois un contrat et une clé d'API obtenus, ajouter la clé comme
   variable d'environnement serveur (jamais commitée) et créer un service
   dédié, par exemple `server/vehicle-history/service.ts`, qui appelle le(s)
   fournisseur(s) et retourne un rapport structuré (mêmes rubriques que
   celles déjà affichées à l'écran : sinistres, vol, gage, entretiens,
   propriétaires) — chaque rubrique doit porter la source et la date de
   consultation, jamais une valeur silencieuse.
3. Exposer ce service via une procédure tRPC (ex.
   `vehicleHistory.rapport`), appelée depuis
   `HistoriqueVehiculeVente.tsx` à la place du bloc de divulgation actuel.
4. Si un ou plusieurs fournisseurs restent indisponibles (pas de contrat
   pour le gage, par exemple), le rapport doit continuer à dire
   explicitement quelles rubriques manquent — ne jamais afficher une
   rubrique non vérifiée comme si elle valait « aucun incident ».

## Application concernée

Particulier (achat) — `/acheter/historique-vehicule`.

## Fichier à utiliser

`client/src/pages/HistoriqueVehiculeVente.tsx` (écran), nouveau
`server/vehicle-history/service.ts` + routeur tRPC à créer (backend).

## Valeurs attendues

Clé(s) d'API des fournisseurs choisis, en variable d'environnement serveur
uniquement (jamais dans le dépôt, jamais dans un PR, jamais dans un log).

## Contrôles après action

- Une recherche par VIN/plaque réelle renvoie un rapport dont chaque
  rubrique cite sa source et sa date.
- Une rubrique dont le fournisseur n'a pas encore de contrat reste marquée
  « non vérifié », jamais « aucun incident » par défaut.
- `npm run typecheck` reste à son nombre d'erreurs préexistant, tous les
  checks du dépôt restent verts.

## Ce qu'il ne doit surtout pas faire

- Ne jamais afficher une donnée d'historique par défaut ou estimée comme si
  elle provenait d'un registre officiel.
- Ne jamais committer une clé d'API ou un identifiant de contrat dans le
  dépôt, un commit, ou une pull request.
