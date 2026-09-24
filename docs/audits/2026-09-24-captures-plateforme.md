# Captures Santé plateforme — 24 septembre 2026

Dépôt : `projet-Auto-plus-Africa-MKAPMS/mkapms-web`. Base examinée : `312ac07`.
Périmètre : captures transmises par la direction, plateforme principale uniquement.
Aucun changement dans SHOP. PR 422 (démarches) laissée intacte.

## Constat principal

Le compteur 137 OK / 67 cassés des captures n'est pas une preuve de fonctionnement.
Le scanner détecte une absence de gestionnaire dans le JSX. Il ne teste ni les
permissions, ni la persistance, ni la réponse d'un moteur métier. Plusieurs pages
concernées sont des maquettes avec des tableaux de données codés en dur.

### 01 — Surveillance (corrigée dans ce lot)

`health-monitor.syncBoutonsSansAction` changeait les anciens relevés en OK sans
effacer leur message d'erreur. Les relevés déjà OK n'étaient plus réconciliés.
Les boutons sans texte ne pouvaient pas être rapprochés par libellé après déplacement.
Une ancienne ligne ne prouve jamais le bon fonctionnement d'un bouton.

Correction : conservation de ces relevés sous `archived`, exclus des compteurs
actifs et des nouveaux scans d'erreur, sans suppression de données. Le nombre
archivé est visible dans le centre de contrôle. Les libellés courants sont remis
à jour même si l'anomalie reste broken. Une résolution manuelle d'un ancien relevé
statique ne rétablit plus un faux OK. Les vrais boutons encore muets restent broken.

### 02 — Exécution du moteur Boutons (corrigée dans ce lot)

`BoutonMoteur` envoyait le succès avant d'appeler le traitement métier et ignorait
les rejets asynchrones. Le motif `desactive` ne s'appliquait pas à la navigation.
Une erreur de résolution produisait un bouton désactivé sans possibilité de reprise.

Correction : attente de la promesse métier, trace d'échec et erreur visible,
verrou anti-double-clic, annulation explicite (`false`) sans trace de succès,
indisponibilité appliquée à tous les genres, possibilité de réessayer la résolution.
Le heartbeat est degraded après un échec. La destination cataloguée sert de repli
si la résolution auxiliaire échoue. Les nouveaux codes nomment moteur et procédure
pour enrichir le diagnostic remis à l'IA.

Limite : les anciens appels utilisant `mutation.mutate` doivent rendre leur promesse
(`mutateAsync`) pour bénéficier de l'attente complète. Une trace de navigation reste
une intention de navigation, pas une preuve que le serveur de destination a réussi.

### 03 — Devis flotte (raccordé)

`LocationPro.tsx` : bouton absent du catalogue et sans gestionnaire.
Chaîne : `location_devis_flotte` → Redirection → `/louer/pro/candidature` →
`rentalApplications.create/updateStep/submit`. Le formulaire de candidature existe
sur la base actuelle ; aucune disponibilité ni tarification n'est inventée.

### 04 — Vérifications incomplètes (faux positif expliqué)

`ControleDocuments.tsx` : état KYC volontairement bloquant, pas une action manquante.
Ce texte devient un statut accessible, avec renvoi aux pièces manquantes affichées.
Le lien de poursuite déjà conditionné au KYC reste conservé.

### 05 — Valider / Refuser (raccordés et moteur renforcé)

`ValidationDocumentsComplete.tsx` présentait cinq dossiers fictifs sans mutation.
La page réutilise désormais `AdminValidationDocs`, déjà reliée à
`admin.kycPending/kycDocuments/validateKyc`. Deux codes du catalogue identifient KYC.
Le service `modules/kyc-decision.ts` assure la transaction et le verrou du dossier,
le motif de refus, l'existence du dossier, l'état en_validation, la présence et la
non-expiration des pièces, l'audit transactionnel et le rejeu idempotent.
Les droits restent imposés par `adminProcedure`. Aucune décision réelle exécutée.

## Autres éléments des captures : non corrigés par ce lot

