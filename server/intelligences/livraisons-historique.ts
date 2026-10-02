/**
 * MKA.P-MS — journal historique des livraisons (récit complet du chantier).
 *
 * Complète `livraisons.ts` : on y a ajouté ce qui MANQUAIT à la mémoire de l'assistant (les entrées déjà présentes dans
 * `livraisons.ts` sont laissées intactes), pour que le récit de tout ce qui a été fait, des problèmes rencontrés et de la
 * manière dont ils ont été résolus, y compris les retours en arrière, soit consultable dans sa mémoire.
 *
 * Sources et fidélité : les entrées « pr-<numéro> » et « commit-<hash> » reprennent les messages de commit de l'historique
 * de la branche main (état aa96e35, dernier commit du 3 octobre 2026), cités tels quels ; un texte coupé porte la marque
 * « […] » et le commit d'origine est nommé dans l'entrée. Seuls ont été remplacés : les noms de variables de clés et les
 * adresses de fournisseurs de modèles, les adresses e-mail et l'identité du PDG, que les garde-fous du dépôt interdisent
 * d'écrire dans le code. Les entrées « recit-* » sont des synthèses rédigées à partir de ces mêmes messages.
 * Aucune attribution n'est faite au-delà de la famille de branche (claude, devin, codex, manus…).
 *
 * Fichier tolérant à l'ancien nom du produit : l'historique cite l'appellation d'époque ; le réécrire serait mentir sur ce
 * qui a réellement été livré sous ce nom (même tolérance que `livraisons.ts`).
 */
import type { Livraison } from "./livraisons.js";

