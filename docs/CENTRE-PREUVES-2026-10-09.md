# Centre Cyber-Électrique — dossier de preuves pour l'audit (9 octobre 2026)

Tout ce qui est affirmé ici a été exécuté **en local** (base Postgres jetable, serveur construit `dist/server.js`, navigateur Chromium réel). **Rien n'a été exécuté sur Railway, en production, ni contre la vraie Boutique** : je n'y ai pas accès. Le centre est en simulation ; il n'est **pas** déclaré autonome ni terminé à 100 %.

## 1. Inventaire vérifié

Boutique (`mkapms-shop`, commit `3f5022921c898ca56a48e4a534be264bd74e6458`, 9 octobre 2026) : 83 moteurs, 6 intermédiaires préparés (5 contrats déclarés + 1 accès de service exécutable). Plateforme principale (`mkapms-web`) : 96 moteurs + 6 canaux du moteur intermédiaire `shop_link`. Détail, références fichier avec ligne, tests et manques de chaque moteur : [`CENTRE-INVENTAIRE-2026-10-09.md`](CENTRE-INVENTAIRE-2026-10-09.md) et `server/frontier-os/inventaire/*.generated.ts` (régénérables : `npx tsx scripts/gen-frontier-inventaire.ts --shop <chemin du dépôt de la Boutique>`). Contrôles de cohérence du relevé : `server/frontier-os/__tests__/inventaire.test.ts`.

## 2. Nombres exacts (base neuve, après fondation)

| Élément | Valeur |
| --- | ---: |
| Lignes **réelles** | **6** (3 validées : documents, état technique, accès de service ; 3 non valides avec leurs raisons : entrée, paiement, Google) |
| Lignes de **réserve « À venir »** — groupe Boutique | **30** (5 × 6), soit 36 lignes |
| Réserves — Map, IA Al-Houdoud M., Boutique Bijoux (future), futures plateformes | 5 + 5 + 5 + 5 |
| Total des réserves | **50** (aucune activée, aucune ne porte un moteur) |
| Groupes | 5 (extensible sans limite : action « Ajouter un groupe ») |
| Coupures / portes | 18 / 18 (trois par ligne réelle, aucune pour une réserve) |
| Moteurs enregistrés | 225 = 191 relevés (83 + 6 + 96 + 6) + 34 du centre (16 internes + 18 éléments de coupure) |
| Liaisons commande / vérification | 71 |
| Versions de moteurs conservées | 191 |
| Salles / boutons | 10 / 20 |
| Plateformes / noms demandés | 7 / 7 |
| Tables du schéma `frontier` | 30 (29 de données + le journal des migrations) ; 37 clés étrangères ; 117 contraintes |

## 3. Modèles de données, relations, migrations

Migrations **propres au centre** (ni `drizzle/`, ni le migrateur de la plateforme) : `server/frontier-os/base/migrations/0001_identite_et_registre.sql` (sha256 `ed205db58afcacb8…`) et `0002_chaine_commandes_et_exploitation.sql` (sha256 `cc0ab6bca3c868af…`), journal `frontier.migrations` avec somme de contrôle (une dérive bloque le migrateur : testé). Modèle Drizzle : `server/frontier-os/base/schema.ts`.

