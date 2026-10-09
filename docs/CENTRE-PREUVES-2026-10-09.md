# Centre Cyber-Électrique — dossier de preuves pour l'audit (9 octobre 2026)

Tout ce qui est affirmé ici a été exécuté **en local** (base Postgres jetable, serveur construit `dist/server.js`, navigateur Chromium réel). **Rien n'a été exécuté sur Railway, en production, ni contre la vraie Boutique** : je n'y ai pas accès. Le centre est en **simulation par défaut** ; les liaisons réelles n'existent que derrière deux clés (variable d'environnement + armement du PDG) et n'ont été éprouvées qu'en local. Il n'est **pas** déclaré autonome ni terminé à 100 %.

## 1. Inventaire vérifié

Boutique (`mkapms-shop`, commit `c82fc74…`, 9 octobre 2026, après son lot « moteurs de stock indépendants ») : 83 moteurs du registre, 6 intermédiaires préparés (5 contrats déclarés + 1 accès de service exécutable), **et le moteur de stock propre** (migration 0077) relevé à part, une seule fois : moteur de stock (« testé ») + son intermédiaire de stock (« préparé »), 10 modèles de comptes et 7 canaux désactivés par la base elle-même. Plateforme principale (`mkapms-web`) : 96 moteurs + 6 canaux du moteur intermédiaire `shop_link`. **Aucun doublon** : le générateur échoue si un identifiant `stock.*` ou une table `shop_inventory.*` figure déjà dans le registre ; le recouvrement de fonction avec `inventory` / `warehouse` est signalé, jamais fusionné. Détail, références fichier avec ligne, tests et manques de chaque moteur : [`CENTRE-INVENTAIRE-2026-10-09.md`](CENTRE-INVENTAIRE-2026-10-09.md) et `server/frontier-os/inventaire/*.generated.ts` (régénérables : `npx tsx scripts/gen-frontier-inventaire.ts --shop <chemin du dépôt de la Boutique>`). Contrôles de cohérence : `server/frontier-os/__tests__/inventaire.test.ts`.

## 2. Nombres exacts (base neuve, après fondation)

| Élément | Valeur |
| --- | ---: |
| Lignes **réelles** | **6** (3 validées : documents, état technique, accès de service ; 3 non valides avec leurs raisons : entrée, paiement, Google) |
| Lignes de **réserve « À venir »** — groupe Boutique | **30** (5 × 6), soit 36 lignes |
| Réserves — Map, IA Al-Houdoud M., Boutique Bijoux (future), futures plateformes | 5 + 5 + 5 + 5 |
| Total des réserves | **50** (aucune activée, aucune ne porte un moteur) |
| Groupes | 5 (extensible sans limite : action « Ajouter un groupe ») |
| Coupures / portes | 18 / 18 (trois par ligne réelle, aucune pour une réserve) |
| Moteurs enregistrés | 227 = 193 relevés (83 + 6 + 96 + 6 + 2 de la famille « stock propre ») + 34 du centre (16 internes + 18 éléments de coupure) |
| Liaisons commande / vérification | 71 |
| Versions de moteurs conservées | 193 |
| Salles / boutons | 10 / 20 |
| Plateformes / noms demandés | 7 / 7 |
| Tables du schéma `frontier` | 32 (31 de données + le journal des migrations) ; 42 clés étrangères ; 207 contraintes |

## 3. Modèles de données, relations, migrations

Migrations **propres au centre** (ni `drizzle/`, ni le migrateur de la plateforme) : `server/frontier-os/base/migrations/0001_identite_et_registre.sql` (sha256 `ed205db58afcacb8…`), `0002_chaine_commandes_et_exploitation.sql` (sha256 `cc0ab6bca3c868af…`) et `0003_liaisons_reelles.sql` (sha256 `1d87cb098e859247…` : ordres donnés à l'interrupteur de la Boutique et rapports signés qu'elle renvoie, additive), journal `frontier.migrations` avec somme de contrôle (une dérive bloque le migrateur : testé). Modèle Drizzle : `server/frontier-os/base/schema.ts`.

