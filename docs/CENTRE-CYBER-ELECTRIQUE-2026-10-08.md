# Centre Cyber-Électrique MKA.P-MS / Frontier OS — la base (8 octobre 2026)

Centre de contrôle, de sécurité, de réparation et de pilotage entre plateformes, construit avec la logique « tout est moteur ». Ce lot pose la **base de données et l'architecture interne** et les premiers écrans (accueil, groupes, lignes, détail moteur) ; la vitrine finale viendra ensuite. Réservé au PDG (rôle `super_admin`), sans clé d'accès ni API externe pour le moment.

Accès : back-office → onglet « Administrateur / Directeur » → carte **Portail Frontier OS**, placée juste sous « Système Intelligent MKA.P-MS ». Page : `/admin/centre-cyber-electrique`. Le câble réel de la Boutique (moteur intermédiaire `shop_link`) reste accessible depuis le centre (`/admin/boutique-cable`).

## Mode : simulation seulement

Aucun bouton du centre ne branche ni ne débranche une connexion réelle. « Allumer » une ligne ne change que l'état de simulation du centre ; l'état réel d'un canal est seulement **lu** depuis le câble du moteur intermédiaire Boutique (jamais écrit). Le passage à l'action réelle exige un changement de code (`ACTION_REELLE_ACTIVEE` dans `rules.ts`) et l'audit final décidé par le PDG. Tout est journalisé, y compris les refus.

## Base de données (migration 0157, préfixe `fo_`)

Le préfixe évite toute collision (`audit_logs` existe déjà sur la plateforme). Les 12 tables demandées :

| Demandé | Table | Remarque |
| --- | --- | --- |
| platforms | `fo_platforms` | 9 plateformes : principale, Boutique, Map, IA Al-Houdoud M., Boutique Bijoux, Futures 01–03, externes clientes |
| engines | `fo_engines` | tous les types de moteurs demandés ; `state_source` dit d'où vient l'état (registre, câble, photo de la Boutique, centre) |
| engine_pairs | `fo_engine_pairs` | un moteur externe = une paire de **deux moteurs internes distincts** |
| buttons | `fo_buttons` | 10 boutons, chacun moteur + deux moteurs de contrôle distincts |
| switches | `fo_switches` | deux par ligne (gauche, droit) |
| connection_lines | `fo_connection_lines` | lignes réelles et futures |
| pointages | `fo_pointages` | le grand pointage rouge central de chaque ligne |
| memory_blocks | `fo_memory_blocks` | mémoire du système, sans secret |
| security_zones | `fo_security_zones` | les 10 salles |
| repair_workshop | `fo_repair_workshop` | diagnostic, réparation, retour arrière |
| audit_logs | `fo_audit_logs` | journal complet |
| control_groups | `fo_control_groups` | 8 groupes (Boutique, Map, IA, Bijoux, Futures 01–03, externes) |

Règles d'or **inscrites en base** (contraintes) : un bouton a toujours deux moteurs distincts ; un bouton critique (danger ≥ 3) exige une confirmation ; un interrupteur réel a deux moteurs distincts ; une paire a deux moteurs internes distincts et un moteur externe n'a qu'une paire ; une ligne future est vide, éteinte et désactivée.

## Analyse de la Boutique (lecture seule, aucune modification de la Boutique)

Relevé du dépôt `mkapms-shop` au commit `b057a2d` (8 octobre 2026) : **83 moteurs** déclarés dans son registre et **6 moteurs intermédiaires déjà préparés** pour la connexion à la plateforme — les cinq contrats de connexion de sa migration 0057 (`main-to-shop-entry`, `shared-stripe-account`, `shared-google-owner`, `shop-documents-only`, `shop-intelligence-isolated`) et son accès de service (`/api/service`, jetons à portées). Rien d'autre dans la Boutique n'est un intermédiaire vers la plateforme (ses autres connecteurs visent fournisseurs, transporteurs, paiement, canaux de vente).

Règle du PDG appliquée : 6 lignes réelles + 5 lignes futures vides par ligne réelle = **6 + 30 = 36 lignes** pour le groupe Boutique. Chacun des sept autres groupes garde une réserve de départ de 5 lignes futures vides (décision d'implémentation : sans ligne réelle, la règle donnerait zéro). La réserve est recomplétée à 5 par ligne réelle par le centre (idempotent). L'inventaire est une photo datée : l'état des moteurs de la Boutique reste « non observé » tant qu'aucune liaison contrôlée n'existe.

Écarts relevés, affichés dans le centre : (1) le canal `ia-memoire` de la plateforme n'a pas d'intermédiaire préparé côté Boutique ; (2) `main-to-shop-entry` n'a pas de canal côté plateforme (c'est un bouton) : sa ligne est réelle mais non valide, « à créer » ; (3) deux moteurs nommés par un contrat (`access.entry`, `seo.campaign`) n'existent pas dans le registre des 83 moteurs de la Boutique.

## Validité d'une ligne

Une ligne n'est valide que si ses quatre moteurs (réel et intermédiaire, de chaque côté) existent et sont réels, si **chaque moteur externe a une paire de deux moteurs internes valides**, si ses deux interrupteurs ont chacun deux moteurs utilisables et si son pointage existe sans erreur. Au départ : trois lignes valides (documents, état, accès de service) ; l'entrée (pas d'intermédiaire plateforme), le paiement et Google (attente d'activation externe côté Boutique) ne le sont pas, et le centre dit pourquoi. Une ligne n'est « allumée » que si ses deux interrupteurs sont sur ON **et** son pointage connecté.

## Écrans

Accueil à neuf jauges (puissance, sécurité, température des moteurs, connexions actives, erreurs, moteurs coupés, alertes, mémoire, réparation — toutes calculées, jamais inventées), groupes, salle d'activation (la centrale : moteur réel · intermédiaire · interrupteur · grand pointage rouge · interrupteur · intermédiaire · moteur réel ; Activer tout / Désactiver tout ; lignes futures vides repliables), moteurs avec détail (paire de contrôle, moteurs contrôlés, lignes, boutons, journal), cyber sécurité (espace préparé), atelier de réparation (diagnostic, réparation réversible, retour arrière), mémoire, audit.

## Atelier de réparation

Le diagnostic détecte paire manquante ou invalide, réserve de lignes entamée, moteur en erreur, ligne non valide. Seules les trois premières anomalies se réparent automatiquement, sur confirmation, avec retour arrière exact ; les autres demandent une intervention humaine et ne sont jamais « réparées » en silence.

## Vérifications

Tests `server/frontier-os/__tests__/` (règles pures, inventaire, 22 scénarios sur base jetable : fondation et idempotence, contraintes, paires, validité des lignes, boutons et confirmations, simulation sans toucher au câble réel, miroirs du câble et du registre, atelier et retour arrière, mémoire, journal, routeur PDG), typecheck et build complets, migrations sur base neuve, serveur construit piloté dans un navigateur (ordinateur et téléphone, y compris l'emplacement du portail et son absence pour un administrateur non PDG).

## Pas encore fait

Vitrine finale, clés d'accès (à la fin, bien sécurisées), accès API externe, branchement réel (audit final), canaux Map / IA Al-Houdoud M. / Bijoux, branchement des outils de l'IA sur le câble.
