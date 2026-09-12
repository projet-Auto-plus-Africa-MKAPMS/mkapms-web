# HANDOFF DEVAN — Remplir réellement le rapport d'historique véhicule (accidents, gage, entretiens)

## Objectif

Le moteur de demande de rapport d'historique existe déjà et est branché à
l'écran `/acheter/historique-vehicule` (`client/src/pages/HistoriqueVehiculeVente.tsx` +
`server/routers/historique.ts` + table `vehicle_reports`) : un utilisateur
connecté peut demander un rapport par VIN/plaque, la demande est enregistrée
avec le statut `en_attente`, et l'écran l'affiche dans « Mes demandes de
rapport ». Ce qui manque : rien ne remplit jamais les colonnes du rapport
(`kilometrage`, `controlesTechniques`, `sinistres`, `proprietaires`,
`entretien`, `rappelsConstructeur`) ni ne fait jamais passer une demande de
`en_attente` à `pret` — objectif de ce handoff : brancher un vrai
fournisseur de données pour que ce passage se fasse réellement.

## Pourquoi je ne peux pas l'exécuter

Les informations attendues (sinistres, contrôle technique, propriétaires
successifs, carnet d'entretien constructeur) vivent chez des tiers
(assureurs, HistoVec, constructeurs) et n'existent dans aucune base
accessible depuis ce dépôt ou cet environnement de travail. Chacun de ces
registres exige un contrat commercial, une habilitation et une clé d'API —
aucun accès de ce type n'est présent ici. Le vol et le gage n'ont même pas
de colonne dans `vehicle_reports` aujourd'hui : les ajouter suppose de
choisir d'abord un fournisseur pour ces données, ce que je ne peux pas
décider à la place de la direction (accès commercial, coût par appel).

## Ce qui est déjà terminé

- Écran, requête, stockage et affichage du statut sont réels et
  fonctionnels : `trpc.historique.requestReport` (création, `publicProcedure`
  mais rattache l'utilisateur connecté s'il y en a un), `trpc.historique.myReports`
  (liste réelle des demandes de l'utilisateur), `trpc.historique.report`
  (une demande précise). Aucune de ces trois procédures n'a été modifiée
  par ce lot — elles préexistaient, seul l'écran ne les appelait pas.
- L'identification technique (marque/modèle/année/carburant/boîte/puissance)
  reste réelle via `trpc.annonces.lookupPlate`, affichée séparément du
  rapport détaillé.
- Une demande dont le statut est encore `en_attente` n'affiche jamais de
  contenu de rapport : les 6 rubriques ne s'affichent que si `status === "pret"`,
  et seulement les rubriques réellement non nulles en base — jamais une
  valeur par défaut ou une estimation présentée comme un fait vérifié.
- L'ancienne version (avant cette correction) affichait un rapport 100 %
  fictif et identique pour n'importe quelle plaque/VIN saisi (toujours
  « aucun sinistre », « non gagé », « non volé ») — un risque de confiance
  direct pour un acheteur qui s'en serait servi pour décider d'un achat. Ce
  comportement a été supprimé avant même de découvrir ce moteur réel.

## Ce que Devan doit faire

1. Choisir le(s) fournisseur(s) à intégrer selon les pays couverts. Pour la
   France : HistoVec (service public, nécessite une convention/habilitation
   pour un usage professionnel au-delà de la consultation manuelle) pour le
   contrôle technique et les changements de propriétaire ; un accès au
   fichier des véhicules gagés (FVA) et volés passe généralement par un
   partenaire agréé (ex. AAA Data, SIV Auto, ou équivalent) plutôt qu'un
   accès direct — et suppose d'ajouter deux colonnes (`vol`, `gage`) à
   `vehicle_reports` par une nouvelle migration Drizzle, jamais en modifiant
   une migration déjà fusionnée.
2. Une fois un contrat et une clé d'API obtenus, ajouter la clé comme
   variable d'environnement serveur (jamais commitée) et créer un service
   dédié, par exemple `server/vehicle-history/service.ts`, qui appelle le(s)
   fournisseur(s), écrit le résultat dans les colonnes existantes de
   `vehicle_reports` et passe `status` à `pret` (ou `echec` si le
   fournisseur ne répond pas) — jamais un remplissage silencieux sans
   changement de statut.
3. Décider du déclencheur : appel synchrone au moment de `requestReport`
   (si le fournisseur répond vite) ou tâche différée via `scheduler-os`
   (si le fournisseur est asynchrone/facturé au lot) — les deux mécanismes
   existent déjà ailleurs sur la plateforme, à réutiliser plutôt qu'à
   réinventer.
4. Si un ou plusieurs fournisseurs restent indisponibles (pas de contrat
   pour le gage, par exemple), les colonnes correspondantes restent `null`
   et l'écran continue de ne pas les afficher — ne jamais y mettre une
   valeur par défaut du type « aucun incident ».

## Application concernée

Particulier (achat) — `/acheter/historique-vehicule`.

## Fichier à utiliser

`server/routers/historique.ts` (`requestReport`), `server/modules/history.ts`
(table `vehicle_reports`, migration à ajouter pour `vol`/`gage`), nouveau
`server/vehicle-history/service.ts` (appel fournisseur + écriture du
résultat). `client/src/pages/HistoriqueVehiculeVente.tsx` n'a besoin
d'aucune modification pour un fournisseur qui écrit dans les colonnes
existantes ; seule l'ajout de `vol`/`gage` demandera une petite extension
de son bloc d'affichage.

## Valeurs attendues

Clé(s) d'API des fournisseurs choisis, en variable d'environnement serveur
uniquement (jamais dans le dépôt, jamais dans un PR, jamais dans un log).

## Contrôles après action

- Une demande réelle passe de `en_attente` à `pret` (ou `echec`) sans
  intervention manuelle en base.
- Une rubrique dont le fournisseur n'a pas encore de contrat reste `null`
  et invisible à l'écran, jamais affichée comme « aucun incident ».
- `npm run typecheck` reste à son nombre d'erreurs préexistant, tous les
  checks du dépôt restent verts, `check:migrations` valide la nouvelle
  migration si des colonnes sont ajoutées.

## Ce qu'il ne doit surtout pas faire

- Ne jamais afficher une donnée d'historique par défaut ou estimée comme si
  elle provenait d'un registre officiel.
- Ne jamais committer une clé d'API ou un identifiant de contrat dans le
  dépôt, un commit, ou une pull request.
- Ne jamais éditer la migration Drizzle déjà fusionnée qui a créé
  `vehicle_reports` : toute colonne supplémentaire (vol, gage) passe par une
  nouvelle migration.