Les noms ci-dessous reprennent les noms réels du dépôt (Moniale et Objectif).
La colonne moteur désigne le point d'audit suivant, pas un raccordement déjà prouvé.

| Écran / action | Constat dans le code actuel | Moteur à examiner ou compléter |
|---|---|---|
| Vehicule — sans texte | Le cœur des annonces similaires n'a pas de gestionnaire ; annonces DEMO_VEHICLES et bouton imbriqué dans un lien | annonces + favoris + boutons |
| TableauBordLoueur — Vérifier | Ancien relevé : page modifiée par une livraison antérieure ; ne pas le compter comme test réussi | location + santé |
| ProduitVtcTaxi — Télécharger | Étape documentaire sans upload ; poursuivre l'assistant ne prouve aucun dépôt | pro / KYC / rentalApplications |
| AdminCarteMoniale — pays | Tableau PAYS fictif, carte sans action | country + analytics |
| MultiSites — Ajouter un site | Tableau SITES fictif, aucun formulaire ni mutation | pro / établissements |
| CentreReservationAchat — Réserver | Durées et prix codés en dur, pas d'annonce ni mutation | réservations / paiement |
| CentreRapportsVehicule — PDF | Historique véhicule fictif, aucun rapport généré | document + dossier véhicule |
| CentreExport — formats | Liste de formats sans traitement ni source de données | document + comptabilité + pro |
| CentreDetectionFraude — Voir | VERIFS fictives, compte suspect fictif | fraude + permissions |
| CentreControleQualite — publier | CHECKLIST fictive ; bouton désactivé sans lien aux contrôles réels | annonces + qualité / conformité |
| CentreCampagnes — Nouvelle campagne | CAMPAGNES fictives, aucune création | marketing / notification |
| CentreAlertesRecherche — Créer | ALERTES fictives, champ non relié à une création | recherche + notification |
| CentreAchatDistance — Continuer | Réservation et paiement affichés terminés sans preuve | réservations + paiement + signature + livraison |
| AlertesAuto — Traiter | ALERTES fictives, aucun identifiant métier à traiter | pro + documents + réservations |
| AchatExpress — Commencer | Liste d'étapes informative, aucune sélection de véhicule | annonces + achat / réservations |
| GestionEmployesMKAPMS — Ajouter | Employés et droits fictifs, aucune création | identité + permission + admin.createStaff |
| AdminUtilisateurs — cartes | USERS fictifs ; modifications et messages simulés en mémoire du navigateur | identité + admin + communication |
| AdminStatistiques — Rapport | STATS fictives, aucun rapport | analytics + document |
| AdminPaiements — Relancer | Bouton sans action dans le tableau affiché ; ne jamais relancer un paiement sur cet identifiant sans vérifier sa source réelle | paiement + notification |
| AdminObjectif — Modifier | OBJECTIFS fictifs, aucune persistance | pilotage / objectifs |
| AdminGarage — Détails | INTERVENTIONS fictives ; actions locales sans persistance | garage / atelier |

Ces éléments restent à développer et à tester de bout en bout. Aucune correction
cosmétique ne les fait artificiellement disparaître de l'inventaire.

## Vérifications de ce lot

- `npm run test:button-motor` : rendu du vrai composant avec services de test ;
  attente, succès, rejet, annulation, double clic et désactivation de navigation.
- `server/modules/__tests__/screenshot-motors.test.ts` : tables PostgreSQL isolées
  exécutées avec PGlite et adaptateur protocole PG local ; archivage des anciens OK
  et broken, compteurs, idempotence, rafraîchissement des libellés ; décision KYC
  persistée, audit unique, dossier absent/incomplet, refus sans motif, conflit.
- `npm run build` : réussi, y compris contrôles de fraîcheur des inventaires.
- TypeScript : 39 diagnostics identiques avant/après dans des fichiers inchangés ;
  le contrôle global n'est donc pas vert. Aucun nouveau diagnostic dans ce lot.
- Pas de test navigateur authentifié ni de validation de fonctionnement en production.
- Le test de base exige une base locale jetable sur le port 55432. Ne pas l'exécuter
  contre la production. Les données du test sont locales uniquement.
