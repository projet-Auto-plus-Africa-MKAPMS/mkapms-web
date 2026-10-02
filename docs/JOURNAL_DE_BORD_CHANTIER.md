# Journal de bord du chantier MKA.P-MS

Généré à partir de l'historique de la branche main (état 24ff441, dernier commit du 3 octobre 2026). Les textes détaillés de chaque livraison sont dans la mémoire de l'assistant (entrées `pr-<numéro>`, `commit-<hash>` et `recit-*`).

## Récit complet du chantier MKA.P-MS : chronologie du 10 août au 3 octobre 2026

CHIFFRES VÉRIFIÉS (historique de la branche main) : 699 commits, 293 fusions dont 283 portent un numéro de PR ; du 10 août au 3 octobre 2026. Familles de branches des PR numérotées : claude 152, devin 70, codex 17, fix 13, feat 7, ai 5, manus 4, autres 15. La famille de branche est le seul marqueur d'origine fiable de l'historique : « claude » désigne le travail de Claude ; devin, codex, manus, ai sont d'autres agents. Aucune attribution n'est inventée au-delà de ce marqueur.

PHASE 1 — 10 au 22 août (surtout branches devin) : fondations des moteurs et de leur contrôle.
Registre central des moteurs avec 5 états calculés et journal des modifications d'agents (points 41-42, PR 206) ; dépendances en cascade, validation avant action sensible, retour arrière (43-44, PR 207) ; assurance et bornes de recharge (45, PR 208) ; Reviews & Reputation Engine, faux avis traçables, droit de réponse (46-50, PR 209-210) ; paiement : le bouton ouvre l'écran carte (PR 225), la réponse brute du prestataire n'atteint plus le client et la clé Stripe est vérifiée au démarrage (PR 226) ; audit d'activation général existe/connecté/activé/testé/utilisé (91, PR 227) ; indexation Google URL par URL (92-101, PR 228) ; pipelines Véhicules/Produits et Google Product Engine (94-97, PR 229) ; audit des 16 capacités sur preuve d'usage (102-103, PR 230) ; Event Bus central (104-107) ; contrôle continu avec preuve datée (108-113, PR 233-234) ; Code Knowledge Graph (114-118, PR 235) ; règle TERMINÉ calculée et Completion Center (119-122, PR 236) ; MKA.P-MS Intelligences : appels réels au fournisseur (PR 237), registre des capacités, API /v1 et fournisseur direct interdit (124-129, PR 240), orchestrateur de missions et 7 niveaux d'autonomie (130-133, PR 241), mémoire fédérée et apprentissage après action (134-139, PR 242), observabilité 24/7 (140-144, PR 243), actions de direction et mode shadow (145-149, PR 244), fonctionnalités fournisseur éteintes par défaut (150-151, PR 245). Le 22 août la PR 246 annule la fusion de la PR 232 (marque, rendu du logo).

PHASE 2 — 23 août au 11 septembre : brancher les écrans aux moteurs.
Moteur de livraison de véhicules (PR 249), diagnostic de risque à l'importation (PR 248), Estimation Hub (PR 250), moteur de redirection branché partout (PR 252-253), assistant mondial joignable sur les pages publiques (PR 255), diagnostic des clés du fournisseur de modèles avec bandeau visible (PR 262) et fournisseurs manquants nommés (PR 256), diagnostic actionnable des moteurs dégradés (PR 258), vérification de propriété Google/Bing/Yandex/Facebook/Pinterest (PR 260), suppression de compte réellement exécutée (PR 257), vrais documents imprimables au lieu d'une notification verte (PR 266), contrôle d'authenticité sur chaque pièce KYC (PR 271), cloisonnement VO officiel/pro/particulier décidé par le serveur (PR 268), montant du devis calculé par le serveur (PR 267), filtres de recherche réellement appliqués (PR 272), boutons morts du garage reliés (PR 273), Moteur de boutons (PR 274), Moteur d'Atelier (PR 275) et réapprovisionnement gouverné (PR 281), pages d'accueil des 15 sections et 247 écrans vides recensés (PR 280), correctifs de registre et migrations 0106/0107 du journal Drizzle (PR 276, 278).

PHASE 3 — 11 au 25 septembre (surtout branches claude) : fournisseurs, sécurité des routes, fin des écrans fabriqués.
Le 11 septembre une entrée de mémoire fait échouer le build de production (PR 294, voir le récit des problèmes). Lots IA02B et IA02F (noyau conversationnel, mémoire/fichiers/RAG). Le 15 septembre : plan maître fournisseurs retranscrit intégralement (PR 331) puis LOT 1 Supplier Engine (PR 332), LOT 2 Vehicle Engine (PR 333), LOT 3 Parts Engine (PR 334), LOT 4 Logistics Engine (PR 336), LOT 5 Payout Engine (PR 337), LOT 6 Document Engine (PR 339), LOT 7 partiel : tableau de bord Direction, Ledger, commissions réelles (PR 340) ; la PR 335 corrige le mot interdit qui bloquait tout déploiement depuis le LOT 2. Sécurité : 64 routes Pro/internes verrouillées par le Permission Engine (PR 313). Cinq applications Android : chaîne de build des .aab (PR 371), version 1.7.6 (PR 364), écran « Connexion indisponible » hors réseau (PR 365). Puis une longue série de PR « reconnecte l'écran X au vrai moteur » : fiche historique, dossier client, comptabilité dirigeant, démarches, notifications, Mon espace, location (candidature, contrats, catalogue camions/minibus/utilitaires), publicité, journal d'activité, essai routier, garage, avis (PR 313-411 environ), avec le compteur de boutons sans action qui baisse de 163 à 131 sur les seules PR 383, 384, 387.

PHASE 4 — 26 septembre au 3 octobre : l'espace AL-HUDHUD·M, la voix, la mémoire, la boutique, les pièces.
Espace de conversation unifié et identité publique AL-HUDHUD·M (PR 475-477, 482, 498, 501-502), pièces automobiles : catalogue, boutique, fiche produit, panier persistant (PR 505-511, branches codex), urgence du 1er octobre : « restaurer Railway et la voix multi-appareils » (PR 508). Le 2 octobre (détaillé dans le récit de cette journée) : micros et voix, coffre secret, boutique SHOP, mémoire automobile, Global Country Engine réservé au PDG, postes d'équipe, pays cliquables à l'accueil, sonde des capacités du fournisseur de modèles, mémoire par le sens, agent développeur. Derniers commits de l'historique (2 et 3 octobre) : travail affiché étape par étape et menu repliable (PR 549), mémoires activables (PR 550), dictée (PR 551), menu du trombone (PR 552), connexion Google dans les cinq applications (PR 553), branches devin.

**Pourquoi.** Le PDG a demandé un récit complet et honnête de tout ce qui a été fait sur la plateforme, enrichi dans la mémoire de l'IA : ce qui existe déjà est laissé tel quel, ce qui manque est ajouté. Cette entrée fixe le fil chronologique ; les entrées pr-<numéro> et commit-<hash> donnent le détail de chaque livraison qui manquait.

**Leçon.** Une chronologie n'est fiable que si chaque chiffre et chaque numéro de PR se retrouvent dans l'historique du dépôt. Les chiffres de cette entrée ont été comptés dans l'historique de main le 3 octobre 2026 ; en cas de doute, c'est l'historique git qui fait foi, pas ce récit.

## Comment le travail est mené : audit avant construction, jamais de fabrication, preuves réelles, build complet avant publication

Pratiques constantes relevées dans les messages de commit (les numéros de PR sont ceux où la pratique est écrite noir sur blanc) :

