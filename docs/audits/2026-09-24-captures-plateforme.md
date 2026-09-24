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

## Lot suivant — Employés

`GestionEmployesMKAPMS` utilise maintenant `admin.staffList/createStaff` ; les deux
commandes sont déclarées au moteur Boutons avec propriétaire et procédure. Les
comptes fictifs sont remplacés par les données réelles. Le rôle est distinct du poste.
La création reste réservée à la direction côté serveur. L'adresse est normalisée
et le contrôle de doublon est insensible à la casse. Aucun compte réel créé.

Tests locaux sur base isolée : refus employé/non-admin, validation des champs,
persistance du compte, hachage du mot de passe, lecture réelle et rejet du doublon.
Build réussi ; aucun nouveau diagnostic TypeScript dans les fichiers modifiés.

## Lot suivant — Alertes de recherche

`CentreAlertesRecherche` est raccordé à `searches.list/create/setAlert`, avec
critères explicites, alertes réelles et isolation par propriétaire. Les deux
commandes nomment Recherche comme moteur principal et Notifications/Vente comme
dépendances. Le résultat de résolution et le diagnostic IA exposent ce rattachement.
Le service existant de notifications à la publication est consolidé dans
`modules/search-alerts.ts` : uniquement annonces publiées, devise réelle, transaction
et verrou par annonce pour éviter les doublons lors d'un rejeu. Les nouveaux
services KYC et alertes sont affectés aux moteurs existants dans le registre ;
aucun fichier serveur orphelin ajouté.

Tests isolés : création persistée, lecture, activation/désactivation, refus
non-authentifié, refus d'accès aux alertes d'autrui, publication correspondant
aux critères, absence de notification pour brouillon/alerte désactivée, rejeu
sans doublon et devise XOF conservée. Aucun envoi réel à un utilisateur.

## Lot suivant — Favoris dans les annonces recommandées

Le cœur sans texte de `Vehicule.tsx` appartenait à une carte de démonstration et
était imbriqué dans un lien. Ce bloc lit désormais `annonces.list`, affiche les
photos/prix/devise réels et utilise la commande cataloguée `favoris.set`.
Le moteur Achat porte le service Favoris ; Identité fournit l'utilisateur.
La commande fixe l'état désiré, plutôt que basculer aveuglément lors d'un rejeu.
La transaction et son verrou sérialisent les opérations ; le serveur refuse
l'ajout d'une annonce absente ou non publiée. Le toggle historique reste compatible.

Tests isolés : authentification, annonce réelle/publiée, ajout/retrait idempotent,
isolation des utilisateurs et compatibilité du toggle. Les autres sections de
Vehicule contenant des démonstrations ne sont pas présentées comme auditées ou
corrigées par cette intervention ciblée.


## IMG_1876 — régression du taux après archivage (24 septembre)

Constat de la capture : 16/199 fonctionnels, 60 à corriger, taux 8 %.
Cause confirmée dans `platform-health.ts` : `count(*)` conservait les archives
au dénominateur, tandis que le compteur OK les excluait. `getHealthStatus`
excluait déjà les archives : les deux vues divergeaient après la correction précédente.

Correction ciblée : même agrégat filtré boutons/liens dans les deux vues,
archives conservées à part, statuts lents/non évalués explicités, aucune mesure
n'est présentée comme verte sans relevé actif. Aucun bouton ni fonction supprimé.

Test sur base isolée PostgreSQL compatible : 123 archives + 16 OK + 60 défauts
reproduisent 199 enregistrements. La carte affiche désormais 16/76 = 21 %,
60 défauts et 123 archives ; une image n'affecte pas le taux. Les 123 archives
sont une fixture reproduisant la différence visible, pas une lecture de production.
Ce correctif n'est pas une réparation des 60 actions métier encore signalées.


## IMG_1871 — AdminCarteMoniale / static_L23

Cause : six pays, comptes, annonces et CA fictifs dans une constante PAYS ;
le bouton n’appelait aucun moteur. Le service existant countries.stats était
également incomplet : pays absents de country_configs et codes non normalisés
omis. Le correctif étend ce service et ajoute countries.activity, protégé par
la même permission back-office, avec pagination de 50 comptes/annonces.

Le bouton est déclaré au moteur Boutons, propriétaire Country, puis ouvre un
dialogue de détail. Les compteurs, états des pays et montants restent présents.
Les montants sont des encaissements confirmés par devise, rattachés au pays
actuel du payeur, explicitement distincts d’un CA comptable. Aucun taux de
change ni historique territorial inventé.

Validation base isolée : pays normalisés, pays non configurés conservés,
absence de pays distincte de NA (Namibie), devises séparées, échecs/attentes
exclus des encaissements, pagination sans doublons, rôles public/pro refusés.
Build réussi ; 39 diagnostics TypeScript préexistants inchangés. Vérification
visuelle de production non effectuée (502 laissé de côté à la demande).

## Suivi exhaustif des 30 lignes IMG_1871 à IMG_1875