Relations principales : `companies ← platforms ← groups ← lines` ; `lines → engines` (sept clés d'éléments) ; `lines ← cuts ← gates` ; `commands ← command_receipts`, `commands.parent_id` (ligne → trois coupures) ; `engine_bindings` (cible → deux moteurs `engines` distincts) ; `exchanges → lines` ; `test_sessions ← test_steps → commands` ; `incidents ← repairs` ; `engines ← engine_versions`, `engines ← engine_capabilities` ; `config ← config_history`. La migration 0157 de la plateforme (tables `fo_*`) n'est plus utilisée par le code.

## 4. Fichiers ajoutés ou modifiés (sur la branche `claude/test-network-connections-j6905r`)

- **Ajoutés** — base : `server/frontier-os/base/{connexion,migrateur,demarrage,schema}.ts` et 2 migrations ; chaîne : `regles.ts`, `chaine.ts`, `bus.ts`, `moteurs-internes.ts`, `moteurs-commande.ts`, `moteurs-verification.ts`, `commandes.ts`, `transport.ts`, `mesures.ts`, `sante.ts`, `gouvernance.ts`, `atelier.ts`, `protocole.ts`, `fondation.ts`, `journal.ts`, `vues.ts`, `demarrage-centre.ts` ; inventaire : `scripts/gen-frontier-inventaire.ts`, `server/frontier-os/inventaire/*` ; portier : `server/shop-link/portier.ts` ; vitrine : `client/src/pages/centre/{commun,FicheMoteur,SalleConnexions,Salles}.tsx` ; tests et script navigateur : voir §5.
- **Modifiés** (additions seulement, sans effet par défaut) : `server/shop-link/service.ts` (`etatEffectif` consulte le portier ; nouvelle raison `GOUVERNANCE_CENTRE`), `server/shop-link/entrant.ts` (sens « entrant »), `server/intelligences/boutique.ts` (une consultation du portier avant l'appel réseau), `server/index.ts` (démarrage en arrière-plan), `server/frontier-os/index.ts` (routeur), `client/src/pages/CentreCyberElectrique.tsx`, `.github/workflows/build-check.yml`, fichiers générés (`server/data/*.ts`).
- **Supprimés** (remplacés) : `server/frontier-os/{service,schema,rules}.ts` et leurs deux anciens fichiers de test.

## 5. Résultats des tests (exécutés, base locale jetable)

Chaque groupe a été joué **trois fois de suite** (journal brut : [`preuves/centre-tests-3-passes.log`](preuves/centre-tests-3-passes.log)), 0 échec :

| Fichier | Tests | Ce qu'il prouve |
| --- | ---: | --- |
| `regles.test.ts` + `inventaire.test.ts` | 18 | validité d'une ligne, admissibilité, matrice de passage (trois coupures, contact qui « approche » = rien ne passe), état d'une ligne, règle des échanges en vol, jauges, gouvernance = restriction seulement ; relevé d'inventaire cohérent avec ses définitions, noms non établis jamais inventés |
| `base.integration.test.ts` | 10 | migrations propres, idempotence, dérive, deux moteurs distincts en base, réserves, propriété explicite, secrets = références, API/abonnements inactifs, « connecté » exige une mesure, journal en ajout seul |
| `fondation.integration.test.ts` | 7 | 7 plateformes, noms non trouvés non rattachés, 6 réelles + 30 réserves (+ 4 × 5), sept éléments, paires distinctes, versions, idempotence, réserve entamée complétée |
| `chaine.integration.test.ts` | 11 | **les trois coupures** : ordre vs résultat, deux moteurs et quatre accusés par coupure, ligne complète, couper un seul côté suffit, ligne non validée / désactivée refusée, verrou, grand contact (contacts centraux seulement), général (ne contourne jamais verrou, erreur, vide, non validée), réserves, mode réel refusé |
| `transport.integration.test.ts` | 9 | **coupure dans le transport** : voie directe, secondaire, sens inverse, file, reprises automatiques, échange en vol annulé, **paiement transmis suivi**, redémarrage, unique chemin d'écriture |
| `pannes.integration.test.ts` | 12 | moteur de commande ou de vérification arrêté, moteur muet, **désaccord entre les deux moteurs**, contact bloqué (« coupure non confirmée »), coupure malgré un moteur en panne, commande répétée / idempotence, concurrence, ligne jamais à moitié branchée, défaillance partielle signalée (groupe, général), **redémarrage** |
| `protocole.integration.test.ts` | 4 | **protocole des neuf étapes dans l'ordre exigé** et essais de panne, chacun 3 fois sur les 3 lignes validées, état initial restauré, aucun incident ni porte résiduels |
| `atelier.integration.test.ts` | 7 | diagnostic, proposition, test isolé sans effet, application sur confirmation, retour arrière exact, droits d'intervention, invariants |
| `gouvernance.integration.test.ts` | 7 | non armée = aucun changement ; armée = voie fermée si la ligne n'est pas connectée ; le centre n'ouvre jamais ce que le câble refuse ; voie directe des outils de l'IA ; centre indisponible = fermé ; journal |
| `routeur.integration.test.ts` | 10 | réservé au PDG (toute procédure), accueil mesuré (« non mesurée »), lignes, commandes, moteurs, mesures et banc d'essai, sécurité (aucune valeur de secret), arrêt/redémarrage d'un moteur, atelier/sessions/mémoire/futures |
| **Total** | **95** | |

Autres vérifications : suites **existantes** touchées par mes ajouts, relancées sans régression — `shop-link` (30 tests) et `boutique` / coffre (23 tests) ; `npm run typecheck` sans erreur ; `npm run build` complet sans erreur (contrôles, génération des inventaires, vite, esbuild) ; migrations du centre appliquées deux fois de suite sur base neuve ; **serveur construit lancé en production locale** : le centre se pose seul au démarrage (56 lignes), la plateforme démarre normalement.

**Essai de bout en bout dans un vrai navigateur** (`scripts/test-centre-navigateur.mjs`) : administrateur ordinaire sans portail ; PDG : entrée sur l'accueil, dix salles, six aiguilles dont température « non mesurée », noms non trouvés ; plan des connexions (sept éléments, trois coupures, deux petits interrupteurs et un contact rouge par ligne, 3 lignes non valides avec raisons, 30 réserves dépliables) ; fiche d'un moteur ; activation d'une ligne **avec confirmation** (rien ne bouge avant) puis état « connectée » seulement après confirmation ; échange d'essai livré, puis refusé après coupure d'un petit interrupteur ; grand contact du groupe ; interrupteur général avec ligne verrouillée jamais contournée ; protocole des neuf étapes (11/11) ; salles plateforme, boutiques, cybersécurité (deux voies non gouvernées affichées), atelier, mémoire, incidents, employés, futures ; **arrêt puis relance réels du serveur** : connecté reste connecté, coupé reste coupé, 55 réserves désactivées ; téléphone (390 px) et tablette (820 px) : mode tactile, boutons de zoom toujours visibles, déplacement et **pincement** vérifiés, un appui ouvre la fiche d'un moteur, aucun défilement horizontal de la page, aucune erreur de page.

## 6. Journaux d'ordres et de confirmations

[`preuves/centre-journal-exemple.txt`](preuves/centre-journal-exemple.txt) : une commande de ligne réelle, ses trois coupures dans l'ordre (côtés locaux, centre en dernier), et pour chacune les accusés **des deux moteurs distincts** à chaque phase (contrôle préalable, exécution, vérification finale) avec durées, l'état final demandé / observé / avancement / preuve, et le journal d'audit en ajout seul.

## 7. Captures d'écran (ordinateur, 1440 px ; plus tablette et téléphone)

Dossier [`preuves/captures/`](preuves/captures/) : `01-accueil-bureau` (aiguilles mesurées, base indépendante, noms exacts), `02-connexions-repos-bureau` (le plan au repos), `04b-plan-groupe-boutique-bureau` (la ligne « documents » connectée : fils lumineux, contact fermé *confirmé*), `07b-plan-groupe-boutique-bureau`, `03-fiche-moteur-bureau`, `09-boutiques-bureau`, `10-cybersecurite-bureau`, `11-atelier-bureau`, `12-incidents-audit-bureau`, `13-apres-redemarrage-bureau`, `22-tablette-connexions`, `22-telephone-connexions`.

## 8. Simulé / réel / manquant / bloqué

| Fonction | Statut |
| --- | --- |
| Commandes (coupures, ligne, groupe, général), deux moteurs, ordre vs résultat, transport, règle des échanges en vol, atelier, protocoles, mesures, redémarrage | **Simulé** — réellement exécuté, mais sur des contacts simulés par le centre, aucun réseau |
| Lecture du câble réel de la Boutique (`shop_link`) | **Réel en lecture** ; gouvernance du câble : **réel mais facultative et non armée par défaut**, ne fait que restreindre |
| Base indépendante : schéma, pool, migrateur, journal propres | **Réel** (en droit) ; **base physiquement séparée : manquant** (variable `FRONTIER_DATABASE_URL`, à décider) |
| Branchement réel d'une ligne par le centre | **Bloqué** — refusé par le code (`ACTION_REELLE_ACTIVEE = false`) et par la base ; exige l'audit final décidé par le PDG |
| Interrupteurs locaux côté Boutique et côté plateforme | **Manquant** côté plateformes (simulés par le centre) |
| Émetteurs « Boutique → plateforme » (documents, état, entrée) | **Manquant** côté Boutique (sa règle l'interdit aujourd'hui) — décision des agents de la Boutique |
| Canaux paiement et Google | **Bloqué** — attente externe côté Boutique (clé Stripe, propriétés Google) |
| Gouvernance des deux voies existantes (API de connaissance / d'analyse de la Boutique, bouton Boutique) | **Manquant** — dit dans la salle Cybersécurité, décision du PDG |
| Clés d'accès, API externes, accès employés, souscriptions | **Préparé, inactif** |
| Map, IA Al-Houdoud M., Boutique Bijoux, futures plateformes | **Réserves vides** « À venir » ; Map non inventoriée (à vérifier) ; IA : rattachement à confirmer |
| Identité de « MKH Shop », « MKPMS Shop », « boutique principale » | Précisé par le PDG le 9 oct. 2026 : pas une boutique à part, le centre est installé dans la plateforme principale (MKAPMS Web) ; noms toujours absents du code, rien n'est fusionné |
| Température, capacité doublée | **Non mesurées / non prouvées** : aucune source, aucun facteur annoncé |

## 9. Démarrage et retour arrière

Voir [`CENTRE-CYBER-ELECTRIQUE-2026-10-09.md`](CENTRE-CYBER-ELECTRIQUE-2026-10-09.md), §7. Le démarrage est automatique et non bloquant ; le retour arrière est le revert de la PR (le schéma `frontier` reste, inoffensif, effaçable par `DROP SCHEMA frontier CASCADE`). Pour rejouer l'essai navigateur : `npm run build`, puis `E2E_DB=<base jetable locale _test> E2E_CHROMIUM=<chromium> node scripts/test-centre-navigateur.mjs <dossier de captures>`.