1. AUDIT PRÉALABLE AVANT TOUTE CONSTRUCTION. Les lots 2, 3 et 4 du plan fournisseurs commencent par « Audit préalable complet … avant tout développement » (PR 333, 334, 336) ; la tâche location flotte est « auditée avant toute construction pour éviter une duplication » : rentalApplications existait au schéma sans aucun routeur (grep exhaustif, zéro usage).
2. ÉTENDRE, JAMAIS DUPLIQUER. Règle d'architecture « un moteur pour chaque domaine » ; un profil fournisseur s'ajoute au-dessus d'un partner existant (PR 332) ; VehiculesCertifies est reconnecté à selectionMka déjà utilisé sur l'accueil plutôt qu'un second moteur ; la publicité est reliée au moteur pub_requests déjà réel.
3. NE JAMAIS FABRIQUER. Un écran qui affichait des données inventées est soit relié à un moteur réel qui existe déjà, soit vidé avec un état honnête qui dit pourquoi (par exemple « Scanner OBD-II non connecté » au lieu de codes défaut inventés). Un bouton qui annonce une action sans la faire est le pire cas : il est relié ou retiré. Le compteur de boutons sans action sert d'instrument de mesure (163→147 PR 383, 147→138 PR 384, 138→131 PR 387).
4. DÉCOUVERTES ANNEXES TRACÉES, PAS BÂCLÉES. Quand un défaut voisin demande un vrai chantier (ListeAttente, suspension de compte, paiements de location), il devient une tâche numérotée au lieu d'une correction superficielle.
5. ÉTATS HONNÊTES. Un moteur sans preuve reste « staging » ou « not_connected » (Connector Engine du LOT 1, vo_espaces en staging « pas d'état actif sans preuve ») ; une capacité n'est jamais « fonctionnelle » avant un vrai appel par l'adaptateur de la plateforme.
6. VÉRIFICATION EN CONDITIONS RÉELLES. Tests contre une vraie base PostgreSQL, parcours HTTP complets, navigateur réel (Playwright) avec clics réels, données de test nettoyées après coup. Un test de non-régression est validé en le faisant échouer volontairement avant de restaurer la correction (PR 381) ; les mutations volontaires des règles sont détectées par les tests (travaux du 2 octobre).
7. BUILD COMPLET AVANT TOUTE PUBLICATION. Le déploiement Railway exécute npm run build : check:routers, check:naming, check:identite, check:providers, check:public-provider-leaks, check:intelligence-chat, check:routes, check:boutons, check:cliquables, check:sections, check:moteurs, check:migrations, puis build:graph, build:client, build:server. La séquence est reproduite exactement en local avant de pousser (PR 294), et l'artefact node dist/server.js est démarré et interrogé (PR 335, 336, 339).
8. INVENTAIRES GÉNÉRÉS À RÉGÉNÉRER. Boutons, cliquables, routes, sections, moteurs et graphe de code sont générés ; un inventaire périmé fait échouer le build (PR 269, 446, 508).
9. MIGRATIONS ADDITIVES ET JOURNAL TENU. Chaque migration est additive ; le journal Drizzle est tenu à la main car drizzle-kit generate est cassé (tâche 61) ; check:migrations valide la chaîne ; une migration absente du journal n'est jamais appliquée (PR 278).
10. MÉMOIRE DES LIVRAISONS. Chaque livraison est inscrite au registre server/intelligences/livraisons.ts : ce qui a été fait, pourquoi, où, la leçon. Une entrée n'est jamais modifiée après fusion ; une correction est une nouvelle entrée.
11. UNE PR PAR SUJET. Les PR sont fusionnées dès que la CI est verte sur le dernier commit ; un correctif qui arrive après la fusion est une nouvelle PR, jamais un empilement sur une PR fusionnée.

**Pourquoi.** Le PDG demande que l'IA connaisse non seulement ce qui a été fait mais la manière dont les problèmes ont été trouvés et corrigés, pour qu'elle travaille de la même façon : analyser avant de travailler, ne rien inventer, prouver avant d'affirmer.

**Leçon.** Analyser avant d'agir, réutiliser avant de construire, dire ce qui manque au lieu de l'inventer, prouver par un vrai test, et reproduire en local exactement ce que la production exécutera : ce sont les cinq réflexes qui ont évité le plus de retours en arrière.

## Catalogue des problèmes rencontrés : symptôme, cause réelle trouvée, correction, leçon

Chaque problème ci-dessous est tiré d'un message de commit ou d'une livraison ; le numéro de PR permet de relire le détail.

1. BUILD DE PRODUCTION BLOQUÉ PAR UN MOT INTERDIT (PR 335, 15 septembre). Symptôme : aucune publication des lots Vehicle Engine et Parts Engine n'avait pu être déployée. Cause : check:naming échoue le build dès qu'une chaîne visible contient le mot isolé « IA » ou « AI » ; 18 occurrences (noms de section, commentaires, messages) avaient été introduites depuis le LOT 2, et seuls les tests et le mode développement avaient été vérifiés. Correction : libellés renommés, aucun code métier changé. Leçon : lancer npm run build complet (12 contrôles + build) et démarrer dist/server.js avant de déclarer un lot livré.
2. BUILD CASSÉ PAR UNE ENTRÉE DE MÉMOIRE (PR 294, 11 septembre). Symptôme : le déploiement Railway échoue après la PR 293. Cause : check:providers scanne le texte brut de tous les fichiers, y compris les commentaires ; l'entrée de livraison citait des noms de variables de clés de fournisseurs, et une seconde occurrence de « IA » faisait échouer check:naming. Correction : même information reformulée sans citer ces noms. Méthode : les journaux de compilation de l'échec Railway ont été lus et la séquence EXACTE des 13 étapes a été rejouée en local. Leçon : le registre des livraisons est lui aussi du code scanné par les garde-fous.
3. INVENTAIRES GÉNÉRÉS PÉRIMÉS (PR 269 le 30 août, 446 le 25 septembre, 508 le 1er octobre). Symptôme : déploiement Railway bloqué. Cause : une PR ajoute un écran, un bouton ou un moteur sans régénérer les inventaires (routes, boutons, cliquables, moteurs) que check:* compare au code. Correction : regénérer puis recommitter. Le 1er octobre l'urgence « restaurer Railway et la voix multi-appareils » répare les inventaires qui bloquaient les publications 505 à 507. Leçon : npm run gen:* dès que check:* signale une dérive.
4. MIGRATIONS JAMAIS APPLIQUÉES (PR 278, 1er septembre). Symptôme : tables des avis et de Google Business absentes, moteurs en alerte. Cause : les fichiers SQL 0106 et 0107 existaient mais n'étaient pas inscrits dans le journal Drizzle, donc jamais exécutés au démarrage. Correction : entrées ajoutées au journal. Le diagnostic des moteurs (PR 258) indique désormais les tables manquantes et recommande « Appliquer les migrations ».
5. ACCOLADE MANQUANTE APRÈS UNE FUSION (PR 422, 25 septembre) : conflit de fusion mal résolu dans catalogue.ts, corrigé et inventaires régénérés. Leçon : après chaque fusion de main, relancer le build.
6. ÉCRANS ENTIÈREMENT FABRIQUÉS (dizaines de PR en septembre : historique véhicule avec faux paiement Stripe, dossier client, comptabilité dirigeant, journal d'activité, publicité, location camions/minibus/utilitaires, pénalités, état du véhicule, diagnostic OBD…). Cause : écrans écrits avec des tableaux en dur et des setTimeout qui simulent un succès, alors qu'un moteur réel existait souvent déjà côté serveur sans jamais être appelé. Correction : relier l'écran au moteur existant ; sinon vider avec un état honnête. Un risque réel était caché : des identifiants fabriqués menaient à ProduitLocation qui interrogeait une vraie annonce sans rapport. Leçon : un écran fabriqué est un défaut de sécurité autant que d'affichage.
7. « RÉSOLU » QUI MENT (PR 386). Symptôme : cliquer Résolu sur une alerte bouton puis rafraîchir fait revenir le même problème. Cause racine : resolveAlertWithLearning marquait le contrôle de santé « ok » sans qu'aucun code n'ait changé ; le scan suivant constatait que le bouton était toujours dans l'inventaire et rouvrait l'alerte. Correction : isKnownGhostButton vérifie que le bouton a réellement disparu avant de promettre ; sinon l'alerte reste « prise en compte » avec un motif exact. Leçon : un état ne se déclare pas, il se constate.
8. FAUX POSITIFS DES AUDITS. (a) Huit moteurs signalés « Existe mais non connectée » alors qu'ils filtrent le catalogue annonces partagé : ROUTEURS_PARTAGES ajouté à l'auditeur, controle_technique volontairement laissé en défaut réel. (b) Contrôle continu : la destination /pays/france était jugée inconnue parce que comparée à la liste littérale des routes ; isRoutablePath est utilisé (PR 330), 28 liens morts réels corrigés au passage. (c) Bandeau « dépendance circulaire : aucun ordre de démarrage possible » contredisait la doc du détecteur (PR 325).
9. PAIEMENTS CASSÉS DEPUIS LEUR ÉCRITURE (PR 381). Cause : trois parcours (devis garage, abonnement carte grise, pack de dossiers) passaient un type de paiement absent de l'énumération PostgreSQL ; confirmé par un INSERT direct. Autres : webhook sans gestionnaire pour carte_grise_service (le client payait, le dossier n'avançait jamais), absence d'idempotence sur les redélivrances Stripe, vocabulaire « Caution » pour un encaissement immédiat (corrigé en « Acompte »), montant du devis fait confiance au client (désormais calculé par le serveur, PR 267), réponse brute du prestataire renvoyée au client (PR 226).
10. DÉRIVE ENTRE SCHÉMA ET BASE (PR 334 et LOT 5). Cause : deux fichiers déclaraient les mêmes tables pièces avec des colonnes différentes, seule une version étant migrée ; l'estimation budget pièces joignait une table orpheline toujours vide ; quatre tables du Ledger avaient des colonnes déclarées jamais migrées. Correction : une seule définition, code mort supprimé, migrations additives.
11. SÉCURITÉ. 64 routes Pro/internes se rendaient pour n'importe quelle adresse tapée (PR 313) : verrouillées par le Permission Engine. annonces.get exposait les brouillons à qui devinait un identifiant (corrigé : visibles du propriétaire et des administrateurs). Un professionnel sans abonnement atteignait les écrans VO (cloisonnement décidé par le serveur, PR 268). Le 2 octobre, le Global Country Engine était joignable par le public : réservé au PDG, avec les lectures publiques réduites à nom, langues et devise.
12. PANNE DU CHAT PRINCIPAL (PR 262). Symptôme : le PDG ne pouvait pas envoyer de commande à l'assistant. Cause : aucun fournisseur de modèles configuré en production, l'envoi échouait silencieusement avec « aucun fournisseur habilité ». Correction : procédure de diagnostic (présence seulement, aucune valeur) et bandeau rouge qui nomme la variable manquante. Suites : sonde des capacités par vrais appels (2 octobre).
13. VOIX TEMPS RÉEL. L'offre WebRTC partait sans saut de ligne final (400 invalid_offer) parce que le serveur la nettoyait : analyseur SDP strict vérifié sur une vraie offre Chromium (brute acceptée, nettoyée refusée, nettoyée avec CRLF acceptée). Bannière d'installation qui recouvrait le bouton stop (z-index 10000). Modèles de transcription refusés par le projet (model_not_found) : repli sur une liste fermée et modèle retenu par le navigateur. Micro bleu : démarrage annoncé avant que la session soit prête. Défaut d'affichage reproduit à 320×568 avant d'être corrigé.
14. MODE TRAVAIL ARRÊTÉ DÈS L'ANALYSE (2 octobre). Cause : le moteur de l'orchestrateur n'avait pas la permission ANALYZE ; toute mission s'arrêtait. Correction : ANALYZE et PROPOSE accordés (jamais WRITE, TEST, DEPLOY), Chat et Travail alignés sur une même mémoire.
15. DÉPENDANCES DE REGISTRE ET ÉTATS BLOQUÉS (PR 276, 344). Le registre déclarait des dépendances trop courtes (Smart, Permission, Redirection) et un cercle staging → non configurée interdisait toute promotion sur preuve : dépendances alignées, circularité corrigée.
16. PR FUSIONNÉES AVANT LEURS CORRECTIFS (2 octobre). Constat : une PR était fusionnée dès que la CI était verte sur son premier commit, avant les correctifs de relecture. Pratique : tout mettre dans la PR avant la fin de la CI ou ouvrir une PR de suite (PR 543 → 544 → 545 pour la mémoire par le sens).
17. INCIDENT DE SECRET. Un identifiant de base de production est apparu une fois dans la sortie d'un outil ; le PDG a été invité à le renouveler. Règle depuis : toute commande de test locale s'exécute avec un environnement vidé (env -i) contre une base locale jetable ; aucune clé n'est collée en conversation ni dans le code.

**Pourquoi.** Le PDG veut que l'IA retienne comment les problèmes ont été trouvés et résolus, y compris ceux qui ont persisté, afin de ne pas les revivre et de chercher la cause racine plutôt que le symptôme.

**Leçon.** La cause racine se trouve presque toujours en reproduisant le défaut exactement comme la production le subit (journaux de compilation, INSERT direct, offre SDP réelle, écran à 320×568), puis en montrant le même contrôle qui passe. Un symptôme corrigé sans cause reproduite revient.

## Retours en arrière : ce qui a été fait, ce qui existe dans la plateforme, et ce qui manque encore

CE QUI S'EST RÉELLEMENT PASSÉ DANS L'HISTORIQUE
- 22 août : la PR 246 annule (revert) la fusion de la PR 232 (logo : lettre S entièrement visible et ligne lumineuse). Le message du revert ne donne pas la raison ; la cause n'est donc pas affirmée ici.
- Réparations « en avant » plutôt que retours : le 30 septembre « restaurer les fichiers complets du changement vocal » ; le 1er octobre « Urgence : restaurer Railway et la voix multi-appareils » (PR 508) répare les inventaires générés qui bloquaient les publications 505 à 507 ; le 15 septembre la PR 335 lève le mot interdit qui bloquait tout déploiement ; le 11 septembre la PR 294 reformule l'entrée de mémoire qui cassait le build.
- 2 octobre : trois PR de suite pour une même livraison (mémoire par le sens : 543, 544, 545) parce que la fusion automatique survient dès que la CI est verte sur le premier commit.

COMMENT LA CAUSE A ÉTÉ CHERCHÉE À CHAQUE FOIS
Lire le journal de compilation de l'échec ; reproduire localement la séquence exacte ; isoler le contrôle qui échoue ; corriger ; rejouer toute la séquence ; seulement ensuite pousser. Pour la voix : analyseur SDP réel sur une offre générée par Chromium. Pour un test de non-régression : le faire échouer volontairement avant de rétablir la correction.

CE QUI EXISTE DANS LA PLATEFORME AUTOUR DU RETOUR ARRIÈRE (vérifié dans le code)
- Journal des modifications d'agents (agent_change_log) avec rollback_plan ; l'analyse d'impact signale « Aucune procédure de retour arrière documentée : en cas d'incident, la remise en état sera improvisée ».
- Passages de pipeline avec rollbackPlan ; le Completion Center calcule « retour arrière disponible » dans le rapport de fin de travail.
- Action de direction « retour arrière d'un passage de pipeline » : elle DÉCLARE le retour arrière et rouvre la surveillance ; elle n'exécute aucun redéploiement.
- Sauvegarde et restauration (backup-os) : la demande de restauration NE restaure PAS ; elle attend la validation humaine du PDG.
- Approbateurs de déploiement nominatifs et lecture réelle de l'état Railway en lecture seule. Les fonctions de déclenchement et de retour arrière d'un déploiement Railway sont volontairement NON implémentées : l'application ne déploie ni ne restaure elle-même.

CE QUI MANQUE (demande du PDG, formulée après la PR 553, qu'il ajoutera lui-même) : quand l'IA déploie un code et qu'un problème apparaît, pouvoir revenir en arrière pour remettre la plateforme, ou la partie touchée, comme avant. État de la branche main à son dernier commit (3 octobre 2026) : cette capacité n'existe pas. Rien n'est promis comme disponible.
Pistes à valider avant toute construction (non construites) : jeton Railway autorisé à redéployer le déploiement précédent ; demande d'approbation nominative comme pour un déploiement ; déclenchement seulement après constat réel de l'échec (statut du déploiement et santé de la plateforme), jamais sur supposition ; trace dans le journal des modifications d'agents ; distinction explicite entre retour arrière du CODE et retour arrière des DONNÉES (une migration additive ne se défait pas en redéployant l'ancien code, une migration destructive n'est jamais lancée automatiquement).

**Pourquoi.** Le PDG veut savoir comment les problèmes ont été défaits, et que la plateforme sache un jour se remettre d'un mauvais déploiement. Il faut donc distinguer le fait (ce qui a été annulé ou réparé), l'existant (ce que le code permet déjà) et le manque (ce qui reste à construire sur sa demande).

**Leçon.** Distinguer toujours trois choses : ce qui a été fait, ce que le code permet déjà, ce qui manque. Une capacité de retour arrière déclarée mais non exécutable doit être dite telle quelle ; elle ne doit jamais être présentée comme un filet de sécurité réel.

## Récit des travaux de Claude des 1er et 2 octobre 2026 : micros, coffre, boutique, mémoire, sécurité, agent développeur

Chaque ligne est tirée d'un commit ou d'une PR de ces deux jours ; le détail technique est dans les entrées pr-/livraison correspondantes.
1er octobre — Micros : la bannière d'installation (z-index 10000) recouvrait le bouton stop et interceptait le clic ; connexion vocale annulable, canal d'événements surveillé, codes d'échec de transcription visibles, dictée du navigateur en relais si la liaison ne s'établit jamais.
2 octobre —
• Voix : l'offre WebRTC partait sans CRLF final (400 invalid_offer), corrigé et vérifié sur une vraie offre Chromium ; modèle de transcription de repli ; toutes les voix du mode direct avec aperçu « Écouter cette voix » ; micro bleu qui annonce « Je vous écoute » seulement quand liaison, canal et session sont prêts, salutations arabes en lettres latines, micro borné dans le cadre du téléphone (défaut reproduit à 320×568).
• Coffre secret : « Ajouter un secret » illimité ; plus aucun bouton mort ; clé maître absente = consigne et défilement vers la carte d'activation ; jamais de nouvelle clé quand des secrets existent déjà (il faut restaurer la clé d'origine) ; états chargement/erreur/clé absente distingués.
• Boutique SHOP : cinq outils d'accès de service (capacités, liste, lecture, lancer les photos, brouillon de fiche jamais publié), adresse et jeton lus dans le Coffre, 23 entrées de la mémoire de la boutique reprises mot pour mot ; l'IA ne réclame plus jamais le jeton de la boutique pour du développement ou un déploiement.
• Autonomie : section « Autonomie de travail » dans la consigne de la direction (exécuter, enchaîner les outils, chercher une autre solution, rendre compte) avec limites inchangées ; boucle d'outils portée de 5 à 12 tours ; les outils HIGH/CRITICAL restent refusés par la politique.
• Mode Travail réparé (permission ANALYZE manquante au moteur de l'orchestrateur) et Chat/Travail alignés sur une même mémoire.
• Mémoire automobile : référentiel de départ avec provenance (436 marques notables, catégories, 24 systèmes, 212 familles de pièces, statut « propose »), synchronisation mensuelle des marques depuis la source publique NHTSA, outil automobile.rechercherMemoire ; 23 souvenirs des travaux des 1er et 2 octobre.
• Connexion Google : le bouton ne fait plus semblant ; identifiant lu à l'exécution côté serveur ; adresse vérifiée exigée pour rattacher un compte existant.
• Sécurité urgente : Global Country Engine réservé au PDG (route verrouillée par le Permission Engine, écritures et santé réservées, liste publique réduite).
• Équipe : postes sous-directeur, comptable, chef d'équipe, investisseur, partenaire ; création de compte interne avec poste ; seul le PDG crée un compte Administration et attribue un poste.
• Accueil : cartes de pays cliquables pour choisir son pays, sans réglages visibles du public.
• Sonde des capacités du fournisseur de modèles : liste des modèles du projet puis un vrai appel par capacité, états séparés, FUNCTIONAL seulement via l'adaptateur de la plateforme, preuves en base sans clé ni message brut.
• Mémoire par le sens (embeddings) : passerelle, table in_empreintes, indexation à l'écriture, reprise de l'existant par lots, recherche par le sens après la recherche textuelle, éteinte par défaut ; corrections de revue : droits appliqués avant le classement, versions périmées purgées, repli de modèle durable, verrou de ligne contre le remplacement concurrent.
• Agent développeur : demande courte = reprise de la mission active ou une seule question ; « inconnu » n'est jamais un composant ; étapes « faites » seulement avec preuve ; autorisation par opération réelle ; reprise avec résultats conservés ; mémoire sans doublons (migration 0155 conserve l'ancien compteur) ; huit défauts de revue corrigés avant fusion de la PR 547.

POINTS ENCORE OUVERTS À CETTE DATE : « tout mettre en marche » (autonomie maximale) attend l'accord du PDG, avec la proposition de garder paiements et infrastructure fermés ; clé maître du Coffre à poser dans Railway ; rôle comptable ; résultats de la sonde après redéploiement ; activation de « Recherche par le sens » et de « Reprendre l'existant » ; instructions page par page pour optimiser la plateforme principale.

**Pourquoi.** Garder dans la mémoire de l'IA le récit détaillé et exact des deux journées les plus denses, avec ce qui a été trouvé, corrigé et ce qui reste ouvert.

**Leçon.** Une journée très dense reste sûre si chaque livraison est vérifiée sur un vrai parcours, inscrite à la mémoire, et si ce qui reste ouvert est écrit au lieu d'être sous-entendu.

## Règles permanentes données par le PDG et pratiques qui en découlent

RÈGLES PERMANENTES MKA.P-MS (telles que transmises dans les consignes de travail) :
- Ne jamais fabriquer : une donnée, un état, un résultat ou un bouton qui n'a pas de preuve réelle.
- Compléter le travail des autres ; ne jamais le dupliquer ni le remplacer.
- Ajouter une entrée au registre des livraisons pour chaque livraison.
- Exécuter la commande de build exacte de la CI avant chaque publication, et régénérer les inventaires quand ils dérivent.
- Une PR par tâche ; elle est fusionnée quand la CI (build et shop-knowledge) est verte sur le dernier commit et qu'aucun fil de relecture n'est ouvert ; répondre aux fils traités et les résoudre.
- Retour d'expérience du PDG : « Dès que je te dis qu'il y a des problèmes, il ne faut pas insister. Direct, cherche le problème. »
- Ne jamais toucher aux données ni à la base de production ; aucun secret dans le code ni en conversation ; tests locaux avec un environnement vidé et une base locale.
- Ne rien désactiver, ne rien diminuer : les capacités et les API existantes se conservent ; on développe en plus (consigne la plus récente du PDG).
- Le nom officiel de l'assistant et les noms visibles sont ceux fixés par le PDG ; le mot isolé « IA »/« AI » ne s'écrit pas dans les libellés visibles (garde-fou check:naming).
- Plan maître fournisseurs : retranscrit sans simplification ni suppression ; toute capacité listée reste prévue dans l'architecture même si elle n'est pas utilisée tout de suite ; l'activation se fait par permissions, abonnement, pays, contrat, fournisseur, risque ou validation humaine ; les clés d'API ne sont jamais exposées (frontend, mobile, journaux publics, dépôt).
- Décisions de direction jamais automatiques : validation du fournisseur, signature de contrat, publication, déploiement, paiement.

**Pourquoi.** Les règles du PDG doivent rester disponibles pour toute mission future de l'IA, sans qu'il faille les répéter.

**Leçon.** Une règle donnée une fois par le PDG est une règle permanente : elle s'applique aux missions suivantes sans qu'on le lui redemande.

## Chantiers encore ouverts au 3 octobre 2026 (suivi des tâches) et décisions en attente du PDG

CHANTIERS NOMMÉS DANS LE SUIVI DES TÂCHES ET NON TERMINÉS
- Completion Center : combler la couverture (liste des domaines incomplète) ; connecter les 9 domaines d'intelligence sans implémentation réelle.
- Détecteur de cartes de tableau de bord non cliquables ; audit des boutons sans action (77 écrans sur 89 sans aucun backend) ; flux garage, vente/Centre* et location flotte/réservation sans backend ; écrans vente/véhicule et démarches/dépôt d'annonce restants.
- Identité légale réelle de MKA.P-MS Guinée à saisir dans le registre (RCCM, NIF, adresse, représentant).
- Couverture premium multi-pages et filigrane verrouillé VO v7 ; rattachement recordEdition() sur les écrans restants ; immutabilité réelle d'un document signé et rendu PDF en images pour contrôle visuel.
- Paiements manquants : location, facture autonome, photos supplémentaires/options premium, gagnant d'une enchère, règles de paiement international (table jamais alimentée), émission active de remboursement/annulation ; audit de la couverture des cas de paiement.
- Catégorisation du chiffre d'affaires par univers ; CentrePilotage de comptabilité encore fabriqué ; DocumentPDF qui fabrique une adresse et un e-mail client.
- Clé de calcul de distance routière à fournir (sans elle le devis reste « Non mesuré »).
- drizzle-kit generate à réparer (chaîne de snapshots divergente depuis 0010) ; vérifier en production la migration des tables cpe_rules et cpe_evaluations.
- Moteurs Google distincts par type d'objet, découvrabilité de tous les univers publics, SEO par intention de recherche, moteurs de campagnes principale et boutique, prospection B2B, remplacement du libellé « bloqué par validation externe » par une attente d'activation avec reprise automatique, écran Global Country Engine à reconnecter sur le moteur réel.

DÉCISIONS ET ACTIONS EN ATTENTE DU PDG
- « Tout mettre en marche » (autonomie et automatisation au maximum) : proposition de tout activer en gardant paiements et infrastructure fermés au niveau 7 tant que le PDG ne le demande pas.
- Poser la clé maître du Coffre dans Railway (et restaurer la clé d'origine si des secrets existent déjà) puis déposer les jetons des outils.
- Rôle du comptable ; outillage d'écriture et de déploiement de l'IA ; retour arrière automatique d'un déploiement problématique (voir l'entrée dédiée).
- Rotation de l'identifiant de base de production apparu une fois en sortie d'outil.
- Instructions page par page pour optimiser la plateforme principale.

**Pourquoi.** Pour que l'IA sache exactement ce qui reste à faire et ce qui dépend d'une décision humaine, sans présenter un chantier ouvert comme terminé.

**Leçon.** Un chantier ouvert se nomme ; il n'est jamais compté comme livré. Cette liste est celle du suivi des tâches au 3 octobre 2026 et doit être relue contre le suivi courant avant d'être citée.

## Index de toutes les PR numérotées

| PR | Date | Famille | Titre | Mémoire |
|---|---|---|---|---|
| 51 | 2026-09-25 | autre | superadmin — suspension de compte réelle avec révocation immédiate (tâche #51) + AdminUtilisateurs.tsx sur données réelles | déjà en mémoire (ou fusion sans commit propre) |
| 206 | 2026-08-10 | devin | registre — points 41-42 — registre central avec 5 états opérationnels calculés + journal des modifications d'agents | ajoutée |
| 207 | 2026-08-10 | devin | moteurs — points 43-44 — dépendances en cascade, validation avant action sensible, anomalies consolidées, retour arrière | ajoutée |
| 208 | 2026-08-10 | devin | assurance+recharge — point 45 — mise en relation assurance auto et annuaire des bornes de recharge | ajoutée |
| 209 | 2026-08-10 | devin | avis — points 46-47-48 — Reviews & Reputation Engine, dépôt/consultation par univers, expérience vérifiée après transaction réelle | ajoutée |
| 210 | 2026-08-10 | devin | avis — points 49-50 — détection des faux avis traçable et droit de réponse des professionnels | ajoutée |
| 225 | 2026-08-14 | devin | paiement — le bouton de paiement ouvre l'écran carte au lieu du portefeuille | ajoutée |
| 226 | 2026-08-15 | devin | paiement — la réponse brute du prestataire n'atteint plus le client + clé Stripe vérifiée au démarrage | ajoutée |
| 227 | 2026-08-16 | devin | audit — point 91 — audit d'activation général (existe / connecté / activé / testé / utilisé) | ajoutée |
| 228 | 2026-08-16 | devin | indexation — points 92-101 — audit Google URL par URL, moniteur PDG, alertes de visibilité | ajoutée |
| 229 | 2026-08-16 | devin | produits — points 94-97 — pipelines Véhicules/Produits séparés, Google Product Engine, flux Merchant | ajoutée |
| 230 | 2026-08-16 | devin | systeme-intelligent — points 102-103 — audit des 16 capacités sur preuve d'usage, cycle réellement exécuté | ajoutée |
| 232 | 2026-08-22 | fix | depot-annonce — compression auto + progression détaillée + fix suppression photos (v1.6.0) | ajoutée |
| 233 | 2026-08-17 | devin | controle-continu — points 108-113 — contrôles réellement exécutés, preuve datée, régressions nommées | déjà en mémoire (ou fusion sans commit propre) |
| 234 | 2026-08-17 | devin | controle-continu — points 110-113 — boutons morts, pays, rôles et écrans réellement contrôlés | ajoutée |
| 235 | 2026-08-17 | devin | code-graph — points 114-118 — mémoire technique du code, moteurs centraux contrôlés, apprentissage des corrections | ajoutée |
| 236 | 2026-08-17 | devin | completion — points 119-120-121-122 — règle TERMINÉ calculée, rapport obligatoire, Completion Center, ordre d'exécution observé | ajoutée |
| 237 | 2026-08-18 | devin | intelligences — MKA.P-MS Intelligences — appels réels au fournisseur, côté direction PDG et assistant public séparés | ajoutée |
| 238 | 2026-08-18 | devin | paiement — confirmation Stripe obligatoirement signée + contrôle continu de la confirmation | déjà en mémoire (ou fusion sans commit propre) |
| 239 | 2026-08-20 | devin | google — fichier de vérification Google réellement servi (Search Console / Merchant) | déjà en mémoire (ou fusion sans commit propre) |
| 240 | 2026-08-20 | devin | intelligences — points 124-126 — registre des capacités avec état constaté | ajoutée |
| 241 | 2026-08-20 | devin | intelligences — points 130-133 — orchestrateur de missions, 7 niveaux d'autonomie réglables, multimodalité | ajoutée |
| 242 | 2026-08-22 | devin | intelligences — points 134-139 — mémoire fédérée, audit de connexion des moteurs, apprentissage après action | ajoutée |
| 243 | 2026-08-22 | devin | intelligences — points 140-144 — observabilité 24/7, support diagnostiqué, contrôles ciblés, comparaison avant/après, pipeline complet | ajoutée |
| 244 | 2026-08-22 | devin | intelligences — points 145-149 — actions de direction, permissions contrôlées, abstraction fournisseurs, évaluation permanente, mode shadow | ajoutée |
| 245 | 2026-08-22 | devin | intelligences — points 150-151 — toutes les fonctionnalités fournisseur éteintes par défaut, plan de détachement vérifié, plateforme développeur bornée | ajoutée |
| 246 | 2026-08-22 | devin | Revert "Merge pull request #232 from projet-Auto-plus-Africa-MKAPMS/fix/wordmark-s-visible-and-glow-line" | ajoutée |
| 247 | 2026-08-22 | devin | accueil — recherche véhicules repliable, filtres mondiaux réels et dictée MKA.P-MS Intelligences | ajoutée |
| 248 | 2026-08-23 | autre | risque-import — diagnostic d'importation et d'homologation avant achat ou livraison | ajoutée |
| 248 | 2026-08-23 | devin | risque-import — diagnostic d'importation et d'homologation avant achat ou livraison | ajoutée |
| 249 | 2026-08-23 | devin | livraison-vehicule — moteur d'acheminement des véhicules (barèmes gouvernés, étapes, qualité de prix) | ajoutée |
| 250 | 2026-08-24 | devin | estimation — Estimation Hub — coût total d'acquisition assemblé à partir des moteurs existants | ajoutée |
| 251 | 2026-08-24 | devin | paiement — achat et acheminement encaissés dans la même transaction, montant issu du moteur | déjà en mémoire (ou fusion sans commit propre) |
| 252 | 2026-08-24 | devin | redirection — moteur branché partout — inventaire des routes généré, catalogue produits/géo/comptabilité/VO, audit de couverture par zone | ajoutée |
| 253 | 2026-08-24 | devin | redirection — ecrans VO, pieces et comptabilite branches au moteur, parcours dynamiques observes | ajoutée |
| 254 | 2026-08-24 | devin | accueil — icones reseaux du pied de page issues des canaux configures par le PDG | ajoutée |
| 255 | 2026-08-24 | devin | intelligences — assistant mondial multi-domaines gouverne par le PDG + version unique plateforme et applications | ajoutée |
| 256 | 2026-08-24 | devin | ai-fabric+store — capacites et fournisseurs manquants nommes, visuels Google Play fabriques depuis la charte | ajoutée |
| 257 | 2026-08-24 | devin | suppression-compte — suppression réellement exécutée, page publique de demande, file de décision côté direction | ajoutée |
| 258 | 2026-08-24 | feat | moteurs — diagnostic actionnable & remédiation des moteurs dégradés/HS | ajoutée |
| 259 | 2026-08-24 | feat | moteurs — dépendances réelles renseignées — chaque moteur branché à ses vrais services | déjà en mémoire (ou fusion sans commit propre) |
| 260 | 2026-08-24 | feat | google+seo — balise HTML meta pour vérification propriété + Bing, Yandex, Facebook, Pinterest | ajoutée |
| 261 | 2026-08-24 | feat | moteurs — réactivation automatique de 10 moteurs livrés — passage staging → active | déjà en mémoire (ou fusion sans commit propre) |
| 262 | 2026-08-24 | feat | ia — diagnostic clés API + bandeau visible partout où l'IA est utilisée | ajoutée |
| 263 | 2026-08-24 | feat | paiement — brancher Stripe sur Carte Grise (abonnements + packs) et Devis Garage | déjà en mémoire (ou fusion sans commit propre) |
| 264 | 2026-08-24 | feat | google-play — balises app Android + guide validation propriété Play Console | déjà en mémoire (ou fusion sans commit propre) |
| 265 | 2026-08-24 | devin | build — le déploiement Railway échouait — l'état des clés Intelligence lu hors de la couche fournisseur | déjà en mémoire (ou fusion sans commit propre) |
| 266 | 2026-08-29 | devin | documents — vrais documents imprimables et exports CSV réels au lieu d'une notification verte | ajoutée |
| 267 | 2026-08-29 | devin | paiement+moteurs+google — montant du devis calculé par le serveur, états moteurs sur preuve d'audit, propriété du site gérée par le PDG | ajoutée |
| 268 | 2026-08-29 | devin | vo — cloisonnement officiel / pro / particulier décidé par le serveur | ajoutée |
| 269 | 2026-08-30 | devin | build — inventaire des routes régénéré — déploiement Railway débloqué | déjà en mémoire (ou fusion sans commit propre) |
| 270 | 2026-08-30 | devin | compte-pro — pièces justificatives réellement exigées, téléversées et contrôlées par le serveur | ajoutée |
| 271 | 2026-08-30 | devin | documents+boutons — contrôle d'authenticité branché, documents réels, préférences réellement enregistrées | ajoutée |
| 272 | 2026-08-31 | devin | recherche — les filtres choisis sont réellement appliqués à la liste des annonces | ajoutée |
| 273 | 2026-08-31 | devin | garage — boutons morts reliés à des actions réelles (réclamations, pièces, panier, atelier, rendez-vous) | ajoutée |
| 274 | 2026-08-31 | devin | boutons — Moteur de boutons branché au Moteur de Redirection, à l'Event Bus, au Système Intelligent et aux Intelligences | ajoutée |
| 275 | 2026-08-31 | devin | atelier — Moteur d'Atelier — validations, contrôle qualité, stock garage et report de rendez-vous réellement enregistrés | ajoutée |
| 276 | 2026-08-31 | manus | engine-registry — corriger les dépendances Smart/Permission/Redirection + migrations GBP et avis_reputation | ajoutée |
| 277 | 2026-08-31 | manus | server — forcer les migrations au démarrage sans condition AUTO_MIGRATE | déjà en mémoire (ou fusion sans commit propre) |
| 278 | 2026-09-01 | manus | drizzle — enregistrer les migrations 0106 et 0107 dans le journal | ajoutée |
| 279 | 2026-09-01 | manus | moteurs — réconciliation automatique des états sur preuve au démarrage | déjà en mémoire (ou fusion sans commit propre) |
| 280 | 2026-09-02 | devin | sections — pages d'accueil de section réelles + écrans vides recensés et remontés aux moteurs | ajoutée |
| 281 | 2026-09-03 | devin | atelier — réapprovisionnement gouverné de bout en bout | ajoutée |
| 282 | 2026-09-07 | devin | moteurs — inventaire calculé des 88 moteurs (dépendances prouvées, dépendants, boutons, écrans, événements) + branchements réels Notification/Scheduler/Smart/Document/Country | déjà en mémoire (ou fusion sans commit propre) |
| 283 | 2026-09-07 | devin | moteurs — sonde de battement — journal Drizzle rétabli, échec de migration remonté partout, dépendances du registre réalignées sur le catalogue | déjà en mémoire (ou fusion sans commit propre) |
| 284 | 2026-09-07 | devin | migrations — 0074 référençait reviews_v2 créée en 0107 — série entière annulée en prod, 43 moteurs sans tables | déjà en mémoire (ou fusion sans commit propre) |
| 285 | 2026-09-07 | devin | moteurs — Media, Livraison véhicule et Estimation repassent au vert à la source ; 53 tables sans migration créées ; dépendants du Core affichés | déjà en mémoire (ou fusion sans commit propre) |
| 286 | 2026-09-07 | devin | intelligences — bouton rond noir à côté du micro dans la barre de recherche + registre de conversation (remerciements, ton du visiteur) | déjà en mémoire (ou fusion sans commit propre) |
| 287 | 2026-09-08 | devin | identite — identité personnelle de la direction retirée de tous les écrans, masquée par le serveur (annonces, avis, messagerie), garde-fou check:identite au build | déjà en mémoire (ou fusion sans commit propre) |
| 288 | 2026-09-08 | devin | livraison-vehicule — livraison véhicules/camions visible depuis l'accueil, Livraison et Location ; politique du pays d'arrivée consultée avant devis et acceptation ; statut validation_requis | déjà en mémoire (ou fusion sans commit propre) |
| 289 | 2026-09-11 | claude | engine-registry — généraliser la détection d'intégration technique à tous les moteurs | déjà en mémoire (ou fusion sans commit propre) |
| 290 | 2026-09-11 | claude | engine-registry — résoudre le cycle country -> workflow -> notification -> language -> country | déjà en mémoire (ou fusion sans commit propre) |
| 291 | 2026-09-11 | claude | pro-portal — contrat neutre pour pro_account, cycle avec pro_portal non forcé | déjà en mémoire (ou fusion sans commit propre) |
| 292 | 2026-09-11 | claude | engine-registry — classer les écritures d'alerte/télémétrie vers Smart Engine comme techniques | déjà en mémoire (ou fusion sans commit propre) |
| 293 | 2026-09-11 | claude | intelligences — nom de modèle OpenAI fictif remplacé, diagnostic des API externes | déjà en mémoire (ou fusion sans commit propre) |
| 294 | 2026-09-11 | claude | intelligences — reformuler l'entrée de mémoire qui cassait le build de production | ajoutée |
| 295 | 2026-09-11 | claude | engine-registry — politique_pays -> smart et smart -> smart_audit inversées | déjà en mémoire (ou fusion sans commit propre) |
| 296 | 2026-09-11 | claude | engine-registry — vente déclare enfin livraison_vehicule et boutons | déjà en mémoire (ou fusion sans commit propre) |
| 297 | 2026-09-11 | claude | engine-registry — achat et avis_reputation déclarent enfin identity | déjà en mémoire (ou fusion sans commit propre) |
| 298 | 2026-09-11 | claude | smart-engine — carte « À valider » reliée au mauvais onglet, action de validation ajoutée | déjà en mémoire (ou fusion sans commit propre) |
| 299 | 2026-09-11 | claude | activation-audit — 13 moteurs mal détectés « non connectée » alors qu'ils ont un vrai routeur | déjà en mémoire (ou fusion sans commit propre) |
| 300 | 2026-09-11 | claude | activation-audit — critère « Accessible » — 32 moteurs avaient déjà une route déclarée, mal détectée | déjà en mémoire (ou fusion sans commit propre) |
| 301 | 2026-09-11 | claude | engine-registry — ensureSeeded() réaligne enfin sur le catalogue au lieu d'accumuler | déjà en mémoire (ou fusion sans commit propre) |
| 302 | 2026-09-11 | claude | continuous-test — lot de 5 moteurs — 2 dépendances ajoutées + 5 premiers scénarios de contrôle continu | déjà en mémoire (ou fusion sans commit propre) |
| 303 | 2026-09-11 | claude | redirection+moteurs — clé accueil sans règle, route orpheline, 2 dépendances vers boutons + couverture de test pour 5 moteurs | déjà en mémoire (ou fusion sans commit propre) |
| 304 | 2026-09-11 | claude | engine-registry — balayage final — 7 fausses dépendances de plus retirées (confusion champ de données / nom de moteur) | déjà en mémoire (ou fusion sans commit propre) |
| 305 | 2026-09-11 | claude | mobile — socle de la 4e application MKA.P-MS Intelligence (com.mkapms.intelligence) | déjà en mémoire (ou fusion sans commit propre) |
| 306 | 2026-09-11 | claude | intelligences — câble réellement l'appel d'outils et la sortie structurée dans la couche d'appel unique | déjà en mémoire (ou fusion sans commit propre) |
| 307 | 2026-09-12 | claude | intelligences — Tool Registry + boucle d'exécution d'outils — sécurité et orchestration, pas un simple switch | déjà en mémoire (ou fusion sans commit propre) |
| 308 | 2026-09-12 | claude | intelligences — Tool Registry global (29 familles, 77 outils, aucune omise) + lot véhicules/VIN/immatriculation/estimation | déjà en mémoire (ou fusion sans commit propre) |
| 309 | 2026-09-12 | claude | mobile — mise à niveau Android vers l'API 36 (Android 16) sur les 4 applications | déjà en mémoire (ou fusion sans commit propre) |
| 310 | 2026-09-12 | claude | particulier — U-002 — corrige les liens morts confirmés par l'audit de l'application Particulier | déjà en mémoire (ou fusion sans commit propre) |
| 311 | 2026-09-12 | claude | investment — socle moteurs de l'application Investisseur — Contract Engine, Ownership Router, Revenue Engine, Ledger | déjà en mémoire (ou fusion sans commit propre) |
| 312 | 2026-09-12 | claude | investment — continuer sans s'arrêter sur les accès externes — KYC réutilisé, Payout, Assistant, interface réelle + 3 HANDOFF DEVAN | déjà en mémoire (ou fusion sans commit propre) |
| 313 | 2026-09-12 | claude | routing — corriger les liens dynamiques morts (U-071 point 1), reconstruire Favoris.tsx et HistoriqueConsultations.tsx sur les vrais moteurs | déjà en mémoire (ou fusion sans commit propre) |
| 314 | 2026-09-12 | claude | routing — clôture U-002 — 18 liens morts strictement Particulier corrigés (balayage final du registre) | déjà en mémoire (ou fusion sans commit propre) |
| 315 | 2026-09-12 | claude | intelligences — Chantier de développement — MKA.P-MS Intelligences capable de construire un site de bout en bout | déjà en mémoire (ou fusion sans commit propre) |
| 316 | 2026-09-12 | claude | intelligences — LOT 01 chantier maître — Universe Registry, Context Engine, Intelligence Coverage | déjà en mémoire (ou fusion sans commit propre) |
| 317 | 2026-09-12 | claude | intelligences — LOT 02A — identité MKA.P-MS Intelligence et assainissement des fuites fournisseurs | déjà en mémoire (ou fusion sans commit propre) |
| 318 | 2026-09-12 | claude | intelligences — LOT IA02B — noyau conversationnel réel /intelligence | déjà en mémoire (ou fusion sans commit propre) |
| 319 | 2026-09-13 | claude | governance — règles permanentes — versions, audit semestriel, Settings Registry | déjà en mémoire (ou fusion sans commit propre) |
| 320 | 2026-09-13 | claude | intelligences — LOT IA02D — Provider Registry, indépendance API, échéance 27 mars 2027 | déjà en mémoire (ou fusion sans commit propre) |
| 321 | 2026-09-13 | claude | LOT IA02E — Estimate Gateway : connexion aux vrais moteurs de prix | déjà en mémoire (ou fusion sans commit propre) |
| 322 | 2026-09-13 | claude | LOT IA02F — Mémoire, fichiers, recherche et RAG | déjà en mémoire (ou fusion sans commit propre) |
| 323 | 2026-09-14 | claude | smart-engine — la carte "À valider" du tableau de bord ne montrait rien | déjà en mémoire (ou fusion sans commit propre) |
| 324 | 2026-09-14 | claude | redirection-engine — corriger la destination inexistante /acheter/pro | déjà en mémoire (ou fusion sans commit propre) |
| 325 | 2026-09-14 | claude | connecter réellement l'inscription Pro Vente au KYC, corriger 2 anomalies d'audit | ajoutée |
| 326 | 2026-09-14 | claude | engine-registry — distinguer les vrais manques des segments à infrastructure partagée | déjà en mémoire (ou fusion sans commit propre) |
| 327 | 2026-09-14 | claude | engine-registry — les 4 moteurs à contrat n'émettaient un signal qu'au démarrage | déjà en mémoire (ou fusion sans commit propre) |
| 328 | 2026-09-14 | claude | URL de recherche mal formée + anomalies moteur jamais remontées en alerte | déjà en mémoire (ou fusion sans commit propre) |
| 329 | 2026-09-14 | claude | intelligences — budget de jetons trop juste sur le chat direction, diagnostic amélioré | déjà en mémoire (ou fusion sans commit propre) |
| 330 | 2026-09-14 | claude | 28 liens morts (vente pro + garage) + faux positif du contrôle continu | ajoutée |
| 331 | 2026-09-15 | claude | ajouter le plan maître fournisseurs (référence officielle) | ajoutée |
| 332 | 2026-09-15 | claude | supplier-engine — LOT 1 du Plan Maître Fournisseurs — Registry, Onboarding, Connector, Mapping, Audit | ajoutée |
| 333 | 2026-09-15 | claude | vehicle-engine — LOT 2 du Plan Maître Fournisseurs — véhicules uniquement | ajoutée |
| 334 | 2026-09-15 | claude | parts-engine — LOT 3 du Plan Maître Fournisseurs — pièces automobiles uniquement | ajoutée |
| 335 | 2026-09-15 | claude | build — corriger l'appellation « IA »/« AI » interdite bloquant tout déploiement Railway | ajoutée |
| 336 | 2026-09-15 | claude | logistics-engine — LOT 4 du Plan Maître Fournisseurs — transport/livraison | ajoutée |
| 337 | 2026-09-15 | claude | payout-engine — LOT 5 du Plan Maître Fournisseurs — paiements (Payout Engine + compléments Payment Engine) | ajoutée |
| 338 | 2026-09-15 | claude | tests — nettoyer les versements Payout Engine créés en effet de bord (LOT 5) | ajoutée |
| 339 | 2026-09-15 | claude | document-engine — LOT 6 du Plan Maître Fournisseurs — documents (Supplier/Vehicle Document Engine + Document Custody Engine) | ajoutée |
| 340 | 2026-09-15 | claude | direction-dashboard — LOT 7 (partiel) — tableau de bord Direction, Ledger fournisseur/transporteur, Commissions réelles | ajoutée |
| 363 | 2026-09-17 | devin | vo+intelligences — cartes VO calculées par les moteurs, alias redirection, domaine religion réservé à la direction, livraisons inscrites | déjà en mémoire (ou fusion sans commit propre) |
| 364 | 2026-09-17 | devin | android — version 1.7.6 (versionCode 10706) pour les 5 applications + User-Agent aligné sur la version du dépôt | ajoutée |
| 365 | 2026-09-17 | devin | android — écran « Connexion indisponible » réellement affiché hors réseau (server.errorPath) + reprise automatique au retour du réseau | ajoutée |
| 371 | 2026-09-18 | claude | Prépare la chaîne de build Android pour les 5 nouvelles applications | ajoutée |
| 372 | 2026-09-18 | claude | Connecte une comparaison de prix externe par pays pour l'estimation véhicule (LOT IA02G) | déjà en mémoire (ou fusion sans commit propre) |
| 373 | 2026-09-18 | claude | Connecte les boutons sans action au Smart Engine (alerte vivante, rejouée automatiquement) | déjà en mémoire (ou fusion sans commit propre) |
| 374 | 2026-09-18 | claude | Document OS : premières corrections contre le Référentiel Documentaire Officiel 2026 | déjà en mémoire (ou fusion sans commit propre) |
| 375 | 2026-09-18 | claude | Document OS : identité mondiale MKA.P-MS d'origine guinéenne, fin du repli France par défaut | déjà en mémoire (ou fusion sans commit propre) |
| 376 | 2026-09-18 | claude | Document OS : rattache les documents à leur objet métier réel (règle #10) | déjà en mémoire (ou fusion sans commit propre) |
| 388 | 2026-09-19 | claude | smart-engine — [CRITIQUE] deux mensonges d'état trouvés dans le moteur, pas dans un écran | déjà en mémoire (ou fusion sans commit propre) |
| 389 | 2026-09-19 | claude | build — régénère les inventaires cliquables et moteurs, périmés depuis le lot précédent | déjà en mémoire (ou fusion sans commit propre) |
| 390 | 2026-09-19 | claude | ajoute une vérification du build complet sur push/PR vers main | déjà en mémoire (ou fusion sans commit propre) |
| 391 | 2026-09-19 | claude | location — construit la recherche réelle sur MKA.P-MS/Camions/Utilitaires | déjà en mémoire (ou fusion sans commit propre) |
| 392 | 2026-09-19 | claude | vente — câble les catégories Camions/Utilitaires, corrige un bug du hook de recherche partagé | déjà en mémoire (ou fusion sans commit propre) |
| 393 | 2026-09-19 | autre | Merge main (PR #393) into follow-up work | déjà en mémoire (ou fusion sans commit propre) |
| 393 | 2026-09-19 | claude | vente — corrige des tarifs pro inventés dans EspaceProVente.tsx et reconnecte 2 CTA au moteur d'abonnement réel | déjà en mémoire (ou fusion sans commit propre) |
| 394 | 2026-09-19 | claude | vente,location — corrige 2 vrais boutons, identifie 9 cas nécessitant un moteur inexistant | déjà en mémoire (ou fusion sans commit propre) |
| 395 | 2026-09-19 | claude | smart-engine — cartes OK/Cassés/Lents cliquables + bouton "Valider tout" sur les actions en attente | déjà en mémoire (ou fusion sans commit propre) |
| 396 | 2026-09-19 | claude | vente — construit le côté vendeur du moteur de réservation avec acompte (ReservationsVente.tsx) | déjà en mémoire (ou fusion sans commit propre) |
| 397 | 2026-09-19 | claude | vente — construit le carnet de fournisseurs du vendeur (CentreFournisseurs.tsx) | déjà en mémoire (ou fusion sans commit propre) |
| 398 | 2026-09-19 | claude | vente — construit l'équipe du vendeur et ses droits d'accès (GestionEmployes.tsx + DroitsAcces.tsx) | déjà en mémoire (ou fusion sans commit propre) |
| 399 | 2026-09-19 | claude | vente: visite véhicule via type test_drive réutilisé + porte d'accès corrigée | déjà en mémoire (ou fusion sans commit propre) |
| 400 | 2026-09-19 | claude | vente: négociation via moteur de messagerie réutilisé + bouton d'offre réparé | déjà en mémoire (ou fusion sans commit propre) |
| 401 | 2026-09-19 | claude | vente: photos & médias via annonces.update réutilisé + point d'entrée stock | déjà en mémoire (ou fusion sans commit propre) |
| 402 | 2026-09-20 | claude | vente: satisfaction achat via reviewsV2 réutilisé, critères réels par vendeur | déjà en mémoire (ou fusion sans commit propre) |
| 403 | 2026-09-20 | claude | audit: corrige 8 faux positifs "non connectée" — routeurs partagés reconnus | déjà en mémoire (ou fusion sans commit propre) |
| 404 | 2026-09-20 | claude | audit: corrige controle_technique — partiellement connecté, pas un manque total | déjà en mémoire (ou fusion sans commit propre) |
| 405 | 2026-09-20 | claude | location: retire la fabrication d'EtatVehicule.tsx et InspectionNumerique.tsx | déjà en mémoire (ou fusion sans commit propre) |
| 406 | 2026-09-20 | claude | depot-annonce: reconnecte Gérer l'annonce + Expiration au moteur MesAnnonces | déjà en mémoire (ou fusion sans commit propre) |
| 407 | 2026-09-20 | claude | demarches: reconnecte 5 écrans au moteur cartegrise + paiement réel dossier | déjà en mémoire (ou fusion sans commit propre) |
| 408 | 2026-09-20 | claude | garage: annuaire de carrossiers réel + diagnostic honnête | déjà en mémoire (ou fusion sans commit propre) |
| 409 | 2026-09-20 | claude | location: retire les pénalités et le calendrier de disponibilité fabriqués | déjà en mémoire (ou fusion sans commit propre) |
| 410 | 2026-09-20 | autre | Merge origin/main (PR #410) into branch | déjà en mémoire (ou fusion sans commit propre) |
| 410 | 2026-09-20 | claude | louer: relie le bouton Continuer vers la réservation à /louer | déjà en mémoire (ou fusion sans commit propre) |
| 411 | 2026-09-20 | autre | Merge origin/main (PR #411) into branch | déjà en mémoire (ou fusion sans commit propre) |
| 411 | 2026-09-20 | claude | admin: reconnecte PubliciteDetail.tsx au vrai moteur pub_requests | déjà en mémoire (ou fusion sans commit propre) |
| 412 | 2026-09-20 | autre | Merge origin/main (PR #412) into branch | déjà en mémoire (ou fusion sans commit propre) |
| 412 | 2026-09-20 | claude | admin: reconnecte JournalActivite.tsx au vrai moteur d'audit | déjà en mémoire (ou fusion sans commit propre) |
| 413 | 2026-09-20 | claude | vente: reconnecte CentreEssaiRoutier.tsx au moteur de visite + KYC réel | déjà en mémoire (ou fusion sans commit propre) |
| 414 | 2026-09-20 | claude | marketing: DemandePublicite.tsx persiste réellement + tarifs internationalisés | déjà en mémoire (ou fusion sans commit propre) |
| 415 | 2026-09-20 | claude | location: construit le moteur de candidature de location flotte (tâche #56, lot 1) | déjà en mémoire (ou fusion sans commit propre) |
| 416 | 2026-09-20 | claude | location: LocationCamions.tsx affiche le vrai catalogue camions | déjà en mémoire (ou fusion sans commit propre) |
| 417 | 2026-09-20 | claude | location: LocationUtilitaires/LocationMinibus affichent le vrai catalogue | déjà en mémoire (ou fusion sans commit propre) |
| 418 | 2026-09-20 | claude | paiements: idempotence Stripe, vocabulaire acompte honnête, fuite d'accès annonces.get corrigée | déjà en mémoire (ou fusion sans commit propre) |
| 419 | 2026-09-20 | claude | location: interface réelle pour la candidature de location flotte (moteur orphelin) | déjà en mémoire (ou fusion sans commit propre) |
| 420 | 2026-09-20 | claude | location: VehiculesCertifies.tsx reconnecté au vrai moteur de certification | déjà en mémoire (ou fusion sans commit propre) |
| 421 | 2026-09-20 | claude | location: contrat de location actif (rentalContracts) + RenouvellementFlotte réel | déjà en mémoire (ou fusion sans commit propre) |
| 422 | 2026-09-25 | devin | demarches — démarches administratives branchées au moteur — catalogue serveur, dépôt réel avec pièces, suivi et espace pro sur données réelles, cartes Carte grise via Moteur de boutons/Redir | ajoutée |
| 423 | 2026-09-20 | claude | location: tableau de bord loueur réel (annonces + demandes + score qualité) | déjà en mémoire (ou fusion sans commit propre) |
| 424 | 2026-09-21 | codex | ia — rétablir la chaîne conversation et mémoire | déjà en mémoire (ou fusion sans commit propre) |
| 425 | 2026-09-21 | devin | atelier — Atelier Pro sur données serveur réelles — synthèse moteur (interventions, clients, véhicules, stock), étapes d'intervention persistées, boutons déclarés au Moteur de boutons | ajoutée |
| 426 | 2026-09-21 | devin | catalogue-technique — identification plaque/VIN par le serveur, accès décidé par la session, boutons déclarés au Moteur de boutons | ajoutée |
| 427 | 2026-09-21 | codex | ia — structurer le diagnostic des boutons | ajoutée |
| 428 | 2026-09-21 | codex | ia — isoler les outils de test du registre actif | déjà en mémoire (ou fusion sans commit propre) |
| 430 | 2026-09-24 | codex | ia — ingest SHOP engineering knowledge with scoped GitHub identity | ajoutée |
| 431 | 2026-09-24 | fix | platform — reconcile screenshot alerts and connect fleet and KYC motors | ajoutée |
| 432 | 2026-09-24 | fix | identity — connect staff screen to real account motor | ajoutée |
| 433 | 2026-09-24 | fix | search — connect saved alerts to publication and notification motors | ajoutée |
| 434 | 2026-09-24 | fix | achat — connect recommendation favourites to persistent motor | ajoutée |
| 435 | 2026-09-24 | fix | smart — exclude archived checks from button health rate | déjà en mémoire (ou fusion sans commit propre) |
| 436 | 2026-09-24 | fix | core — persist detected dependencies and verify complete readiness | déjà en mémoire (ou fusion sans commit propre) |
| 437 | 2026-09-24 | fix | ai — implement engine health observation through existing registry | déjà en mémoire (ou fusion sans commit propre) |
| 438 | 2026-09-24 | fix | country — connect world map actions to real country activity | déjà en mémoire (ou fusion sans commit propre) |
| 439 | 2026-09-24 | fix | smart — use health levels correctly in autonomous observation | ajoutée |
| 440 | 2026-09-24 | fix | smart — preserve health evidence during critical target registration | déjà en mémoire (ou fusion sans commit propre) |
| 441 | 2026-09-24 | fix | garage — restrict global intervention supervision to direction | déjà en mémoire (ou fusion sans commit propre) |
| 442 | 2026-09-24 | fix | hr — persist staff profiles and weekly planning through existing engine | déjà en mémoire (ou fusion sans commit propre) |
| 443 | 2026-09-25 | claude | superadmin: AdminAbonnements.tsx reconnecté aux vraies souscriptions | déjà en mémoire (ou fusion sans commit propre) |
| 444 | 2026-09-25 | claude | superadmin: AdminObjectif.tsx reconnecté à un calcul réel des indicateurs | déjà en mémoire (ou fusion sans commit propre) |
| 445 | 2026-09-25 | autre | superadmin — AdminBadges.tsx sur un vrai catalogue de badges + comptage réel des attributions | déjà en mémoire (ou fusion sans commit propre) |
| 446 | 2026-09-25 | codex | scoped SHOP inference via canonical intelligence gateway | déjà en mémoire (ou fusion sans commit propre) |
| 448 | 2026-09-25 | autre | superadmin — AdminStatistiques.tsx sur des indicateurs réels avec variation mensuelle, conversion honnêtement non mesurée | déjà en mémoire (ou fusion sans commit propre) |
| 449 | 2026-09-25 | autre | superadmin — AdminPaiements.tsx sur des paiements réels, relance par notification plutôt que par identifiant reconstitué | déjà en mémoire (ou fusion sans commit propre) |
| 450 | 2026-09-25 | claude | location — moteur de liste d'attente réel (tâche #63), sans transition automatique fabriquée | déjà en mémoire (ou fusion sans commit propre) |
| 451 | 2026-09-25 | autre | smart-engine — la carte "Propositions" du Rapport quotidien pointait vers un système de validation sans rapport | déjà en mémoire (ou fusion sans commit propre) |
| 452 | 2026-09-25 | autre | product-engine — le compteur "Véhicules" affichait toujours 0 (colonne "statut" inexistante, erreur SQL absorbée en silence) | déjà en mémoire (ou fusion sans commit propre) |
| 453 | 2026-09-26 | claude | Country OS : registre de capacités Google par pays, jamais inventé (#65) | déjà en mémoire (ou fusion sans commit propre) |
| 454 | 2026-09-26 | claude | Product Engine : pays/langue/devise réels, plus jamais FR/fr/EUR en dur (#66) | déjà en mémoire (ou fusion sans commit propre) |
| 455 | 2026-09-26 | claude | Intelligences : remplit les 4 mémoires restées vides (entreprise/décisions/apprentissage/erreurs) (#74) | déjà en mémoire (ou fusion sans commit propre) |
| 456 | 2026-09-26 | claude | Back-office : le badge « Direction / PDG » ouvre l'onglet Administrateur / Directeur | déjà en mémoire (ou fusion sans commit propre) |
| 457 | 2026-09-26 | claude | CRITIQUE : corrige le HTTP 400 OpenAI qui bloquait tout appel IA avec outils | déjà en mémoire (ou fusion sans commit propre) |
| 458 | 2026-09-26 | claude | Connecte réellement Google Merchant Center (Content API v2.1) (#75) | déjà en mémoire (ou fusion sans commit propre) |
| 459 | 2026-09-26 | claude | intelligences — corriger le tirage au sort du modèle et généraliser le rejeu reasoning_effort | déjà en mémoire (ou fusion sans commit propre) |
| 460 | 2026-09-26 | claude | reputation-engine — gouverner moderateContent par le catalogue de fonctions existant | déjà en mémoire (ou fusion sans commit propre) |
| 461 | 2026-09-26 | claude | intelligences — auditer en réel 15 capacités OpenAI, introduire WAITING_EXTERNAL_ACCESS | déjà en mémoire (ou fusion sans commit propre) |
| 462 | 2026-09-26 | claude | intelligences — supprime la fuite « OPENAI / NULL » côté conversation PDG | déjà en mémoire (ou fusion sans commit propre) |
| 463 | 2026-09-26 | claude | intelligences — menu groupé, saisie toujours visible, réglages IA dans Compte, fin du faux « Dégradé » | déjà en mémoire (ou fusion sans commit propre) |
| 464 | 2026-09-26 | claude | intelligences — bandeau d'état centré, saisie agrandie, dictée/lecture/partage/pièces jointes réels | déjà en mémoire (ou fusion sans commit propre) |
| 465 | 2026-09-26 | claude | intelligences — zone de saisie unifiée — trombone/micro/envoi intégrés au cadre | déjà en mémoire (ou fusion sans commit propre) |
| 466 | 2026-09-26 | claude | intelligences — actions de réponse sous le texte, choix de la voix de lecture | déjà en mémoire (ou fusion sans commit propre) |
| 467 | 2026-09-26 | claude | intelligences — curseur d'intensité de réflexion, barre d'enregistrement vocal façon ChatGPT | déjà en mémoire (ou fusion sans commit propre) |
| 468 | 2026-09-27 | codex | ia — expose existing autonomy and capability controls without removing features | ajoutée |
| 469 | 2026-09-27 | codex | Raccorder les productions privées image et voix aux capacités MAIN | ajoutée |
| 470 | 2026-09-27 | codex | ai — private audio transcription with microphone and bounded native gateway | déjà en mémoire (ou fusion sans commit propre) |
| 471 | 2026-09-27 | codex | runtime — align existing client contracts and typed supervision counters | déjà en mémoire (ou fusion sans commit propre) |
| 472 | 2026-09-27 | claude | intelligences — groupes Qualité et Développement remontés en tête du menu | déjà en mémoire (ou fusion sans commit propre) |
| 473 | 2026-09-27 | codex | Expose private media in Centre Intelligences and persist sourced MAIN knowledge | ajoutée |
| 474 | 2026-09-27 | claude | admin — sections MKA.P-MS AI et Commandes & agent développeur remontées sous le VO Interne | déjà en mémoire (ou fusion sans commit propre) |
| 475 | 2026-09-28 | ai | ai — unified Centre workspace and AL-HUDHUD·M public identity; preserve engines | ajoutée |
| 476 | 2026-09-28 | ai | ai — exercise both real MAIN workspaces across four browser layouts and failure cases | ajoutée |
| 477 | 2026-09-28 | ai | ai — distinguish regeneration from sending the current draft and add regression scenarios | ajoutée |
| 480 | 2026-09-28 | ai | ai — verify stale generated inventories without changing the Chat/Travail implementation | déjà en mémoire (ou fusion sans commit propre) |
| 481 | 2026-09-28 | devin | AL-HUDHUD·M — l'entrée Administration/Compte ouvre le workspace approuvé (4 écrans) au lieu de l'ancien centre direction | déjà en mémoire (ou fusion sans commit propre) |
| 482 | 2026-09-28 | devin | AL-HUDHUD·M — conversation conservée entre Chat et Travail, indicateurs d'accueil calculés par le serveur, entrée Boutique reliée à SHOP_PUBLIC_URL | ajoutée |
| 483 | 2026-09-29 | claude | intelligence — motif d'activation par carte, bouton Envoyer masqué à tort sur mobile, loupe retirée | déjà en mémoire (ou fusion sans commit propre) |
| 484 | 2026-09-29 | claude | Côté direction : une salutation ne déclenche plus une analyse de plateforme | déjà en mémoire (ou fusion sans commit propre) |
| 485 | 2026-09-29 | claude | Approbateurs de déploiement nominatifs + lecture réelle de l'état Railway | déjà en mémoire (ou fusion sans commit propre) |
| 486 | 2026-09-29 | claude | AL-HUDHUD·M : écran plein écran, sans double défilement pour voir le haut ou la zone de saisie | déjà en mémoire (ou fusion sans commit propre) |
| 487 | 2026-09-29 | claude | AL-HUDHUD·M Chat : micro = vraie dictée manuelle, appui long ramène aux paramètres voix | déjà en mémoire (ou fusion sans commit propre) |
| 488 | 2026-09-29 | claude | AL-HUDHUD·M Chat : bandeau du haut adapté à la barre d'état système sur mobile | déjà en mémoire (ou fusion sans commit propre) |
| 489 | 2026-09-29 | claude | AL-HUDHUD·M Chat : dictée continue réelle (relance auto) + barre d'enregistrement | déjà en mémoire (ou fusion sans commit propre) |
| 490 | 2026-09-29 | claude | Corrige l'erreur TypeScript qui a fait échouer le CI de la PR #489 | déjà en mémoire (ou fusion sans commit propre) |
| 491 | 2026-09-29 | claude | Consignes direction et public : curiosité sur les sujets inachevés | déjà en mémoire (ou fusion sans commit propre) |
| 492 | 2026-09-29 | claude | Porter Écouter/Partager/Intensité de CentreIntelligences.tsx vers Conversation.tsx | déjà en mémoire (ou fusion sans commit propre) |
| 493 | 2026-09-29 | claude | Sépare la rangée d'actions de la bordure de la bulle de message | déjà en mémoire (ou fusion sans commit propre) |
| 494 | 2026-09-29 | claude | Mémoire d'entreprise : grandit automatiquement à chaque conversation, retrouvable dans les suivantes | déjà en mémoire (ou fusion sans commit propre) |
| 495 | 2026-09-29 | claude | Câble recherche.webSearchNatifOpenAI : recherche web réelle en conversation | déjà en mémoire (ou fusion sans commit propre) |
| 496 | 2026-09-29 | claude | Coffre secret du PDG : identifiants, clés et fichiers chiffrés | déjà en mémoire (ou fusion sans commit propre) |
| 497 | 2026-09-30 | claude | Corrige la recherche « mémoire d'entreprise » : elle ne trouvait rien en langage naturel | déjà en mémoire (ou fusion sans commit propre) |
| 498 | 2026-09-30 | ai | ai — progressive replies with gold reflection, waiting timer and full-width composer | ajoutée |
| 499 | 2026-09-30 | autre | ai — direct live voice attachments and recents | déjà en mémoire (ou fusion sans commit propre) |
| 501 | 2026-09-30 | codex | intelligence — add governed autonomous agent and premium references | ajoutée |
| 502 | 2026-09-30 | autre | intelligence — unifier chat travail et rétablir le micro | ajoutée |
| 503 | 2026-09-30 | autre | intelligence — fiabiliser la dictée sur iPhone | déjà en mémoire (ou fusion sans commit propre) |
| 505 | 2026-10-01 | codex | pieces — catalogue et boutique de pièces | ajoutée |
| 506 | 2026-10-01 | codex | routes — enregistrer la fiche produit pièces | déjà en mémoire (ou fusion sans commit propre) |
| 507 | 2026-10-01 | codex | boutons — synchroniser la fiche produit | déjà en mémoire (ou fusion sans commit propre) |
| 508 | 2026-10-01 | autre | restaurer les publications et la voix multi-appareils | déjà en mémoire (ou fusion sans commit propre) |
| 509 | 2026-10-01 | codex | catalogue pièces électriques et voix stable | ajoutée |
| 510 | 2026-10-01 | codex | catalogue pièces aéré et responsive | ajoutée |
| 511 | 2026-10-01 | codex | gérer les catégories de pièces sans photo | ajoutée |
| 519 | 2026-10-01 | claude | Conversations : liste « Récents » visible et cliquable, titres d'après le sujet | déjà en mémoire (ou fusion sans commit propre) |
| 521 | 2026-10-02 | claude | Micros : la dictée ne se coupe plus seule, la vraie cause est affichée | déjà en mémoire (ou fusion sans commit propre) |
| 524 | 2026-10-02 | claude | Connaissances de publication : Android, Apple, GitHub, Railway et identifiants | déjà en mémoire (ou fusion sans commit propre) |
| 525 | 2026-10-02 | claude | Coffre secret : section « Connecter les outils » | déjà en mémoire (ou fusion sans commit propre) |
| 526 | 2026-10-02 | claude | Outils GitHub en lecture seule qui utilisent le jeton du Coffre secret | déjà en mémoire (ou fusion sans commit propre) |
| 529 | 2026-10-02 | claude | Micros : la bannière d'installation recouvrait stop ; connexion annulable et échecs visibles | déjà en mémoire (ou fusion sans commit propre) |
| 530 | 2026-10-02 | claude | voix — l'offre WebRTC partait sans CRLF final (400 invalid_offer) | déjà en mémoire (ou fusion sans commit propre) |
| 531 | 2026-10-02 | claude | Micro bleu : modèle de transcription de repli ; voix à écouter ; mémoire des travaux ; Coffre « + Ajouter » | déjà en mémoire (ou fusion sans commit propre) |
| 532 | 2026-10-02 | claude | IA principale : accès de service à la boutique (5 outils) et mémoire de la boutique copiée | déjà en mémoire (ou fusion sans commit propre) |
| 533 | 2026-10-02 | claude | Autonomie de travail de l'IA ; consignes du PDG et récit des travaux ajoutés à sa mémoire | déjà en mémoire (ou fusion sans commit propre) |
| 534 | 2026-10-02 | claude | Mode Travail réparé, Chat et Travail alignés, micro : modèle de transcription retenu | déjà en mémoire (ou fusion sans commit propre) |
| 535 | 2026-10-02 | claude | Mémoire automobile remplie (marques, types de véhicules, pièces) ; source NHTSA ; mémoires projets, recherche, décisions, apprentissage | déjà en mémoire (ou fusion sans commit propre) |
| 536 | 2026-10-02 | claude | Connexion / création de compte : le bouton Google ne fait plus semblant | déjà en mémoire (ou fusion sans commit propre) |
| 537 | 2026-10-02 | claude | Micro bleu : démarrage prêt avant « Je vous écoute », salutations arabes, micro dans le cadre du téléphone | déjà en mémoire (ou fusion sans commit propre) |
| 538 | 2026-10-02 | claude | URGENT sécurité : Global Country Engine réservé au PDG | déjà en mémoire (ou fusion sans commit propre) |
| 539 | 2026-10-02 | claude | Postes d'équipe : sous-directeur, comptable, chef d'équipe, investisseur, partenaire (création + attribution PDG) | déjà en mémoire (ou fusion sans commit propre) |
| 540 | 2026-10-02 | claude | Accueil : pays cliquables pour choisir son pays, sans réglages visibles du public | déjà en mémoire (ou fusion sans commit propre) |
| 541 | 2026-10-02 | claude | IA : ne jamais réclamer le jeton de la boutique pour du développement ou un déploiement | déjà en mémoire (ou fusion sans commit propre) |
| 542 | 2026-10-02 | claude | Sonde des capacités du fournisseur de modèles : vrais tests, états séparés, preuves de refus | déjà en mémoire (ou fusion sans commit propre) |
| 543 | 2026-10-02 | claude | Mémoire par le sens : empreintes (embeddings) branchées sur la mémoire et les connaissances de l'IA | déjà en mémoire (ou fusion sans commit propre) |
| 544 | 2026-10-02 | claude | Mémoire par le sens : corrige les 4 anomalies de la revue (droits avant classement, versions périmées, conversation, changement de modèle) | déjà en mémoire (ou fusion sans commit propre) |
| 545 | 2026-10-02 | claude | Empreintes : modèle de repli durable ; verrou de ligne contre le remplacement concurrent | déjà en mémoire (ou fusion sans commit propre) |
| 546 | 2026-10-02 | claude | Coffre secret : plus aucun bouton mort, un clic mène à l'activation quand la clé maître manque | déjà en mémoire (ou fusion sans commit propre) |
| 547 | 2026-10-02 | claude | Agent développeur : corrections de la relecture (rapport détaillé, reprise unique, droits actuels, périmètre et curseur, mémoire, dossier par demandeur) | déjà en mémoire (ou fusion sans commit propre) |
| 548 | 2026-10-02 | devin | AL-HUDHUD·M — micro gris écrit en direct, micro bleu réglable (langue/voix) et boule pilotée par le niveau sonore réel | déjà en mémoire (ou fusion sans commit propre) |
| 549 | 2026-10-02 | devin | AL-HUDHUD·M — Travail affiché étape par étape pendant la mission + Nouvelle conversation et Récents repliables dans le menu, Fermer sous la barre de statut iOS | ajoutée |
| 550 | 2026-10-03 | devin | AL-HUDHUD·M — boutons Activer et Désactiver sur chaque capacité + Tout activer / Tout désactiver, retour affiché dans la carte | déjà en mémoire (ou fusion sans commit propre) |
| 551 | 2026-10-03 | devin | AL-HUDHUD·M — micro gris — premiers mots conservés pendant la connexion + vocabulaire de la mémoire utilisateur transmis à la transcription | déjà en mémoire (ou fusion sans commit propre) |
| 552 | 2026-10-03 | devin | AL-HUDHUD·M — trombone — accès directs Bibliothèque, Dépôts & code, Projets, Outils, Agents, Planifié, Mémoire, Coffre + téléchargement de la conversation | déjà en mémoire (ou fusion sans commit propre) |
| 553 | 2026-10-03 | devin | auth+android — connexion/inscription Google dans les 5 applications (navigateur du téléphone + ticket à usage unique) + version 1.7.7 | ajoutée |