Les lignes sont les références des captures, pas des identifiants durables :
un ajout de code peut déplacer un bouton. Le tableau distingue la correction
livrée des signalements encore présents ; il ne les transforme pas en succès.

| Capture | Fichier dans client/src/pages | Ligne | Action | Moteur propriétaire dans l’inventaire | État |
|---|---|---|---|---|---|
| IMG_1871 | superadmin/AdminCarteMoniale.tsx | 23 | Utilisateurs · annonces | country | Corrigé et testé — PR #438 |
| IMG_1871 | ProduitVtcTaxi.tsx | 493 | Télécharger | location | Signalement encore présent — correction métier non livrée |
| IMG_1871 | vente/MultiSites.tsx | 17 | Ajouter un site | vente | Signalement encore présent — correction métier non livrée |
| IMG_1871 | vente/CentreReservationAchat.tsx | 15 | Réserver ce véhicule | vente | Signalement encore présent — correction métier non livrée |
| IMG_1871 | vente/CentreRapportsVehicule.tsx | 19 | Télécharger le rapport PDF | vente | Signalement encore présent — correction métier non livrée |
| IMG_1871 | vente/CentreExport.tsx | 17 | Libellé dynamique / icône | vente | Signalement encore présent — correction métier non livrée |
| IMG_1872 | vente/CentreDetectionFraude.tsx | 17 | Voir | vente | Signalement encore présent — correction métier non livrée |
| IMG_1872 | vente/CentreControleQualite.tsx | 20 | Libellé dynamique / icône | vente | Signalement encore présent — correction métier non livrée |
| IMG_1872 | vente/CentreCampagnes.tsx | 16 | Nouvelle campagne | vente | Signalement encore présent — correction métier non livrée |
| IMG_1872 | vente/CentreAchatDistance.tsx | 10 | Continuer mon achat | vente | Signalement encore présent — correction métier non livrée |
| IMG_1872 | vente/AlertesAuto.tsx | 17 | Traiter | vente | Signalement encore présent — correction métier non livrée |
| IMG_1872 | vente/AchatExpress.tsx | 9 | Commencer un achat express | vente | Signalement encore présent — correction métier non livrée |
| IMG_1873 | superadmin/AdminUtilisateurs.tsx | 90 | Libellé dynamique / icône | identity | Signalement encore présent — correction métier non livrée |
| IMG_1873 | superadmin/AdminStatistiques.tsx | 40 | Voir rapport complet | monitoring | Signalement encore présent — correction métier non livrée |
| IMG_1873 | superadmin/AdminPaiements.tsx | 216 | Relancer | payment | Signalement encore présent — correction métier non livrée |
| IMG_1873 | superadmin/AdminObjectif.tsx | 35 | Modifier objectif | workflow | Signalement encore présent — correction métier non livrée |
| IMG_1873 | superadmin/AdminGarage.tsx | 75 | Details | garage | Signalement encore présent — correction métier non livrée |
| IMG_1873 | superadmin/AdminEmployes.tsx | 275 | Libellé dynamique / icône | workflow | Signalement encore présent — correction métier non livrée |
| IMG_1874 | superadmin/AdminBadges.tsx | 36 | Gerer criteres | payment | Signalement encore présent — correction métier non livrée |
| IMG_1874 | superadmin/AdminAbonnements.tsx | 63 | Historique | payment | Signalement encore présent — correction métier non livrée |
| IMG_1874 | superadmin/AdminAbonnements.tsx | 62 | Gerer | payment | Signalement encore présent — correction métier non livrée |
| IMG_1874 | superadmin/AdminAbonnements.tsx | 31 | Libellé dynamique / icône | payment | Signalement encore présent — correction métier non livrée |
| IMG_1874 | ReservationRecurrente.tsx | 106 | Choisir un véhicule → | location | Signalement encore présent — correction métier non livrée |
| IMG_1874 | ReservationRecurrente.tsx | 76 | Modifier | location | Signalement encore présent — correction métier non livrée |
| IMG_1875 | ReservationRecurrente.tsx | 75 | Prolonger | location | Signalement encore présent — correction métier non livrée |
| IMG_1875 | ReservationMulti.tsx | 97 | Réserver véhicules | location | Signalement encore présent — correction métier non livrée |
| IMG_1875 | RenouvellementLocation.tsx | 171 | Confirmer le retrait / retour | location | Signalement encore présent — correction métier non livrée |
| IMG_1875 | RenouvellementLocation.tsx | 126 | Prolonger ma location | location | Signalement encore présent — correction métier non livrée |
| IMG_1875 | RemplacementVehicule.tsx | 106 | Accepter | location | Signalement encore présent — correction métier non livrée |
| IMG_1875 | RemplacementVehicule.tsx | 68 | Envoyer la demande | location | Signalement encore présent — correction métier non livrée |

### Causes déjà confirmées, à traiter sans supprimer les fonctions