Relations principales : `companies ← platforms ← groups ← lines` ; `lines → engines` (sept clés d'éléments) ; `lines ← cuts ← gates` ; `commands ← command_receipts`, `commands.parent_id` (ligne → trois coupures) ; `engine_bindings` (cible → deux moteurs `engines` distincts) ; `exchanges → lines` ; `test_sessions ← test_steps → commands` ; `incidents ← repairs` ; `engines ← engine_versions`, `engines ← engine_capabilities` ; `config ← config_history` ; `remote_orders → lines, cuts, commands` et `remote_reports → lines` (liaisons réelles). La migration 0157 de la plateforme (tables `fo_*`) n'est plus utilisée par le code.

## 4. Fichiers ajoutés ou modifiés (sur la branche `claude/test-network-connections-j6905r`)

- **Lot précédent (déjà fusionné, PR #594)** : base propre (`server/frontier-os/base/*`), chaîne, transport, atelier, protocole, gouvernance, vitrine à dix salles, inventaire, portier `server/shop-link/portier.ts`.
- **Ce lot — inventaire** : `scripts/gen-frontier-inventaire.ts` (famille « stock propre », contrôles de non-duplication), `server/frontier-os/inventaire/*`, `fondation.ts`, `vues.ts`.
- **Ce lot — vitrine** : `client/src/pages/centre/SalleConnexions.tsx` (fils animés, leviers, réserves visibles et inertes, étiquettes réel / simulé), `ModeReel.tsx` (carte du mode réel), `Salles.tsx` (séparation de la base, voies de données / navigation, stock propre).
- **Ce lot — séparation physique** : `server/frontier-os/separation.ts` (niveau mesuré), `sauvegarde.ts` (sauvegarde, vérification, restauration tout ou rien, comparaison), `scripts/centre-sauvegarde.ts`, `base/connexion.ts`.
- **Ce lot — liaisons réelles** : `reel-etat.ts` (deux clés), `liaisons-reelles.ts` (câble, commutation Boutique, porte du centre), `reel.ts` (armement, régime d'une ligne, désarmement, réconciliation, vue), migration `0003_liaisons_reelles.sql`, adaptations de `moteurs-commande.ts`, `moteurs-verification.ts`, `commandes.ts`, `transport.ts`, `regles.ts`, `protocole.ts`, `demarrage-centre.ts` ; plateforme : `server/shop-link/commutation.ts` (point d'accroche) et deux routes signées dans `server/shop-link/entrant.ts` ; **émetteur de référence** `scripts/boutique-emetteur-reference.mjs` et contrat [`CENTRE-COMMUTATION-BOUTIQUE-2026-10-09.md`](CENTRE-COMMUTATION-BOUTIQUE-2026-10-09.md) pour les agents de la Boutique (**le dépôt de la Boutique n'a pas été touché**).
- **Ce lot — voies de données** : un point d'accroche du portier dans `server/intelligences/api-v1.ts` (API de connaissance et d'analyse), sans effet tant que la gouvernance n'est pas armée.
- **Tests, CI, script navigateur** : voir §5 ; `.github/workflows/build-check.yml`, `scripts/test-centre-navigateur.mjs`.

## 5. Résultats des tests (exécutés, base locale jetable)

La suite complète du centre a été jouée **trois fois de suite** (journal brut : [`preuves/centre-tests-3-passes.log`](preuves/centre-tests-3-passes.log)) : **127 tests par passe, 0 échec**.

| Fichier | Tests | Ce qu'il prouve |
| --- | ---: | --- |
| `regles.test.ts` + `inventaire.test.ts` | 19 | règles pures (validité, admissibilité, matrice de passage, échanges en vol, jauges) ; relevé cohérent, noms non établis jamais inventés, **famille « stock propre » séparée et sans doublon** |
| `base.integration.test.ts` | 10 | trois migrations propres, idempotence, dérive, deux moteurs distincts en base, réserves, propriété explicite, secrets = références, « connecté » exige une mesure, journal en ajout seul |
| `fondation.integration.test.ts` | 7 | plateformes, 6 réelles + 30 réserves (+ 4 × 5), sept éléments, paires distinctes, versions, idempotence, 83 moteurs du registre + stock propre compté à part |
| `chaine.integration.test.ts` | 11 | les trois coupures : ordre vs résultat, deux moteurs et quatre accusés par coupure, grand contact, général, verrou, réserves, mode réel refusé |
| `transport.integration.test.ts` | 9 | coupure dans le transport : voie directe, secondaire, file, reprises, échange en vol, **paiement transmis suivi**, redémarrage |
| `pannes.integration.test.ts` | 12 | moteur arrêté, muet, désaccord, contact bloqué, coupure malgré une panne, idempotence, concurrence, jamais à moitié branchée, redémarrage |
| `protocole.integration.test.ts` | 4 | protocole des neuf étapes dans l'ordre exigé et essais de panne, 3 fois sur 3 lignes |
| `atelier.integration.test.ts` | 7 | diagnostic, test isolé, application, retour arrière exact, droits, invariants |
| `gouvernance.integration.test.ts` | 8 | non armée = aucun changement ; armée = voie fermée si la ligne n'est pas connectée ; le centre n'ouvre jamais ce que le câble refuse ; **les deux API de données (connaissance, analyse) consultent le portier : libres non armé, REFUSÉES armé** |
| `routeur.integration.test.ts` | 10 | réservé au PDG (toute procédure, y compris celles du mode réel), accueil mesuré, lignes, commandes, moteurs, mesures, sécurité (niveau de séparation mesuré, aucune adresse ni valeur de secret ; voies de données toutes consultées, navigation distinguée), atelier |
| `sauvegarde.integration.test.ts` | 8 | **niveau de séparation mesuré** (schéma partagé, base distincte, identique, inconnu, **serveur distinct** sur un second Postgres local) ; sauvegarde par empreintes, altération reconnue, **restauration tout ou rien** (cible vide seulement, migrations identiques, portes restaurées telles quelles, séquences), comparaison avant bascule |
| `reel.integration.test.ts` | 13 | **liaisons réelles** : deux clés (variable seule ou armement seul ne suffisent pas) ; ligne sans liaison jamais réelle ; activation = **vrai câble** `shop_link` fermé + ordre signé à la Boutique de référence + état relu ; **chaque coupure, seule, referme la voie réelle** (échange réel signé accepté puis refusé) ; Boutique silencieuse ou qui refuse : échec fermé, rien d'ouvert, incident ; câble sans effet : contact refermé ; mode retiré : plus rien ne passe, coupure toujours permise ; réconciliation ; redémarrage ; désarmement ; plan de commande (signature, horodatage, ligne inconnue, accusé plus ancien) |
| `autonomie.test.ts` | 3 | **aucun fichier du cœur du centre n'appelle une IA ni une API de fournisseur externe**, aucun n'importe `server/intelligences/` ; les 16 moteurs internes ne nomment aucune IA externe dans leur fonction |
| `developpement.test.ts` | 6 | **lacunes de développement** : déclaration idempotente, résolution par preuve observée (jamais par une IA), résolution par le PDG (confirmation et note exigées), ré-ouverture honnête, le balayage ne relève que ce qui est réellement vérifiable (l'émetteur de la Boutique) |
| **Total** | **127** | |

Autres vérifications, **deux passes de suite** : suites existantes touchées — `shop-link` (30 tests), `boutique` (22), coffre (6, dont 1 sauté de longue date), `shop-analysis` (2), `shop-knowledge` (4) — sans régression. `npm run typecheck` sans erreur ; `npm run build` complet sans erreur (contrôles, inventaires générés, vite, esbuild).

**Essai de bout en bout dans un vrai navigateur** (`scripts/test-centre-navigateur.mjs`, serveur construit, base jetable, Chromium) : tout l'essai du lot précédent (portail réservé au PDG, accueil, dix salles, aiguilles dont température « non mesurée », activation avec confirmation, grand contact, général, protocole 11/11, redémarrage réel du serveur, téléphone et tablette avec pincement) **plus** : réserves visibles et inertes (5 par groupe, 25 derrière un bouton, aucun bouton dessus) ; **comparaison mesurée au modèle** (moteur distant à gauche, contact rouge au centre de la ligne, moteur principal à droite, six fils par ligne, groupes dans l'ordre et vers le bas) ; niveau de séparation affiché ; voies de données (5, toutes consultées) et navigation (1) présentées à part ; **mode réel de bout en bout** : variable posée, armement refusé tant que la phrase n'est pas exacte, ligne passée en réel, activation pendant que la Boutique de référence accuse, **câble `shop_link` réellement fermé**, interrupteur local de la Boutique fermé, trois coupures étiquetées RÉELLES, fils parcourus par le courant, levier du contact fermé, **message signé accepté ligne connectée puis refusé (503) ligne coupée**, câble recoupé, désarmement qui remet la ligne en simulation, aucune erreur de page.

## 6. Journaux d'ordres et de confirmations

[`preuves/centre-journal-exemple.txt`](preuves/centre-journal-exemple.txt) : une commande de ligne réelle, ses trois coupures dans l'ordre (côtés locaux, centre en dernier), et pour chacune les accusés **des deux moteurs distincts** à chaque phase (contrôle préalable, exécution, vérification finale) avec durées, l'état final demandé / observé / avancement / preuve, et le journal d'audit en ajout seul.

## 7. Captures d'écran (ordinateur, 1440 px ; plus tablette et téléphone)

Dossier [`preuves/captures/`](preuves/captures/) (jouées sur la version finale) : `01-accueil-bureau` (aiguilles mesurées, séparation mesurée, noms exacts), `02-connexions-repos-bureau` (plan au repos : leviers relevés, réserves visibles et inertes), `04b` / `07b-plan-groupe-boutique-bureau` (la ligne connectée : fils parcourus par le courant, contact fermé *confirmé*), `03-fiche-moteur-bureau`, `09-boutiques-bureau` (dont le moteur de stock propre), `10-cybersecurite-bureau` (séparation, mode réel, voies de données et navigation), `11-atelier-bureau`, `12-incidents-audit-bureau`, `13-apres-redemarrage-bureau`, `22-tablette-connexions`, `22-telephone-connexions`, et le **mode réel** : `30-mode-reel-arme-bureau`, `31-mode-reel-connecte-bureau` (trois coupures « RÉEL », câble réel fermé), `32-mode-reel-coupe-bureau`. **Limite de la comparaison visuelle** : le modèle validé n'est pas dans le dépôt ; la comparaison est faite contre sa description écrite (Boutique à gauche, plateforme principale à droite, contacts rouges au centre, fils et petits moteurs visibles, groupes vers le bas) et mesurée sur les positions réelles dans le navigateur. Une comparaison à l'œil contre l'image d'origine reste à faire par le PDG.

## 8. Simulé / réel / manquant / bloqué

| Fonction | Statut |
| --- | --- |
| Commandes, deux moteurs, ordre vs résultat, transport, règle des échanges en vol, atelier, protocoles, mesures, redémarrage | **Simulé par défaut** — réellement exécuté, sur des contacts simulés par le centre, aucun réseau |
| Interrupteur local **principal** (plateforme) | **Réel quand la ligne est passée en réel** : il commande le vrai câble `shop_link` du canal et son état est **relu** dans le câble. Éprouvé en local |
| Contact **central** | **Réel quand la ligne est passée en réel** : la porte du transport, lue par le portier de toute voie réelle quand la gouvernance est armée. Éprouvé en local |
| Interrupteur local de la **Boutique** | **Côté plateforme réel et éprouvé** (ordres, accusés signés, fraîcheur, refus possible) ; **à finir par les agents de la Boutique** (émetteur) : sans lui, état inconnu, aucune ligne confirmée en réel. Contrat et émetteur de référence fournis |
| Mode réel | **Bloqué par défaut** : deux clés (variable `FRONTIER_MODE_REEL=oui` sur le service + armement du PDG avec phrase), puis ligne par ligne. **Jamais activé ici en production** |
| Gouvernance du câble | **Réel mais facultatif et non armé par défaut** ; ne fait que restreindre. Couvre désormais **toutes** les voies de données, y compris les API de connaissance et d'analyse |
| Bouton « Boutique » | **Navigation**, pas un échange de données : aucune donnée ne passe entre moteurs |
| Base indépendante | **Réelle en droit** ; séparation **mesurée** ; sauvegarde, restauration et comparaison **prêtes et testées** ; **base physiquement séparée : manquante** (second service Postgres à créer par le PDG, puis `FRONTIER_DATABASE_URL`) |
| Accès sécurisés | **Mesurés** (présence des clés publiques de la Boutique et des prérequis de chaque canal, jamais une valeur) ; **clés d'accès, API externes, accès employés, souscriptions : préparés, inactifs** |
| Canaux paiement et Google ; ligne « main-to-shop-entry » | **Bloqués** : activation externe côté Boutique, ou aucun canal côté plateforme — aucune liaison réelle possible |
| Map, IA Al-Houdoud M., Boutique Bijoux, futures plateformes | **Réserves vides** « À venir » ; Map non inventoriée (à vérifier) |
| Identité de « MKH Shop », « MKPMS Shop », « boutique principale » | Précisé par le PDG le 9 oct. 2026 : pas une boutique à part, le centre est installé dans la plateforme principale (MKAPMS Web) ; noms toujours absents du code, rien n'est fusionné |
| Température, capacité doublée | **Non mesurées / non prouvées** : aucune source, aucun facteur annoncé |
| Lacunes de développement | **Réel et testé** : le centre déclare honnêtement ce qu'il ne sait pas encore faire (aujourd'hui : l'émetteur de la Boutique), avec le développement exact nécessaire ; résolution par preuve observée ou par le PDG, jamais par supposition |
| Autonomie du cœur du centre | **Testée** : aucun fichier de `server/frontier-os/*.ts` n'appelle une IA ni une API de fournisseur externe (garde statique, `autonomie.test.ts`) |
| **Preuve en ligne** | **Manquante** : rien n'a été exécuté sur Railway ni contre la vraie Boutique |

## 9. Démarrage et retour arrière

Voir [`CENTRE-CYBER-ELECTRIQUE-2026-10-09.md`](CENTRE-CYBER-ELECTRIQUE-2026-10-09.md), §7. Le démarrage est automatique et non bloquant ; le retour arrière est le revert de la PR (le schéma `frontier` reste, inoffensif, effaçable par `DROP SCHEMA frontier CASCADE`). Pour rejouer l'essai navigateur : `npm run build`, puis `E2E_DB=<base jetable locale _test> E2E_CHROMIUM=<chromium> node scripts/test-centre-navigateur.mjs <dossier de captures>`.