export const LIVRAISONS_HISTORIQUE: Livraison[] = [
{
  "cle": "recit-chantier-chronologie",
  "titre": "Récit complet du chantier MKA.P-MS : chronologie du 10 août au 3 octobre 2026",
  "categorie": "projets",
  "domaine": "decisions",
  "moteurs": [
    "plateforme"
  ],
  "quoi": "CHIFFRES VÉRIFIÉS (historique de la branche main) : 699 commits, 293 fusions dont 283 portent un numéro de PR ; du 10 août au 3 octobre 2026. Familles de branches des PR numérotées : claude 152, devin 70, codex 17, fix 13, feat 7, ai 5, manus 4, autres 15. La famille de branche est le seul marqueur d'origine fiable de l'historique : « claude » désigne le travail de Claude ; devin, codex, manus, ai sont d'autres agents. Aucune attribution n'est inventée au-delà de ce marqueur.\n\nPHASE 1 — 10 au 22 août (surtout branches devin) : fondations des moteurs et de leur contrôle.\nRegistre central des moteurs avec 5 états calculés et journal des modifications d'agents (points 41-42, PR 206) ; dépendances en cascade, validation avant action sensible, retour arrière (43-44, PR 207) ; assurance et bornes de recharge (45, PR 208) ; Reviews & Reputation Engine, faux avis traçables, droit de réponse (46-50, PR 209-210) ; paiement : le bouton ouvre l'écran carte (PR 225), la réponse brute du prestataire n'atteint plus le client et la clé Stripe est vérifiée au démarrage (PR 226) ; audit d'activation général existe/connecté/activé/testé/utilisé (91, PR 227) ; indexation Google URL par URL (92-101, PR 228) ; pipelines Véhicules/Produits et Google Product Engine (94-97, PR 229) ; audit des 16 capacités sur preuve d'usage (102-103, PR 230) ; Event Bus central (104-107) ; contrôle continu avec preuve datée (108-113, PR 233-234) ; Code Knowledge Graph (114-118, PR 235) ; règle TERMINÉ calculée et Completion Center (119-122, PR 236) ; MKA.P-MS Intelligences : appels réels au fournisseur (PR 237), registre des capacités, API /v1 et fournisseur direct interdit (124-129, PR 240), orchestrateur de missions et 7 niveaux d'autonomie (130-133, PR 241), mémoire fédérée et apprentissage après action (134-139, PR 242), observabilité 24/7 (140-144, PR 243), actions de direction et mode shadow (145-149, PR 244), fonctionnalités fournisseur éteintes par défaut (150-151, PR 245). Le 22 août la PR 246 annule la fusion de la PR 232 (marque, rendu du logo).\n\nPHASE 2 — 23 août au 11 septembre : brancher les écrans aux moteurs.\nMoteur de livraison de véhicules (PR 249), diagnostic de risque à l'importation (PR 248), Estimation Hub (PR 250), moteur de redirection branché partout (PR 252-253), assistant mondial joignable sur les pages publiques (PR 255), diagnostic des clés du fournisseur de modèles avec bandeau visible (PR 262) et fournisseurs manquants nommés (PR 256), diagnostic actionnable des moteurs dégradés (PR 258), vérification de propriété Google/Bing/Yandex/Facebook/Pinterest (PR 260), suppression de compte réellement exécutée (PR 257), vrais documents imprimables au lieu d'une notification verte (PR 266), contrôle d'authenticité sur chaque pièce KYC (PR 271), cloisonnement VO officiel/pro/particulier décidé par le serveur (PR 268), montant du devis calculé par le serveur (PR 267), filtres de recherche réellement appliqués (PR 272), boutons morts du garage reliés (PR 273), Moteur de boutons (PR 274), Moteur d'Atelier (PR 275) et réapprovisionnement gouverné (PR 281), pages d'accueil des 15 sections et 247 écrans vides recensés (PR 280), correctifs de registre et migrations 0106/0107 du journal Drizzle (PR 276, 278).\n\nPHASE 3 — 11 au 25 septembre (surtout branches claude) : fournisseurs, sécurité des routes, fin des écrans fabriqués.\nLe 11 septembre une entrée de mémoire fait échouer le build de production (PR 294, voir le récit des problèmes). Lots IA02B et IA02F (noyau conversationnel, mémoire/fichiers/RAG). Le 15 septembre : plan maître fournisseurs retranscrit intégralement (PR 331) puis LOT 1 Supplier Engine (PR 332), LOT 2 Vehicle Engine (PR 333), LOT 3 Parts Engine (PR 334), LOT 4 Logistics Engine (PR 336), LOT 5 Payout Engine (PR 337), LOT 6 Document Engine (PR 339), LOT 7 partiel : tableau de bord Direction, Ledger, commissions réelles (PR 340) ; la PR 335 corrige le mot interdit qui bloquait tout déploiement depuis le LOT 2. Sécurité : 64 routes Pro/internes verrouillées par le Permission Engine (PR 313). Cinq applications Android : chaîne de build des .aab (PR 371), version 1.7.6 (PR 364), écran « Connexion indisponible » hors réseau (PR 365). Puis une longue série de PR « reconnecte l'écran X au vrai moteur » : fiche historique, dossier client, comptabilité dirigeant, démarches, notifications, Mon espace, location (candidature, contrats, catalogue camions/minibus/utilitaires), publicité, journal d'activité, essai routier, garage, avis (PR 313-411 environ), avec le compteur de boutons sans action qui baisse de 163 à 131 sur les seules PR 383, 384, 387.\n\nPHASE 4 — 26 septembre au 3 octobre : l'espace AL-HUDHUD·M, la voix, la mémoire, la boutique, les pièces.\nEspace de conversation unifié et identité publique AL-HUDHUD·M (PR 475-477, 482, 498, 501-502), pièces automobiles : catalogue, boutique, fiche produit, panier persistant (PR 505-511, branches codex), urgence du 1er octobre : « restaurer Railway et la voix multi-appareils » (PR 508). Le 2 octobre (détaillé dans le récit de cette journée) : micros et voix, coffre secret, boutique SHOP, mémoire automobile, Global Country Engine réservé au PDG, postes d'équipe, pays cliquables à l'accueil, sonde des capacités du fournisseur de modèles, mémoire par le sens, agent développeur. Derniers commits de l'historique (2 et 3 octobre) : travail affiché étape par étape et menu repliable (PR 549), mémoires activables (PR 550), dictée (PR 551), menu du trombone (PR 552), connexion Google dans les cinq applications (PR 553), branches devin.",
  "pourquoi": "Le PDG a demandé un récit complet et honnête de tout ce qui a été fait sur la plateforme, enrichi dans la mémoire de l'IA : ce qui existe déjà est laissé tel quel, ce qui manque est ajouté. Cette entrée fixe le fil chronologique ; les entrées pr-<numéro> et commit-<hash> donnent le détail de chaque livraison qui manquait.",
  "ou": [
    "server/intelligences/livraisons.ts",
    "server/intelligences/livraisons-historique.ts",
    "docs/JOURNAL_DE_BORD_CHANTIER.md"
  ],
  "lecon": "Une chronologie n'est fiable que si chaque chiffre et chaque numéro de PR se retrouvent dans l'historique du dépôt. Les chiffres de cette entrée ont été comptés dans l'historique de main le 3 octobre 2026 ; en cas de doute, c'est l'historique git qui fait foi, pas ce récit.",
  "historique": true
},
{
  "cle": "recit-methode-de-travail",
  "titre": "Comment le travail est mené : audit avant construction, jamais de fabrication, preuves réelles, build complet avant publication",
  "categorie": "apprentissage",
  "domaine": "confiance",
  "moteurs": [
    "plateforme"
  ],
  "quoi": "Pratiques constantes relevées dans les messages de commit (les numéros de PR sont ceux où la pratique est écrite noir sur blanc) :\n\n1. AUDIT PRÉALABLE AVANT TOUTE CONSTRUCTION. Les lots 2, 3 et 4 du plan fournisseurs commencent par « Audit préalable complet … avant tout développement » (PR 333, 334, 336) ; la tâche location flotte est « auditée avant toute construction pour éviter une duplication » : rentalApplications existait au schéma sans aucun routeur (grep exhaustif, zéro usage).\n2. ÉTENDRE, JAMAIS DUPLIQUER. Règle d'architecture « un moteur pour chaque domaine » ; un profil fournisseur s'ajoute au-dessus d'un partner existant (PR 332) ; VehiculesCertifies est reconnecté à selectionMka déjà utilisé sur l'accueil plutôt qu'un second moteur ; la publicité est reliée au moteur pub_requests déjà réel.\n3. NE JAMAIS FABRIQUER. Un écran qui affichait des données inventées est soit relié à un moteur réel qui existe déjà, soit vidé avec un état honnête qui dit pourquoi (par exemple « Scanner OBD-II non connecté » au lieu de codes défaut inventés). Un bouton qui annonce une action sans la faire est le pire cas : il est relié ou retiré. Le compteur de boutons sans action sert d'instrument de mesure (163→147 PR 383, 147→138 PR 384, 138→131 PR 387).\n4. DÉCOUVERTES ANNEXES TRACÉES, PAS BÂCLÉES. Quand un défaut voisin demande un vrai chantier (ListeAttente, suspension de compte, paiements de location), il devient une tâche numérotée au lieu d'une correction superficielle.\n5. ÉTATS HONNÊTES. Un moteur sans preuve reste « staging » ou « not_connected » (Connector Engine du LOT 1, vo_espaces en staging « pas d'état actif sans preuve ») ; une capacité n'est jamais « fonctionnelle » avant un vrai appel par l'adaptateur de la plateforme.\n6. VÉRIFICATION EN CONDITIONS RÉELLES. Tests contre une vraie base PostgreSQL, parcours HTTP complets, navigateur réel (Playwright) avec clics réels, données de test nettoyées après coup. Un test de non-régression est validé en le faisant échouer volontairement avant de restaurer la correction (PR 381) ; les mutations volontaires des règles sont détectées par les tests (travaux du 2 octobre).\n7. BUILD COMPLET AVANT TOUTE PUBLICATION. Le déploiement Railway exécute npm run build : check:routers, check:naming, check:identite, check:providers, check:public-provider-leaks, check:intelligence-chat, check:routes, check:boutons, check:cliquables, check:sections, check:moteurs, check:migrations, puis build:graph, build:client, build:server. La séquence est reproduite exactement en local avant de pousser (PR 294), et l'artefact node dist/server.js est démarré et interrogé (PR 335, 336, 339).\n8. INVENTAIRES GÉNÉRÉS À RÉGÉNÉRER. Boutons, cliquables, routes, sections, moteurs et graphe de code sont générés ; un inventaire périmé fait échouer le build (PR 269, 446, 508).\n9. MIGRATIONS ADDITIVES ET JOURNAL TENU. Chaque migration est additive ; le journal Drizzle est tenu à la main car drizzle-kit generate est cassé (tâche 61) ; check:migrations valide la chaîne ; une migration absente du journal n'est jamais appliquée (PR 278).\n10. MÉMOIRE DES LIVRAISONS. Chaque livraison est inscrite au registre server/intelligences/livraisons.ts : ce qui a été fait, pourquoi, où, la leçon. Une entrée n'est jamais modifiée après fusion ; une correction est une nouvelle entrée.\n11. UNE PR PAR SUJET. Les PR sont fusionnées dès que la CI est verte sur le dernier commit ; un correctif qui arrive après la fusion est une nouvelle PR, jamais un empilement sur une PR fusionnée.",
  "pourquoi": "Le PDG demande que l'IA connaisse non seulement ce qui a été fait mais la manière dont les problèmes ont été trouvés et corrigés, pour qu'elle travaille de la même façon : analyser avant de travailler, ne rien inventer, prouver avant d'affirmer.",
  "ou": [
    "scripts/check-naming.mjs",
    "scripts/check-providers.mjs",
    "scripts/check-identite.mjs",
    "scripts/check-migrations.mjs",
    "server/intelligences/livraisons.ts",
    ".github/workflows/build-check.yml"
  ],
  "lecon": "Analyser avant d'agir, réutiliser avant de construire, dire ce qui manque au lieu de l'inventer, prouver par un vrai test, et reproduire en local exactement ce que la production exécutera : ce sont les cinq réflexes qui ont évité le plus de retours en arrière.",
  "historique": true
},
{
  "cle": "recit-problemes-causes-et-solutions",
  "titre": "Catalogue des problèmes rencontrés : symptôme, cause réelle trouvée, correction, leçon",
  "categorie": "apprentissage",
  "domaine": "confiance",
  "moteurs": [
    "plateforme"
  ],
  "quoi": "Chaque problème ci-dessous est tiré d'un message de commit ou d'une livraison ; le numéro de PR permet de relire le détail.\n\n1. BUILD DE PRODUCTION BLOQUÉ PAR UN MOT INTERDIT (PR 335, 15 septembre). Symptôme : aucune publication des lots Vehicle Engine et Parts Engine n'avait pu être déployée. Cause : check:naming échoue le build dès qu'une chaîne visible contient le mot isolé « IA » ou « AI » ; 18 occurrences (noms de section, commentaires, messages) avaient été introduites depuis le LOT 2, et seuls les tests et le mode développement avaient été vérifiés. Correction : libellés renommés, aucun code métier changé. Leçon : lancer npm run build complet (12 contrôles + build) et démarrer dist/server.js avant de déclarer un lot livré.\n2. BUILD CASSÉ PAR UNE ENTRÉE DE MÉMOIRE (PR 294, 11 septembre). Symptôme : le déploiement Railway échoue après la PR 293. Cause : check:providers scanne le texte brut de tous les fichiers, y compris les commentaires ; l'entrée de livraison citait des noms de variables de clés de fournisseurs, et une seconde occurrence de « IA » faisait échouer check:naming. Correction : même information reformulée sans citer ces noms. Méthode : les journaux de compilation de l'échec Railway ont été lus et la séquence EXACTE des 13 étapes a été rejouée en local. Leçon : le registre des livraisons est lui aussi du code scanné par les garde-fous.\n3. INVENTAIRES GÉNÉRÉS PÉRIMÉS (PR 269 le 30 août, 446 le 25 septembre, 508 le 1er octobre). Symptôme : déploiement Railway bloqué. Cause : une PR ajoute un écran, un bouton ou un moteur sans régénérer les inventaires (routes, boutons, cliquables, moteurs) que check:* compare au code. Correction : regénérer puis recommitter. Le 1er octobre l'urgence « restaurer Railway et la voix multi-appareils » répare les inventaires qui bloquaient les publications 505 à 507. Leçon : npm run gen:* dès que check:* signale une dérive.\n4. MIGRATIONS JAMAIS APPLIQUÉES (PR 278, 1er septembre). Symptôme : tables des avis et de Google Business absentes, moteurs en alerte. Cause : les fichiers SQL 0106 et 0107 existaient mais n'étaient pas inscrits dans le journal Drizzle, donc jamais exécutés au démarrage. Correction : entrées ajoutées au journal. Le diagnostic des moteurs (PR 258) indique désormais les tables manquantes et recommande « Appliquer les migrations ».\n5. ACCOLADE MANQUANTE APRÈS UNE FUSION (PR 422, 25 septembre) : conflit de fusion mal résolu dans catalogue.ts, corrigé et inventaires régénérés. Leçon : après chaque fusion de main, relancer le build.\n6. ÉCRANS ENTIÈREMENT FABRIQUÉS (dizaines de PR en septembre : historique véhicule avec faux paiement Stripe, dossier client, comptabilité dirigeant, journal d'activité, publicité, location camions/minibus/utilitaires, pénalités, état du véhicule, diagnostic OBD…). Cause : écrans écrits avec des tableaux en dur et des setTimeout qui simulent un succès, alors qu'un moteur réel existait souvent déjà côté serveur sans jamais être appelé. Correction : relier l'écran au moteur existant ; sinon vider avec un état honnête. Un risque réel était caché : des identifiants fabriqués menaient à ProduitLocation qui interrogeait une vraie annonce sans rapport. Leçon : un écran fabriqué est un défaut de sécurité autant que d'affichage.\n7. « RÉSOLU » QUI MENT (PR 386). Symptôme : cliquer Résolu sur une alerte bouton puis rafraîchir fait revenir le même problème. Cause racine : resolveAlertWithLearning marquait le contrôle de santé « ok » sans qu'aucun code n'ait changé ; le scan suivant constatait que le bouton était toujours dans l'inventaire et rouvrait l'alerte. Correction : isKnownGhostButton vérifie que le bouton a réellement disparu avant de promettre ; sinon l'alerte reste « prise en compte » avec un motif exact. Leçon : un état ne se déclare pas, il se constate.\n8. FAUX POSITIFS DES AUDITS. (a) Huit moteurs signalés « Existe mais non connectée » alors qu'ils filtrent le catalogue annonces partagé : ROUTEURS_PARTAGES ajouté à l'auditeur, controle_technique volontairement laissé en défaut réel. (b) Contrôle continu : la destination /pays/france était jugée inconnue parce que comparée à la liste littérale des routes ; isRoutablePath est utilisé (PR 330), 28 liens morts réels corrigés au passage. (c) Bandeau « dépendance circulaire : aucun ordre de démarrage possible » contredisait la doc du détecteur (PR 325).\n9. PAIEMENTS CASSÉS DEPUIS LEUR ÉCRITURE (PR 381). Cause : trois parcours (devis garage, abonnement carte grise, pack de dossiers) passaient un type de paiement absent de l'énumération PostgreSQL ; confirmé par un INSERT direct. Autres : webhook sans gestionnaire pour carte_grise_service (le client payait, le dossier n'avançait jamais), absence d'idempotence sur les redélivrances Stripe, vocabulaire « Caution » pour un encaissement immédiat (corrigé en « Acompte »), montant du devis fait confiance au client (désormais calculé par le serveur, PR 267), réponse brute du prestataire renvoyée au client (PR 226).\n10. DÉRIVE ENTRE SCHÉMA ET BASE (PR 334 et LOT 5). Cause : deux fichiers déclaraient les mêmes tables pièces avec des colonnes différentes, seule une version étant migrée ; l'estimation budget pièces joignait une table orpheline toujours vide ; quatre tables du Ledger avaient des colonnes déclarées jamais migrées. Correction : une seule définition, code mort supprimé, migrations additives.\n11. SÉCURITÉ. 64 routes Pro/internes se rendaient pour n'importe quelle adresse tapée (PR 313) : verrouillées par le Permission Engine. annonces.get exposait les brouillons à qui devinait un identifiant (corrigé : visibles du propriétaire et des administrateurs). Un professionnel sans abonnement atteignait les écrans VO (cloisonnement décidé par le serveur, PR 268). Le 2 octobre, le Global Country Engine était joignable par le public : réservé au PDG, avec les lectures publiques réduites à nom, langues et devise.\n12. PANNE DU CHAT PRINCIPAL (PR 262). Symptôme : le PDG ne pouvait pas envoyer de commande à l'assistant. Cause : aucun fournisseur de modèles configuré en production, l'envoi échouait silencieusement avec « aucun fournisseur habilité ». Correction : procédure de diagnostic (présence seulement, aucune valeur) et bandeau rouge qui nomme la variable manquante. Suites : sonde des capacités par vrais appels (2 octobre).\n13. VOIX TEMPS RÉEL. L'offre WebRTC partait sans saut de ligne final (400 invalid_offer) parce que le serveur la nettoyait : analyseur SDP strict vérifié sur une vraie offre Chromium (brute acceptée, nettoyée refusée, nettoyée avec CRLF acceptée). Bannière d'installation qui recouvrait le bouton stop (z-index 10000). Modèles de transcription refusés par le projet (model_not_found) : repli sur une liste fermée et modèle retenu par le navigateur. Micro bleu : démarrage annoncé avant que la session soit prête. Défaut d'affichage reproduit à 320×568 avant d'être corrigé.\n14. MODE TRAVAIL ARRÊTÉ DÈS L'ANALYSE (2 octobre). Cause : le moteur de l'orchestrateur n'avait pas la permission ANALYZE ; toute mission s'arrêtait. Correction : ANALYZE et PROPOSE accordés (jamais WRITE, TEST, DEPLOY), Chat et Travail alignés sur une même mémoire.\n15. DÉPENDANCES DE REGISTRE ET ÉTATS BLOQUÉS (PR 276, 344). Le registre déclarait des dépendances trop courtes (Smart, Permission, Redirection) et un cercle staging → non configurée interdisait toute promotion sur preuve : dépendances alignées, circularité corrigée.\n16. PR FUSIONNÉES AVANT LEURS CORRECTIFS (2 octobre). Constat : une PR était fusionnée dès que la CI était verte sur son premier commit, avant les correctifs de relecture. Pratique : tout mettre dans la PR avant la fin de la CI ou ouvrir une PR de suite (PR 543 → 544 → 545 pour la mémoire par le sens).\n17. INCIDENT DE SECRET. Un identifiant de base de production est apparu une fois dans la sortie d'un outil ; le PDG a été invité à le renouveler. Règle depuis : toute commande de test locale s'exécute avec un environnement vidé (env -i) contre une base locale jetable ; aucune clé n'est collée en conversation ni dans le code.",
  "pourquoi": "Le PDG veut que l'IA retienne comment les problèmes ont été trouvés et résolus, y compris ceux qui ont persisté, afin de ne pas les revivre et de chercher la cause racine plutôt que le symptôme.",
  "ou": [
    "scripts/check-naming.mjs",
    "scripts/check-providers.mjs",
    "server/engine-registry/diagnose.ts",
    "server/smart-engine/health-monitor.ts",
    "server/routers/stripeWebhook.ts",
    "server/schema.ts",
    "server/intelligences/orchestrateur.ts"
  ],
  "lecon": "La cause racine se trouve presque toujours en reproduisant le défaut exactement comme la production le subit (journaux de compilation, INSERT direct, offre SDP réelle, écran à 320×568), puis en montrant le même contrôle qui passe. Un symptôme corrigé sans cause reproduite revient.",
  "historique": true
},
{
  "cle": "recit-retours-arriere-et-capacite-manquante",
  "titre": "Retours en arrière : ce qui a été fait, ce qui existe dans la plateforme, et ce qui manque encore",
  "categorie": "decisions",
  "domaine": "confiance",
  "moteurs": [
    "plateforme"
  ],
  "quoi": "CE QUI S'EST RÉELLEMENT PASSÉ DANS L'HISTORIQUE\n- 22 août : la PR 246 annule (revert) la fusion de la PR 232 (logo : lettre S entièrement visible et ligne lumineuse). Le message du revert ne donne pas la raison ; la cause n'est donc pas affirmée ici.\n- Réparations « en avant » plutôt que retours : le 30 septembre « restaurer les fichiers complets du changement vocal » ; le 1er octobre « Urgence : restaurer Railway et la voix multi-appareils » (PR 508) répare les inventaires générés qui bloquaient les publications 505 à 507 ; le 15 septembre la PR 335 lève le mot interdit qui bloquait tout déploiement ; le 11 septembre la PR 294 reformule l'entrée de mémoire qui cassait le build.\n- 2 octobre : trois PR de suite pour une même livraison (mémoire par le sens : 543, 544, 545) parce que la fusion automatique survient dès que la CI est verte sur le premier commit.\n\nCOMMENT LA CAUSE A ÉTÉ CHERCHÉE À CHAQUE FOIS\nLire le journal de compilation de l'échec ; reproduire localement la séquence exacte ; isoler le contrôle qui échoue ; corriger ; rejouer toute la séquence ; seulement ensuite pousser. Pour la voix : analyseur SDP réel sur une offre générée par Chromium. Pour un test de non-régression : le faire échouer volontairement avant de rétablir la correction.\n\nCE QUI EXISTE DANS LA PLATEFORME AUTOUR DU RETOUR ARRIÈRE (vérifié dans le code)\n- Journal des modifications d'agents (agent_change_log) avec rollback_plan ; l'analyse d'impact signale « Aucune procédure de retour arrière documentée : en cas d'incident, la remise en état sera improvisée ».\n- Passages de pipeline avec rollbackPlan ; le Completion Center calcule « retour arrière disponible » dans le rapport de fin de travail.\n- Action de direction « retour arrière d'un passage de pipeline » : elle DÉCLARE le retour arrière et rouvre la surveillance ; elle n'exécute aucun redéploiement.\n- Sauvegarde et restauration (backup-os) : la demande de restauration NE restaure PAS ; elle attend la validation humaine du PDG.\n- Approbateurs de déploiement nominatifs et lecture réelle de l'état Railway en lecture seule. Les fonctions de déclenchement et de retour arrière d'un déploiement Railway sont volontairement NON implémentées : l'application ne déploie ni ne restaure elle-même.\n\nCE QUI MANQUE (demande du PDG, formulée après la PR 553, qu'il ajoutera lui-même) : quand l'IA déploie un code et qu'un problème apparaît, pouvoir revenir en arrière pour remettre la plateforme, ou la partie touchée, comme avant. État de la branche main à son dernier commit (3 octobre 2026) : cette capacité n'existe pas. Rien n'est promis comme disponible.\nPistes à valider avant toute construction (non construites) : jeton Railway autorisé à redéployer le déploiement précédent ; demande d'approbation nominative comme pour un déploiement ; déclenchement seulement après constat réel de l'échec (statut du déploiement et santé de la plateforme), jamais sur supposition ; trace dans le journal des modifications d'agents ; distinction explicite entre retour arrière du CODE et retour arrière des DONNÉES (une migration additive ne se défait pas en redéployant l'ancien code, une migration destructive n'est jamais lancée automatiquement).",
  "pourquoi": "Le PDG veut savoir comment les problèmes ont été défaits, et que la plateforme sache un jour se remettre d'un mauvais déploiement. Il faut donc distinguer le fait (ce qui a été annulé ou réparé), l'existant (ce que le code permet déjà) et le manque (ce qui reste à construire sur sa demande).",
  "ou": [
    "server/engine-registry/agent-changes.ts",
    "server/engine-registry/change-impact.ts",
    "server/completion/service.ts",
    "server/intelligences/actions.ts",
    "server/backup-os/index.ts",
    "server/intelligences/deploiement/railway.ts"
  ],
  "lecon": "Distinguer toujours trois choses : ce qui a été fait, ce que le code permet déjà, ce qui manque. Une capacité de retour arrière déclarée mais non exécutable doit être dite telle quelle ; elle ne doit jamais être présentée comme un filet de sécurité réel.",
  "historique": true
},
{
  "cle": "recit-journee-1-2-octobre-2026",
  "titre": "Récit des travaux de Claude des 1er et 2 octobre 2026 : micros, coffre, boutique, mémoire, sécurité, agent développeur",
  "categorie": "projets",
  "domaine": "intelligences",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Chaque ligne est tirée d'un commit ou d'une PR de ces deux jours ; le détail technique est dans les entrées pr-/livraison correspondantes.\n1er octobre — Micros : la bannière d'installation (z-index 10000) recouvrait le bouton stop et interceptait le clic ; connexion vocale annulable, canal d'événements surveillé, codes d'échec de transcription visibles, dictée du navigateur en relais si la liaison ne s'établit jamais.\n2 octobre —\n• Voix : l'offre WebRTC partait sans CRLF final (400 invalid_offer), corrigé et vérifié sur une vraie offre Chromium ; modèle de transcription de repli ; toutes les voix du mode direct avec aperçu « Écouter cette voix » ; micro bleu qui annonce « Je vous écoute » seulement quand liaison, canal et session sont prêts, salutations arabes en lettres latines, micro borné dans le cadre du téléphone (défaut reproduit à 320×568).\n• Coffre secret : « Ajouter un secret » illimité ; plus aucun bouton mort ; clé maître absente = consigne et défilement vers la carte d'activation ; jamais de nouvelle clé quand des secrets existent déjà (il faut restaurer la clé d'origine) ; états chargement/erreur/clé absente distingués.\n• Boutique SHOP : cinq outils d'accès de service (capacités, liste, lecture, lancer les photos, brouillon de fiche jamais publié), adresse et jeton lus dans le Coffre, 23 entrées de la mémoire de la boutique reprises mot pour mot ; l'IA ne réclame plus jamais le jeton de la boutique pour du développement ou un déploiement.\n• Autonomie : section « Autonomie de travail » dans la consigne de la direction (exécuter, enchaîner les outils, chercher une autre solution, rendre compte) avec limites inchangées ; boucle d'outils portée de 5 à 12 tours ; les outils HIGH/CRITICAL restent refusés par la politique.\n• Mode Travail réparé (permission ANALYZE manquante au moteur de l'orchestrateur) et Chat/Travail alignés sur une même mémoire.\n• Mémoire automobile : référentiel de départ avec provenance (436 marques notables, catégories, 24 systèmes, 212 familles de pièces, statut « propose »), synchronisation mensuelle des marques depuis la source publique NHTSA, outil automobile.rechercherMemoire ; 23 souvenirs des travaux des 1er et 2 octobre.\n• Connexion Google : le bouton ne fait plus semblant ; identifiant lu à l'exécution côté serveur ; adresse vérifiée exigée pour rattacher un compte existant.\n• Sécurité urgente : Global Country Engine réservé au PDG (route verrouillée par le Permission Engine, écritures et santé réservées, liste publique réduite).\n• Équipe : postes sous-directeur, comptable, chef d'équipe, investisseur, partenaire ; création de compte interne avec poste ; seul le PDG crée un compte Administration et attribue un poste.\n• Accueil : cartes de pays cliquables pour choisir son pays, sans réglages visibles du public.\n• Sonde des capacités du fournisseur de modèles : liste des modèles du projet puis un vrai appel par capacité, états séparés, FUNCTIONAL seulement via l'adaptateur de la plateforme, preuves en base sans clé ni message brut.\n• Mémoire par le sens (embeddings) : passerelle, table in_empreintes, indexation à l'écriture, reprise de l'existant par lots, recherche par le sens après la recherche textuelle, éteinte par défaut ; corrections de revue : droits appliqués avant le classement, versions périmées purgées, repli de modèle durable, verrou de ligne contre le remplacement concurrent.\n• Agent développeur : demande courte = reprise de la mission active ou une seule question ; « inconnu » n'est jamais un composant ; étapes « faites » seulement avec preuve ; autorisation par opération réelle ; reprise avec résultats conservés ; mémoire sans doublons (migration 0155 conserve l'ancien compteur) ; huit défauts de revue corrigés avant fusion de la PR 547.\n\nPOINTS ENCORE OUVERTS À CETTE DATE : « tout mettre en marche » (autonomie maximale) attend l'accord du PDG, avec la proposition de garder paiements et infrastructure fermés ; clé maître du Coffre à poser dans Railway ; rôle comptable ; résultats de la sonde après redéploiement ; activation de « Recherche par le sens » et de « Reprendre l'existant » ; instructions page par page pour optimiser la plateforme principale.",
  "pourquoi": "Garder dans la mémoire de l'IA le récit détaillé et exact des deux journées les plus denses, avec ce qui a été trouvé, corrigé et ce qui reste ouvert.",
  "ou": [
    "server/intelligences/provider.ts",
    "server/intelligences/empreintes.ts",
    "server/intelligences/coffre.ts",
    "server/intelligences/orchestrateur.ts",
    "server/country-os/index.ts",
    "client/src/pages/intelligence/modules/Conversation.tsx"
  ],
  "lecon": "Une journée très dense reste sûre si chaque livraison est vérifiée sur un vrai parcours, inscrite à la mémoire, et si ce qui reste ouvert est écrit au lieu d'être sous-entendu.",
  "historique": true
},
{
  "cle": "recit-regles-permanentes-du-pdg",
  "titre": "Règles permanentes données par le PDG et pratiques qui en découlent",
  "categorie": "decisions",
  "domaine": "decisions",
  "moteurs": [
    "plateforme"
  ],
  "quoi": "RÈGLES PERMANENTES MKA.P-MS (telles que transmises dans les consignes de travail) :\n- Ne jamais fabriquer : une donnée, un état, un résultat ou un bouton qui n'a pas de preuve réelle.\n- Compléter le travail des autres ; ne jamais le dupliquer ni le remplacer.\n- Ajouter une entrée au registre des livraisons pour chaque livraison.\n- Exécuter la commande de build exacte de la CI avant chaque publication, et régénérer les inventaires quand ils dérivent.\n- Une PR par tâche ; elle est fusionnée quand la CI (build et shop-knowledge) est verte sur le dernier commit et qu'aucun fil de relecture n'est ouvert ; répondre aux fils traités et les résoudre.\n- Retour d'expérience du PDG : « Dès que je te dis qu'il y a des problèmes, il ne faut pas insister. Direct, cherche le problème. »\n- Ne jamais toucher aux données ni à la base de production ; aucun secret dans le code ni en conversation ; tests locaux avec un environnement vidé et une base locale.\n- Ne rien désactiver, ne rien diminuer : les capacités et les API existantes se conservent ; on développe en plus (consigne la plus récente du PDG).\n- Le nom officiel de l'assistant et les noms visibles sont ceux fixés par le PDG ; le mot isolé « IA »/« AI » ne s'écrit pas dans les libellés visibles (garde-fou check:naming).\n- Plan maître fournisseurs : retranscrit sans simplification ni suppression ; toute capacité listée reste prévue dans l'architecture même si elle n'est pas utilisée tout de suite ; l'activation se fait par permissions, abonnement, pays, contrat, fournisseur, risque ou validation humaine ; les clés d'API ne sont jamais exposées (frontend, mobile, journaux publics, dépôt).\n- Décisions de direction jamais automatiques : validation du fournisseur, signature de contrat, publication, déploiement, paiement.",
  "pourquoi": "Les règles du PDG doivent rester disponibles pour toute mission future de l'IA, sans qu'il faille les répéter.",
  "ou": [
    "server/intelligences/regles.ts",
    "server/intelligences/livraisons.ts",
    "docs/PLAN_MAITRE_FOURNISSEURS.md"
  ],
  "lecon": "Une règle donnée une fois par le PDG est une règle permanente : elle s'applique aux missions suivantes sans qu'on le lui redemande.",
  "historique": true
},
{
  "cle": "recit-ce-qui-reste-a-faire-au-3-octobre-2026",
  "titre": "Chantiers encore ouverts au 3 octobre 2026 (suivi des tâches) et décisions en attente du PDG",
  "categorie": "projets",
  "domaine": "decisions",
  "moteurs": [
    "plateforme"
  ],
  "quoi": "CHANTIERS NOMMÉS DANS LE SUIVI DES TÂCHES ET NON TERMINÉS\n- Completion Center : combler la couverture (liste des domaines incomplète) ; connecter les 9 domaines d'intelligence sans implémentation réelle.\n- Détecteur de cartes de tableau de bord non cliquables ; audit des boutons sans action (77 écrans sur 89 sans aucun backend) ; flux garage, vente/Centre* et location flotte/réservation sans backend ; écrans vente/véhicule et démarches/dépôt d'annonce restants.\n- Identité légale réelle de MKA.P-MS Guinée à saisir dans le registre (RCCM, NIF, adresse, représentant).\n- Couverture premium multi-pages et filigrane verrouillé VO v7 ; rattachement recordEdition() sur les écrans restants ; immutabilité réelle d'un document signé et rendu PDF en images pour contrôle visuel.\n- Paiements manquants : location, facture autonome, photos supplémentaires/options premium, gagnant d'une enchère, règles de paiement international (table jamais alimentée), émission active de remboursement/annulation ; audit de la couverture des cas de paiement.\n- Catégorisation du chiffre d'affaires par univers ; CentrePilotage de comptabilité encore fabriqué ; DocumentPDF qui fabrique une adresse et un e-mail client.\n- Clé de calcul de distance routière à fournir (sans elle le devis reste « Non mesuré »).\n- drizzle-kit generate à réparer (chaîne de snapshots divergente depuis 0010) ; vérifier en production la migration des tables cpe_rules et cpe_evaluations.\n- Moteurs Google distincts par type d'objet, découvrabilité de tous les univers publics, SEO par intention de recherche, moteurs de campagnes principale et boutique, prospection B2B, remplacement du libellé « bloqué par validation externe » par une attente d'activation avec reprise automatique, écran Global Country Engine à reconnecter sur le moteur réel.\n\nDÉCISIONS ET ACTIONS EN ATTENTE DU PDG\n- « Tout mettre en marche » (autonomie et automatisation au maximum) : proposition de tout activer en gardant paiements et infrastructure fermés au niveau 7 tant que le PDG ne le demande pas.\n- Poser la clé maître du Coffre dans Railway (et restaurer la clé d'origine si des secrets existent déjà) puis déposer les jetons des outils.\n- Rôle du comptable ; outillage d'écriture et de déploiement de l'IA ; retour arrière automatique d'un déploiement problématique (voir l'entrée dédiée).\n- Rotation de l'identifiant de base de production apparu une fois en sortie d'outil.\n- Instructions page par page pour optimiser la plateforme principale.",
  "pourquoi": "Pour que l'IA sache exactement ce qui reste à faire et ce qui dépend d'une décision humaine, sans présenter un chantier ouvert comme terminé.",
  "ou": [
    "docs/JOURNAL_DE_BORD_CHANTIER.md"
  ],
  "lecon": "Un chantier ouvert se nomme ; il n'est jamais compté comme livré. Cette liste est celle du suivi des tâches au 3 octobre 2026 et doit être relue contre le suivi courant avant d'être citée.",
  "historique": true
},
{
  "cle": "pr-206",
  "titre": "registre — points 41-42 — registre central avec 5 états opérationnels calculés + journal des modifications d'agents",
  "moteurs": [
    "registre"
  ],
  "quoi": "Origine : PR 206 du 2026-08-10, branche devin/1786386405-registre-journal-agents (famille devin), commits 0d8093f6, auteur git : Mka Garage.\n\n• feat(registre): points 41-42 — registre central avec 5 états opérationnels calculés + journal des modifications d'agents\n(Message de commit réduit au titre : le détail se trouve dans le diff, 6 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 206 et le diff.",
  "ou": [
    "client/src/pages/EngineRegistry/ControlCenter.tsx",
    "drizzle/0072_journal_modifications_agents.sql",
    "server/engine-registry/agent-changes.ts",
    "server/engine-registry/bootstrap.ts",
    "server/engine-registry/readiness.ts",
    "server/engine-registry/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-207",
  "titre": "moteurs — points 43-44 — dépendances en cascade, validation avant action sensible, anomalies consolidées, retour arrière",
  "moteurs": [
    "moteurs"
  ],
  "quoi": "Origine : PR 207 du 2026-08-10, branche devin/1786386894-dependances-validations-retour (famille devin), commits f7f45f04, auteur git : Mka Garage.\n\n• feat(moteurs): points 43-44 — dépendances en cascade, validation avant action sensible, anomalies consolidées, retour arrière\n(Message de commit réduit au titre : le détail se trouve dans le diff, 3 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 207 et le diff.",
  "ou": [
    "client/src/pages/EngineRegistry/ControlCenter.tsx",
    "server/engine-registry/dependencies.ts",
    "server/engine-registry/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-208",
  "titre": "assurance+recharge — point 45 — mise en relation assurance auto et annuaire des bornes de recharge",
  "moteurs": [
    "assurancerecharge"
  ],
  "quoi": "Origine : PR 208 du 2026-08-10, branche devin/1786387174-assurance-bornes-recharge (famille devin), commits 53e8f2e0, auteur git : Mka Garage.\n\n• feat(assurance+recharge): point 45 — mise en relation assurance auto et annuaire des bornes de recharge\n(Message de commit réduit au titre : le détail se trouve dans le diff, 14 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 208 et le diff.",
  "ou": [
    "client/src/pages/labs/EnergyRecharge.tsx",
    "client/src/pages/operations/MKAPMSAssurance.tsx",
    "drizzle/0073_assurance_bornes_recharge.sql",
    "server/charging-engine/index.ts",
    "server/charging-engine/schema.ts",
    "server/charging-engine/service.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/probes.ts",
    "server/insurance-engine/index.ts",
    "server/insurance-engine/schema.ts",
    "server/insurance-engine/service.ts",
    "server/notification-os/triggers.ts",
    "server/router.ts",
    "server/schema.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-209",
  "titre": "avis — points 46-47-48 — Reviews & Reputation Engine, dépôt/consultation par univers, expérience vérifiée après transaction réelle",
  "moteurs": [
    "avis"
  ],
  "quoi": "Origine : PR 209 du 2026-08-10, branche devin/1786388048-avis-reputation-engine (famille devin), commits b17fabf6, auteur git : Mka Garage.\n\n• feat(avis): points 46-47-48 — Reviews & Reputation Engine, dépôt/consultation par univers, expérience vérifiée après transaction réelle\n(Message de commit réduit au titre : le détail se trouve dans le diff, 18 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 209 et le diff.",
  "ou": [
    "client/src/App.tsx",
    "client/src/components/avis/BlocAvis.tsx",
    "client/src/pages/Compte.tsx",
    "client/src/pages/compte/MesAvis.tsx",
    "client/src/pages/garage/GaragePublicFiche.tsx",
    "drizzle/0074_avis_reputation_pays.sql",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/probes.ts",
    "server/modules/reviews.ts",
    "server/notification-os/triggers.ts",
    "server/reputation-engine/index.ts",
    "server/reputation-engine/service.ts",
    "server/router.ts",
    "server/routers/depannage.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-210",
  "titre": "avis — points 49-50 — détection des faux avis traçable et droit de réponse des professionnels",
  "moteurs": [
    "avis"
  ],
  "quoi": "Origine : PR 210 du 2026-08-10, branche devin/1786388760-avis-fraude-reponses (famille devin), commits 2fffbec0, auteur git : Mka Garage.\n\n• feat(avis): points 49-50 — détection des faux avis traçable et droit de réponse des professionnels\nPoint 49 : chaque avis déposé est analysé (rafale de comptes, répétition sur une\nmême cible, rafale de notes uniformes, commentaire dupliqué, conflit d'intérêt,\nabsence de transaction). Les signaux sont écrits dans review_fraud_signals avec\ngravité, détail, acteur et décision. Un signal critique place l'avis en\nvérification et prévient la direction — aucune suppression automatique, et une\nnote basse n'est jamais un signal en elle-même.\n\nPoint 50 : le droit de réponse est résolu à partir des tables métier\n(garages, boutiques de pièces, transporteurs, dépanneurs) au lieu du seul\ntargetType \"user\". Le Système Intelligent propose un brouillon identifié comme\ntel ; la publication reste une action explicite du professionnel.\n\nLa modération exige désormais un motif écrit pour masquer ou refuser un avis, et\nles agrégats sont recalculés après toute décision.",
  "pourquoi": "Point 49 : chaque avis déposé est analysé (rafale de comptes, répétition sur une\nmême cible, rafale de notes uniformes, commentaire dupliqué, conflit d'intérêt,\nabsence de transaction). Les signaux sont écrits dans review_fraud_signals avec\ngravité, détail, acteur et décision. Un signal critique place l'avis en\nvérification et prévient la direction — aucune suppression automatique, et une\nnote basse n'est jamais un signal en elle-même.",
  "ou": [
    "client/src/App.tsx",
    "client/src/pages/Compte.tsx",
    "client/src/pages/pro/AvisPro.tsx",
    "drizzle/0075_avis_signaux_fraude.sql",
    "server/modules/reviews.ts",
    "server/notification-os/triggers.ts",
    "server/reputation-engine/fraud.ts",
    "server/reputation-engine/index.ts",
    "server/reputation-engine/ownership.ts",
    "server/reputation-engine/responses.ts",
    "server/routers/reviewsV2.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-225",
  "titre": "paiement — le bouton de paiement ouvre l'écran carte au lieu du portefeuille",
  "moteurs": [
    "paiement"
  ],
  "quoi": "Origine : PR 225 du 2026-08-14, branche devin/1786563000-paiement-carte (famille devin), commits 4848c1d8, auteur git : Mka Garage.\n\n• fix(paiement): le bouton de paiement ouvre l'écran carte au lieu du portefeuille\nPanier pièces, acompte de réservation et boutons location/VTC ouvrent\ndésormais un Checkout réel du prestataire retenu par l'orchestrateur.\nLes moyens réellement encaissables (pays, devise, service) sont affichés\navant le départ, et la confirmation vient du webhook, jamais du retour\nnavigateur.",
  "pourquoi": "Panier pièces, acompte de réservation et boutons location/VTC ouvrent\ndésormais un Checkout réel du prestataire retenu par l'orchestrateur.\nLes moyens réellement encaissables (pays, devise, service) sont affichés\navant le départ, et la confirmation vient du webhook, jamais du retour\nnavigateur.",
  "ou": [
    "client/src/App.tsx",
    "client/src/components/MoyensPaiement.tsx",
    "client/src/pages/Compte.tsx",
    "client/src/pages/PaiementVehicule.tsx",
    "client/src/pages/Pieces.tsx",
    "client/src/pages/PiecesCommande.tsx",
    "client/src/pages/Vehicule.tsx",
    "server/payment-engine/checkout.ts",
    "server/payment-engine/router.ts",
    "server/routers/pieces.ts",
    "server/routers/reservations.ts",
    "server/stripeWebhook.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "paiement",
  "historique": true
},
{
  "cle": "pr-226",
  "titre": "paiement — la réponse brute du prestataire n'atteint plus le client + clé Stripe vérifiée au démarrage",
  "moteurs": [
    "paiement"
  ],
  "quoi": "Origine : PR 226 du 2026-08-15, branche devin/1786745634-paiement-cle-prestataire (famille devin), commits e63d5d30, auteur git : Mka Garage.\n\n• fix(paiement): la réponse brute du prestataire n'atteint plus le client + clé Stripe vérifiée au démarrage\n(Message de commit réduit au titre : le détail se trouve dans le diff, 7 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 226 et le diff.",
  "ou": [
    "server/index.ts",
    "server/lib/payment-errors.ts",
    "server/lib/stripe.ts",
    "server/payment-engine/checkout.ts",
    "server/payment-orchestrator/index.ts",
    "server/routers/abonnements.ts",
    "server/routers/reservations.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "paiement",
  "historique": true
},
{
  "cle": "commit-5dcf6006",
  "titre": "event-bus — points 104-107 — bus central, moteurs réellement abonnés, remises tracées et observables",
  "moteurs": [
    "event-bus"
  ],
  "quoi": "Origine : commits du 2026-08-16 (commit arrivé par une fusion de synchronisation), commits 5dcf6006, auteur git : Mka Garage.\n\n• feat(event-bus): points 104-107 — bus central, moteurs réellement abonnés, remises tracées et observables\n(Message de commit réduit au titre : le détail se trouve dans le diff, 0 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir le diff du commit.",
  "ou": [
    "(fichiers visibles dans le diff du commit)"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-227",
  "titre": "audit — point 91 — audit d'activation général (existe / connecté / activé / testé / utilisé)",
  "moteurs": [
    "audit"
  ],
  "quoi": "Origine : PR 227 du 2026-08-16, branche devin/1786839621-audit-activation (famille devin), commits 6813fb96, auteur git : Mka Garage.\n\n• feat(audit): point 91 — audit d'activation général (existe / connecté / activé / testé / utilisé)\n(Message de commit réduit au titre : le détail se trouve dans le diff, 12 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 227 et le diff.",
  "ou": [
    "client/src/App.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/AuditActivation.tsx",
    "drizzle/0084_activation_audit.sql",
    "server/activation-audit/index.ts",
    "server/activation-audit/inventory.ts",
    "server/activation-audit/schema.ts",
    "server/activation-audit/service.ts",
    "server/data/client-routes.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/probes.ts",
    "server/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-228",
  "titre": "indexation — points 92-101 — audit Google URL par URL, moniteur PDG, alertes de visibilité",
  "moteurs": [
    "indexation"
  ],
  "quoi": "Origine : PR 228 du 2026-08-16, branche devin/1786840071-indexation-google (famille devin), commits 552a806b, auteur git : Mka Garage.\n\n• feat(indexation): points 92-101 — audit Google URL par URL, moniteur PDG, alertes de visibilité\n(Message de commit réduit au titre : le détail se trouve dans le diff, 14 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 228 et le diff.",
  "ou": [
    "client/src/App.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/CentreIndexation.tsx",
    "drizzle/0085_indexation_monitor.sql",
    "server/data/client-routes.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/probes.ts",
    "server/indexation/index.ts",
    "server/indexation/inventory.ts",
    "server/indexation/probe.ts",
    "server/indexation/schema.ts",
    "server/indexation/service.ts",
    "server/router.ts",
    "server/seo-hooks.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "seo",
  "historique": true
},
{
  "cle": "pr-229",
  "titre": "produits — points 94-97 — pipelines Véhicules/Produits séparés, Google Product Engine, flux Merchant",
  "moteurs": [
    "produits"
  ],
  "quoi": "Origine : PR 229 du 2026-08-16, branche devin/1786868278-product-engine (famille devin), commits bcfebbaa, auteur git : Mka Garage.\n\n• feat(produits): points 94-97 — pipelines Véhicules/Produits séparés, Google Product Engine, flux Merchant\n(Message de commit réduit au titre : le détail se trouve dans le diff, 14 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 229 et le diff.",
  "ou": [
    "client/src/App.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/CentreProduitsGoogle.tsx",
    "drizzle/0086_product_engine.sql",
    "server/data/client-routes.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/probes.ts",
    "server/index.ts",
    "server/product-engine/eligibility.ts",
    "server/product-engine/index.ts",
    "server/product-engine/schema.ts",
    "server/product-engine/service.ts",
    "server/router.ts",
    "server/routers/pieces.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "seo",
  "historique": true
},
{
  "cle": "pr-230",
  "titre": "systeme-intelligent — points 102-103 — audit des 16 capacités sur preuve d'usage, cycle réellement exécuté",
  "moteurs": [
    "systeme-intelligent"
  ],
  "quoi": "Origine : PR 230 du 2026-08-16, branche devin/1786868759-systeme-intelligent (famille devin), commits 00ab8528, auteur git : Mka Garage.\n\n• feat(systeme-intelligent): points 102-103 — audit des 16 capacités sur preuve d'usage, cycle réellement exécuté\n(Message de commit réduit au titre : le détail se trouve dans le diff, 13 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 230 et le diff.",
  "ou": [
    "client/src/App.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/CentreSystemeIntelligent.tsx",
    "drizzle/0087_smart_audit.sql",
    "server/command-center/service.ts",
    "server/data/client-routes.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/probes.ts",
    "server/router.ts",
    "server/smart-audit/capabilities.ts",
    "server/smart-audit/index.ts",
    "server/smart-audit/schema.ts",
    "server/smart-audit/service.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "commit-fac2e620",
  "titre": "controle-continu — points 108-113 — contrôles réellement exécutés, preuve datée, régressions nommées",
  "moteurs": [
    "controle-continu"
  ],
  "quoi": "Origine : commits du 2026-08-17 (commit arrivé par une fusion de synchronisation), commits fac2e620, auteur git : Mka Garage.\n\n• feat(controle-continu): points 108-113 — contrôles réellement exécutés, preuve datée, régressions nommées\n(Message de commit réduit au titre : le détail se trouve dans le diff, 0 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir le diff du commit.",
  "ou": [
    "(fichiers visibles dans le diff du commit)"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-234",
  "titre": "controle-continu — points 110-113 — boutons morts, pays, rôles et écrans réellement contrôlés",
  "moteurs": [
    "controle-continu"
  ],
  "quoi": "Origine : PR 234 du 2026-08-17, branche devin/1786970505-tests-boutons-pays-roles (famille devin), commits 716cb40f, auteur git : Mka Garage.\n\n• feat(controle-continu): points 110-113 — boutons morts, pays, rôles et écrans réellement contrôlés\n(Message de commit réduit au titre : le détail se trouve dans le diff, 7 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 234 et le diff.",
  "ou": [
    "client/src/pages/CentreControleContinu.tsx",
    "server/continuous-test/catalog.ts",
    "server/continuous-test/helpers.ts",
    "server/continuous-test/scenarios-parcours.ts",
    "server/continuous-test/service.ts",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-235",
  "titre": "code-graph — points 114-118 — mémoire technique du code, moteurs centraux contrôlés, apprentissage des corrections",
  "moteurs": [
    "code-graph"
  ],
  "quoi": "Origine : PR 235 du 2026-08-17, branche devin/1786971691-code-knowledge-graph (famille devin), commits af4893f4, auteur git : Mka Garage.\n\n• feat(code-graph): points 114-118 — mémoire technique du code, moteurs centraux contrôlés, apprentissage des corrections\nPoint 117 : le relevé du code est calculé depuis les sources réelles au build et relie service → moteur → fichiers → API → tables → événements → tests → dépendances, en exposant ses angles morts (moteurs sans contrôle, tables sans module propriétaire).\nPoint 116 : l'agent code observe — chaque relevé enregistre ce qui est apparu, disparu ou changé depuis le précédent. Il n'écrit aucun code.\nPoint 118 : les corrections déjà validées (journal des modifications d'agents, régressions du contrôle continu, alertes résolues) sont mémorisées par classe d'anomalie.\nPoint 115 : openDevRequest() lit le graphe avant de proposer un plan, et reste soumis au pipeline obligatoire.\nPoint 114 : neuf contrôles continus sur les deux moteurs centraux (disponibilité, moteurs enfants, commandes tracées, mémoire, alertes, reprise après panne).\n\nÉcran PDG : /admin/memoire-technique.",
  "pourquoi": "Point 117 : le relevé du code est calculé depuis les sources réelles au build et relie service → moteur → fichiers → API → tables → événements → tests → dépendances, en exposant ses angles morts (moteurs sans contrôle, tables sans module propriétaire).\nPoint 116 : l'agent code observe — chaque relevé enregistre ce qui est apparu, disparu ou changé depuis le précédent. Il n'écrit aucun code.\nPoint 118 : les corrections déjà validées (journal des modifications d'agents, régressions du contrôle continu, alertes résolues) sont mémorisées par classe d'anomalie.\nPoint 115 : openDevRequest() lit le graphe avant de proposer un plan, et reste soumis au pipeline obligatoire.\nPoint 114 : neuf contrôles continus sur les deux moteurs centraux (disponibilité, moteurs enfants, commandes tracées, mémoire, alertes, reprise après panne).",
  "ou": [
    ".gitignore",
    "client/src/App.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/MemoireTechnique.tsx",
    "drizzle/0090_code_graph.sql",
    "package.json",
    "scripts/code-graph.mjs",
    "server/code-graph/index.ts",
    "server/code-graph/schema.ts",
    "server/code-graph/service.ts",
    "server/command-center/service.ts",
    "server/continuous-test/catalog.ts",
    "server/continuous-test/scenarios-moteurs-centraux.ts",
    "server/engine-registry/catalog.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-236",
  "titre": "completion — points 119-120-121-122 — règle TERMINÉ calculée, rapport obligatoire, Completion Center, ordre d'exécution observé",
  "moteurs": [
    "completion"
  ],
  "quoi": "Origine : PR 236 du 2026-08-17, branche devin/1786972382-completion-center (famille devin), commits c901e948, auteur git : Mka Garage.\n\n• feat(completion): points 119-120-121-122 — règle TERMINÉ calculée, rapport obligatoire, Completion Center, ordre d'exécution observé\nPoint 119 : TERMINÉ = construit + connecté + activé + testé + observable + inscrit au registre + rapporté au Système Intelligent + non-régression vérifiée + preuve de résultat. Un seul maillon sans preuve écrit PAS TERMINÉ.\nPoint 120 : le rapport de fin de travail calcule lui-même les tests, les régressions, l'information du Système Intelligent, le retour arrière et le statut final — l'auteur ne peut pas se déclarer terminé.\nPoint 121 : Completion Center sur les 17 domaines demandés ; le pourcentage est la part de maillons prouvés, jamais une estimation, et chaque tâche restante est nommée.\nPoint 122 : l'ordre d'exécution des 12 étapes est affiché avec l'état réellement observé en base.\n\nÉcran PDG : /admin/completion.",
  "pourquoi": "Point 119 : TERMINÉ = construit + connecté + activé + testé + observable + inscrit au registre + rapporté au Système Intelligent + non-régression vérifiée + preuve de résultat. Un seul maillon sans preuve écrit PAS TERMINÉ.\nPoint 120 : le rapport de fin de travail calcule lui-même les tests, les régressions, l'information du Système Intelligent, le retour arrière et le statut final — l'auteur ne peut pas se déclarer terminé.\nPoint 121 : Completion Center sur les 17 domaines demandés ; le pourcentage est la part de maillons prouvés, jamais une estimation, et chaque tâche restante est nommée.\nPoint 122 : l'ordre d'exécution des 12 étapes est affiché avec l'état réellement observé en base.",
  "ou": [
    "client/src/App.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/CompletionCenter.tsx",
    "drizzle/0091_completion_center.sql",
    "server/completion/definition.ts",
    "server/completion/index.ts",
    "server/completion/schema.ts",
    "server/completion/service.ts",
    "server/continuous-test/scenarios-moteurs-centraux.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/probes.ts",
    "server/index.ts",
    "server/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-237",
  "titre": "intelligences — MKA.P-MS Intelligences — appels réels au fournisseur, côté direction PDG et assistant public séparés",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Origine : PR 237 du 2026-08-18, branche devin/1787011220-mkapms-intelligences (famille devin), commits 5f90373b, auteur git : Mka Garage.\n\n• feat(intelligences): MKA.P-MS Intelligences — appels réels au fournisseur, côté direction PDG et assistant public séparés\n(Message de commit réduit au titre : le détail se trouve dans le diff, 17 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 237 et le diff.",
  "ou": [
    "client/src/App.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/AssistantIntelligences.tsx",
    "client/src/pages/CentreIntelligences.tsx",
    "drizzle/0092_intelligences.sql",
    "server/continuous-test/catalog.ts",
    "server/continuous-test/scenarios-intelligences.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/probes.ts",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts",
    "server/intelligences/index.ts",
    "server/intelligences/provider.ts",
    "server/intelligences/regles.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-240",
  "titre": "intelligences — points 124-126 — registre des capacités avec état constaté",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Origine : PR 240 du 2026-08-20, branche devin/1787226568-intelligences-124-151 (famille devin), commits fa39834c, e793c67b, 4080df01, d088596f, auteur git : Mka Garage.\n\n• fix(intelligences): rôle typé en chaîne (UserRole non exporté)\n• feat(intelligences): points 127-129 — API interne /v1, routeur de capacités, fournisseur direct interdit\n• feat(intelligences): points 124-126 — registre des capacités avec état constaté\n14 capacités déclarées avec, pour chacune : le moteur MKA qui la porte, le fournisseur\nprincipal et son repli, la permission exigée, le repli propriétaire et le remplacement\nMKA visé. L'état n'est pas déclaré mais constaté depuis les fournisseurs réellement\nconfigurés : disponible / repli interne seulement / non exécutable, avec le motif exact.\nNouvel onglet « Capacités » dans le Centre de direction.\n• feat(intelligences): point 123 — nom officiel MKA.P-MS Intelligences, garde-fou au build\nL'ancienne appellation (« IA », « AI », « intelligence artificielle ») disparaît des\nécrans, journaux, routes internes et consignes envoyées au modèle. Le respect du nom\nn'est plus laissé à la vigilance : scripts/check-naming.mjs échoue le build s'il\nréapparaît dans client/src, server ou shared.",
  "pourquoi": "14 capacités déclarées avec, pour chacune : le moteur MKA qui la porte, le fournisseur\nprincipal et son repli, la permission exigée, le repli propriétaire et le remplacement\nMKA visé. L'état n'est pas déclaré mais constaté depuis les fournisseurs réellement\nconfigurés : disponible / repli interne seulement / non exécutable, avec le motif exact.\nNouvel onglet « Capacités » dans le Centre de direction.",
  "ou": [
    "client/src/App.tsx",
    "client/src/components/FileUpload.tsx",
    "client/src/pages/AbonnementsDefinitifs.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/AvisUnivers.tsx",
    "client/src/pages/BadgesDefinitifs.tsx",
    "client/src/pages/CentreActions.tsx",
    "client/src/pages/CentreIA.tsx",
    "client/src/pages/CentreIntelligences.tsx",
    "client/src/pages/CentreReputation.tsx",
    "client/src/pages/DepotAnnonce.tsx",
    "client/src/pages/Historique.tsx",
    "client/src/pages/Home.tsx",
    "client/src/pages/InscriptionProVO.tsx"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-241",
  "titre": "intelligences — points 130-133 — orchestrateur de missions, 7 niveaux d'autonomie réglables, multimodalité",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Origine : PR 241 du 2026-08-20, branche devin/1787240000-intelligences-130-139 (famille devin), commits 8f1fedbd, auteur git : Mka Garage.\n\n• feat(intelligences): points 130-133 — orchestrateur de missions, 7 niveaux d'autonomie réglables, multimodalité\n(Message de commit réduit au titre : le détail se trouve dans le diff, 9 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 241 et le diff.",
  "ou": [
    "client/src/pages/CentreIntelligences.tsx",
    "drizzle/0093_intelligences_orchestration.sql",
    "server/intelligences/api-v1.ts",
    "server/intelligences/autonomie.ts",
    "server/intelligences/index.ts",
    "server/intelligences/multimodal.ts",
    "server/intelligences/orchestrateur.ts",
    "server/intelligences/routeur.ts",
    "server/intelligences/schema.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-232",
  "titre": "depot-annonce — compression auto + progression détaillée + fix suppression photos (v1.6.0)",
  "moteurs": [
    "depot-annonce"
  ],
  "quoi": "Origine : PR 232 du 2026-08-22, branche fix/wordmark-s-visible-and-glow-line (famille fix), commits 5d3401b4, 86619a4a, auteur git : MKA.P-MS Agent, MKA.P-MS Engineering.\n\n• fix(brand): wordmark — S entièrement visible + ligne lumineuse or→bleu→or\n- WordmarkMKAPMS.tsx : viewBox élargi (580×82) pour marge droite (flèche du S) et\n  marge basse (ligne lumineuse). Ajout du gradient wmk-glow (or→bleu ciel→or) et\n  du filtre wmk-glow-blur (halo doux). Nouvelle prop withGlowLine (défaut true).\n- Logo.tsx : remplacement de <img src=/brand/wordmark.png> par le composant SVG\n  WordmarkMKAPMS. Le S n'est plus jamais rogné (SVG, aucun crop possible).\n- Connexion.tsx & VenteEncheres.tsx : même remplacement PNG → SVG pour un\n  rendu net à toute taille (retina, PWA, écrans HD) et cohérent avec le header.\n- Header conservé à 72px (aucun agrandissement, icônes droites intactes).\n- scripts/wordmark-preview.tsx : outil dev pour rendu isolé (multi-tailles).\n• feat(depot-annonce): compression auto + progression détaillée + fix suppression photos (v1.6.0)\n🔒 Marqueur : MKAPMS-PHOTO-GUARDIAN-2026-SGX9K3\n\n3 améliorations sur le dépôt d'annonce, adaptées mobile + desktop + PWA :\n\n1. Suppression photos à l'édition (client/src/pages/Vendre.tsx L763)\n   Correction du fallback dans la branche update: 'photos: allPhotos'\n   (sans fallback) au lieu de 'allPhotos.length > 0 ? allPhotos : ...'.\n   L'utilisateur peut maintenant retirer TOUTES ses photos volontairement.\n   La branche create garde son fallback normal pour éviter d'envoyer\n   un tableau vide.\n\n2. Compression automatique (client/src/lib/imageUpload.ts)\n   Photos > 5 MB compressées côté client avant envoi :\n   - Redimensionnement à 1920px sur le grand côté (canvas)\n   - Encodage JPEG qualité 85%\n   - Fallback : renvoie l'original si la compression n'aide pas\n   Économise data mobile pour utilisateurs Afrique / connexions 3G/4G.\n   Intégré dans normalizeImages() après conversion HEIC.\n\n3. Barre de progression complète (client/src/pages/Vendre.tsx)\n   - useState uploadProgress par catégorie (done/total/pct)\n   - useRef uploadAborts pour AbortController par catégorie\n   - uploadPhotos utilise XMLHttpRequest + xhr.upload.onprogress\n     pour capter le VRAI % réseau (impossible avec fetch)\n   - useMemo globalProgress qui agrège toutes les catégories actives\n   - Overlay par case : compteur '3/5 · 42%' + bouton Annuler + barre\n     dorée dégradée (bg-gradient-to-r from-[#FFD700] to-[#B78D00])\n   - Bannière globale flottante (fixed inset-x-0 bottom-0 z-50) :\n     * Mobile : plein largeur en bas\n     * Desktop : carte flottante 96×auto en bas-droite (sm:right-4)\n     * Compteur global, % moyen, spinner or, bouton 'Annuler tout'\n     * data-testid : upload-progress-banner, cancel-all-uploads\n   - Adaptation charte : or #FFD700 → #B78D00 (charte MKA.P-MS 2026)\n\nBump version 1.5.0 → 1.6.0 (package.json).\n\nBloc protégé par MKAPMS-PHOTO-GUARDIAN-2026-SGX9K3 (fix upload + toutes\nles améliorations photos).\n\nVérifié par testing_agent (rapports iteration_3.json + iteration_4.json) :\n- Build TypeScript : 0 erreur\n- Compression : constantes + fonction + intégration OK\n- XHR onprogress + AbortController correctement branchés\n- Bannière globale responsive mobile/desktop OK\n- Fix suppression photos appliqué sur la BONNE branche (update L763)\n- create.mutate garde son fallback pour éviter les payloads vides.",
  "pourquoi": "- WordmarkMKAPMS.tsx : viewBox élargi (580×82) pour marge droite (flèche du S) et\n  marge basse (ligne lumineuse). Ajout du gradient wmk-glow (or→bleu ciel→or) et\n  du filtre wmk-glow-blur (halo doux). Nouvelle prop withGlowLine (défaut true).\n- Logo.tsx : remplacement de <img src=/brand/wordmark.png> par le composant SVG\n  WordmarkMKAPMS. Le S n'est plus jamais rogné (SVG, aucun crop possible).\n- Connexion.tsx & VenteEncheres.tsx : même remplacement PNG → SVG pour un\n  rendu net à toute taille (retina, PWA, écrans HD) et cohérent avec le header.\n- Header conservé à 72px (aucun agrandissement, icônes droites intactes).\n- scripts/wordmark-preview.tsx : outil dev pour rendu isolé (multi-tailles).",
  "ou": [
    "client/src/components/Logo.tsx",
    "client/src/components/WordmarkMKAPMS.tsx",
    "client/src/pages/Connexion.tsx",
    "client/src/pages/VenteEncheres.tsx",
    "scripts/wordmark-preview.tsx"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : 3. Barre de progression complète (client/src/pages/Vendre.tsx)\n   - useState uploadProgress par catégorie (done/total/pct)\n   - useRef uploadAborts pour AbortController par catégorie\n   - uploadPhotos utilise XMLHttpRequest + xhr.upload.onprogress\n     pour capter le VRAI % réseau (impossible avec fetch)\n   - useMemo globalProgress qui agrège toutes les catégories actives\n   - Overlay par case : compteur '3/5 · 42%' + bouton Annuler + barre\n     dorée dégradée (bg-gradient-to-r from-[#FFD700] to-[#B78D00])\n   - Bannière globale flottante (fixed inset-x-0 bottom-0 z-50) :\n     * Mobile : plein largeur en bas\n     * Desktop : carte flottante 96×auto en bas-droite (sm:right-4)\n     * Compteur global, % moyen, spinner or, bouton 'Annuler tout'\n     * data-testid : upload-progress-banner, cancel-all-uploads\n   - Adaptation charte : or #FFD700 → #B78D00 (charte MKA.P-MS 2026)\nVérifié par testing_agent (rapports iteration_3.json + iteration_4.json) :\n- Build TypeScript : 0 erreur\n- Compression : constantes + fonction + intégration OK\n- XHR onprogress + AbortController correctement branchés […]",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-242",
  "titre": "intelligences — points 134-139 — mémoire fédérée, audit de connexion des moteurs, apprentissage après action",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Origine : PR 242 du 2026-08-22, branche devin/1787385999-intelligences-134-139 (famille devin), commits 8df0117e, auteur git : Mka Garage.\n\n• feat(intelligences): points 134-139 — mémoire fédérée, audit de connexion des moteurs, apprentissage après action\n(Message de commit réduit au titre : le détail se trouve dans le diff, 9 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 242 et le diff.",
  "ou": [
    "client/src/pages/CentreIntelligences.tsx",
    "drizzle/0094_intelligences_memoire.sql",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts",
    "server/intelligences/index.ts",
    "server/intelligences/memoire.ts",
    "server/intelligences/moteurs.ts",
    "server/intelligences/orchestrateur.ts",
    "server/intelligences/schema.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-243",
  "titre": "intelligences — points 140-144 — observabilité 24/7, support diagnostiqué, contrôles ciblés, comparaison avant/après, pipeline complet",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Origine : PR 243 du 2026-08-22, branche devin/1787386607-intelligences-140-144 (famille devin), commits d17beb77, auteur git : Mka Garage.\n\n• feat(intelligences): points 140-144 — observabilité 24/7, support diagnostiqué, contrôles ciblés, comparaison avant/après, pipeline complet\n(Message de commit réduit au titre : le détail se trouve dans le diff, 12 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 243 et le diff.",
  "ou": [
    "client/src/pages/CentreIntelligences.tsx",
    "client/src/pages/CentreResilience.tsx",
    "server/command-center/service.ts",
    "server/continuous-test/impact.ts",
    "server/continuous-test/index.ts",
    "server/continuous-test/service.ts",
    "server/monitoring-os/domaines.ts",
    "server/monitoring-os/index.ts",
    "server/resilience/schema.ts",
    "server/resilience/service.ts",
    "server/support-os/diagnostic.ts",
    "server/support-os/index.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-244",
  "titre": "intelligences — points 145-149 — actions de direction, permissions contrôlées, abstraction fournisseurs, évaluation permanente, mode shadow",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Origine : PR 244 du 2026-08-22, branche devin/1787387555-intelligences-145-149 (famille devin), commits d2f99690, auteur git : Mka Garage.\n\n• feat(intelligences): points 145-149 — actions de direction, permissions contrôlées, abstraction fournisseurs, évaluation permanente, mode shadow\n(Message de commit réduit au titre : le détail se trouve dans le diff, 11 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 244 et le diff.",
  "ou": [
    "client/src/pages/CentreIntelligences.tsx",
    "drizzle/0095_intelligences_pilotage.sql",
    "server/intelligences/actions.ts",
    "server/intelligences/evaluation.ts",
    "server/intelligences/index.ts",
    "server/intelligences/orchestrateur.ts",
    "server/intelligences/permissions.ts",
    "server/intelligences/provider.ts",
    "server/intelligences/routeur.ts",
    "server/intelligences/schema.ts",
    "server/intelligences/shadow.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-245",
  "titre": "intelligences — points 150-151 — toutes les fonctionnalités fournisseur éteintes par défaut, plan de détachement vérifié, plateforme développeur bornée",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Origine : PR 245 du 2026-08-22, branche devin/1787391927-intelligences-150-151 (famille devin), commits bad87895, auteur git : Mka Garage.\n\n• feat(intelligences): points 150-151 — toutes les fonctionnalités fournisseur éteintes par défaut, plan de détachement vérifié, plateforme développeur bornée\n(Message de commit réduit au titre : le détail se trouve dans le diff, 8 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 245 et le diff.",
  "ou": [
    "client/src/pages/CentreIntelligences.tsx",
    "drizzle/0096_intelligences_autonomie.sql",
    "server/intelligences/api-v1.ts",
    "server/intelligences/developpeur.ts",
    "server/intelligences/fonctions.ts",
    "server/intelligences/index.ts",
    "server/intelligences/plan-autonomie.ts",
    "server/intelligences/schema.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-246",
  "titre": "Revert \"Merge pull request #232 from projet-Auto-plus-Africa-MKAPMS/fix/wordmark-s-visible-and-glow-line\"",
  "moteurs": [
    "1787399660"
  ],
  "quoi": "Origine : PR 246 du 2026-08-22, branche devin/1787399660-revert-wordmark-232 (famille devin), commits 539b72d6, auteur git : Mka Garage.\n\n• Revert \"Merge pull request #232 from projet-Auto-plus-Africa-MKAPMS/fix/wordmark-s-visible-and-glow-line\"\nThis reverts commit d83ef6d06350…, reversing\nchanges made to bec52249be8f….",
  "pourquoi": "This reverts commit d83ef6d06350…, reversing\nchanges made to bec52249be8f….",
  "ou": [
    "client/src/components/Logo.tsx",
    "client/src/components/WordmarkMKAPMS.tsx",
    "client/src/pages/Connexion.tsx",
    "client/src/pages/VenteEncheres.tsx",
    "scripts/wordmark-preview.tsx"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-247",
  "titre": "accueil — recherche véhicules repliable, filtres mondiaux réels et dictée MKA.P-MS Intelligences",
  "moteurs": [
    "accueil"
  ],
  "quoi": "Origine : PR 247 du 2026-08-22, branche devin/1787400035-recherche-accueil-vocal (famille devin), commits e83559fe, auteur git : Mka Garage.\n\n• feat(accueil): recherche véhicules repliable, filtres mondiaux réels et dictée MKA.P-MS Intelligences\n(Message de commit réduit au titre : le détail se trouve dans le diff, 6 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 247 et le diff.",
  "ou": [
    "client/src/components/MicroVocal.tsx",
    "client/src/pages/Acheter.tsx",
    "client/src/pages/Home.tsx",
    "server/intelligences/index.ts",
    "server/intelligences/recherche.ts",
    "server/routers/annonces.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-248",
  "titre": "risque-import — diagnostic d'importation et d'homologation avant achat ou livraison",
  "moteurs": [
    "risque-import"
  ],
  "quoi": "Origine : PR 248 du 2026-08-23, branche merge main (risque import #248) (famille autre), commits f3c275a5, auteur git : Mka Garage.\n\n• feat(risque-import): diagnostic d'importation et d'homologation avant achat ou livraison\n(Message de commit réduit au titre : le détail se trouve dans le diff, 9 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 248 et le diff.",
  "ou": [
    "client/src/components/AlerteRisqueImport.tsx",
    "client/src/pages/Vehicule.tsx",
    "server/country-policy/service.ts",
    "server/engine-registry/os-bridge.ts",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts",
    "server/import-risk/index.ts",
    "server/import-risk/service.ts",
    "server/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-249",
  "titre": "livraison-vehicule — moteur d'acheminement des véhicules (barèmes gouvernés, étapes, qualité de prix)",
  "moteurs": [
    "livraison-vehicule"
  ],
  "quoi": "Origine : PR 249 du 2026-08-23, branche devin/1787497604-moteurs-livraison (famille devin), commits cbaf98e6, d05726e5, auteur git : Mka Garage.\n\n• feat(livraison-vehicule): moteur de livraison des vehicules separe, prix qualifies et suivi reel\n• feat(livraison-vehicule): moteur d'acheminement des véhicules (barèmes gouvernés, étapes, qualité de prix)\n(Message de commit réduit au titre : le détail se trouve dans le diff, 11 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 249 et le diff.",
  "ou": [
    "client/src/pages/LivraisonVehicule.tsx",
    "drizzle/0097_vehicle_delivery.sql",
    "server/engine-registry/os-bridge.ts",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts",
    "server/import-risk/service.ts",
    "server/router.ts",
    "server/schema.ts",
    "server/vehicle-delivery/index.ts",
    "server/vehicle-delivery/schema.ts",
    "server/vehicle-delivery/service.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-250",
  "titre": "estimation — Estimation Hub — coût total d'acquisition assemblé à partir des moteurs existants",
  "moteurs": [
    "estimation"
  ],
  "quoi": "Origine : PR 250 du 2026-08-24, branche devin/1787526238-estimations-connectees (famille devin), commits 9933519c, auteur git : Mka Garage.\n\n• feat(estimation): Estimation Hub — coût total d'acquisition assemblé à partir des moteurs existants\n(Message de commit réduit au titre : le détail se trouve dans le diff, 8 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 250 et le diff.",
  "ou": [
    "client/src/components/CoutTotalEstime.tsx",
    "client/src/pages/Vehicule.tsx",
    "server/engine-registry/os-bridge.ts",
    "server/estimation-hub/index.ts",
    "server/estimation-hub/service.ts",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts",
    "server/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-252",
  "titre": "redirection — moteur branché partout — inventaire des routes généré, catalogue produits/géo/comptabilité/VO, audit de couverture par zone",
  "moteurs": [
    "redirection"
  ],
  "quoi": "Origine : PR 252 du 2026-08-24, branche devin/1787526819-redirection-partout (famille devin), commits eade31a3, auteur git : Mka Garage.\n\n• feat(redirection): moteur branché partout — inventaire des routes généré, catalogue produits/géo/comptabilité/VO, audit de couverture par zone\n(Message de commit réduit au titre : le détail se trouve dans le diff, 9 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 252 et le diff.",
  "ou": [
    "client/src/lib/redirect.tsx",
    "client/src/pages/RedirectionEngine/ControlCenter.tsx",
    "client/src/pages/SeoLandingPage.tsx",
    "package.json",
    "scripts/gen-client-routes.mjs",
    "server/data/client-routes.ts",
    "server/redirection-engine/catalog.ts",
    "server/redirection-engine/couverture.ts",
    "server/redirection-engine/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-253",
  "titre": "redirection — ecrans VO, pieces et comptabilite branches au moteur, parcours dynamiques observes",
  "moteurs": [
    "redirection"
  ],
  "quoi": "Origine : PR 253 du 2026-08-24, branche devin/1787565728-redirection-ecrans (famille devin), commits 698a4bf7, auteur git : Mka Garage.\n\n• feat(redirection): ecrans VO, pieces et comptabilite branches au moteur, parcours dynamiques observes\n(Message de commit réduit au titre : le détail se trouve dans le diff, 11 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 253 et le diff.",
  "ou": [
    "client/src/components/DocumentPDF.tsx",
    "client/src/index.css",
    "client/src/pages/Acheter.tsx",
    "client/src/pages/Comptabilite.tsx",
    "client/src/pages/Pieces.tsx",
    "client/src/pages/RedirectionEngine/ControlCenter.tsx",
    "client/src/pages/VoitureOccasion.tsx",
    "server/redirection-engine/catalog.ts",
    "server/redirection-engine/couverture.ts",
    "server/routers/annonces.ts",
    "server/routers/comptabilite.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-254",
  "titre": "accueil — icones reseaux du pied de page issues des canaux configures par le PDG",
  "moteurs": [
    "accueil"
  ],
  "quoi": "Origine : PR 254 du 2026-08-24, branche devin/1787566477-reseaux-pied-page (famille devin), commits 117142a6, auteur git : Mka Garage.\n\n• fix(accueil): icones reseaux du pied de page issues des canaux configures par le PDG\n(Message de commit réduit au titre : le détail se trouve dans le diff, 3 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 254 et le diff.",
  "ou": [
    "client/src/pages/Home.tsx",
    "client/src/pages/VisibilityEngine/ControlCenter.tsx",
    "server/visibility-os/index.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-255",
  "titre": "intelligences — assistant mondial multi-domaines gouverne par le PDG + version unique plateforme et applications",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Origine : PR 255 du 2026-08-24, branche devin/1787567059-assistant-mondial (famille devin), commits d648db8c, f683c398, a2695645, auteur git : Mka Garage.\n\n• chore(version): 1.7.1\n• feat(intelligences): assistant joignable sur toutes les pages publiques (panneau flottant, domaines ouverts, dictee)\n• feat(intelligences): assistant mondial multi-domaines gouverne par le PDG + version unique plateforme et applications\n(Message de commit réduit au titre : le détail se trouve dans le diff, 12 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 255 et le diff.",
  "ou": [
    "android/app/build.gradle",
    "client/src/components/AssistantFlottant.tsx",
    "client/src/components/Layout.tsx",
    "client/src/pages/AssistantIntelligences.tsx",
    "client/src/pages/CentreIntelligences.tsx",
    "drizzle/0098_intelligences_domaines.sql",
    "package.json",
    "scripts/bump-version.mjs",
    "server/intelligences/domaines.ts",
    "server/intelligences/index.ts",
    "server/intelligences/schema.ts",
    "server/intelligences/service.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-256",
  "titre": "ai-fabric+store — capacites et fournisseurs manquants nommes, visuels Google Play fabriques depuis la charte",
  "moteurs": [
    "ai-fabricstore"
  ],
  "quoi": "Origine : PR 256 du 2026-08-24, branche devin/1787567450-fournisseurs-manquants (famille devin), commits 7da1b090, auteur git : Mka Garage.\n\n• feat(ai-fabric+store): capacites et fournisseurs manquants nommes, visuels Google Play fabriques depuis la charte\nVoix, recherche externe, itineraire, douane, transporteurs, donnees techniques et paiement local entrent au catalogue avec leurs variables d'acces: le centre de controle les affiche sans fournisseur branche au lieu de les taire.\n\nIcone 512x512 et banniere 1024x500 produites depuis les fichiers de marque du depot, plus les textes de fiche et la liste des elements bloquants restants.",
  "pourquoi": "Icone 512x512 et banniere 1024x500 produites depuis les fichiers de marque du depot, plus les textes de fiche et la liste des elements bloquants restants.",
  "ou": [
    "package.json",
    "scripts/build-store-assets.mjs",
    "server/ai-fabric/service.ts",
    "store/google-play/README.md",
    "store/google-play/feature-graphic-1024x500.png",
    "store/google-play/icon-512x512.png",
    "store/google-play/textes-fiche.md"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "paiement",
  "historique": true
},
{
  "cle": "pr-257",
  "titre": "suppression-compte — suppression réellement exécutée, page publique de demande, file de décision côté direction",
  "moteurs": [
    "suppression-compte"
  ],
  "quoi": "Origine : PR 257 du 2026-08-24, branche devin/1787569144-suppression-compte (famille devin), commits fa71aba8, 51c1ebf4, auteur git : Mka Garage.\n\n• feat(direction): entrée « Demandes de suppression » dans l'espace direction\n• feat(suppression-compte): suppression réellement exécutée, page publique de demande, file de décision côté direction\n(Message de commit réduit au titre : le détail se trouve dans le diff, 15 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 257 et le diff.",
  "ou": [
    "client/src/App.tsx",
    "client/src/components/Layout.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/Confidentialite.tsx",
    "client/src/pages/DemandesSuppression.tsx",
    "client/src/pages/Parametres.tsx",
    "client/src/pages/SuppressionCompte.tsx",
    "client/src/pages/utilisateurs/SuppressionCompte.tsx",
    "drizzle/0099_account_deletion.sql",
    "server/account-deletion/index.ts",
    "server/account-deletion/schema.ts",
    "server/account-deletion/service.ts",
    "server/data/client-routes.ts",
    "server/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-258",
  "titre": "moteurs — diagnostic actionnable & remédiation des moteurs dégradés/HS",
  "moteurs": [
    "moteurs"
  ],
  "quoi": "Origine : PR 258 du 2026-08-24, branche feat/engines-diagnostic-and-repair (famille feat), commits ce7e5bb0, auteur git : MKA.P-MS Engineering.\n\n• feat(moteurs): diagnostic actionnable & remédiation des moteurs dégradés/HS\nLe Centre PDG affichait « 38 moteurs à surveiller » sans expliquer POURQUOI\nchacun était dégradé. Impossible d'agir sans deviner. Ce commit répond à la\nquestion moteur par moteur, avec une action concrète.\n\nBackend — server/engine-registry/diagnose.ts\n- diagnoseAllEngines() : pour chaque moteur, retourne\n    · sa source de supervision (contrat / sonde métier / feed OS / aucune)\n    · la sonde base de données à froid : tables attendues vs accessibles,\n      tables manquantes (migration non appliquée) et requêtes en échec\n    · l'état de ses dépendances déclarées (présente ? active ? santé ?)\n    · dernier message de santé enregistré\n    · une recommandation humaine (ex : « Appliquer les migrations : 3 table(s)\n      manquante(s) — reviews_v2, review_requests, review_aggregates »)\n- diagnoseEngine(name) : même chose pour un seul moteur.\n- retryEngineSupervision(name) : PDG uniquement — relance immédiate de la\n  sonde (métier) ou du feed OS (bridged), sans redémarrer la plateforme.\n  Un moteur qui vient de terminer sa migration remonte vert sans redéploiement.\n\nRouter — server/engine-registry/router.ts\n- engineRegistry.diagnose : lecture Direction, refresh 30 s.\n- engineRegistry.diagnoseOne(name) : lecture d'un moteur.\n- engineRegistry.retrySupervision(name) : mutation PDG.\n\nFrontend — client/src/pages/EngineRegistry/DiagnosticPanel.tsx\n- Bandeau au-dessus du registre : liste UNIQUEMENT les moteurs dégradés/HS.\n- Pour chacun : santé, source de supervision, recommandation, détails\n  extensibles (tables manquantes, requêtes en échec, statut dépendances).\n- Bouton « Relancer la sonde » / « Rafraîchir le feed » (PDG uniquement) :\n  invalide list/stats/diagnose au retour → l'écran se met à jour instantanément.\n- Cas vert : bandeau émeraude « Tous les moteurs remontent une santé nominale ».\n\nAucune donnée métier modifiée. Aucun schéma changé. Additif pur.",
  "pourquoi": "Le Centre PDG affichait « 38 moteurs à surveiller » sans expliquer POURQUOI\nchacun était dégradé. Impossible d'agir sans deviner. Ce commit répond à la\nquestion moteur par moteur, avec une action concrète.",
  "ou": [
    "client/src/pages/EngineRegistry/ControlCenter.tsx",
    "client/src/pages/EngineRegistry/DiagnosticPanel.tsx",
    "server/engine-registry/diagnose.ts",
    "server/engine-registry/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-260",
  "titre": "google+seo — balise HTML meta pour vérification propriété + Bing, Yandex, Facebook, Pinterest",
  "moteurs": [
    "googleseo"
  ],
  "quoi": "Origine : PR 260 du 2026-08-24, branche feat/google-verification-meta-tag (famille feat), commits 29860642, auteur git : MKA.P-MS Engineering.\n\n• feat(google+seo): balise HTML meta pour vérification propriété + Bing, Yandex, Facebook, Pinterest\nDevin a branché la méthode 'fichier HTML' (/google<jeton>.html) pour Search Console.\nManquait la méthode 'balise HTML meta' — indispensable quand le jeton fourni par\nGoogle contient des caractères hors [a-z0-9] (underscores, tirets), ce qui interdit\nla méthode fichier. Ce commit complète, sans changer la méthode fichier existante.\n\nserver/env.ts\n- Nouvelles variables : BING_SITE_VERIFICATION, YANDEX_VERIFICATION,\n  FACEBOOK_DOMAIN_VERIFICATION, PINTEREST_SITE_VERIFICATION.\n- Aucune valeur codée : rien n'est publié tant qu'une variable est vide.\n\nserver/seo.ts\n- Nouvelle fonction siteVerificationMeta() : émet toutes les balises meta de\n  vérification propriétaire à partir des env vars. Supporte plusieurs jetons\n  Google séparés par virgule.\n- injectAnnonceSeo() inclut désormais ces balises dans domainMeta — présentes\n  sur TOUTES les pages du site (accueil, annonces, garages, avis, blog,\n  pages statiques), sur TOUS les domaines (.fr, .pro, .ci, .site).\n\nserver/index.ts\n- Log de démarrage : récap des méthodes de vérification actives. Si aucune,\n  message d'avertissement pointant vers docs/SEO_VERIFICATION.md.\n\ndocs/SEO_VERIFICATION.md\n- Guide utilisateur exhaustif : où coller chaque code fourni par Google,\n  Bing, Yandex, Facebook, Pinterest. Exemples réels, procédure de vérification\n  sans attendre le moteur, multi-domaines, FAQ.",
  "pourquoi": "Devin a branché la méthode 'fichier HTML' (/google<jeton>.html) pour Search Console.\nManquait la méthode 'balise HTML meta' — indispensable quand le jeton fourni par\nGoogle contient des caractères hors [a-z0-9] (underscores, tirets), ce qui interdit\nla méthode fichier. Ce commit complète, sans changer la méthode fichier existante.",
  "ou": [
    "docs/SEO_VERIFICATION.md",
    "server/env.ts",
    "server/index.ts",
    "server/seo.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : server/env.ts\n- Nouvelles variables : BING_SITE_VERIFICATION, YANDEX_VERIFICATION,\n  FACEBOOK_DOMAIN_VERIFICATION, PINTEREST_SITE_VERIFICATION.\n- Aucune valeur codée : rien n'est publié tant qu'une variable est vide.\nserver/seo.ts\n- Nouvelle fonction siteVerificationMeta() : émet toutes les balises meta de\n  vérification propriétaire à partir des env vars. Supporte plusieurs jetons\n  Google séparés par virgule.\n- injectAnnonceSeo() inclut désormais ces balises dans domainMeta — présentes\n  sur TOUTES les pages du site (accueil, annonces, garages, avis, blog,\n  pages statiques), sur TOUS les domaines (.fr, .pro, .ci, .site).",
  "domaine": "seo",
  "historique": true
},
{
  "cle": "pr-262",
  "titre": "ia — diagnostic clés API + bandeau visible partout où l'IA est utilisée",
  "moteurs": [
    "ia"
  ],
  "quoi": "Origine : PR 262 du 2026-08-24, branche feat/ia-diagnostic-and-warning (famille feat), commits c5427507, d4aad6db, auteur git : MKA.P-MS Engineering.\n\n• chore(nommage): remplacer 'IA' par 'MKA.P-MS Intelligence' dans le composant + le message serveur\nLe PDG a rappelé la règle : le nom officiel est 'MKA.P-MS Intelligence' —\njamais 'IA' dans les libellés visibles.\n\nclient/src/components/IaConfigWarning.tsx\n- Titre 'Assistant IA hors service' → 'Assistant MKA.P-MS Intelligence hors service'\n- Phrase de bas de bandeau 'l'IA remonte automatiquement' → 'MKA.P-MS Intelligence\n  remonte automatiquement'\n- Commentaires JSDoc alignés\n\nserver/intelligences/index.ts\n- Message guidance : 'clé API IA' → 'clé API pour MKA.P-MS Intelligence'\n- Commentaires JSDoc alignés\n\nLe NOM de fichier IaConfigWarning.tsx est conservé (nom technique interne,\njamais montré à l'utilisateur). Renommer le fichier ferait un diff bruyant\nsans bénéfice visible pour le PDG.\n• feat(ia): diagnostic clés API + bandeau visible partout où l'IA est utilisée\nLe PDG rapportait ne pas pouvoir envoyer de commandes à l'assistant IA. Cause\nidentifiée : le provider (server/intelligences/provider.ts) exige les variables\nd'environnement [variable de clé du fournisseur de modèles] ou [variable de clé du fournisseur de modèles]. Aucune n'est configurée en\nproduction Railway → chaque envoi échoue silencieusement avec le motif obscur\n« aucun fournisseur habilité », sans dire au PDG quelle clé configurer.\n\nCe commit rend le problème visible et actionnable sans coder à l'aveugle.\n\nBackend — server/intelligences/index.ts\n- Nouvelle procédure publique intelligences.configStatus :\n  · liste des 3 fournisseurs supportés (openai / mistral / modele_local)\n  · pour chacun : envKey attendue, URL pour obtenir la clé, présence (bool)\n  · flag operational + message guidance humain\n  · aucune donnée sensible exposée (seulement présence/absence)\n\nFrontend — client/src/components/IaConfigWarning.tsx\n- Bandeau rouge visible UNIQUEMENT si operational=false.\n- Cite chaque envKey manquante avec lien vers la page de création (OpenAI,\n  Mistral). Instruction claire : coller dans les Variables Railway.\n- Refresh 60 s → dès que le PDG ajoute la clé + Railway redéploie, le bandeau\n  disparaît automatiquement.\n\nInsertion dans les 3 écrans où l'utilisateur envoie des commandes IA :\n- client/src/pages/CentreCommandes.tsx (Centre de Commandes PDG)\n- client/src/pages/AssistantIntelligences.tsx (Assistant public)\n- client/src/pages/CentreIA.tsx (Fournisseurs & supervision)\n\nAucun schéma DB touché. Aucun endpoint modifié. Additif pur.",
  "pourquoi": "Le PDG a rappelé la règle : le nom officiel est 'MKA.P-MS Intelligence' —\njamais 'IA' dans les libellés visibles.",
  "ou": [
    "client/src/components/IaConfigWarning.tsx",
    "client/src/pages/AssistantIntelligences.tsx",
    "client/src/pages/CentreCommandes.tsx",
    "client/src/pages/CentreIA.tsx",
    "server/intelligences/index.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-266",
  "titre": "documents — vrais documents imprimables et exports CSV réels au lieu d'une notification verte",
  "moteurs": [
    "documents"
  ],
  "quoi": "Origine : PR 266 du 2026-08-29, branche devin/1787591695-documents-reels (famille devin), commits 7360df66, auteur git : Mka Garage.\n\n• feat(documents): vrais documents imprimables et exports CSV réels au lieu d'une notification verte\nLes boutons PDF / Télécharger annonçaient un téléchargement sans produire aucun\nfichier. Ils produisent maintenant soit un vrai fichier CSV, soit une feuille A4\nimprimable (enregistrable en PDF par le navigateur), et chaque édition est tracée\ndans Document OS.",
  "pourquoi": "Les boutons PDF / Télécharger annonçaient un téléchargement sans produire aucun\nfichier. Ils produisent maintenant soit un vrai fichier CSV, soit une feuille A4\nimprimable (enregistrable en PDF par le navigateur), et chaque édition est tracée\ndans Document OS.",
  "ou": [
    "client/src/components/DocumentPDF.tsx",
    "client/src/lib/documents.ts",
    "client/src/pages/DossierClient.tsx",
    "client/src/pages/Historique.tsx",
    "client/src/pages/VenteEncheres.tsx",
    "client/src/pages/comptabilite/AbonnementsCompta.tsx",
    "client/src/pages/comptabilite/CentrePilotage.tsx",
    "client/src/pages/comptabilite/ComptaAnalytique.tsx",
    "client/src/pages/comptabilite/FacturationAvancee.tsx",
    "client/src/pages/comptabilite/Paiements.tsx",
    "client/src/pages/comptabilite/PublicitesRevenu.tsx",
    "client/src/pages/comptabilite/Rapports.tsx",
    "client/src/pages/comptabilite/TVA.tsx",
    "client/src/pages/operations/MKAPMSBanque.tsx"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-267",
  "titre": "paiement+moteurs+google — montant du devis calculé par le serveur, états moteurs sur preuve d'audit, propriété du site gérée par le PDG",
  "moteurs": [
    "paiementmoteursgoogle"
  ],
  "quoi": "Origine : PR 267 du 2026-08-29, branche devin/1787963824-securite-paiement-moteurs (famille devin), commits 885ebe01, auteur git : Mka Garage.\n\n• fix(paiement+moteurs+google): montant du devis calculé par le serveur, états moteurs sur preuve d'audit, propriété du site gérée par le PDG\n(Message de commit réduit au titre : le détail se trouve dans le diff, 12 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 267 et le diff.",
  "ou": [
    "client/src/pages/CarteGrise.tsx",
    "client/src/pages/CentreIndexation.tsx",
    "client/src/pages/EngineRegistry/ControlCenter.tsx",
    "server/engine-registry/bootstrap.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/router.ts",
    "server/index.ts",
    "server/router.ts",
    "server/routers/devis.ts",
    "server/seo.ts",
    "server/site-verification/index.ts",
    "server/site-verification/router.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "paiement",
  "historique": true
},
{
  "cle": "pr-268",
  "titre": "vo — cloisonnement officiel / pro / particulier décidé par le serveur",
  "moteurs": [
    "vo"
  ],
  "quoi": "Origine : PR 268 du 2026-08-29, branche devin/1788024833-vo-espaces-cloisonnement (famille devin), commits dcce6f2c, 1b1cdfc8, auteur git : Mka Garage.\n\n• feat(vo): étape 12 — attestation de cession et de vente réellement éditées et archivées\nLe parcours VO s'arrêtait à la vente : aucune pièce écrite à remettre au\nclient. Le serveur produit désormais l'attestation depuis les données\nenregistrées (véhicule, vendeur, prix, kilométrage), l'archive au Document\nOS avec une référence vérifiable, et l'écran l'imprime ou l'enregistre en\nPDF. La signature reste honnête : signature sur place enregistrée et\nhorodatée, ou impression pour signature manuscrite — aucun prestataire de\nsignature électronique à distance n'est raccordé, donc aucun n'est promis.\n\nChaque édition est bornée au cloisonnement VO : l'appartenance du véhicule\nest vérifiée côté serveur avant toute génération, lecture ou signature.\n\nVersion 1.7.3 (site, grand public, PRO, COMMAND).\n• feat(vo): cloisonnement officiel / pro / particulier décidé par le serveur\nUn professionnel sans abonnement atteignait les écrans de gestion VO en\ntapant l'adresse : les routes /vente/* n'avaient aucun verrou et les\nécrans affichaient des véhicules d'exemple. Le serveur décide désormais\nde l'espace (officiel réservé à l'équipe, professionnel sur abonnement VO\nactif, particulier fermé) et chaque stock reste borné à son propriétaire.\n\n- server/vo-espaces : décision d'accès, abonnement VO réel, stock et\n  compteurs bornés à annonces.ownerId, contrôle d'appartenance serveur\n- routes /vente/* passées derrière VoProGate (décision serveur)\n- stock et tableau de bord pro alimentés par voEspaces (plus de chiffres\n  ni de véhicules d'exemple)\n- moteur vo_espaces déclaré en staging (pas d'état actif sans preuve)",
  "pourquoi": "Le parcours VO s'arrêtait à la vente : aucune pièce écrite à remettre au\nclient. Le serveur produit désormais l'attestation depuis les données\nenregistrées (véhicule, vendeur, prix, kilométrage), l'archive au Document\nOS avec une référence vérifiable, et l'écran l'imprime ou l'enregistre en\nPDF. La signature reste honnête : signature sur place enregistrée et\nhorodatée, ou impression pour signature manuscrite — aucun prestataire de\nsignature électronique à distance n'est raccordé, donc aucun n'est promis.",
  "ou": [
    "client/src/App.tsx",
    "client/src/components/VoProGate.tsx",
    "client/src/pages/TableauBordProVente.tsx",
    "client/src/pages/vente/AttestationVente.tsx",
    "client/src/pages/vente/GestionStockVO.tsx",
    "package.json",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/probes.ts",
    "server/router.ts",
    "server/vo-espaces/attestations.ts",
    "server/vo-espaces/index.ts",
    "server/vo-espaces/service.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : Chaque édition est bornée au cloisonnement VO : l'appartenance du véhicule\nest vérifiée côté serveur avant toute génération, lecture ou signature.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-270",
  "titre": "compte-pro — pièces justificatives réellement exigées, téléversées et contrôlées par le serveur",
  "moteurs": [
    "compte-pro"
  ],
  "quoi": "Origine : PR 270 du 2026-08-30, branche devin/1788079522-dossier-pro-pieces (famille devin), commits 6f9cdc0f, c40e5dd0, auteur git : Mka Garage.\n\n• chore(version): 1.7.4 — plateforme et applications alignées\n• feat(compte-pro): pièces justificatives réellement exigées, téléversées et contrôlées par le serveur\n(Message de commit réduit au titre : le détail se trouve dans le diff, 6 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 270 et le diff.",
  "ou": [
    "client/src/components/FileUpload.tsx",
    "client/src/pages/InscriptionProVO.tsx",
    "client/src/pages/Validation.tsx",
    "package.json",
    "server/routers/kyc.ts",
    "shared/profiles.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-271",
  "titre": "documents+boutons — contrôle d'authenticité branché, documents réels, préférences réellement enregistrées",
  "moteurs": [
    "documentsboutons"
  ],
  "quoi": "Origine : PR 271 du 2026-08-30, branche devin/1788079652-boutons-morts-atelier-compte (famille devin), commits cd82a40c, auteur git : Mka Garage.\n\n• feat(documents+boutons): contrôle d'authenticité branché, documents réels, préférences réellement enregistrées\n- Media Authenticity Engine appelé sur chaque pièce justificative KYC, constat tracé, pièce douteuse envoyée en examen humain\n- Centre de documents, catalogue technique, dossier véhicule, comptabilité dirigeant : ouverture du fichier réel au lieu d'une notification\n- Écran d'administration KYC relié aux dossiers et documents réels\n- Paramètres : Confidentialité, Coaching et Cookies réellement enregistrés (moteur de préférences serveur + consentement navigateur)\n- Garde-fou check:boutons : inventaire des boutons sans action vérifié au build",
  "pourquoi": "- Media Authenticity Engine appelé sur chaque pièce justificative KYC, constat tracé, pièce douteuse envoyée en examen humain\n- Centre de documents, catalogue technique, dossier véhicule, comptabilité dirigeant : ouverture du fichier réel au lieu d'une notification\n- Écran d'administration KYC relié aux dossiers et documents réels\n- Paramètres : Confidentialité, Coaching et Cookies réellement enregistrés (moteur de préférences serveur + consentement navigateur)\n- Garde-fou check:boutons : inventaire des boutons sans action vérifié au build",
  "ou": [
    "client/src/lib/consentementCookies.ts",
    "client/src/pages/AtelierPro.tsx",
    "client/src/pages/CatalogueTechnique.tsx",
    "client/src/pages/CentreDocuments.tsx",
    "client/src/pages/ComptaDirigeant.tsx",
    "client/src/pages/DossierVehiculeNumerique.tsx",
    "client/src/pages/Parametres.tsx",
    "client/src/pages/garage/DemandeDevis.tsx",
    "client/src/pages/superadmin/AdminValidationDocs.tsx",
    "drizzle/0100_media_authenticity.sql",
    "drizzle/0101_user_preferences.sql",
    "package.json",
    "scripts/gen-boutons-sans-action.mjs",
    "server/continuous-test/scenarios-parcours.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-272",
  "titre": "recherche — les filtres choisis sont réellement appliqués à la liste des annonces",
  "moteurs": [
    "recherche"
  ],
  "quoi": "Origine : PR 272 du 2026-08-31, branche devin/1788110099-recherche-filtres-morts (famille devin), commits a1099a3d, auteur git : Mka Garage.\n\n• fix(recherche): les filtres choisis sont réellement appliqués à la liste des annonces\nLes filtres carburant, boîte, kilométrage, couleur, puissance, cylindrée,\néquipements, places, portes, fraîcheur et présence de médias étaient\naffichés puis abandonnés avant la requête. Ils sont désormais portés par\nl'URL, relus par l'écran de résultats et traduits en conditions SQL.\n\nLes libellés affichés sont dissociés des valeurs transmises pour rester\nalignés sur les énumérations persistées (« Électrique » -> electrique).",
  "pourquoi": "Les filtres carburant, boîte, kilométrage, couleur, puissance, cylindrée,\néquipements, places, portes, fraîcheur et présence de médias étaient\naffichés puis abandonnés avant la requête. Ils sont désormais portés par\nl'URL, relus par l'écran de résultats et traduits en conditions SQL.",
  "ou": [
    "client/src/pages/Acheter.tsx",
    "client/src/pages/Rechercher.tsx",
    "server/data/boutons-sans-action.ts",
    "server/routers/annonces.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-273",
  "titre": "garage — boutons morts reliés à des actions réelles (réclamations, pièces, panier, atelier, rendez-vous)",
  "moteurs": [
    "garage"
  ],
  "quoi": "Origine : PR 273 du 2026-08-31, branche devin/1788164310-boutons-morts-garage (famille devin), commits a2583486, auteur git : Mka Garage.\n\n• fix(garage): boutons morts reliés à des actions réelles (réclamations, pièces, panier, atelier, rendez-vous)\n(Message de commit réduit au titre : le détail se trouve dans le diff, 11 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 273 et le diff.",
  "ou": [
    "client/src/lib/panierPieces.ts",
    "client/src/pages/garage/BoutiquePieces.tsx",
    "client/src/pages/garage/CentreLavage.tsx",
    "client/src/pages/garage/CentreReclamations.tsx",
    "client/src/pages/garage/CommandePieces.tsx",
    "client/src/pages/garage/GestionMecaniciens.tsx",
    "client/src/pages/garage/PanierPieces.tsx",
    "client/src/pages/garage/PriseRendezVous.tsx",
    "client/src/pages/garage/ReservationAtelier.tsx",
    "client/src/pages/garage/VehiculesAttente.tsx",
    "server/data/boutons-sans-action.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-274",
  "titre": "boutons — Moteur de boutons branché au Moteur de Redirection, à l'Event Bus, au Système Intelligent et aux Intelligences",
  "moteurs": [
    "boutons"
  ],
  "quoi": "Origine : PR 274 du 2026-08-31, branche devin/1788164742-moteur-boutons (famille devin), commits 7096d7a5, auteur git : Mka Garage.\n\n• feat(boutons): Moteur de boutons branché au Moteur de Redirection, à l'Event Bus, au Système Intelligent et aux Intelligences\n(Message de commit réduit au titre : le détail se trouve dans le diff, 18 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 274 et le diff.",
  "ou": [
    "client/src/lib/boutonMoteur.tsx",
    "client/src/pages/garage/CommandesAutomatiques.tsx",
    "client/src/pages/garage/ContratsFlottes.tsx",
    "client/src/pages/garage/ControleQualitePremium.tsx",
    "client/src/pages/garage/ReceptionVehicule.tsx",
    "client/src/pages/garage/RestitutionClient.tsx",
    "client/src/pages/garage/ValidationInterne.tsx",
    "server/button-engine/catalogue.ts",
    "server/button-engine/index.ts",
    "server/button-engine/router.ts",
    "server/button-engine/service.ts",
    "server/data/boutons-sans-action.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/contracts.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-275",
  "titre": "atelier — Moteur d'Atelier — validations, contrôle qualité, stock garage et report de rendez-vous réellement enregistrés",
  "moteurs": [
    "atelier"
  ],
  "quoi": "Origine : PR 275 du 2026-08-31, branche devin/1788174855-moteur-atelier (famille devin), commits 80904132, auteur git : Mka Garage.\n\n• feat(atelier): Moteur d'Atelier — validations, contrôle qualité, stock garage et report de rendez-vous réellement enregistrés\nTrois actions de l'atelier étaient déclarées « non branchées » au Moteur de\nboutons faute de capacité serveur : la validation interne, le contrôle qualité\net la tenue du stock. Les écrans concernés affichaient des chiffres écrits dans\nla page. Ce moteur fournit la capacité manquante, et les écrans lisent\ndésormais le serveur.\n\n- tables atelier_validations, atelier_stock, atelier_stock_mouvements,\n  atelier_rdv_reports (migration 0102 inscrite au journal Drizzle)\n- routes tRPC atelierEngine, toutes bornées aux garages réellement possédés\n- conformité calculée à partir des points cochés, jamais déclarée\n- ligne de stock et mouvement écrits dans la même transaction\n- report de RDV effectif sur rdv_garage, avec preuve, suivi client et notification\n- événements atelier.* publiés à l'Event Bus, alertes Système Intelligent\n  dédupliquées, sonde de santé et catalogue du registre central",
  "pourquoi": "- tables atelier_validations, atelier_stock, atelier_stock_mouvements,\n  atelier_rdv_reports (migration 0102 inscrite au journal Drizzle)\n- routes tRPC atelierEngine, toutes bornées aux garages réellement possédés\n- conformité calculée à partir des points cochés, jamais déclarée\n- ligne de stock et mouvement écrits dans la même transaction\n- report de RDV effectif sur rdv_garage, avec preuve, suivi client et notification\n- événements atelier.* publiés à l'Event Bus, alertes Système Intelligent\n  dédupliquées, sonde de santé et catalogue du registre central",
  "ou": [
    "client/src/pages/garage/ControleQualitePremium.tsx",
    "client/src/pages/garage/DepannageGarage.tsx",
    "client/src/pages/garage/HistoriqueGarage.tsx",
    "client/src/pages/garage/PlanningAtelier.tsx",
    "client/src/pages/garage/StockPieces.tsx",
    "client/src/pages/garage/ValidationClient.tsx",
    "client/src/pages/garage/ValidationInterne.tsx",
    "drizzle/0102_atelier_engine.sql",
    "server/atelier-engine/index.ts",
    "server/atelier-engine/schema.ts",
    "server/atelier-engine/service.ts",
    "server/button-engine/catalogue.ts",
    "server/data/boutons-sans-action.ts",
    "server/engine-registry/catalog.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-276",
  "titre": "engine-registry — corriger les dépendances Smart/Permission/Redirection + migrations GBP et avis_reputation",
  "moteurs": [
    "engine-registry"
  ],
  "quoi": "Origine : PR 276 du 2026-08-31, branche manus/connect-all-engines-green (famille manus), commits 701acd22, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix(engine-registry): corriger les dépendances Smart/Permission/Redirection + migrations GBP et avis_reputation\n- Smart Engine: dependencies [core] → [core, identity, permission, notification, monitoring]\n- Permission Engine: dependencies [core] → [core, identity]\n- Redirection Engine: dependencies [core] → [core, identity, permission, smart]\n- Nouvelle migration drizzle/0106_connecteur_google_business.sql (gbp_locations, gbp_review_snapshots)\n- Nouvelle migration drizzle/0107_avis_reputation_tables.sql (reviews_v2, review_requests, review_aggregates)\n\nCes corrections permettent aux moteurs concernés de passer en état opérationnel (vert)\ndans le Command Center.",
  "pourquoi": "- Smart Engine: dependencies [core] → [core, identity, permission, notification, monitoring]\n- Permission Engine: dependencies [core] → [core, identity]\n- Redirection Engine: dependencies [core] → [core, identity, permission, smart]\n- Nouvelle migration drizzle/0106_connecteur_google_business.sql (gbp_locations, gbp_review_snapshots)\n- Nouvelle migration drizzle/0107_avis_reputation_tables.sql (reviews_v2, review_requests, review_aggregates)",
  "ou": [
    "drizzle/0106_connecteur_google_business.sql",
    "drizzle/0107_avis_reputation_tables.sql",
    "server/engine-registry/contracts.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "seo",
  "historique": true
},
{
  "cle": "pr-278",
  "titre": "drizzle — enregistrer les migrations 0106 et 0107 dans le journal",
  "moteurs": [
    "drizzle"
  ],
  "quoi": "Origine : PR 278 du 2026-09-01, branche manus/connect-all-engines-green (famille manus), commits 44f06a7d, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix(drizzle): enregistrer les migrations 0106 et 0107 dans le journal\n- Les fichiers SQL existaient mais n'étaient pas dans _journal.json\n- Drizzle ne les appliquait donc jamais au démarrage\n- Ajout des entrées 0106_connecteur_google_business et 0107_avis_reputation_tables",
  "pourquoi": "- Les fichiers SQL existaient mais n'étaient pas dans _journal.json\n- Drizzle ne les appliquait donc jamais au démarrage\n- Ajout des entrées 0106_connecteur_google_business et 0107_avis_reputation_tables",
  "ou": [
    "(fichiers visibles dans le diff du commit)"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "seo",
  "historique": true
},
{
  "cle": "pr-280",
  "titre": "sections — pages d'accueil de section réelles + écrans vides recensés et remontés aux moteurs",
  "moteurs": [
    "sections"
  ],
  "quoi": "Origine : PR 280 du 2026-09-02, branche devin/1788175030-auto-branchement-cliquables (famille devin), commits b88867f3, 5ac1bb05, auteur git : Mka Garage.\n\n• feat(auto-branchement): module d'auto-branchement des cliquables branché au Moteur de boutons, à la Redirection, à l'Event Bus, au Système Intelligent et aux Intelligences\n• feat(sections): pages d'accueil de section réelles + écrans vides recensés et remontés aux moteurs\nLes 15 sections racines n'existaient pas alors que 231 liens y menaient : chaque section a désormais une page d'accueil alimentée par un inventaire généré depuis les routes réellement déclarées, qui distingue les écrans livrés des écrans encore réduits à un gabarit.\n\nLes 247 écrans vides sont publiés au bus (ecrans.vides_recenses), écrits en mémoire technique par le Système Intelligent et exposés au Centre d'auto-branchement au lieu d'être présentés comme des services livrés.",
  "pourquoi": "Les 15 sections racines n'existaient pas alors que 231 liens y menaient : chaque section a désormais une page d'accueil alimentée par un inventaire généré depuis les routes réellement déclarées, qui distingue les écrans livrés des écrans encore réduits à un gabarit.",
  "ou": [
    "client/src/App.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/CentreAutoBranchement.tsx",
    "client/src/pages/SectionAccueil.tsx",
    "package.json",
    "scripts/gen-client-routes.mjs",
    "scripts/gen-cliquables.mjs",
    "scripts/gen-sections.mjs",
    "server/auto-branchement/index.ts",
    "server/auto-branchement/router.ts",
    "server/auto-branchement/service.ts",
    "server/continuous-test/scenarios-parcours.ts",
    "server/data/client-routes.ts",
    "server/data/cliquables.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-281",
  "titre": "atelier — réapprovisionnement gouverné de bout en bout",
  "moteurs": [
    "atelier"
  ],
  "quoi": "Origine : PR 281 du 2026-09-03, branche devin/1788232000-reappro-atelier (famille devin), commits 2c6750b9, auteur git : Mka Garage.\n\n• feat(atelier): réapprovisionnement gouverné de bout en bout\nSeuil → proposition persistante (idempotente) → décision humaine tracée → commande fournisseur sous plafond mensuel → réception en stock. Événements catalogués, Smart abonné (alertes, clôture, mémoire), boutons déclarés au Moteur de boutons, redirection cataloguée, contrat Atelier 1.1.0.",
  "pourquoi": "Seuil → proposition persistante (idempotente) → décision humaine tracée → commande fournisseur sous plafond mensuel → réception en stock. Événements catalogués, Smart abonné (alertes, clôture, mémoire), boutons déclarés au Moteur de boutons, redirection cataloguée, contrat Atelier 1.1.0.",
  "ou": [
    "client/src/pages/garage/CommandesAutomatiques.tsx",
    "drizzle/0108_atelier_reappro.sql",
    "server/atelier-engine/index.ts",
    "server/atelier-engine/reappro.ts",
    "server/atelier-engine/schema.ts",
    "server/atelier-engine/service.ts",
    "server/button-engine/catalogue.ts",
    "server/data/cliquables.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/contracts.ts",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts",
    "server/redirection-engine/catalog.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-294",
  "titre": "intelligences — reformuler l'entrée de mémoire qui cassait le build de production",
  "moteurs": [
    "intelligences"
  ],
  "quoi": "Origine : PR 294 du 2026-09-11, branche claude/test-network-connections-j6905r (famille claude), commits 9746b5e1, auteur git : Claude.\n\n• fix(intelligences): reformuler l'entrée de mémoire qui cassait le build de production\nLa PR #293 a fait échouer le déploiement Railway : check:providers\n(Point 129 — interdiction d'appeler un fournisseur de modèle hors de\nla couche autorisée) scanne le texte brut de tous les fichiers, y\ncompris les commentaires et chaînes de documentation. Mon entrée de\nmémoire dans server/intelligences/livraisons.ts citait en toutes\nlettres [variable de clé du fournisseur de modèles], [variable de clé du fournisseur de modèles] et [variable de clé du fournisseur de modèles] pour\ndécrire quelles clés manquaient sur Railway — un diagnostic exact,\nmais qui déclenchait à tort la même alarme que si le code appelait\nun fournisseur en direct. Une seconde occurrence (\"repli IA absent\")\na aussi fait échouer check:naming.\n\nReformulé sans changer le diagnostic : la même information (aucun\nfournisseur de repli configuré, clé Google Search Console absente,\netc.) sans jamais citer littéralement un nom de variable de clé de\nfournisseur de modèle ni l'abréviation IA hors du nom officiel.\n\nVérifié en reproduisant EXACTEMENT la séquence du build Railway\n(lue dans les journaux de compilation de son échec) : check:routers,\ncheck:naming, check:identite, check:providers, check:routes,\ncheck:boutons, check:cliquables, check:sections, check:moteurs,\ncheck:migrations, build:graph, build:client, build:server — les 13\nétapes passent maintenant de bout en bout, en local, avant de pousser.",
  "pourquoi": "Reformulé sans changer le diagnostic : la même information (aucun\nfournisseur de repli configuré, clé Google Search Console absente,\netc.) sans jamais citer littéralement un nom de variable de clé de\nfournisseur de modèle ni l'abréviation IA hors du nom officiel.",
  "ou": [
    "(fichiers visibles dans le diff du commit)"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : Vérifié en reproduisant EXACTEMENT la séquence du build Railway\n(lue dans les journaux de compilation de son échec) : check:routers,\ncheck:naming, check:identite, check:providers, check:routes,\ncheck:boutons, check:cliquables, check:sections, check:moteurs,\ncheck:migrations, build:graph, build:client, build:server — les 13\nétapes passent maintenant de bout en bout, en local, avant de pousser.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-325",
  "titre": "connecter réellement l'inscription Pro Vente au KYC, corriger 2 anomalies d'audit",
  "moteurs": [
    "test"
  ],
  "quoi": "Origine : PR 325 du 2026-09-14, branche claude/test-network-connections-j6905r (famille claude), commits 36e7bb4d, auteur git : Claude.\n\n• fix: connecter réellement l'inscription Pro Vente au KYC, corriger 2 anomalies d'audit\n- InscriptionProVente.tsx (\"Devenir professionnel\" à /acheter/inscription-pro)\n  était un mockup statique : champs non contrôlés, boutons \"Télécharger\"\n  sans input file ni action, écran final affichant un statut de dossier\n  toujours identique et fabriqué. Réécrit sur le pattern déjà réel et\n  fonctionnel d'InscriptionProVO.tsx : champs contrôlés, upload réel via\n  FileUpload (contrôle d'authenticité inclus), soumission via\n  pro.createProfile + kyc.submitDocuments (même profil \"pro_vente\" que la\n  VO), écran final reflétant le statut réel du dossier en base. Vérifié en\n  direct : dossier réellement créé, 3 pièces réellement persistées avec\n  analyse d'authenticité, statut \"en_validation\" lu en base — pas fabriqué.\n  Données de test nettoyées après vérification.\n\n- server/indexation/inventory.ts : l'inventaire des URLs SEO à contrôler\n  référençait \"/pro/portail\", une page qui n'a jamais existé (la vraie\n  route du Portail Pro est \"/pro/demarrer\") — corrigé.\n\n- EngineRegistry/ControlCenter.tsx : le bandeau \"Dépendance circulaire\n  détectée — aucun ordre de démarrage n'est possible\" contredisait la\n  documentation du détecteur lui-même (server/engine-registry/dependencies.ts) :\n  les moteurs tournent dans un seul processus, une boucle ne bloque pas le\n  démarrage. Le texte et la sévérité affichée sont maintenant alignés sur\n  la classification réelle (\"à surveiller\"), déjà correcte dans la liste\n  d'anomalies juste en dessous.",
  "pourquoi": "- server/indexation/inventory.ts : l'inventaire des URLs SEO à contrôler\n  référençait \"/pro/portail\", une page qui n'a jamais existé (la vraie\n  route du Portail Pro est \"/pro/demarrer\") — corrigé.",
  "ou": [
    "client/src/pages/EngineRegistry/ControlCenter.tsx",
    "client/src/pages/InscriptionProVente.tsx",
    "server/data/boutons-sans-action.ts",
    "server/data/cliquables.ts",
    "server/indexation/inventory.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : - InscriptionProVente.tsx (\"Devenir professionnel\" à /acheter/inscription-pro)\n  était un mockup statique : champs non contrôlés, boutons \"Télécharger\"\n  sans input file ni action, écran final affichant un statut de dossier\n  toujours identique et fabriqué. Réécrit sur le pattern déjà réel et\n  fonctionnel d'InscriptionProVO.tsx : champs contrôlés, upload réel via\n  FileUpload (contrôle d'authenticité inclus), soumission via\n  pro.createProfile + kyc.submitDocuments (même profil \"pro_vente\" que la\n  VO), écran final reflétant le statut réel du dossier en base. Vérifié en\n  direct : dossier réellement créé, 3 pièces réellement persistées avec\n  analyse d'authenticité, statut \"en_validation\" lu en base — pas fabriqué.\n  Données de test nettoyées après vérification.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-330",
  "titre": "28 liens morts (vente pro + garage) + faux positif du contrôle continu",
  "moteurs": [
    "test"
  ],
  "quoi": "Origine : PR 330 du 2026-09-14, branche claude/test-network-connections-j6905r (famille claude), commits ee8e98c4, auteur git : Claude.\n\n• fix: 28 liens morts (vente pro + garage) + faux positif du contrôle continu\nTrouvé en faisant tourner la campagne complète du Contrôle continu en\ndirect dans ce sandbox (63 scénarios) :\n\n- 23 écrans du tableau de bord vendeur pro (client/src/pages/vente/*)\n  renvoyaient tous vers \"/vente/tableau-de-bord-pro\", une page qui n'a\n  jamais existé — la vraie route du tableau de bord (TableauBordVendeur)\n  est \"/vente/resume-vendeur\". Corrigé partout.\n- 5 écrans garage (ContratsFlottes, FlottesEntreprises, FichesTechniciens,\n  DossiersFlottes, GarageProfessionnel) renvoyaient vers des chemins\n  raccourcis jamais déclarés (\"/garage/professionnel\", \"/garage/devis\",\n  \"/garage/flottes\", \"/garage/mecaniciens\") au lieu des vraies routes\n  (\"/garage/garage-professionnel\", \"/garage/demande-devis\",\n  \"/garage/flottes-entreprises\", \"/garage/fiches-techniciens\"). Corrigé.\n- Catalogue de redirection : \"service_controle_technique\" pointait vers\n  \"/service/controle-technique\", qui n'a jamais existé — la vraie page\n  est \"/garage/controle-technique\". Corrigé, avec la même correction\n  auto-appliquée au démarrage que pour \"acheter_pro\" (LOT précédent).\n\nFaux positif corrigé au passage : le scénario de contrôle continu\n\"parcours.destinations_existantes\" comparait chaque cible de\nredirection à la liste littérale CLIENT_ROUTES au lieu d'utiliser\nisRoutablePath() — une cible parfaitement valide comme \"/pays/france\"\n(qui correspond au patron \"/pays/:slug\", jamais présent tel quel dans\nla liste) était donc signalée à tort comme \"route inconnue\".\n\nVérifié en direct : campagne complète du Contrôle continu ré-exécutée\navant/après — les deux scénarios concernés (parcours.\ndestinations_existantes, parcours.destinations_ecrans) passent\ndésormais au vert (\"0 destination inexistante\"), échecs totaux 25→22,\n0 régression. Inventaires (cliquables, boutons sans action, moteurs)\nrégénérés : 28 anomalies en moins, genre \"destination_inconnue\" à 0.",
  "pourquoi": "Trouvé en faisant tourner la campagne complète du Contrôle continu en\ndirect dans ce sandbox (63 scénarios) :",
  "ou": [
    "client/src/pages/garage/ContratsFlottes.tsx",
    "client/src/pages/garage/DossiersFlottes.tsx",
    "client/src/pages/garage/FichesTechniciens.tsx",
    "client/src/pages/garage/FlottesEntreprises.tsx",
    "client/src/pages/garage/GarageProfessionnel.tsx",
    "client/src/pages/vente/AchatExpress.tsx",
    "client/src/pages/vente/AlertesAuto.tsx",
    "client/src/pages/vente/AvisVendeurs.tsx",
    "client/src/pages/vente/CentreArchives.tsx",
    "client/src/pages/vente/CentreBadgesVendeurs.tsx",
    "client/src/pages/vente/CentreCampagnes.tsx",
    "client/src/pages/vente/CentreClientsVente.tsx",
    "client/src/pages/vente/CentreControleQualite.tsx",
    "client/src/pages/vente/CentreDetectionFraude.tsx"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : Vérifié en direct : campagne complète du Contrôle continu ré-exécutée\navant/après — les deux scénarios concernés (parcours.\ndestinations_existantes, parcours.destinations_ecrans) passent\ndésormais au vert (\"0 destination inexistante\"), échecs totaux 25→22,\n0 régression. Inventaires (cliquables, boutons sans action, moteurs)\nrégénérés : 28 anomalies en moins, genre \"destination_inconnue\" à 0.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-331",
  "titre": "ajouter le plan maître fournisseurs (référence officielle)",
  "moteurs": [
    "test"
  ],
  "quoi": "Origine : PR 331 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits 0e3a1009, auteur git : Claude.\n\n• docs: ajouter le plan maître fournisseurs (référence officielle)\nDocument transmis par le PDG, référence centrale pour tout ce qui\ntouche fournisseurs, stocks, pièces, transporteurs, paiements,\ndocuments, IA et connexions externes (63 sections, découpage en 10\nlots). Retranscrit intégralement, sans simplification ni suppression\nde capacité : toute capacité listée reste prévue dans l'architecture,\nmême non utilisée immédiatement — son activation se fait ensuite par\npermissions, abonnement, pays, contrat, fournisseur, risque ou\nvalidation.",
  "pourquoi": "Document transmis par le PDG, référence centrale pour tout ce qui\ntouche fournisseurs, stocks, pièces, transporteurs, paiements,\ndocuments, IA et connexions externes (63 sections, découpage en 10\nlots). Retranscrit intégralement, sans simplification ni suppression\nde capacité : toute capacité listée reste prévue dans l'architecture,\nmême non utilisée immédiatement — son activation se fait ensuite par\npermissions, abonnement, pays, contrat, fournisseur, risque ou\nvalidation.",
  "ou": [
    "docs/PLAN_MAITRE_FOURNISSEURS.md"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "paiement",
  "historique": true
},
{
  "cle": "pr-332",
  "titre": "supplier-engine — LOT 1 du Plan Maître Fournisseurs — Registry, Onboarding, Connector, Mapping, Audit",
  "moteurs": [
    "supplier-engine"
  ],
  "quoi": "Origine : PR 332 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits 8ea5fa7a, auteur git : Claude.\n\n• feat(supplier-engine): LOT 1 du Plan Maître Fournisseurs — Registry, Onboarding, Connector, Mapping, Audit\nAudit préalable (voir docs/PLAN_MAITRE_FOURNISSEURS.md) : rien de ce lot\nn'existait déjà sous une autre forme, mais du réutilisable si — étendu,\njamais dupliqué (règle MOS #15, mkapms-mos-architecture.md) :\n- partner-engine gère déjà candidature/contrat/couverture, et\n  partnerTypeEnum reconnaît déjà fournisseur_vehicules, fournisseur_pieces,\n  transporteur : un profil fournisseur s'ajoute donc AU-DESSUS d'un\n  `partners.id` déjà existant, jamais en le dupliquant.\n- Country OS : réutilisé tel quel pour valider les territoires.\n- Contract OS : \"fournisseur\"/\"transporteur\" ajoutés à CONTRACT_PARTIES\n  au lieu d'un nouveau système de cycle de vie contractuel.\n- Document OS, Ledger (wallets/payouts) : non touchés, non dupliqués —\n  réservés aux lots suivants (6 et 5).\n\nNouveau module server/supplier-engine/, conforme à la structure MOS\nobligatoire (règle #12) : contract.ts (types stables + catalogue des 22\nméthodes de connexion + Event union), schema.ts (7 tables supplier_*,\n100 % additives), service.ts (VERSION, machine à états, healthStatus/\ncontrolCenterFeed/dashboard), index.ts (router tRPC), README.md, tests\nréels en base de données.\n\nContenu du LOT 1 :\n- Supplier Registry : identité légale, territoires multiples validés\n  contre le Country OS, devise, conditions de paiement, statut KYB.\n- Supplier Onboarding : 15 étapes en historique append-only, validation\n  Direction et signature de contrat jamais automatiques.\n- Connector Engine : catalogue des 22 méthodes du plan. Sans secret réel\n  configuré, le statut reste honnêtement \"not_connected\" (même principe\n  que la Passerelle d'Embeddings du LOT IA02F) — jamais bloquant, jamais\n  simulé comme actif. Saisie manuelle et connecteurs fichier réellement\n  testables sans aucune clé externe ; URL catalogue réellement interrogée\n  quand elle est fournie.\n- Universal Mapping Engine : mapping versionné, jamais écrasé.\n- Audit : chaque décision journalisée avec qui l'a prise.\n- Enregistré dans le registre des moteurs (staging, honnête) et dans les\n  sondes périodiques (probes.ts) pour un battement de cœur réel toutes\n  les 5 minutes dès le déploiement — même correctif que celui appliqué\n  aux moteurs à contrat dans une PR précédente.\n\nVérifié réellement : 37/37 assertions (server/supplier-engine/__tests__/\nsupplier-engine.test.ts) — refus d'un partenaire incompatible, activation\nbloquée sans KYB/contrat/connexion, territoire invalide rejeté sans\nbloquer les valides, connecteur à secret manquant honnêtement\nNOT_CONNECTED, connecteur manuel réellement testable, mapping versionné […]",
  "pourquoi": "Audit préalable (voir docs/PLAN_MAITRE_FOURNISSEURS.md) : rien de ce lot\nn'existait déjà sous une autre forme, mais du réutilisable si — étendu,\njamais dupliqué (règle MOS #15, mkapms-mos-architecture.md) :\n- partner-engine gère déjà candidature/contrat/couverture, et\n  partnerTypeEnum reconnaît déjà fournisseur_vehicules, fournisseur_pieces,\n  transporteur : un profil fournisseur s'ajoute donc AU-DESSUS d'un\n  `partners.id` déjà existant, jamais en le dupliquant.\n- Country OS : réutilisé tel quel pour valider les territoires.\n- Contract OS : \"fournisseur\"/\"transporteur\" ajoutés à CONTRACT_PARTIES\n  au lieu d'un nouveau système de cycle de vie contractuel.\n- Document OS, Ledger (wallets/payouts) : non touchés, non dupliqués —\n  réservés aux lots suivants (6 et 5).",
  "ou": [
    "drizzle/0120_supplier_engine.sql",
    "server/contract-os/index.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/perimetres.ts",
    "server/engine-registry/probes.ts",
    "server/router.ts",
    "server/schema.ts",
    "server/supplier-engine/README.md",
    "server/supplier-engine/__tests__/supplier-engine.test.ts",
    "server/supplier-engine/contract.ts",
    "server/supplier-engine/index.ts",
    "server/supplier-engine/schema.ts",
    "server/supplier-engine/service.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : Nouveau module server/supplier-engine/, conforme à la structure MOS\nobligatoire (règle #12) : contract.ts (types stables + catalogue des 22\nméthodes de connexion + Event union), schema.ts (7 tables supplier_*,\n100 % additives), service.ts (VERSION, machine à états, healthStatus/\ncontrolCenterFeed/dashboard), index.ts (router tRPC), README.md, tests\nréels en base de données.\nContenu du LOT 1 :\n- Supplier Registry : identité légale, territoires multiples validés\n  contre le Country OS, devise, conditions de paiement, statut KYB.\n- Supplier Onboarding : 15 étapes en historique append-only, validation\n  Direction et signature de contrat jamais automatiques.\n- Connector Engine : catalogue des 22 méthodes du plan. Sans secret réel\n  configuré, le statut reste honnêtement \"not_connected\" (même principe\n  que la Passerelle d'Embeddings du LOT IA02F) — jamais bloquant, jamais\n  simulé comme actif. Saisie manuelle et connecteurs fichier réellement\n  testables sans aucune clé externe ; URL catalogue réellement interrogée\n  quand elle est fournie. […]",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-333",
  "titre": "vehicle-engine — LOT 2 du Plan Maître Fournisseurs — véhicules uniquement",
  "moteurs": [
    "vehicle-engine"
  ],
  "quoi": "Origine : PR 333 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits c170b6a6, 9470d929, auteur git : Claude.\n\n• feat(vehicle-engine): LOT 2 du Plan Maître Fournisseurs — véhicules uniquement\nAudit préalable complet (fiche véhicule, annonces/marketplace, stock,\nréservation, VIN, immatriculation, caractéristiques, photos, documents,\npricing, estimation, localisation, Country OS, traduction, recherche, IA\nvéhicule, historique, condition, import, fournisseurs véhicules, doublons,\nEvent Bus) avant tout développement, conformément à la discipline du plan.\n\nNouveau moteur server/vehicle-engine/ (LOT 2, véhicules uniquement — jamais\nPièces [LOT 3] ni Transport/Livraison [LOT 4]) : pipeline complet ingestion\n→ mapping/normalisation → détection de doublons → analyse VIN/données →\ncontrôle qualité → analyse IA (honnête, NOT_CONNECTED) → tarification →\nterritoires → disponibilité → préparation → publication (décision Direction)\n→ synchronisation continue → réservation/vente → retrait.\n\nRéutilise sans dupliquer : Supplier Engine (LOT 1, fournisseur actif +\nConnector Engine + Universal Mapping Engine), Country OS (pays, devises,\ntaux de change réels), Country Policy Engine (export refusé par défaut sans\nrègle pays confirmée), la marketplace `annonces` existante (la publication\ncrée une vraie annonce, pas un système parallèle), Smart Engine\n(`checkDuplicates` appelé après publication), Event Bus (nouveau domaine\n`vehicule`, 11 types d'événements).\n\nCorrige au passage un vrai manque déjà signalé par l'audit : `annonces`\nn'avait ni colonne `vin` ni `plaque` alors que la détection de doublons du\nSmart Engine les lisait déjà — 2 de ses 3 règles étaient inertes. Ajout\npurement additif (`drizzle/0122_annonces_identity_columns.sql`).\n\nPoints d'intégration LOT 4 (Logistics Engine) préparés dans\nvehicle_territories (PickupLocation, TransportEligible,\nTransportModesAllowed, VehicleReadyDelay) sans aucun connecteur transporteur\nréel.\n\n49 tests réels (base de données réelle) + vérification live des endpoints\ntRPC après démarrage du serveur.\n• docs(plan-maitre): renforcer la doctrine — un moteur par domaine, Delivery/Logistics API Gateway\nAddendum PDG au Plan Maître Fournisseurs, ajout pur (rien retiré) :\n- Règle formelle « un moteur pour chaque domaine » et décomposition\n  fonctionnelle du Supplier Engine du LOT 1 en sous-moteurs distincts\n  (Onboarding, Verification/KYB, Contract, Territory, Connector, Mapping,\n  Audit), avec la voie de connexion future des moteurs Vehicle/Parts/\n  Logistics/Payment/Document/Country/AI.\n- Architecture obligatoire Delivery / Logistics API Gateway : adaptateur\n  par transporteur, capacités attendues, méthodes techniques, Delivery\n  Quote/Routing Engine, Multi-Leg Engine, Tracking Engine (statuts\n  normalisés), événements webhook transport, API MKA.P-MS pour\n  transporteurs.\n- Règle de sécurité absolue sur les clés API (jamais exposées : frontend,\n  mobile, logs publics, dépôt GitHub).\n- Dimensions d'activation/blocage complétées (rôle, juridiction,\n  validation humaine), en plus de la liste existante.",
  "pourquoi": "Nouveau moteur server/vehicle-engine/ (LOT 2, véhicules uniquement — jamais\nPièces [LOT 3] ni Transport/Livraison [LOT 4]) : pipeline complet ingestion\n→ mapping/normalisation → détection de doublons → analyse VIN/données →\ncontrôle qualité → analyse IA (honnête, NOT_CONNECTED) → tarification →\nterritoires → disponibilité → préparation → publication (décision Direction)\n→ synchronisation continue → réservation/vente → retrait.",
  "ou": [
    "docs/PLAN_MAITRE_FOURNISSEURS.md",
    "drizzle/0121_vehicle_engine.sql",
    "drizzle/0122_annonces_identity_columns.sql",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/perimetres.ts",
    "server/engine-registry/probes.ts",
    "server/event-bus/catalog.ts",
    "server/router.ts",
    "server/schema.ts",
    "server/vehicle-engine/README.md",
    "server/vehicle-engine/__tests__/vehicle-engine.test.ts",
    "server/vehicle-engine/contract.ts",
    "server/vehicle-engine/index.ts",
    "server/vehicle-engine/schema.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : 49 tests réels (base de données réelle) + vérification live des endpoints\ntRPC après démarrage du serveur.\nAddendum PDG au Plan Maître Fournisseurs, ajout pur (rien retiré) :\n- Règle formelle « un moteur pour chaque domaine » et décomposition\n  fonctionnelle du Supplier Engine du LOT 1 en sous-moteurs distincts\n  (Onboarding, Verification/KYB, Contract, Territory, Connector, Mapping,\n  Audit), avec la voie de connexion future des moteurs Vehicle/Parts/\n  Logistics/Payment/Document/Country/AI.\n- Architecture obligatoire Delivery / Logistics API Gateway : adaptateur\n  par transporteur, capacités attendues, méthodes techniques, Delivery\n  Quote/Routing Engine, Multi-Leg Engine, Tracking Engine (statuts\n  normalisés), événements webhook transport, API MKA.P-MS pour\n  transporteurs.\n- Règle de sécurité absolue sur les clés API (jamais exposées : frontend,\n  mobile, logs publics, dépôt GitHub).\n- Dimensions d'activation/blocage complétées (rôle, juridiction,\n  validation humaine), en plus de la liste existante.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-334",
  "titre": "parts-engine — LOT 3 du Plan Maître Fournisseurs — pièces automobiles uniquement",
  "moteurs": [
    "parts-engine"
  ],
  "quoi": "Origine : PR 334 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits 0de0690c, a2fc47b7, auteur git : Claude.\n\n• feat(parts-engine): LOT 3 du Plan Maître Fournisseurs — pièces automobiles uniquement\nAudit préalable complet (catalogue, stock, OEM, aftermarket, EAN/GTIN,\ncatégories, marques, compatibilité, entrepôts, inventaire, réservations,\ncommandes, photos, documents, TecDoc, IA pièces, estimation, traductions,\ndoublons, Event Bus, Country OS, Supplier Engine, Universal Mapping Engine)\navant tout développement, conformément à la discipline du plan.\n\nNouveau moteur server/parts-engine/ (LOT 3, pièces uniquement — jamais\nTransport/Livraison [LOT 4] ni Payment Engine complet [LOT 5]) : pipeline\ncomplet ingestion → mapping/normalisation → identification pièce/OEM\n(pièce canonique multi-fournisseurs, jamais fusionnée automatiquement) →\nOEM/Cross-Reference Engine → Parts Compatibility Engine (5 niveaux, jamais\n« compatible » par ressemblance de mots) → contrôle qualité → IA (honnête,\nNOT_CONNECTED) → tarification → stock (ledger + réservations temporaires\navec expiration/libération automatique) → territoires → préparation →\npublication (décision Direction) → synchronisation continue.\n\nRéutilise sans dupliquer : Supplier Engine (LOT 1, CANONICAL_PART_FIELDS\nétendu avec les champs manquants identifiés par l'audit), Country OS/\nCountry Policy Engine (export refusé par défaut sans règle pays confirmée),\nla marketplace pièces déjà existante (`parts_catalog`/`parts_stock`/\n`parts_compatibility`, `server/routers/pieces.ts` — la publication crée une\nvraie offre, jamais un système parallèle), Event Bus (domaine `produit`\nexistant, 14 nouveaux types d'événements `part.*`), et étend Search OS\n(`searchPieces`, jamais indexé avant ce lot).\n\nDeux corrections de dérive schéma/migration découvertes en construisant ce\nlot dessus, avant tout code métier :\n- `server/schema.ts` et `server/modules/pieces.ts` déclaraient les mêmes\n  tables physiques avec des colonnes différentes (masquage silencieux par\n  les règles d'export ESM) ; `estimation-hub`/`reputation-engine`\n  importaient par erreur la version jamais migrée — corrigé, code mort\n  supprimé (voir commit précédent).\n- La migration 0011 tentait d'enrichir `parts_stock` (site_id,\n  quantite_reservee, seuil_min, entrepot, rayon, etagere) via\n  `CREATE TABLE IF NOT EXISTS`, sans effet car la table existait déjà\n  depuis la migration 0001 : `server/routers/pieces.ts` écrit depuis\n  longtemps sur des colonnes absentes de la base (jamais déclenché, le\n  catalogue est resté vide) — corrigé par une vraie migration ALTER TABLE\n  additive (`drizzle/0124_parts_stock_columns_fix.sql`).\n\nLa publication (`validerEtPublier`) est désormais transactionnelle : plus […]\n• fix(pieces): fusionner les définitions de schéma dupliquées avant le LOT 3\nAudit pré-LOT 3 : server/schema.ts et server/modules/pieces.ts déclaraient\nchacun partsShops/partsCatalog/partsStock/partsOrders/partsOrderItems (et\npartsShopTypeEnum/partsOrderStatusEnum) sous les MÊMES noms de table\nphysiques, avec des colonnes différentes. Les règles d'export ESM font que\nla déclaration locale de schema.ts masque silencieusement le re-export de\nmodules/pieces.ts : seule la version schema.ts est donc jamais migrée.\n\nTrois fichiers importaient malgré tout directement modules/pieces.ts,\ndonc une définition de colonnes jamais migrée en base :\n- server/estimation-hub/service.ts (voletPieces) joignait \"part_compatibilities\"\n  (table orpheline, toujours vide) au lieu de \"parts_compatibility\" (la vraie\n  table alimentée par server/routers/pieces.ts) — l'estimation budget pièces\n  ne trouvait donc jamais de pièce compatible, et retombait silencieusement\n  en \"non_mesuré\" même quand des pièces compatibles existaient réellement.\n- server/reputation-engine/{ownership,responses}.ts référençaient la version\n  non migrée de partsShops (sans effet observable aujourd'hui car les seules\n  colonnes utilisées, id/ownerId/nom, existent dans les deux versions — mais\n  un futur ajout de colonne aurait cassé silencieusement).\n\nCorrection : les trois fichiers importent désormais les tables réellement\nmigrées depuis server/schema.ts. server/modules/pieces.ts est réduit à ses\ndeux tables réellement uniques et migrées (part_references,\npart_compatibilities, toutes deux actuellement inutilisées) ; les\ndéclarations mortes et masquées sont supprimées (code mort jamais\natteignable, aucune capacité perdue).\n\nNécessaire avant le LOT 3 (Parts Engine) : les nouveaux moteurs pièces\ns'appuient sur parts_catalog/parts_compatibility/parts_stock, il fallait\nd'abord lever toute ambiguïté sur quelle définition fait foi.",
  "pourquoi": "Nouveau moteur server/parts-engine/ (LOT 3, pièces uniquement — jamais\nTransport/Livraison [LOT 4] ni Payment Engine complet [LOT 5]) : pipeline\ncomplet ingestion → mapping/normalisation → identification pièce/OEM\n(pièce canonique multi-fournisseurs, jamais fusionnée automatiquement) →\nOEM/Cross-Reference Engine → Parts Compatibility Engine (5 niveaux, jamais\n« compatible » par ressemblance de mots) → contrôle qualité → IA (honnête,\nNOT_CONNECTED) → tarification → stock (ledger + réservations temporaires\navec expiration/libération automatique) → territoires → préparation →\npublication (décision Direction) → synchronisation continue.",
  "ou": [
    "drizzle/0123_parts_engine.sql",
    "drizzle/0124_parts_stock_columns_fix.sql",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/perimetres.ts",
    "server/engine-registry/probes.ts",
    "server/estimation-hub/service.ts",
    "server/event-bus/catalog.ts",
    "server/modules/pieces.ts",
    "server/parts-engine/README.md",
    "server/parts-engine/__tests__/parts-engine.test.ts",
    "server/parts-engine/contract.ts",
    "server/parts-engine/index.ts",
    "server/parts-engine/schema.ts",
    "server/parts-engine/service.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : La publication (`validerEtPublier`) est désormais transactionnelle : plus\naucun risque de ligne `parts_catalog`/`parts_stock` orpheline si une étape\néchoue en cours de route (constaté en direct pendant les tests avant le\ncorrectif de migration ci-dessus).\n63 tests réels (base de données réelle) + non-régression Supplier Engine\n(37/37) et Vehicle Engine (49/49) + vérification live des endpoints tRPC et\nde la recherche pièces après démarrage du serveur.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-335",
  "titre": "build — corriger l'appellation « IA »/« AI » interdite bloquant tout déploiement Railway",
  "moteurs": [
    "build"
  ],
  "quoi": "Origine : PR 335 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits b67a9f51, auteur git : Claude.\n\n• fix(build): corriger l'appellation « IA »/« AI » interdite bloquant tout déploiement Railway\nnpm run build (build.buildCommand de railway.json) enchaîne 12 contrôles\navant de compiler, dont check:naming (scripts/check-naming.mjs) qui échoue\nle build dès qu'une chaîne visible contient « IA » ou « AI » en mot isolé —\nle nom officiel imposé étant « MKA.P-MS Intelligences ». Le Vehicle Engine\n(LOT 2) et le Parts Engine (LOT 3) introduisaient 18 occurrences (noms de\nsection \"Vehicle/Parts AI Engine\", commentaires, messages \"reason\",\ndocstrings de test) : npm run build échouait donc systématiquement depuis\nle LOT 2, avant même d'atteindre check:migrations/build:client/build:server\n— aucune des publications de ces deux lots n'a jamais pu être déployée sur\nRailway.\n\nAucune ligne de code métier changée : uniquement des libellés (sections\n\"Vehicle/Parts AI Engine\" → \"Vehicle/Parts Intelligence Engine\", messages\n\"reason\" honnêtes reformulés, docstrings). analyserIA()/aiData/le code des\ntests restent inchangés — ce sont des identifiants techniques, jamais\ninterdits par la règle (elle ne cible que le mot isolé « IA »/« AI » visible\nen prose).\n\nVérifié cette fois de bout en bout, contrairement aux deux lots précédents\noù seuls les tests DB et le mode développement avaient été validés :\n- `npm run build` (les 12 contrôles + build:graph + build:client +\n  build:server) : exit 0, aucune régression sur les autres contrôles.\n- `node dist/server.js` (l'artefact réellement exécuté par `npm run start`\n  sur Railway, NODE_ENV=production) démarre proprement, `/api/health`\n  répond 200, les trois moteurs (supplierEngine/vehicleEngine/partsEngine)\n  répondent en direct depuis ce build compilé.\n- Les 3 suites de tests réels (Supplier 37/37, Vehicle 49/49, Parts 63/63)\n  repassent intégralement après renommage.",
  "pourquoi": "npm run build (build.buildCommand de railway.json) enchaîne 12 contrôles\navant de compiler, dont check:naming (scripts/check-naming.mjs) qui échoue\nle build dès qu'une chaîne visible contient « IA » ou « AI » en mot isolé —\nle nom officiel imposé étant « MKA.P-MS Intelligences ». Le Vehicle Engine\n(LOT 2) et le Parts Engine (LOT 3) introduisaient 18 occurrences (noms de\nsection \"Vehicle/Parts AI Engine\", commentaires, messages \"reason\",\ndocstrings de test) : npm run build échouait donc systématiquement depuis\nle LOT 2, avant même d'atteindre check:migrations/build:client/build:server\n— aucune des publications de ces deux lots n'a jamais pu être déployée sur\nRailway.",
  "ou": [
    "server/parts-engine/README.md",
    "server/parts-engine/__tests__/parts-engine.test.ts",
    "server/parts-engine/index.ts",
    "server/parts-engine/schema.ts",
    "server/parts-engine/service.ts",
    "server/vehicle-engine/README.md",
    "server/vehicle-engine/__tests__/vehicle-engine.test.ts",
    "server/vehicle-engine/index.ts",
    "server/vehicle-engine/schema.ts",
    "server/vehicle-engine/service.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : Aucune ligne de code métier changée : uniquement des libellés (sections\n\"Vehicle/Parts AI Engine\" → \"Vehicle/Parts Intelligence Engine\", messages\n\"reason\" honnêtes reformulés, docstrings). analyserIA()/aiData/le code des\ntests restent inchangés — ce sont des identifiants techniques, jamais\ninterdits par la règle (elle ne cible que le mot isolé « IA »/« AI » visible\nen prose).\nVérifié cette fois de bout en bout, contrairement aux deux lots précédents\noù seuls les tests DB et le mode développement avaient été validés :\n- `npm run build` (les 12 contrôles + build:graph + build:client +\n  build:server) : exit 0, aucune régression sur les autres contrôles.\n- `node dist/server.js` (l'artefact réellement exécuté par `npm run start`\n  sur Railway, NODE_ENV=production) démarre proprement, `/api/health`\n  répond 200, les trois moteurs (supplierEngine/vehicleEngine/partsEngine)\n  répondent en direct depuis ce build compilé.\n- Les 3 suites de tests réels (Supplier 37/37, Vehicle 49/49, Parts 63/63)\n  repassent intégralement après renommage.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-336",
  "titre": "logistics-engine — LOT 4 du Plan Maître Fournisseurs — transport/livraison",
  "moteurs": [
    "logistics-engine"
  ],
  "quoi": "Origine : PR 336 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits 49dffabc, auteur git : Claude.\n\n• feat(logistics-engine): LOT 4 du Plan Maître Fournisseurs — transport/livraison\nAudit préalable complet (Vehicle Delivery Engine, deliveryMissions/livraison\nlocale, Import Africa+, Event Bus, Document OS, connecteurs transporteurs\nexistants, webhooks entrants, Supplier Engine côté transport, champs\ncanoniques) avant tout développement.\n\nNouveau moteur server/logistics-engine/ (LOT 4) : Delivery/Logistics API\nGateway, Carrier Connector Engine (catalogue de 19 transporteurs nommés par\nle plan, honnêtement NOT_CONNECTED sans clé réelle — aucune n'existe\naujourd'hui), Delivery Quote Engine (délègue au Vehicle Delivery Engine réel\npour les véhicules, honnêtement indisponible pour colis/fret), Delivery\nRouting Engine (sélection multi-facteurs parmi les seules options\ndisponibles), Multi-Leg Engine (MASTER SHIPMENT + LEG 1-4, responsabilité et\ncondition de paiement distinctes par leg), Tracking Engine (18 statuts\nnormalisés, agrégation au leg le moins avancé sauf urgence FAILED/DISPUTED/\nRETURNED remontée immédiatement), webhook transporteur (signature réelle\nvérifiée, jamais un succès fabriqué sans secret configuré), API MKA.P-MS\npour transporteurs (`/api/logistics/*`, clé API dédiée par en-tête, jamais\nla session plateforme).\n\nRéutilise sans dupliquer : Vehicle Delivery Engine (seule source réelle de\nprix, catégorie véhicules), Connector Engine du LOT 1 (catalogue des\nméthodes techniques, jamais un second catalogue), Country OS/Country Policy\nEngine, Event Bus (nouveau domaine \"logistique\", 15 événements), Supplier\nEngine (MAPPING_ENTITY_TYPES étendu avec \"expedition\", CANONICAL_SHIPMENT_FIELDS\najouté). Événements carrier.payout.* du plan délibérément différés au LOT 5\n(Payment Engine), jamais implémentés ici.\n\nCorrection appliquée dès l'écriture (pas après coup, contrairement aux\nLOT 2/3) : `npm run check:naming` exécuté avant tout commit, aucune\nappellation « IA »/« AI » introduite.\n\n48 tests réels (base de données réelle) + non-régression Supplier (37/37),\nVehicle (49/49) et Parts (63/63) Engine + `npm run build` (les 12 contrôles\n+ build client + build serveur) vérifié vert de bout en bout + artefact\ncompilé (`node dist/server.js`, NODE_ENV=production) démarré et testé en\nréel : healthcheck, endpoints tRPC, et flux API transporteur complet\n(création de clé → authentification → devis honnête) via curl.",
  "pourquoi": "Nouveau moteur server/logistics-engine/ (LOT 4) : Delivery/Logistics API\nGateway, Carrier Connector Engine (catalogue de 19 transporteurs nommés par\nle plan, honnêtement NOT_CONNECTED sans clé réelle — aucune n'existe\naujourd'hui), Delivery Quote Engine (délègue au Vehicle Delivery Engine réel\npour les véhicules, honnêtement indisponible pour colis/fret), Delivery\nRouting Engine (sélection multi-facteurs parmi les seules options\ndisponibles), Multi-Leg Engine (MASTER SHIPMENT + LEG 1-4, responsabilité et\ncondition de paiement distinctes par leg), Tracking Engine (18 statuts\nnormalisés, agrégation au leg le moins avancé sauf urgence FAILED/DISPUTED/\nRETURNED remontée immédiatement), webhook transporteur (signature réelle\nvérifiée, jamais un succès fabriqué sans secret configuré), API MKA.P-MS\npour transporteurs (`/api/logistics/*`, clé API dédiée par en-tête, jamais […]",
  "ou": [
    "drizzle/0125_logistics_engine.sql",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/perimetres.ts",
    "server/engine-registry/probes.ts",
    "server/event-bus/catalog.ts",
    "server/index.ts",
    "server/logistics-engine/README.md",
    "server/logistics-engine/__tests__/logistics-engine.test.ts",
    "server/logistics-engine/api.ts",
    "server/logistics-engine/contract.ts",
    "server/logistics-engine/index.ts",
    "server/logistics-engine/schema.ts",
    "server/logistics-engine/service.ts",
    "server/router.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : Réutilise sans dupliquer : Vehicle Delivery Engine (seule source réelle de\nprix, catégorie véhicules), Connector Engine du LOT 1 (catalogue des\nméthodes techniques, jamais un second catalogue), Country OS/Country Policy\nEngine, Event Bus (nouveau domaine \"logistique\", 15 événements), Supplier\nEngine (MAPPING_ENTITY_TYPES étendu avec \"expedition\", CANONICAL_SHIPMENT_FIELDS\najouté). Événements carrier.payout.* du plan délibérément différés au LOT 5\n(Payment Engine), jamais implémentés ici.\n48 tests réels (base de données réelle) + non-régression Supplier (37/37),\nVehicle (49/49) et Parts (63/63) Engine + `npm run build` (les 12 contrôles\n+ build client + build serveur) vérifié vert de bout en bout + artefact\ncompilé (`node dist/server.js`, NODE_ENV=production) démarré et testé en\nréel : healthcheck, endpoints tRPC, et flux API transporteur complet\n(création de clé → authentification → devis honnête) via curl.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-337",
  "titre": "payout-engine — LOT 5 du Plan Maître Fournisseurs — paiements (Payout Engine + compléments Payment Engine)",
  "moteurs": [
    "payout-engine"
  ],
  "quoi": "Origine : PR 337 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits dead5b1e, auteur git : Claude.\n\n• feat(payout-engine): LOT 5 du Plan Maître Fournisseurs — paiements (Payout Engine + compléments Payment Engine)\nAudit préalable : Payment Engine, Payment Orchestrator, Financial\nIntelligence et Internal Accounting existaient déjà (staging/actifs) ; le\nLedger (wallets/payouts) existait mais réservé aux utilisateurs plateforme,\njamais branché aux fournisseurs/transporteurs comme le LOT1 le promettait.\nSeul le Payout Engine (§32 du plan) était réellement absent.\n\n- Ledger étendu (server/modules/wallet.ts) : wallets.ownerType\n  (user/supplier/carrier/platform) + supplierProfileId/carrierCode en\n  lecture seule, userId nullable — sans dupliquer la table.\n- Nouveau server/payout-engine/ : politiques de versement (préréglages\n  100%/50-50/30-70, validation humaine par défaut), calendriers de\n  versement (blocage Ledger, commission plateforme créditée), déclenchement\n  et libération par étape, idempotent, journal d'audit complet.\n- Branchement Event Bus réel : vehicule.vendu ouvre le versement\n  fournisseur ; pickup.completed/delivery.completed font avancer le\n  versement transporteur (jamais pour un leg \"interne\").\n- Corrigé une dérive schéma/DB préexistante sur 4 tables du Ledger\n  (colonnes déclarées jamais migrées, bank_accounts.wallet_id absent,\n  stripe_bank_account_id mal nommé) — même famille de bug que la\n  correction parts_stock du LOT 3.\n- Complété les webhooks Stripe manquants (litiges, transferts Connect,\n  compte connecté, abonnement créé) et l'Abandoned Payment Engine (§31,\n  relances 24h/48h/72h puis expiration).\n- npm run build vérifié vert de bout en bout (12 contrôles + build\n  client/serveur), artefact de production démarré et testé en réel.",
  "pourquoi": "Audit préalable : Payment Engine, Payment Orchestrator, Financial\nIntelligence et Internal Accounting existaient déjà (staging/actifs) ; le\nLedger (wallets/payouts) existait mais réservé aux utilisateurs plateforme,\njamais branché aux fournisseurs/transporteurs comme le LOT1 le promettait.\nSeul le Payout Engine (§32 du plan) était réellement absent.",
  "ou": [
    "drizzle/0126_payout_engine.sql",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/perimetres.ts",
    "server/engine-registry/probes.ts",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts",
    "server/index.ts",
    "server/modules/wallet.ts",
    "server/payment-engine/abandoned.ts",
    "server/payment-engine/audit.ts",
    "server/payment-engine/index.ts",
    "server/payout-engine/README.md",
    "server/payout-engine/__tests__/payout-engine.test.ts",
    "server/payout-engine/contract.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : - Ledger étendu (server/modules/wallet.ts) : wallets.ownerType\n  (user/supplier/carrier/platform) + supplierProfileId/carrierCode en\n  lecture seule, userId nullable — sans dupliquer la table.\n- Nouveau server/payout-engine/ : politiques de versement (préréglages\n  100%/50-50/30-70, validation humaine par défaut), calendriers de\n  versement (blocage Ledger, commission plateforme créditée), déclenchement\n  et libération par étape, idempotent, journal d'audit complet.\n- Branchement Event Bus réel : vehicule.vendu ouvre le versement\n  fournisseur ; pickup.completed/delivery.completed font avancer le\n  versement transporteur (jamais pour un leg \"interne\").\n- Corrigé une dérive schéma/DB préexistante sur 4 tables du Ledger\n  (colonnes déclarées jamais migrées, bank_accounts.wallet_id absent,\n  stripe_bank_account_id mal nommé) — même famille de bug que la\n  correction parts_stock du LOT 3.\n- Complété les webhooks Stripe manquants (litiges, transferts Connect,\n  compte connecté, abonnement créé) et l'Abandoned Payment Engine (§31,\n  relances 24h/48h/72h puis expiration). […]",
  "domaine": "paiement",
  "historique": true
},
{
  "cle": "pr-338",
  "titre": "tests — nettoyer les versements Payout Engine créés en effet de bord (LOT 5)",
  "moteurs": [
    "tests"
  ],
  "quoi": "Origine : PR 338 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits 53288f09, auteur git : Claude.\n\n• fix(tests): nettoyer les versements Payout Engine créés en effet de bord (LOT 5)\nDécouvert en vérification post-merge du LOT 5 : marquerVendu (Vehicle\nEngine) et mettreAJourStatutLeg (Logistics Engine) émettent des événements\nque le Payout Engine écoute désormais réellement (vehicule.vendu,\npickup.completed/delivery.completed). Une vente ou une livraison de test\nouvre donc un vrai versement (Ledger compris) que ces deux suites,\nantérieures au LOT 5, ne connaissaient pas encore à leur écriture — chaque\nexécution laissait un payout_schedule/wallet de test résiduel. Nettoyage\nétendu dans les deux suites ; non-régression vérifiée (37/37, 49/49, 63/63,\n48/48, 32/32) avec zéro résidu après exécution séquentielle.",
  "pourquoi": "Découvert en vérification post-merge du LOT 5 : marquerVendu (Vehicle\nEngine) et mettreAJourStatutLeg (Logistics Engine) émettent des événements\nque le Payout Engine écoute désormais réellement (vehicule.vendu,\npickup.completed/delivery.completed). Une vente ou une livraison de test\nouvre donc un vrai versement (Ledger compris) que ces deux suites,\nantérieures au LOT 5, ne connaissaient pas encore à leur écriture — chaque\nexécution laissait un payout_schedule/wallet de test résiduel. Nettoyage\nétendu dans les deux suites ; non-régression vérifiée (37/37, 49/49, 63/63,\n48/48, 32/32) avec zéro résidu après exécution séquentielle.",
  "ou": [
    "server/logistics-engine/__tests__/logistics-engine.test.ts",
    "server/vehicle-engine/__tests__/vehicle-engine.test.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "paiement",
  "historique": true
},
{
  "cle": "pr-339",
  "titre": "document-engine — LOT 6 du Plan Maître Fournisseurs — documents (Supplier/Vehicle Document Engine + Document Custody Engine)",
  "moteurs": [
    "document-engine"
  ],
  "quoi": "Origine : PR 339 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits 46949c22, auteur git : Claude.\n\n• feat(document-engine): LOT 6 du Plan Maître Fournisseurs — documents (Supplier/Vehicle Document Engine + Document Custody Engine)\nAudit préalable : Document OS (registre unifié doc_documents/doc_types,\nactif) et Carte Grise Engine (démarche SIV, actif) existaient déjà. Aucun\nsous-moteur \"Supplier Document Engine\" (§33), \"Vehicle Document Engine\"\n(§34, hors SIV) ni \"Document Custody Engine\" (§35) n'existait. Rien recréé :\ntout nouveau document créé par ce LOT est une ligne Document OS réelle.\n\n- server/document-engine/ (un seul module technique, 3 sous-moteurs nommés\n  par le plan, même décomposition que le Supplier Engine du LOT 1) :\n  - Supplier Document Engine : conventions/annexes/RGPD/confidentialité,\n    écart réel vs baseline (jamais une case cochée par déclaration).\n  - Vehicle Document Engine : contrôle technique/COC/garantie/export/\n    douane ; répond réellement à la question posée par\n    vehicle_territories.documentsReadyForExport (LOT 2, décision Direction\n    inchangée — juste un calcul vérifiable en plus d'un flag manuel).\n  - Document Custody Engine : original/copie, détenteur, réception, remise\n    tracée avec preuve obligatoire, \"document requis par étape\" et\n    \"blocage si document manquant\" — générique par type d'entité.\n- Branché réellement sur le Payout Engine (LOT 5) : le déclencheur\n  \"documents\" (PAYOUT_TRIGGERS), jusqu'ici purement déclaratif, s'active\n  désormais quand la pièce exigée pour un versement est réellement reçue\n  (Event Bus, nouveau domaine \"document\").\n- npm run build vérifié vert de bout en bout, artefact de production\n  démarré et testé en réel (6 moteurs healthStatus \"ok\").",
  "pourquoi": "Audit préalable : Document OS (registre unifié doc_documents/doc_types,\nactif) et Carte Grise Engine (démarche SIV, actif) existaient déjà. Aucun\nsous-moteur \"Supplier Document Engine\" (§33), \"Vehicle Document Engine\"\n(§34, hors SIV) ni \"Document Custody Engine\" (§35) n'existait. Rien recréé :\ntout nouveau document créé par ce LOT est une ligne Document OS réelle.",
  "ou": [
    "drizzle/0127_document_engine.sql",
    "server/document-engine/README.md",
    "server/document-engine/__tests__/document-engine.test.ts",
    "server/document-engine/contract.ts",
    "server/document-engine/index.ts",
    "server/document-engine/schema.ts",
    "server/document-engine/service.ts",
    "server/engine-registry/catalog.ts",
    "server/engine-registry/perimetres.ts",
    "server/engine-registry/probes.ts",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts",
    "server/index.ts",
    "server/router.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : - server/document-engine/ (un seul module technique, 3 sous-moteurs nommés\n  par le plan, même décomposition que le Supplier Engine du LOT 1) :\n  - Supplier Document Engine : conventions/annexes/RGPD/confidentialité,\n    écart réel vs baseline (jamais une case cochée par déclaration).\n  - Vehicle Document Engine : contrôle technique/COC/garantie/export/\n    douane ; répond réellement à la question posée par\n    vehicle_territories.documentsReadyForExport (LOT 2, décision Direction\n    inchangée — juste un calcul vérifiable en plus d'un flag manuel).\n  - Document Custody Engine : original/copie, détenteur, réception, remise\n    tracée avec preuve obligatoire, \"document requis par étape\" et\n    \"blocage si document manquant\" — générique par type d'entité.\n- Branché réellement sur le Payout Engine (LOT 5) : le déclencheur\n  \"documents\" (PAYOUT_TRIGGERS), jusqu'ici purement déclaratif, s'active\n  désormais quand la pièce exigée pour un versement est réellement reçue\n  (Event Bus, nouveau domaine \"document\").\n- npm run build vérifié vert de bout en bout, artefact de production […]",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-340",
  "titre": "direction-dashboard — LOT 7 (partiel) — tableau de bord Direction, Ledger fournisseur/transporteur, Commissions réelles",
  "moteurs": [
    "direction-dashboard"
  ],
  "quoi": "Origine : PR 340 du 2026-09-15, branche claude/test-network-connections-j6905r (famille claude), commits 87a36bc6, auteur git : Claude.\n\n• feat(direction-dashboard): LOT 7 (partiel) — tableau de bord Direction, Ledger fournisseur/transporteur, Commissions réelles\nAudit préalable : le Supplier Portal/Transporter Portal du LOT 7 (§38-39)\nsupposent qu'un fournisseur/transporteur externe se connecte lui-même — or\naucun rôle \"supplier\"/\"carrier\" ni lien users↔supplier_profiles n'existe\ndans le modèle d'auth actuel (shared/roles.ts, server/trpc.ts). Créer cette\nsurface d'authentification externe est une décision de sécurité/produit qui\nreste à trancher — non traitée ici, signalée explicitement à la Direction.\n\nCe qui est réellement livré dans ce commit, sans dépendre de cette décision\n(usage interne Direction/admin uniquement, aucune nouvelle surface externe) :\n\n- Tableau de bord Direction agrégé (§40, server/engine-registry/\n  business-dashboard.ts) : réunit les dashboard() déjà exposés par les 6\n  moteurs LOT1-6 + Payment Engine + Internal Accounting + Financial\n  Intelligence — aucune donnée dupliquée, chaque section isolée (l'échec\n  d'un moteur n'empêche jamais les autres).\n- Ledger fournisseur/transporteur (§29/§38/§39/§41) : `findOrCreateWallet`/\n  `findOrCreatePlatformWallet` du Payout Engine (LOT 5) déplacés vers\n  server/modules/wallet-ledger.ts (le Ledger lui-même) pour ne plus être\n  dupliqués, et exposés côté admin via server/routers/wallet.ts\n  (walletForSupplier/walletForCarrier/transactionsFor/payoutsFor) — le\n  schéma était prêt depuis le LOT 5, le routeur ne suivait pas.\n- Correction de AdminCommissions.tsx (§41 Comptabilité), jusqu'ici 100 %\n  factice (taux et montants codés en dur) : branché sur les données réelles\n  du Payment Engine (paymentEngine.productsAll/stats).\n\nnpm run build vérifié vert de bout en bout, artefact de production démarré\net testé en réel.",
  "pourquoi": "Audit préalable : le Supplier Portal/Transporter Portal du LOT 7 (§38-39)\nsupposent qu'un fournisseur/transporteur externe se connecte lui-même — or\naucun rôle \"supplier\"/\"carrier\" ni lien users↔supplier_profiles n'existe\ndans le modèle d'auth actuel (shared/roles.ts, server/trpc.ts). Créer cette\nsurface d'authentification externe est une décision de sécurité/produit qui\nreste à trancher — non traitée ici, signalée explicitement à la Direction.",
  "ou": [
    "client/src/pages/superadmin/AdminCommissions.tsx",
    "server/engine-registry/__tests__/business-dashboard.test.ts",
    "server/engine-registry/business-dashboard.ts",
    "server/engine-registry/perimetres.ts",
    "server/engine-registry/router.ts",
    "server/modules/wallet-ledger.ts",
    "server/payout-engine/service.ts",
    "server/routers/wallet.ts"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : - Tableau de bord Direction agrégé (§40, server/engine-registry/\n  business-dashboard.ts) : réunit les dashboard() déjà exposés par les 6\n  moteurs LOT1-6 + Payment Engine + Internal Accounting + Financial\n  Intelligence — aucune donnée dupliquée, chaque section isolée (l'échec\n  d'un moteur n'empêche jamais les autres).\n- Ledger fournisseur/transporteur (§29/§38/§39/§41) : `findOrCreateWallet`/\n  `findOrCreatePlatformWallet` du Payout Engine (LOT 5) déplacés vers\n  server/modules/wallet-ledger.ts (le Ledger lui-même) pour ne plus être\n  dupliqués, et exposés côté admin via server/routers/wallet.ts\n  (walletForSupplier/walletForCarrier/transactionsFor/payoutsFor) — le\n  schéma était prêt depuis le LOT 5, le routeur ne suivait pas.\n- Correction de AdminCommissions.tsx (§41 Comptabilité), jusqu'ici 100 %\n  factice (taux et montants codés en dur) : branché sur les données réelles\n  du Payment Engine (paymentEngine.productsAll/stats).\nnpm run build vérifié vert de bout en bout, artefact de production démarré\net testé en réel.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-364",
  "titre": "android — version 1.7.6 (versionCode 10706) pour les 5 applications + User-Agent aligné sur la version du dépôt",
  "moteurs": [
    "android"
  ],
  "quoi": "Origine : PR 364 du 2026-09-17, branche devin/1789598570-android-api36 (famille devin), commits d7381a67, auteur git : Mka Garage.\n\n• chore(android): version 1.7.6 (versionCode 10706) pour les 5 applications + User-Agent aligné sur la version du dépôt\n(Message de commit réduit au titre : le détail se trouve dans le diff, 3 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 364 et le diff.",
  "ou": [
    "capacitor.config.ts",
    "package-lock.json",
    "package.json"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-365",
  "titre": "android — écran « Connexion indisponible » réellement affiché hors réseau (server.errorPath) + reprise automatique au retour du réseau",
  "moteurs": [
    "android"
  ],
  "quoi": "Origine : PR 365 du 2026-09-17, branche devin/1789643196-android-offline (famille devin), commits 1d2277d2, auteur git : Mka Garage.\n\n• fix(android): écran « Connexion indisponible » réellement affiché hors réseau (server.errorPath) + reprise automatique au retour du réseau\n(Message de commit réduit au titre : le détail se trouve dans le diff, 2 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 365 et le diff.",
  "ou": [
    "capacitor.config.ts",
    "mobile/www/index.html"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-371",
  "titre": "Prépare la chaîne de build Android pour les 5 nouvelles applications",
  "moteurs": [
    "test"
  ],
  "quoi": "Origine : PR 371 du 2026-09-18, branche claude/test-network-connections-j6905r (famille claude), commits 9c0aa5e3, auteur git : Claude.\n\n• Prépare la chaîne de build Android pour les 5 nouvelles applications\nObjectif : rendre les 5 flavors (grandpublic/com.mkapms.app,\npro/com.mkapms.pro, command/com.mkapms.command,\nintelligence/com.mkapms.intelligence, investor/com.mkapms.investor)\ncapables de produire chacun un Android App Bundle .aab — sans générer\naucune clé ni aucun secret, conformément à la consigne.\n\nCause trouvée en vérifiant la chaîne (point 1 demandé) : AGP 8.2.1 (le\ndéfaut du gabarit Capacitor 6, toujours en place) plafonne officiellement\nà compileSdk/targetSdk API 34 (release notes Google officielles). Or\nvariables.gradle fixe compileSdk=targetSdk=36 — et Google Play impose\nde cibler l'API 36 pour toute NOUVELLE application depuis le 31/08/2026,\nce qui est le cas ici. Un build avec cette combinaison n'est pas garanti\nstable ni officiellement supporté.\n\nCorrectif : AGP 8.2.1 → 8.13.0 (dernière version stable de la branche 8.x,\ndonc le plus petit saut possible — la branche 9.x apporte des changements\nplus larges, non nécessaires ici), qui supporte officiellement l'API 36.1.\nGradle wrapper aligné sur 8.13 (minimum exigé par AGP 8.13.0, vérifié\nréellement téléchargeable). JDK 17 (déjà le minimum documenté, satisfait\npar l'environnement CI). Aucun changement à l'architecture des 5 flavors\nelle-même (product flavors, applicationId par variante) : déjà correcte,\nnon touchée.\n\nAjouts :\n- .github/workflows/android-aab.yml : construit les 5 .aab sur\n  déclenchement manuel uniquement (aucune publication, aucun déploiement).\n  Réutilise mobile/build-apps.mjs (déjà réel, jamais dupliqué) — jamais une\n  seconde logique de build. Signature release optionnelle via secrets\n  GitHub (MKAPMS_KEYSTORE_BASE64/MKAPMS_KEYSTORE_PASSWORD/MKAPMS_KEY_ALIAS/\n  MKAPMS_KEY_PASSWORD) ; sans eux, les .aab sont produits mais non signés,\n  jamais présentés comme publiables. Aucun trousseau n'est créé par ce\n  workflow.\n- scripts/check-android-appids.mjs (check:android-appids) : vérifie que\n  les 5 applicationId sont exacts et qu'aucune ancienne entrée Play\n  Console (com.mkapms.direction, com.mkapms.particulier, com.mkapms.Pro —\n  applications distinctes, jamais mélangées) n'apparaît dans\n  mobile/variants.json.\n- android/keystore.properties.example : documente le format attendu du\n  trousseau local, sans aucune valeur réelle.\n\nCorrige au passage deux commentaires devenus faux (« quatre applications »\n→ cinq) dans android/app/build.gradle et mobile/build-apps.mjs.\n\nNon exécuté de bout en bout : cet environnement de travail n'a pas le SDK\nAndroid installé (aucun ANDROID_HOME), donc je n'ai pas pu lancer un build […]",
  "pourquoi": "Objectif : rendre les 5 flavors (grandpublic/com.mkapms.app,\npro/com.mkapms.pro, command/com.mkapms.command,\nintelligence/com.mkapms.intelligence, investor/com.mkapms.investor)\ncapables de produire chacun un Android App Bundle .aab — sans générer\naucune clé ni aucun secret, conformément à la consigne.",
  "ou": [
    ".github/workflows/android-aab.yml",
    "android/app/build.gradle",
    "android/build.gradle",
    "android/gradle/wrapper/gradle-wrapper.properties",
    "android/keystore.properties.example",
    "mobile/build-apps.mjs",
    "package.json",
    "scripts/check-android-appids.mjs"
  ],
  "lecon": "Vérification et contenu relevés dans le message d'origine : Cause trouvée en vérifiant la chaîne (point 1 demandé) : AGP 8.2.1 (le\ndéfaut du gabarit Capacitor 6, toujours en place) plafonne officiellement\nà compileSdk/targetSdk API 34 (release notes Google officielles). Or\nvariables.gradle fixe compileSdk=targetSdk=36 — et Google Play impose\nde cibler l'API 36 pour toute NOUVELLE application depuis le 31/08/2026,\nce qui est le cas ici. Un build avec cette combinaison n'est pas garanti\nstable ni officiellement supporté.\nCorrectif : AGP 8.2.1 → 8.13.0 (dernière version stable de la branche 8.x,\ndonc le plus petit saut possible — la branche 9.x apporte des changements\nplus larges, non nécessaires ici), qui supporte officiellement l'API 36.1.\nGradle wrapper aligné sur 8.13 (minimum exigé par AGP 8.13.0, vérifié\nréellement téléchargeable). JDK 17 (déjà le minimum documenté, satisfait\npar l'environnement CI). Aucun changement à l'architecture des 5 flavors\nelle-même (product flavors, applicationId par variante) : déjà correcte,\nnon touchée.",
  "domaine": "seo",
  "historique": true
},
{
  "cle": "pr-425",
  "titre": "atelier — Atelier Pro sur données serveur réelles — synthèse moteur (interventions, clients, véhicules, stock), étapes d'intervention persistées, boutons déclarés au Moteur de boutons",
  "moteurs": [
    "atelier"
  ],
  "quoi": "Origine : PR 425 du 2026-09-21, branche devin/1789994072-boutons-morts-atelier-autodata-encheres-compte (famille devin), commits c07f8223, auteur git : Mka Garage.\n\n• feat(atelier): Atelier Pro sur données serveur réelles — synthèse moteur (interventions, clients, véhicules, stock), étapes d'intervention persistées, boutons déclarés au Moteur de boutons\n(Message de commit réduit au titre : le détail se trouve dans le diff, 7 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 425 et le diff.",
  "ou": [
    "client/src/pages/AtelierPro.tsx",
    "drizzle/0138_rdv_status_intervention.sql",
    "server/button-engine/catalogue.ts",
    "server/data/cliquables.ts",
    "server/redirection-engine/catalog.ts",
    "server/routers/garages.ts",
    "server/schema.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-426",
  "titre": "catalogue-technique — identification plaque/VIN par le serveur, accès décidé par la session, boutons déclarés au Moteur de boutons",
  "moteurs": [
    "catalogue-technique"
  ],
  "quoi": "Origine : PR 426 du 2026-09-21, branche devin/1789994979-autodata-encheres-compte (famille devin), commits 85378176, auteur git : Mka Garage.\n\n• feat(catalogue-technique): identification plaque/VIN par le serveur, accès décidé par la session, boutons déclarés au Moteur de boutons\n(Message de commit réduit au titre : le détail se trouve dans le diff, 3 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 426 et le diff.",
  "ou": [
    "client/src/pages/CatalogueTechnique.tsx",
    "server/button-engine/catalogue.ts",
    "server/data/cliquables.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-427",
  "titre": "ia — structurer le diagnostic des boutons",
  "moteurs": [
    "ia"
  ],
  "quoi": "Origine : PR 427 du 2026-09-21, branche codex/auditer-mka-pms-ia-et-corriger-les-erreurs-hn9xqd (famille codex), commits a54011be, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• feat(ia): structurer le diagnostic des boutons\n(Message de commit réduit au titre : le détail se trouve dans le diff, 9 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 427 et le diff.",
  "ou": [
    "docs/audits/mka-pms-ia-lot-boutons-diagnostic.md",
    "scripts/gen-moteurs.mjs",
    "server/button-engine/__tests__/button-engine.test.ts",
    "server/button-engine/__tests__/diagnostic.test.ts",
    "server/button-engine/diagnostic.ts",
    "server/button-engine/index.ts",
    "server/button-engine/service.ts",
    "server/event-bus/catalog.ts",
    "server/event-bus/handlers.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-430",
  "titre": "ia — ingest SHOP engineering knowledge with scoped GitHub identity",
  "moteurs": [
    "ia"
  ],
  "quoi": "Origine : PR 430 du 2026-09-24, branche codex/ia-shop-knowledge (famille codex), commits d9234194, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• feat(ia): ingest SHOP engineering knowledge with scoped GitHub identity\n(Message de commit réduit au titre : le détail se trouve dans le diff, 8 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 430 et le diff.",
  "ou": [
    ".github/workflows/build-check.yml",
    "docs/SHOP-KNOWLEDGE-SYNC.md",
    "server/intelligences/__tests__/shop-knowledge.integration.test.ts",
    "server/intelligences/__tests__/shop-knowledge.test.ts",
    "server/intelligences/api-v1.ts",
    "server/intelligences/shop-knowledge-contract.ts",
    "server/intelligences/shop-knowledge-store.ts",
    "server/intelligences/shop-knowledge.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-431",
  "titre": "platform — reconcile screenshot alerts and connect fleet and KYC motors",
  "moteurs": [
    "platform"
  ],
  "quoi": "Origine : PR 431 du 2026-09-24, branche fix/platform-screenshot-motors (famille fix), commits eadd02ff, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix(platform): reconcile screenshot alerts and connect fleet and KYC motors\n(Message de commit réduit au titre : le détail se trouve dans le diff, 23 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 431 et le diff.",
  "ou": [
    "client/src/lib/boutonMoteur.tsx",
    "client/src/pages/ControleDocuments.tsx",
    "client/src/pages/LocationPro.tsx",
    "client/src/pages/SmartEngine/ControlCenter.tsx",
    "client/src/pages/superadmin/AdminValidationDocs.tsx",
    "client/src/pages/superadmin/ValidationDocumentsComplete.tsx",
    "docs/audits/2026-09-24-captures-plateforme.md",
    "package-lock.json",
    "package.json",
    "scripts/test-button-motor.mjs",
    "server/button-engine/catalogue.ts",
    "server/button-engine/diagnostic.ts",
    "server/button-engine/service.ts",
    "server/data/boutons-sans-action.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "confiance",
  "historique": true
},
{
  "cle": "pr-432",
  "titre": "identity — connect staff screen to real account motor",
  "moteurs": [
    "identity"
  ],
  "quoi": "Origine : PR 432 du 2026-09-24, branche fix/platform-staff-motor (famille fix), commits 7093dde4, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix(identity): connect staff screen to real account motor\n(Message de commit réduit au titre : le détail se trouve dans le diff, 7 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 432 et le diff.",
  "ou": [
    "client/src/pages/superadmin/GestionEmployesMKAPMS.tsx",
    "docs/audits/2026-09-24-captures-plateforme.md",
    "server/button-engine/catalogue.ts",
    "server/data/boutons-sans-action.ts",
    "server/data/cliquables.ts",
    "server/routers/__tests__/staff-motor.test.ts",
    "server/routers/admin.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-433",
  "titre": "search — connect saved alerts to publication and notification motors",
  "moteurs": [
    "search"
  ],
  "quoi": "Origine : PR 433 du 2026-09-24, branche fix/platform-search-alert-motor (famille fix), commits 6165a0da, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix(search): connect saved alerts to publication and notification motors\n(Message de commit réduit au titre : le détail se trouve dans le diff, 13 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 433 et le diff.",
  "ou": [
    "client/src/pages/vente/CentreAlertesRecherche.tsx",
    "docs/audits/2026-09-24-captures-plateforme.md",
    "server/button-engine/catalogue.ts",
    "server/button-engine/diagnostic.ts",
    "server/button-engine/service.ts",
    "server/data/boutons-sans-action.ts",
    "server/data/cliquables.ts",
    "server/engine-registry/perimetres.ts",
    "server/modules/search-alerts.ts",
    "server/routers/__tests__/search-alert-motor.test.ts",
    "server/routers/admin.ts",
    "server/routers/annonces.ts",
    "server/routers/notifications.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-434",
  "titre": "achat — connect recommendation favourites to persistent motor",
  "moteurs": [
    "achat"
  ],
  "quoi": "Origine : PR 434 du 2026-09-24, branche fix/platform-vehicle-favourites (famille fix), commits 1dc59d1e, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix(achat): connect recommendation favourites to persistent motor\n(Message de commit réduit au titre : le détail se trouve dans le diff, 7 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 434 et le diff.",
  "ou": [
    "client/src/pages/Vehicule.tsx",
    "docs/audits/2026-09-24-captures-plateforme.md",
    "server/button-engine/catalogue.ts",
    "server/data/boutons-sans-action.ts",
    "server/data/cliquables.ts",
    "server/routers/__tests__/favourite-motor.test.ts",
    "server/routers/favoris.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-439",
  "titre": "smart — use health levels correctly in autonomous observation",
  "moteurs": [
    "smart"
  ],
  "quoi": "Origine : PR 439 du 2026-09-24, branche fix/smart-observation-health-contract (famille fix), commits c5c7a116, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix(smart): use health levels correctly in autonomous observation\n(Message de commit réduit au titre : le détail se trouve dans le diff, 4 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 439 et le diff.",
  "ou": [
    "docs/audits/2026-09-24-captures-plateforme.md",
    "docs/audits/2026-09-24-moteurs-dependances.md",
    "server/smart-audit/__tests__/health-observation.test.ts",
    "server/smart-audit/service.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "commit-0e936149",
  "titre": "scoped SHOP inference via canonical intelligence gateway",
  "moteurs": [
    "commitarrivparunefusiondesynchronisation"
  ],
  "quoi": "Origine : commits du 2026-09-25 (commit arrivé par une fusion de synchronisation), commits 0e936149, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• feat: scoped SHOP inference via canonical intelligence gateway\n(Message de commit réduit au titre : le détail se trouve dans le diff, 0 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir le diff du commit.",
  "ou": [
    "(fichiers visibles dans le diff du commit)"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "commit-7b93b21a",
  "titre": "regenerate inventories against current main",
  "moteurs": [
    "commitarrivparunefusiondesynchronisation"
  ],
  "quoi": "Origine : commits du 2026-09-25 (commit arrivé par une fusion de synchronisation), commits 7b93b21a, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• chore: regenerate inventories against current main\n(Message de commit réduit au titre : le détail se trouve dans le diff, 0 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir le diff du commit.",
  "ou": [
    "(fichiers visibles dans le diff du commit)"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-422",
  "titre": "demarches — démarches administratives branchées au moteur — catalogue serveur, dépôt réel avec pièces, suivi et espace pro sur données réelles, cartes Carte grise via Moteur de boutons/Redir",
  "moteurs": [
    "demarches"
  ],
  "quoi": "Origine : PR 422 du 2026-09-25, branche devin/1789646591-demarches-branchees (famille devin), commits 03655460, 9640a5bc, cddb0b74, auteur git : Claude, Mka Garage.\n\n• feat(demarches): démarches administratives branchées au moteur — catalogue serveur, dépôt réel avec pièces, suivi et espace pro sur données réelles, cartes Carte grise via Moteur de boutons/Redirection\n• fix: accolade manquante après la fusion (catalogue.ts) + inventaires régénérés\n• chore: régénère inventaires + déclare cartegrise-catalogue.ts au moteur cartegrise\n(Message de commit réduit au titre : le détail se trouve dans le diff, 19 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 422 et le diff.",
  "ou": [
    "client/src/components/demarches/DemarcheFormulaire.tsx",
    "client/src/pages/demarches/CarteGriseDemarche.tsx",
    "client/src/pages/demarches/ChangementAdresse.tsx",
    "client/src/pages/demarches/ChangementTitulaire.tsx",
    "client/src/pages/demarches/DeclarationCession.tsx",
    "client/src/pages/demarches/DuplicataDemarche.tsx",
    "client/src/pages/demarches/EspaceProDemarches.tsx",
    "client/src/pages/demarches/ImmatriculationProvisoire.tsx",
    "client/src/pages/demarches/ImportationVehicule.tsx",
    "client/src/pages/demarches/PlaquesImmatriculation.tsx",
    "client/src/pages/demarches/SuccessionVehicule.tsx",
    "client/src/pages/demarches/SuiviDossier.tsx",
    "client/src/pages/demarches/WWGarage.tsx",
    "server/button-engine/catalogue.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-468",
  "titre": "ia — expose existing autonomy and capability controls without removing features",
  "moteurs": [
    "ia"
  ],
  "quoi": "Origine : PR 468 du 2026-09-27, branche codex/ia-controls-preserve-capabilities (famille codex), commits 242acd40, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• feat(ia): expose existing autonomy and capability controls without removing features\n(Message de commit réduit au titre : le détail se trouve dans le diff, 5 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 468 et le diff.",
  "ou": [
    "client/src/pages/intelligence/modules/Automatisations.tsx",
    "client/src/pages/intelligence/modules/FonctionsControle.tsx",
    "client/src/pages/intelligence/modules/Parametres.tsx",
    "docs/IA-CONTROLS-AUDIT-2026-09-27.md",
    "server/data/cliquables.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-469",
  "titre": "Raccorder les productions privées image et voix aux capacités MAIN",
  "moteurs": [
    "ai"
  ],
  "quoi": "Origine : PR 469 du 2026-09-27, branche codex/ai-private-media (famille codex), commits 81c16a60, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• Raccorder les productions privées image et voix aux capacités MAIN\n(Message de commit réduit au titre : le détail se trouve dans le diff, 15 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 469 et le diff.",
  "ou": [
    ".github/workflows/build-check.yml",
    "client/src/pages/intelligence/modules/Images.tsx",
    "client/src/pages/intelligence/modules/ProductionMedia.tsx",
    "client/src/pages/intelligence/modules/VoixTempsReel.tsx",
    "docs/IA-MEDIAS-2026-09-27.md",
    "drizzle/0147_intelligence_media_productions.sql",
    "server/data/cliquables.ts",
    "server/intelligences/__tests__/media-productions.integration.test.ts",
    "server/intelligences/__tests__/media-productions.test.ts",
    "server/intelligences/capacites.ts",
    "server/intelligences/index.ts",
    "server/intelligences/media-productions.ts",
    "server/intelligences/provider.ts",
    "server/intelligences/routeur.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-473",
  "titre": "Expose private media in Centre Intelligences and persist sourced MAIN knowledge",
  "moteurs": [
    "main"
  ],
  "quoi": "Origine : PR 473 du 2026-09-27, branche codex/main-memory-completion (famille codex), commits 8209c2bc, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• Expose private media in Centre Intelligences and persist sourced MAIN knowledge\n(Message de commit réduit au titre : le détail se trouve dans le diff, 7 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 473 et le diff.",
  "ou": [
    ".github/workflows/build-check.yml",
    "client/src/pages/CentreIntelligences.tsx",
    "client/src/pages/intelligence/modules/Memoire.tsx",
    "docs/IA-CENTRE-MEMOIRE-2026-09-27.md",
    "server/intelligences/__tests__/fondations.test.ts",
    "server/intelligences/__tests__/memory-foundations.integration.test.ts",
    "server/intelligences/fondations.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-475",
  "titre": "ai — unified Centre workspace and AL-HUDHUD·M public identity; preserve engines",
  "moteurs": [
    "ai"
  ],
  "quoi": "Origine : PR 475 du 2026-09-28, branche ai/main-conversation-workspace-20260928 (famille ai), commits ae30df32, 21409527, 517cd61a, 62c5da0f, a70dd7fa, auteur git : MKA.P-MS workspace preparation, projet-Auto-plus-Africa-MKAPMS.\n\n• test(ai): isolated browser harness for real Centre workspace components\n• feat(ai): unified Centre workspace and AL-HUDHUD·M public identity; preserve engines\n• feat(brand): declare AL-HUDHUD·M and require exact approved artwork\n• style(ai): responsive side workspace without removing existing controls\n• feat(ai): add isolated conversation and tools rail for AL-HUDHUD·M\n(Message de commit réduit au titre : le détail se trouve dans le diff, 27 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 475 et le diff.",
  "ou": [
    "client/src/App.tsx",
    "client/src/components/AssistantFlottant.tsx",
    "client/src/components/BoutonIntelligences.tsx",
    "client/src/components/IaConfigWarning.tsx",
    "client/src/pages/Admin.tsx",
    "client/src/pages/AssistantIntelligences.tsx",
    "client/src/pages/CentreAutoBranchement.tsx",
    "client/src/pages/CentreIntelligences.tsx",
    "client/src/pages/Compte.tsx",
    "client/src/pages/DepotAnnonce.tsx",
    "client/src/pages/Parametres.tsx",
    "client/src/pages/Vendre.tsx",
    "client/src/pages/comptabilite/CentrePilotage.tsx",
    "client/src/pages/depot-annonce/DescriptionAnnonce.tsx"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-476",
  "titre": "ai — exercise both real MAIN workspaces across four browser layouts and failure cases",
  "moteurs": [
    "ai"
  ],
  "quoi": "Origine : PR 476 du 2026-09-28, branche ai/main-workspace-recovery-20260928 (famille ai), commits 0949dfeb, c9e4bdc3, feab6ddd, 8a03780c, 5f17be28, d8f1e76f, auteur git : MKA.P-MS workspace recovery, projet-Auto-plus-Africa-MKAPMS.\n\n• fix(ai): one MAIN sidebar and isolated conversation drafts and request lifecycles\n• ci(ai): validate MAIN recovery, retained inventories and both workspaces in real browsers\n• test(ai): exercise both real MAIN workspaces across four browser layouts and failure cases\n• fix(ai): prepare guarded MAIN single-sidebar and conversation lifecycle recovery\n• ci(ai): bound audit archive to code and manifests, excluding large binaries\n• ci(ai): capture tracked source for isolated MAIN workspace audit\n(Message de commit réduit au titre : le détail se trouve dans le diff, 9 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 476 et le diff.",
  "ou": [
    ".github/workflows/alhud-workspace-recovery.yml",
    "client/src/pages/CentreIntelligences.tsx",
    "client/src/pages/intelligence/WorkspaceRail.tsx",
    "client/src/pages/intelligence/index.tsx",
    "client/src/pages/intelligence/modules/Conversation.tsx",
    "client/src/pages/intelligence/workspace.css",
    "scripts/apply-alhud-recovery.py",
    "scripts/test-alhud-browser.mjs",
    "server/data/cliquables.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-477",
  "titre": "ai — distinguish regeneration from sending the current draft and add regression scenarios",
  "moteurs": [
    "ai"
  ],
  "quoi": "Origine : PR 477 du 2026-09-28, branche ai/main-regenerate-draft-20260928 (famille ai), commits 410f8007, 509e43cb, c3ac4b69, auteur git : MKA.P-MS workspace recovery, projet-Auto-plus-Africa-MKAPMS.\n\n• fix(ai): preserve composed drafts during successful or failed regeneration\n• ci(ai): verify draft-preserving regeneration without production credentials\n• fix(ai): distinguish regeneration from sending the current draft and add regression scenarios\n(Message de commit réduit au titre : le détail se trouve dans le diff, 4 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 477 et le diff.",
  "ou": [
    ".github/workflows/alhud-regeneration-drafts.yml",
    "client/src/pages/intelligence/modules/Conversation.tsx",
    "scripts/fix-regeneration-drafts.py",
    "scripts/test-alhud-browser.mjs"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "moteurs",
  "historique": true
},
{
  "cle": "pr-482",
  "titre": "AL-HUDHUD·M — conversation conservée entre Chat et Travail, indicateurs d'accueil calculés par le serveur, entrée Boutique reliée à SHOP_PUBLIC_URL",
  "moteurs": [
    "AL-HUDHUD·M"
  ],
  "quoi": "Origine : PR 482 du 2026-09-28, branche devin/1790628440-alhudhud-chat-travail (famille devin), commits 6d74e746, auteur git : Mka Garage.\n\n• feat(AL-HUDHUD·M): conversation conservée entre Chat et Travail, indicateurs d'accueil calculés par le serveur, entrée Boutique reliée à SHOP_PUBLIC_URL\n(Message de commit réduit au titre : le détail se trouve dans le diff, 5 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 482 et le diff.",
  "ou": [
    "client/src/pages/intelligence/index.tsx",
    "client/src/pages/intelligence/workspace.css",
    "server/data/boutons-sans-action.ts",
    "server/data/cliquables.ts",
    "server/intelligences/index.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "commit-6d25d1d8",
  "titre": "add functional voice and account settings",
  "moteurs": [
    "commitarrivparunefusiondesynchronisation"
  ],
  "quoi": "Origine : commits du 2026-09-30 (commit arrivé par une fusion de synchronisation), commits 6d25d1d8, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• feat: add functional voice and account settings\n(Message de commit réduit au titre : le détail se trouve dans le diff, 0 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir le diff du commit.",
  "ou": [
    "(fichiers visibles dans le diff du commit)"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-498",
  "titre": "ai — progressive replies with gold reflection, waiting timer and full-width composer",
  "moteurs": [
    "ai"
  ],
  "quoi": "Origine : PR 498 du 2026-09-30, branche ai/main-progressive-gold-20260930 (famille ai), commits cf089e87, 7de8d76b, b600a75a, 99a58f6e, auteur git : MKA.P-MS interface verification, projet-Auto-plus-Africa-MKAPMS.\n\n• fix(ai): keep answer canvas white and anchor return arrow above the composer\n• test(ai): select visual reply and wait for overflow before testing manual scroll\n• build(ai): refresh inventories for progressive conversation controls\n• feat(ai): progressive replies with gold reflection, waiting timer and full-width composer\n(Message de commit réduit au titre : le détail se trouve dans le diff, 6 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 498 et le diff.",
  "ou": [
    ".github/workflows/alhud-progressive-interface.yml",
    "client/src/pages/intelligence/modules/Conversation.tsx",
    "client/src/pages/intelligence/modules/ReplyPresentation.tsx",
    "client/src/pages/intelligence/workspace.css",
    "scripts/test-alhud-progressive-browser.mjs",
    "server/data/cliquables.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-501",
  "titre": "intelligence — add governed autonomous agent and premium references",
  "moteurs": [
    "intelligence"
  ],
  "quoi": "Origine : PR 501 du 2026-09-30, branche codex/alhud-autonomous-capabilities-20260930 (famille codex), commits cd439b17, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• feat(intelligence): add governed autonomous agent and premium references\n(Message de commit réduit au titre : le détail se trouve dans le diff, 10 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 501 et le diff.",
  "ou": [
    "client/src/pages/intelligence/modules/Agents.tsx",
    "client/src/pages/intelligence/modules/ProductionMedia.tsx",
    "server/data/cliquables.ts",
    "server/intelligences/__tests__/agent-autonome.test.ts",
    "server/intelligences/__tests__/media-productions.test.ts",
    "server/intelligences/autonomie.ts",
    "server/intelligences/fondations.ts",
    "server/intelligences/index.ts",
    "server/intelligences/media-productions.ts",
    "server/intelligences/provider.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-502",
  "titre": "intelligence — unifier chat travail et rétablir le micro",
  "moteurs": [
    "intelligence"
  ],
  "quoi": "Origine : PR 502 du 2026-09-30, branche alhud-chat-work-voice-fix-20260930 (famille autre), commits e141974e, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix(intelligence): unifier chat travail et rétablir le micro\n(Message de commit réduit au titre : le détail se trouve dans le diff, 8 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 502 et le diff.",
  "ou": [
    "client/src/components/VoiceSettingsPanel.tsx",
    "client/src/lib/__tests__/speech.test.ts",
    "client/src/lib/speech.ts",
    "client/src/pages/intelligence/index.tsx",
    "client/src/pages/intelligence/modules/Conversation.tsx",
    "server/data/boutons-sans-action.ts",
    "server/data/cliquables.ts",
    "server/intelligences/index.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-505",
  "titre": "pieces — catalogue et boutique de pièces",
  "moteurs": [
    "pieces"
  ],
  "quoi": "Origine : PR 505 du 2026-10-01, branche codex/pieces-catalogue-boutique-fiche (famille codex), commits bcf5fe5b, 5da05c84, 439982dc, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• feat(pieces): persister le panier pièces\n• feat(pieces): catalogue et boutique de pièces\n• feat(pieces): ajouter la page produit\n(Message de commit réduit au titre : le détail se trouve dans le diff, 4 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 505 et le diff.",
  "ou": [
    "client/src/App.tsx",
    "client/src/lib/piecesCartStore.ts",
    "client/src/pages/Pieces.tsx",
    "client/src/pages/PiecesProduit.tsx"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-509",
  "titre": "catalogue pièces électriques et voix stable",
  "moteurs": [
    "pieces"
  ],
  "quoi": "Origine : PR 509 du 2026-10-01, branche codex/pieces-electriques-voix-ice-20261001 (famille codex), commits e9e1e15b, 5a80bb10, f1f55395, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix: synchroniser l'inventaire des boutons\n• fix: typer la tuile bateau sans visuel trompeur\n• feat: catalogue pièces électriques et voix stable\n(Message de commit réduit au titre : le détail se trouve dans le diff, 10 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 509 et le diff.",
  "ou": [
    "client/src/lib/realtimeVoice.ts",
    "client/src/pages/Pieces.tsx",
    "client/src/pages/PiecesProduit.tsx",
    "drizzle/0151_parts_vehicle_type_electrique.sql",
    "server/data/boutons-sans-action.ts",
    "server/data/cliquables.ts",
    "server/routers/__tests__/pieces.test.ts",
    "server/routers/pieces.ts",
    "server/schema.ts",
    "shared/partsCategories.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-510",
  "titre": "catalogue pièces aéré et responsive",
  "moteurs": [
    "catalogue"
  ],
  "quoi": "Origine : PR 510 du 2026-10-01, branche codex/catalogue-pieces-responsive-20261001 (famille codex), commits 0d85ea1f, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• feat: catalogue pièces aéré et responsive\n(Message de commit réduit au titre : le détail se trouve dans le diff, 1 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 510 et le diff.",
  "ou": [
    "client/src/pages/Pieces.tsx"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-511",
  "titre": "gérer les catégories de pièces sans photo",
  "moteurs": [
    "catalogue"
  ],
  "quoi": "Origine : PR 511 du 2026-10-01, branche codex/catalogue-pieces-responsive-20261001 (famille codex), commits 6aea787a, auteur git : projet-Auto-plus-Africa-MKAPMS.\n\n• fix: gérer les catégories de pièces sans photo\n(Message de commit réduit au titre : le détail se trouve dans le diff, 1 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 511 et le diff.",
  "ou": [
    "client/src/pages/Pieces.tsx"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "code",
  "historique": true
},
{
  "cle": "pr-549",
  "titre": "AL-HUDHUD·M — Travail affiché étape par étape pendant la mission + Nouvelle conversation et Récents repliables dans le menu, Fermer sous la barre de statut iOS",
  "moteurs": [
    "AL-HUDHUD·M"
  ],
  "quoi": "Origine : PR 549 du 2026-10-02, branche devin/1790977870-travail-temps-reel-menu (famille devin), commits d1e09192, auteur git : Mka Garage.\n\n• feat(AL-HUDHUD·M): Travail affiché étape par étape pendant la mission + Nouvelle conversation et Récents repliables dans le menu, Fermer sous la barre de statut iOS\n(Message de commit réduit au titre : le détail se trouve dans le diff, 10 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 549 et le diff.",
  "ou": [
    "client/src/pages/intelligence/index.tsx",
    "client/src/pages/intelligence/modules/Conversation.tsx",
    "client/src/pages/intelligence/modules/ReplyPresentation.tsx",
    "client/src/pages/intelligence/workspace.css",
    "server/data/boutons-sans-action.ts",
    "server/data/cliquables.ts",
    "server/intelligences/__tests__/mission-progression.test.ts",
    "server/intelligences/index.ts",
    "server/intelligences/mission-progression.ts",
    "server/intelligences/orchestrateur.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "intelligences",
  "historique": true
},
{
  "cle": "pr-553",
  "titre": "auth+android — connexion/inscription Google dans les 5 applications (navigateur du téléphone + ticket à usage unique) + version 1.7.7",
  "moteurs": [
    "authandroid"
  ],
  "quoi": "Origine : PR 553 du 2026-10-03, branche devin/1790981465-google-app-android (famille devin), commits cf3b4a0b, auteur git : Mka Garage.\n\n• feat(auth+android): connexion/inscription Google dans les 5 applications (navigateur du téléphone + ticket à usage unique) + version 1.7.7\n(Message de commit réduit au titre : le détail se trouve dans le diff, 10 fichier(s) modifié(s).)",
  "pourquoi": "Le message de commit ne détaille pas le motif ; voir la description de la PR 553 et le diff.",
  "ou": [
    ".github/workflows/build-check.yml",
    "android/app/src/main/AndroidManifest.xml",
    "client/src/pages/Connexion.tsx",
    "package-lock.json",
    "package.json",
    "server/__tests__/auth-google.test.ts",
    "server/auth-google.ts",
    "server/index.ts",
    "server/intelligences/connaissances-publication.ts",
    "server/routers/auth.ts"
  ],
  "lecon": "Aucune leçon propre n'est consignée dans le message d'origine.",
  "domaine": "seo",
  "historique": true
}
];