- **ProduitVtcTaxi** : le bouton sert au dépôt des justificatifs, malgré le libellé « Télécharger ». Aucun fichier n’est envoyé. Le parcours de signature change seulement d’étape locale et la réservation finale crée une demande ; dépôt, éligibilité, contrat et paiement doivent être reliés au même dossier.
- **Vente / achat** : les pages MultiSites, Réservation achat, Rapport véhicule, Export, Fraude, Qualité, Campagnes, Achat à distance, Alertes et Achat express utilisent des constantes de démonstration. Exemple : contrôle qualité fixé à six points validés sur sept ; achat à distance déjà affiché réservé/payé sans lecture de preuve. Il faut traiter les données et les commandes, pas seulement ajouter onClick.
- **Administration** : comptes/employés, statistiques, objectifs, interventions, badges et abonnements sont en tout ou partie des maquettes. AdminPaiements combine un audit Payment OS réel avec une liste de paiements fictifs : aucune relance ne doit utiliser ces identifiants de démonstration. AdminEmployes est distinct de GestionEmployesMKAPMS déjà corrigé.
- **Location** : récurrence, panier multi-véhicules, renouvellement, retrait/retour et remplacement présupposent des contrats, tarifs, véhicules et propositions réels. Les listes et montants sont actuellement fictifs. La candidature de flotte existante ne couvre pas à elle seule ces workflows. Préserver les fréquences, options, documents, validations et historique lors de la construction.

Ces 29 signalements restants ne sont ni masqués, ni considérés réparés par
les corrections de supervision. Ils nécessitent leurs propres lots métier
et tests ; les autorisations de publication déjà données restent acquises.


## Enregistrement des cibles critiques : absence de preuve ≠ succès

`registerCriticalElements` appelait `reportHealthCheck(status: ok)` pour 21 cibles (16 boutons/liens et 5 formulaires). Cela ne testait aucun parcours et écrasait un résultat existant lors d’une réinitialisation. L’initialisation inscrit désormais uniquement les cibles absentes avec `unknown` et sans date de contrôle ; elle conserve tous les relevés existants, y compris les échecs. Enregistrement et réception d’un relevé utilisent le même verrou transactionnel PostgreSQL pour sérialiser leurs écritures. Le tableau présente les non-évalués et son filtre « Cassés » inclut aussi les éléments manquants.

Le test isolé vérifie 21 inconnus au départ, l’idempotence et la conservation d’un succès mesuré, d’une panne, de son horodatage et de son détail. Le serveur PGlite de test partage une session et ne permet pas de valider les transactions concurrentes comme un PostgreSQL multi-session : cette concurrence reste à vérifier dans un environnement PostgreSQL dédié. Aucun ancien résultat OK n’est rétroactivement déclassé faute de provenance permettant de distinguer initialisation et véritable observation. Le lien entre ces 16 cibles et les 16 OK de la capture reste une hypothèse, pas une preuve en production.


## IMG_1877–1881 — lot Garage (AdminGarage.tsx:75)

Les nouvelles captures reprennent les anomalies précédentes et ajoutent notamment AdminEmployes.tsx:52. Le changement 8 % → 21 % corrige le calcul, pas les parcours restants. La baisse précédente 60 → 59 correspond uniquement à la carte mondiale.

**Cause Garage :** cinq interventions inventées dans INTERVENTIONS ; les actions Terminer/Annuler/Supprimer ne modifiaient que React. Le bouton Détails n’avait aucune action. Le moteur Garage dispose déjà de rdv_garage et du suivi service_tracking : aucun moteur ni dossier parallèle n’est créé.

**Correction :** garages.adminInterventions et adminIntervention lisent les dossiers réels, avec recherche et pagination ; adminAction délègue au moteur Atelier existant, conserve un audit et le suivi client dans une transaction. Les cinq commandes sont déclarées dans le moteur de boutons avec leurs dépendances. Clôture après contrôle qualité/mise à disposition ; refus des transitions périmées ; annulation persistée ; retrait par archivage réversible sans suppression des dossiers ni de leur historique. Les dossiers archivés restent visibles. Les échecs de notification/demande d’avis sont remontés et tracés. Les devises, prix et noms de mécaniciens inventés ne sont pas repris comme faits : les données non disponibles sont indiquées explicitement. Les compteurs portent explicitement sur la page affichée.

**Preuves :** test PostgreSQL compatible isolé : données réelles de fixtures, pagination sans recouvrement, recherche, interdiction des accès particulier/pro/garage, détail, historique, statut persisté, refus des transitions invalides et périmées, idempotence des répétitions, archivage/restauration et conservation des 55 dossiers. Aucun rendez-vous réel ni notification réelle n’a été modifié/envoyé par ces tests. Validation visuelle en production non effectuée. Ce lot ferme la ligne Garage, pas les autres lignes des captures. Inventaire statique : 59 → 58 boutons sans action ; ce chiffre ne constitue pas une preuve de bon fonctionnement des autres boutons.
