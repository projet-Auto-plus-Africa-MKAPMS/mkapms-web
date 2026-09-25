/**
 * MKA.P-MS Intelligences — registre versionné des livraisons.
 *
 * Règle de la direction : rien n'est poussé sans que les Intelligences sachent
 * ce qui a été fait, pourquoi, où, et ce qu'il faut en retenir. Chaque
 * livraison (PR) ajoute une entrée ici ; au démarrage, les entrées absentes
 * de la mémoire technique y sont écrites, et la leçon devient une expérience
 * consultée par les missions suivantes. Le fichier est la source : la base
 * n'en est que le reflet, reconstruit à chaque déploiement.
 *
 * Une entrée n'est jamais modifiée après fusion : une correction ultérieure
 * est une nouvelle livraison.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { ecrire, retenir } from "./memoire.js";
import { inMemoire } from "./schema.js";

export interface Livraison {
  /** Identifiant stable : `pr-<numéro>` ou `branche-<nom>` avant fusion. */
  cle: string;
  titre: string;
  /** Moteurs touchés, par identifiant du registre. */
  moteurs: string[];
  /** Ce qui a été fait, en termes de comportement observable. */
  quoi: string;
  /** Cause ou besoin qui a motivé la livraison. */
  pourquoi: string;
  /** Fichiers ou zones de code porteurs du changement. */
  ou: string[];
  /** Leçon retenue, réutilisable pour un problème similaire. */
  lecon: string;
  /** Domaine d'expérience (paiement, moteurs, code, seo, …). */
  domaine: string;
}

export const LIVRAISONS: Livraison[] = [
  {
    cle: "branche-fix-hr-staff-planning",
    titre: "Employés : profils et planning persistants dans le moteur RH",
    moteurs: ["workflow", "identity", "boutons"],
    quoi: "Relier les compteurs, profils, congés et performances aux données RH et ajouter le planning hebdomadaire persistant avec contrôle des chevauchements, idempotence et retrait audité. Quatre commandes déclarées dans le moteur de boutons.",
    pourquoi: "Les compteurs et missions étaient inventés ; Enregistrer fermait la fenêtre et Ajouter au planning vidait le formulaire sans aucune sauvegarde.",
    ou: ["server/modules/hr-direction.ts", "server/modules/operations.ts", "server/routers/operations.ts", "client/src/pages/superadmin/AdminEmployes.tsx", "drizzle/0139_hr_staff_planning.sql", "server/routers/__tests__/hr-staff-planning.test.ts"],
    lecon: "Tester la persistance et la conservation des champs non modifiés. Les dossiers de direction exigent le PDG ; aucun rôle ou salaire n’est modifié depuis cet écran. Une absence de note reste non évaluée. Migration et tests isolés ; pas de vérification visuelle en production.",
    domaine: "confiance",
  },
  {
    cle: "branche-fix-admin-garage-real-workflow",
    titre: "Garage Direction : dossiers réels, détails et actions persistées",
    moteurs: ["garage", "atelier", "boutons", "identity", "notification", "avis_reputation"],
    quoi: "Brancher AdminGarage sur rdv_garage, le suivi et l’audit ; recherche et pagination ; détails ; clôture et annulation avec contrôles ; archivage réversible. Déclarer les cinq commandes dans le moteur de boutons.",
    pourquoi: "La page utilisait cinq interventions fabriquées et des mutations uniquement locales. Le bouton Détails était sans action.",
    ou: ["server/atelier-engine/administration.ts", "server/routers/garages.ts", "client/src/pages/superadmin/AdminGarage.tsx", "server/button-engine/catalogue.ts", "server/routers/__tests__/garage-direction.test.ts"],
    lecon: "Un clic fonctionnel ne suffit pas : vérifier la source du dossier, la persistance, les permissions, les transitions et l’historique. Tests isolés de ces comportements et conservation intégrale des dossiers. Pas de déclaration de validation visuelle ou d’envoi de notification en production.",
    domaine: "confiance",
  },
  {
    cle: "branche-fix-critical-health-registration",
    titre: "Surveillance : préserver les relevés et distinguer les cibles non testées",
    moteurs: ["smart"],
    quoi: "Enregistrer les cibles absentes comme unknown sans horodatage de test, préserver les observations existantes, sérialiser les écritures avec un verrou transactionnel et afficher les non-évalués dans le centre de contrôle.",
    pourquoi: "L’initialisation des 21 cibles appelait reportHealthCheck avec ok sans effectuer de test et pouvait effacer un diagnostic de panne.",
    ou: ["server/smart-engine/services/health-monitor.ts", "client/src/pages/SmartEngine/ControlCenter.tsx", "server/modules/__tests__/critical-health-registration.test.ts"],
    lecon: "L’existence d’une cible ne prouve pas son bon fonctionnement. Test isolé de conservation des résultats et d’idempotence ; concurrence multi-session PostgreSQL non validée par le serveur PGlite de test. Les anciens OK sans provenance ne sont pas arbitrairement modifiés.",
    domaine: "confiance",
  },
  {
    cle: "branche-fix-smart-observation-health-contract",
    titre: "Cycle intelligent : distinguer santé green et statut de tâche ok",
    moteurs: ["smart_audit", "smart"],
    quoi: "L’étape observer du cycle compte les catégories yellow/red comme anormales et conserve les catégories green comme saines.",
    pourquoi: "La comparaison à ok ne correspondait à aucune valeur du contrat HealthLevel (green/yellow/red). Tous les domaines, même sains, étaient donc annoncés hors état normal dans le résumé du cycle.",
    ou: ["server/smart-audit/service.ts", "server/smart-audit/__tests__/health-observation.test.ts"],
    lecon: "Ne pas confondre statut d’une tâche et santé d’un service. Tester un instantané entièrement sain et un instantané mixte avant de faire consommer le diagnostic à l’IA.",
    domaine: "moteurs",
  },
  {
    cle: "branche-fix-country-map-activity",
    titre: "Capture AdminCarteMoniale : activité réelle par pays et détail consultable",
    moteurs: ["country", "boutons", "identity", "achat", "payment"],
    quoi: "Le bouton de chaque pays ouvre les utilisateurs et annonces réels, paginés. Le moteur Countries normalise les codes, conserve les pays non configurés et distingue pays absent de Namibie. Encaissements confirmés séparés par devise, jamais assimilés au CA comptable.",
    pourquoi: "La carte était une liste de six pays et chiffres fictifs, sans action ni appel au moteur. L’API de statistiques existante omettait les pays non configurés et les valeurs non normalisées.",
    ou: ["client/src/pages/superadmin/AdminCarteMoniale.tsx", "server/routers/operations.ts", "server/button-engine/catalogue.ts", "server/routers/__tests__/country-activity.test.ts"],
    lecon: "Un bouton doit porter une action sur des données réelles. Garder les compteurs et le détail, représenter honnêtement les montants financiers, tester les permissions, la pagination et les pays incomplets.",
    domaine: "moteurs",
  },
  {
    cle: "branche-fix-ai-engine-health-tool",
    titre: "MKA.P-MS IA : outil getSystemHealth connecté au registre vivant",
    moteurs: ["intelligences", "core"],
    quoi: "L’outil précédemment enregistré sans implémentation lit désormais les états réels et l’inventaire des 94 moteurs. Filtre moteur pour détailler services, dépendances, dépendants et manques statiques. Exécution via le registre et l’exécuteur existants, session Direction obligatoire.",
    pourquoi: "L’IA avait une fiche getSystemHealth désactivée mais aucun code pour consulter effectivement ces diagnostics via sa boucle d’outils.",
    ou: ["server/intelligences/outils/familles/globales.ts", "server/intelligences/outils/familles/outils-observabilite.ts", "server/intelligences/outils/implementations.ts", "server/intelligences/outils/__tests__/observability.test.ts"],
    lecon: "Déclaré n’est pas implémenté. Lecture du registre et preuve métier sont distinctes ; cet outil n’applique aucune réparation. Tester les refus de rôles publics, l’acteur obligatoire, la lecture des vrais états et l’absence d’écriture avant de déclarer la capacité connectée.",
    domaine: "moteurs",
  },
  {
    cle: "branche-fix-engine-dependency-evidence",
    titre: "94 moteurs : dépendances persistées et preuves d’activation complètes",
    moteurs: ["core", "activation_audit", "smart", "monitoring"],
    quoi: "Résolution catalogue + connexions détectées + contrats ; contrôle des dépendances partielles/périmées ; audit exigeant tous les services tRPC déclarés et le stockage disponible ; panne de migration Core conservée lors du contrôle périodique.",
    pourquoi: "48 relations détectées n’étaient pas toutes persistées. Un seul routeur et une santé partielle pouvaient suffire à un verdict opérationnel. Le battement périodique pouvait effacer une panne de migration.",
    ou: ["server/engine-registry/service.ts", "server/engine-registry/bootstrap.ts", "server/engine-registry/readiness.ts", "server/activation-audit/service.ts", "docs/audits/2026-09-24-moteurs-dependances.md"],
    lecon: "Les valeurs initiales du catalogue ne sont pas l’état vivant. Activer nécessite des preuves actuelles sur les services et les dépendances ; un inventaire statique ne prouve ni le fonctionnement métier ni l’intégration complète à l’IA. Tests des 94 enregistrements réalisés en base isolée, pas en production.",
    domaine: "moteurs",
  },
  {
    cle: "branche-fix-button-health-archive-rate",
    titre: "IMG_1876 : taux des boutons cohérent entre les deux vues santé",
    moteurs: ["smart", "boutons"],
    quoi: "La carte État plateforme utilise le même agrégat de santé que Santé plateforme, filtré boutons/liens. Archives hors dénominateur mais toujours affichées ; lents et non évalués explicités ; absence de mesure jamais verte.",
    pourquoi: "La correction précédente archivait les relevés obsolètes, mais un second compteur les incluait encore : 16 OK / 199 dont 123 archives produisait 8 %. Test reproduisant ces valeurs : 16 / 76 relevés actifs = 21 %, 60 anomalies conservées.",
    ou: ["server/smart-engine/services/health-monitor.ts", "server/smart-engine/services/platform-health.ts", "server/modules/__tests__/button-health-rate.test.ts"],
    lecon: "Un changement de statut doit être répercuté sur tous les agrégats. Un taux de relevés surveillés ne prouve pas la couverture de tous les boutons de la plateforme. Ne jamais marquer une archive comme réussite métier.",
    domaine: "moteurs",
  },
  {
    cle: "branche-fix-platform-vehicle-favourites",
    titre: "Capture Vehicule : favoris réels et annonces recommandées réelles",
    moteurs: ["boutons", "achat", "identity"],
    quoi: "Le bloc recommandé lit annonces.list et utilise favoris.set ; la commande est déclarée au moteur Boutons. Ajout/retrait transactionnels et rejouables, annonce publiée exigée à l'ajout, utilisateur propriétaire imposé côté serveur, toggle conservé.",
    pourquoi: "Le cœur sans texte n'avait aucun gestionnaire, était imbriqué dans le lien et visait une annonce de démonstration.",
    ou: ["client/src/pages/Vehicule.tsx", "server/routers/favoris.ts", "server/routers/__tests__/favourite-motor.test.ts"],
    lecon: "Le retour serveur décide de l'état du favori. Tester les rejeux, les annonces absentes et l'isolation propriétaire. Les autres parties de la fiche encore en démonstration restent hors de cette correction ciblée.",
    domaine: "moteurs",
  },
  {
    cle: "branche-fix-platform-search-alert-motor",
    titre: "Capture Alertes recherche : Recherche reliée à Annonces et Notifications",
    moteurs: ["boutons", "search", "notification", "identity"],
    quoi: "Création, liste et activation d'alertes réelles ; propriété vérifiée côté serveur. Notification des annonces publiées, devise réelle et rejeu idempotent. Propriétaires et dépendances des commandes exposés, nouveaux services affectés aux moteurs existants.",
    pourquoi: "Le formulaire affichait des alertes fictives et ne persistait aucun critère ; le service existant de publication ne protégeait pas contre le rejeu.",
    ou: ["client/src/pages/vente/CentreAlertesRecherche.tsx", "server/routers/notifications.ts", "server/modules/search-alerts.ts", "server/engine-registry/perimetres.ts"],
    lecon: "Tester toute la chaîne recherche enregistrée → annonce correspondante → notification, l'isolation des utilisateurs, l'exclusion des brouillons et le rejeu. Tests isolés réussis ; pas d'envoi réel ni de correction déclarée des autres écrans encore en maquette.",
    domaine: "moteurs",
  },
  {
    cle: "branche-fix-platform-staff-motor",
    titre: "Capture Employés : création reliée à Identité et Permissions",
    moteurs: ["boutons", "identity", "permission"],
    quoi: "L'écran GestionEmployesMKAPMS lit admin.staffList et crée via admin.createStaff ; codes de boutons déclarés, erreurs et résultat serveur visibles, rôles réels distingués du poste. Adresse normalisée et doublon insensible à la casse.",
    pourquoi: "Le bouton Ajouter un employé appartenait à une maquette avec six personnes fictives et des droits non vérifiés.",
    ou: ["client/src/pages/superadmin/GestionEmployesMKAPMS.tsx", "server/routers/admin.ts", "server/routers/__tests__/staff-motor.test.ts"],
    lecon: "Réutiliser le moteur d'identité existant et tester les droits côté serveur. Test en base isolée : permissions, validation, création, hachage, lecture et doublon réussis ; build réussi. Aucun compte réel créé.",
    domaine: "moteurs",
  },
  {
    cle: "branche-fix-platform-screenshot-motors",
    titre: "Captures plateforme : suivi honnête, exécution Boutons, flotte et KYC",
    moteurs: ["boutons", "redirection", "smart", "location", "kyc"],
    quoi: "Archive les anciens relevés statiques sans faux OK ; attend le résultat métier, bloque les doubles clics et rend les erreurs visibles ; raccorde le devis flotte au parcours existant et la validation documentaire au moteur KYC avec décision transactionnelle.",
    pourquoi: "Les captures montrent des erreurs sous statut OK et des écrans maquettes sans service métier. Ce lot ne prétend pas résoudre les autres maquettes.",
    ou: ["docs/audits/2026-09-24-captures-plateforme.md", "server/button-engine", "server/smart-engine/services/health-monitor.ts", "server/modules/kyc-decision.ts"],
    lecon: "Un relevé absent n'est pas une preuve de réussite ; un clic n'est réussi qu'après le traitement attendu. Tests composant, base isolée et build réussis ; 39 diagnostics TypeScript préexistants subsistent. La liste explicite des écrans restants est conservée dans l'audit.",
    domaine: "moteurs",
  },
  {
    cle: "pr-282",
    titre: "Inventaire calculé des 88 moteurs + dépendances réellement branchées",
    moteurs: ["core", "engine_registry", "notification", "scheduler", "smart", "document", "country", "monitoring"],
    quoi:
      "Un générateur (scripts/gen-moteurs.mjs) calcule depuis le code, pour chaque moteur : dépendances prouvées, dépendants, boutons et emplacement, écrans, routes, événements, abonnements, tables, rôles, textes, et nomme chaque manque. Le registre expose `inventaire` et `inventaireMoteur`.",
    pourquoi:
      "La direction interroge le moteur, pas l'écran : un moteur doit savoir ce qu'il possède et signaler ce qu'il ne reconnaît pas.",
    ou: ["scripts/gen-moteurs.mjs", "server/data/moteurs.ts", "server/engine-registry/catalog.ts"],
    lecon:
      "Une dépendance déclarée au catalogue sans import, événement ou abonnement dans le code est une dépendance sans preuve : on la branche, on ne la retire pas.",
    domaine: "moteurs",
  },
  {
    cle: "branche-sonde-battement",
    titre: "Sonde de battement de cœur — cause racine : journal Drizzle incohérent",
    moteurs: ["core", "engine_registry", "smart", "intelligences", "event_bus", "notification"],
    quoi:
      "Les migrations 0039_notification_os_and_all_languages et 0040_document_os manquaient au journal Drizzle et 46 entrées avaient des horodatages en retard : `doc_documents` et des dizaines de tables n'existaient pas en production, les sondes disaient vrai. Journal rétabli, garde-fou `check:migrations` au build, échec de migration remonté au registre (Core hors service), au bus (`moteur.migration_echouee`), au Système Intelligent (alerte critique avec la cause), aux Intelligences (expérience) et à la direction (notification). `moteur.degrade` porte désormais la cause exacte.",
    pourquoi:
      "Des moteurs étaient dégradés ou hors service sans qu'aucun écran ni aucun build ne dise pourquoi ; forcer le vert aurait masqué des tables réellement absentes.",
    ou: [
      "drizzle/meta/_journal.json",
      "scripts/check-migrations.mjs",
      "server/engine-registry/bootstrap.ts",
      "server/engine-registry/service.ts",
      "server/event-bus/catalog.ts",
      "server/event-bus/handlers.ts",
      "server/index.ts",
    ],
    lecon:
      "Drizzle n'applique une migration que si son horodatage dépasse la dernière enregistrée en base. Un fichier SQL hors journal ou un horodatage en retard est invisible : vérifier le journal avant de soupçonner la sonde.",
    domaine: "moteurs",
  },
  {
    cle: "registre-dependances-catalogue",
    titre: "Registre des moteurs — dépendances réalignées sur le catalogue",
    moteurs: ["core", "engine_registry", "smart", "intelligences"],
    quoi:
      "En production, le Core était enregistré avec zéro dépendance et Smart avec cinq : le contrat (`contracts.ts`) et le pont OS (`os-bridge.ts`) réenregistraient chaque moteur avec leur propre liste, écrasant celle du catalogue de référence, et `ensureSeeded` ne réalignait jamais les lignes existantes. `registerEngine` réunit désormais catalogue + déclaration de l'appelant, et `ensureSeeded` réaligne les dépendances des moteurs déjà présents à chaque démarrage.",
    pourquoi:
      "Le centre de contrôle montrait un moteur central sans dépendant alors que 87 moteurs déclarent dépendre de lui ; trois sources de vérité pour la même donnée.",
    ou: ["server/engine-registry/service.ts", "server/engine-registry/catalog.ts"],
    lecon:
      "Une donnée du registre ne doit avoir qu'une source : le catalogue. Tout appelant qui réenregistre un moteur ne peut qu'ajouter, jamais réduire.",
    domaine: "moteurs",
  },
  {
    cle: "branche-migration-0074-reference-en-avance",
    titre: "43 moteurs dégradés après #283 — migration 0074 référençait une table créée en 0107",
    moteurs: ["core", "engine_registry", "avis_reputation", "intelligences", "smart", "event_bus"],
    quoi:
      "Le déploiement de #283 a bien franchi `doc_documents`, mais la série s'est arrêtée sur `relation \"reviews_v2\" does not exist` : 0074_avis_reputation_pays faisait des ALTER TABLE et CREATE INDEX sur `reviews_v2` et `review_requests` alors que ces tables ne sont créées qu'en 0107. Drizzle exécutant toute la série pendante dans une seule transaction, ce seul défaut annulait les 60 migrations suivantes (Intelligences, Event Bus, audit d'activation, Compte Pro, paiement, portail pro, atelier…) et laissait 43 moteurs sans leurs tables. 0074 est désormais conditionnel (`DO $$ IF to_regclass(...)`), 0107 crée les tables avec les colonnes et index attendus, et `check:migrations` refuse au build toute migration qui modifie une table qu'aucune migration précédente n'a créée. Rejoué sur une base neuve et sur une base à l'état exact de la production (47 migrations appliquées) : toutes les migrations du journal passent.",
    pourquoi:
      "La direction voyait toujours 43 moteurs jaunes après le déploiement ; la production tourne avec AUTO_MIGRATE_STRICT=false, donc le serveur démarre en mode secours et seul le journal de démarrage dit la cause.",
    ou: ["drizzle/0074_avis_reputation_pays.sql", "scripts/check-migrations.mjs"],
    lecon:
      "Une migration ne doit toucher que des tables créées avant elle ; lire la première ligne « échec migrations » du journal de démarrage à chaque déploiement, car une seule référence en avance fait échouer toute la série silencieusement en mode secours.",
    domaine: "moteurs",
  },
  {
    cle: "trois-moteurs-degrades-et-53-tables-sans-migration",
    titre: "Media, Livraison véhicule et Estimation dégradés ; 53 tables déclarées sans aucune migration (Core, Avis, Finance+)",
    moteurs: ["media", "livraison_vehicule", "estimation", "core", "avis_reputation", "finance", "engine_registry", "smart", "event_bus", "intelligences"],
    quoi:
      "Trois causes distinctes lues dans les sondes elles-mêmes. Media : la sonde décodait une image PNG en base64 corrompue (`vipspng: libpng read error`) — Sharp fonctionnait, c'était le fixture qui était faux ; la sonde fabrique désormais son image de test avec Sharp puis la convertit en WebP. Livraison véhicule : la table `vd_tarifs` était vide en production, donc aucun devis possible ; le moteur pose lui-même au démarrage (`initialiserBaremes`, idempotent) un barème interne mondial v1 de 156 lignes explicitement `verifie=false`, `origine=interne`, en EUR, et l'annonce par l'événement `livraison_vehicule.baremes_initialises` ; les devis restent « confirmation requise » tant que la direction n'a pas vérifié ou remplacé chaque ligne. Estimation : la santé confondait volume et panne (0 compatibilité pièce = dégradé) ; elle ne se dégrade plus que si des pièces actives existent sans aucune compatibilité déclarée, et nomme le marché vide comme manque. En parallèle, la comparaison schéma Drizzle ↔ migrations a révélé 53 tables déclarées dans le code sans aucune migration (29 du Core Engine, 17 des Avis dont `review_univers_registry` qui faisait échouer le seed à chaque démarrage, 6 Finance+, `pub_requests`) : migration 0109 générée depuis le schéma. Enfin, le centre de contrôle affiche maintenant les deux nombres du moteur central (a besoin de 5 / 87 moteurs en dépendent) et les boucles passant par le socle ne sont plus comptées comme anomalies critiques (153 fausses boucles).",
    pourquoi:
      "La direction voyait 3 moteurs jaunes et un moteur central « à 5 dépendants » : le tableau de bord montrait les dépendances amont sans le nombre de dépendants, et deux sondes disaient faux pour de mauvaises raisons.",
    ou: [
      "server/media-os/index.ts",
      "server/vehicle-delivery/service.ts",
      "server/estimation-hub/service.ts",
      "server/engine-registry/bootstrap.ts",
      "server/engine-registry/dependencies.ts",
      "drizzle/0109_tables_sans_migration.sql",
    ],
    lecon:
      "Une sonde de santé mesure une capacité, pas un volume : un marché vide n'est pas une panne, une table vide que le moteur peut remplir lui-même l'est. Et toute table `pgTable` déclarée doit avoir sa migration : comparer schéma et migrations avant chaque livraison, pas après l'échec du seed en production.",
    domaine: "moteurs",
  },
  {
    cle: "bouton-intelligences-barre-recherche-et-registre-de-conversation",
    titre: "Bouton MKA.P-MS Intelligences déplacé dans la barre de recherche (rond noir à côté du micro) ; l'assistant lit le registre du visiteur et rend l'honneur d'un remerciement",
    moteurs: ["intelligences", "boutons", "search", "redirection", "event_bus"],
    quoi:
      "Le bouton flottant « Intelligences » fixé en bas à droite se posait sur Compte / Messages ; il est retiré. L'assistant s'ouvre désormais depuis un bouton rond noir (h-8 w-8, étoile dorée) posé juste à côté du micro de dictée dans la barre de recherche universelle de l'accueil, à la place de l'étoile décorative qui n'ouvrait rien. Le bouton est déclaré au Moteur de boutons (`accueil_intelligences_ouvrir`, écran `/`, genre formulaire) et rendu par `BoutonMoteur` : chaque clic est tracé, et il stoppe la propagation pour ne pas déclencher la navigation de la barre. Le panneau (`AssistantFlottant`, monté dans le Layout) écoute le signal `ouvrirIntelligences` (`client/src/lib/assistantIntelligences.ts`). Côté moteur : avant chaque réponse publique, `lireRegistre` lit l'intention (remerciement, salutation, au revoir, compliment, excuse, question), le registre (soutenu, courtois, familier, pressé, agacé), le tutoiement et un salut « salam » ; une consigne de ton en est déduite et jointe à la consigne système. Une pure politesse reçoit sa réponse du moteur lui-même (`reponseCourtoisie`, fournisseur `moteur`) — l'honneur du remerciement est rendu, la salutation retournée dans la même forme — sans consommer le plafond journalier ni dépendre du fournisseur. La consigne publique fixe gagne une section « Tenue de conversation ».",
    pourquoi:
      "La direction demandait un bouton discret à côté du vocal, et un assistant qui répond correctement quand on lui dit merci et s'adapte à la façon dont on lui parle, au lieu d'un « de rien » sec ou d'un refus.",
    ou: [
      "client/src/components/BoutonIntelligences.tsx",
      "client/src/lib/assistantIntelligences.ts",
      "client/src/components/AssistantFlottant.tsx",
      "client/src/pages/Home.tsx",
      "server/button-engine/catalogue.ts",
      "server/intelligences/registre.ts",
      "server/intelligences/service.ts",
      "server/intelligences/regles.ts",
    ],
    lecon:
      "Une icône qui ressemble à un bouton doit être un bouton connu du Moteur de boutons, sinon c'est un cliquable mort. Et la politesse fait partie du service : le moteur la lit et y répond lui-même, le fournisseur n'est appelé que pour une vraie question.",
    domaine: "intelligences",
  },
  {
    cle: "livraison-vehicules-camions-visible-et-branchee-politique-pays",
    titre: "Livraison de véhicules et camions rendue visible depuis l'accueil, Livraison et Location ; le moteur consulte la politique du pays d'arrivée avant tout devis et toute acceptation",
    moteurs: ["livraison_vehicule", "politique_pays", "boutons", "redirection", "event_bus", "smart", "livraison", "location"],
    quoi:
      "Lecture du moteur d'abord : `livraison_vehicule` avait ses routes (/louer/livraison), ses 9 procédures et ses 5 tables, mais aucun bouton déclaré au Moteur de boutons, une dépendance `politique_pays` déclarée sans preuve, et la clé de redirection `service_livraison_vehicule` pointait vers /vente/livraison — un écran vitrine à prix en dur (350 €, 400 €…) sans aucun appel au moteur. L'accueil ne pointait que vers /livraison (colis). Corrigé à la source : route canonique /livraison-vehicule (alias /louer/livraison et /vente/livraison servent le vrai écran du moteur, la vitrine LivraisonVente est supprimée) ; 9 actions déclarées au catalogue des boutons (entrées depuis /, /livraison, /louer ; onglets, choix du mode, acceptation, connexion, retour) et l'écran passe par BoutonMoteur ; clé `service_livraison_vehicule` → /livraison-vehicule + clé bouton connexion ; tuiles « Livraison véhicules » ajoutées à l'accueil (vidéos, méga-menus, services), carte « Livraison de véhicules & camions » dans Location, encart dans Livraison colis. Le devis expose `reglementation` (autorisé / conditionné / interdit / inconnu / sans objet) lue dans les règles confirmées d'importation du pays d'arrivée ; l'acceptation transfrontalière passe par `evaluateAction` : « bloque » refuse la création, « validation_requise » crée l'expédition au statut `validation_requise` et publie `livraison_vehicule.validation_requise` (alerte de direction Smart).",
    pourquoi:
      "La direction constatait que la livraison des véhicules et camions n'était pas visible dans la plateforme alors que le moteur existait : la panne était dans les branchements (boutons, redirection, entrée d'accueil), pas dans le moteur métier.",
    ou: [
      "server/vehicle-delivery/service.ts",
      "server/button-engine/catalogue.ts",
      "server/redirection-engine/catalog.ts",
      "server/event-bus/catalog.ts",
      "server/event-bus/handlers.ts",
      "client/src/pages/LivraisonVehicule.tsx",
      "client/src/pages/Home.tsx",
      "client/src/pages/Louer.tsx",
      "client/src/pages/Livraison.tsx",
      "client/src/App.tsx",
    ],
    lecon:
      "Un service invisible n'est presque jamais un moteur absent : c'est un moteur sans bouton déclaré et sans clé de redirection vers lui. Vérifier dans l'inventaire du moteur « boutons = 0 » avant de toucher un écran ; et une dépendance déclarée sans preuve doit être branchée (ici la politique pays lue au devis et évaluée à l'acceptation), pas retirée.",
    domaine: "livraison_vehicule",
  },
  {
    cle: "identite-direction-protegee-partout",
    titre: "Identité personnelle du PDG retirée de tous les écrans et masquée par le serveur ; garde-fou au build",
    moteurs: ["identity_os", "annonces", "avis", "messagerie", "compte_pro", "inscription"],
    quoi:
      "Les formulaires d'inscription pro et particulier présentaient le prénom, le nom et l'adresse e-mail du PDG comme valeurs d'exemple ; plusieurs tableaux de démonstration (journal d'activité, comptabilité dirigeant, centre de pilotage, publicité) affichaient son nom. Tout est remplacé par des libellés neutres (« Votre prénom », « Votre nom », « votre@email.com », « Direction (PDG) »). Côté moteur : Identity OS expose `IDENTITE_OFFICIELLE` (marque + numéro officiel de la société) et `estDirection(role)` ; le détail public d'une annonce, les avis publics (v1 et v2) et la fiche interlocuteur de la messagerie renvoient la marque et le numéro officiel à la place du nom et du téléphone personnels dès que le compte est admin ou super_admin. Le contrôle `check:identite` casse le build si un motif d'identité de la direction réapparaît dans client, server, shared ou scripts.",
    pourquoi:
      "Alerte maximale de la direction : son identité exacte apparaissait dans l'inscription pro, et rien dans la plateforme n'empêchait qu'elle sorte par une procédure publique.",
    ou: [
      "server/identity-os/identite-officielle.ts",
      "server/routers/annonces.ts",
      "server/routers/reviews.ts",
      "server/routers/reviewsV2.ts",
      "server/routers/messages.ts",
      "client/src/pages/InscriptionProVente.tsx",
      "client/src/pages/InscriptionParticulier.tsx",
      "client/src/pages/JournalActivite.tsx",
      "client/src/pages/ComptaDirigeant.tsx",
      "client/src/pages/comptabilite/CentrePilotage.tsx",
      "scripts/check-identite.mjs",
    ],
    lecon:
      "Aucune donnée personnelle réelle ne sert d'exemple de saisie ni de donnée de démonstration : un placeholder décrit le champ, il ne le remplit pas. L'identité de la direction appartient à Identity OS ; ce que le public voit d'un compte de direction est la marque, décidé par le serveur (rôle), jamais par l'écran. Le garde-fou est au build, pas dans la vigilance d'un agent.",
    domaine: "identite",
  },
  {
    cle: "branche-stabilisation-moteurs-cycles",
    titre: "Distinction dépendance métier / intégration technique dans le détecteur de cycles",
    moteurs: ["core", "engine_registry", "identity", "audit", "smart", "ai_learning", "visibility", "permission", "country", "comptabilite", "accounting_internal"],
    quoi:
      "Trois corrections liées au registre de dépendances. (1) comptabilite déclarait accounting_internal sans aucune preuve d'usage dans le code (dependance_sans_preuve) alors que la relation réelle est l'inverse (accounting_internal importe comptabilite, avec preuve) : déclaration non prouvée retirée. (2) Le détecteur de cycles (server/engine-registry/dependencies.ts) exemptait tout core.dependencies en bloc (« le socle démarre en premier ») pour éviter 150+ fausses boucles — exception globale exactement du type que la direction a demandé de ne pas garder. Remplacé par un mécanisme précis à deux niveaux dans server/engine-registry/technical-integrations.ts : (a) une classification AUTOMATIQUE, calculée par scripts/gen-moteurs.mjs (nouveau champ integrationsTechniques par moteur) — toute dépendance déclarée dont TOUTES les preuves détectées ne sont qu'une vérification de session/rôle (procédure protégée, filtre de rôle), une écriture d'audit, ou un import du contrat public d'un OS (identity-os/contract.ts) ; (b) une liste résiduelle vérifiée à la main pour les cas qu'un motif générique ne peut pas capturer (core -> smart/ai_learning/visibility/audit, preuves par import direct de fichiers de lecture de statut). dependencyGraph() expose dependsOn (tout, pour l'impact en cascade réel) et dependsOnMetier (sous-ensemble métier, seul utilisé par findCycles).",
    pourquoi:
      "La direction a demandé de séparer explicitement dépendance métier et intégration technique transversale (identité/session, audit, monitoring/télémétrie, sécurité), avec un contrat/port neutre par intégration technique plutôt qu'un import direct comptant comme dépendance de premier rang, et de ne jamais garder un cycle comme exception globale non justifiée.",
    ou: [
      "server/engine-registry/technical-integrations.ts",
      "server/engine-registry/dependencies.ts",
      "scripts/gen-moteurs.mjs",
      "server/engine-registry/catalog.ts",
      "server/data/moteurs.ts",
    ],
    lecon:
      "Corriger core seul ne suffit pas à vider un cycle géant, et une classification manuelle par moteur ne passe pas à l'échelle sur 88 moteurs. Mesuré sur le graphe déclaré réel : la composante fortement connexe brute fait 55 moteurs ; exempter les 5 dépendances techniques de core ne la fait retomber qu'à 53 (seuls core et ai_learning en sortent) ; généraliser la même preuve (session/rôle/audit/contrat) à TOUTES les paires — pas seulement celles de core — la fait retomber à 42, et résout exactement l'exemple cité par la direction (identity → country → identity : country -> identity n'était qu'une vérification de session, jamais une dépendance métier). Il reste une composante de 42 moteurs, un cycle à 5 (country, language, notification, scheduler, workflow) et un cycle à 2 (pro_account, pro_portal, réellement bidirectionnel — nécessite un contrat de domaine Pro partagé, pas un retrait de dépendance). Chaque cycle restant doit être vérifié un par un, avec preuve d'usage dans les deux sens, avant de décider s'il est réellement bidirectionnel (contrat neutre nécessaire) ou juste une déclaration non prouvée (à retirer, comme comptabilite↔accounting_internal).",
    domaine: "moteurs",
  },
  {
    cle: "branche-stabilisation-moteurs-cycle-country",
    titre: "Cycle country -> workflow -> notification -> language -> country : platformMap mal rattaché",
    moteurs: ["country", "workflow", "notification", "language", "scheduler"],
    quoi:
      "Le routeur platformMap (carte des sites géolocalisés : lavage, karting, sites) n'a jamais eu de rapport fonctionnel avec workflow (gouvernance/RH/procurement/investisseurs) : il vivait dans workflow.routeurs uniquement parce qu'il partage le fichier server/routers/operations.ts avec les vrais routeurs de workflow. Or c'est CarteMondiale.tsx — l'écran de country (/carte) — qui l'appelle (trpc.platformMap). Cette proximité de fichier créait une fausse dépendance country -> workflow, qui refermait le cycle country -> workflow -> notification -> language -> country (chaque autre arête de ce cycle est une vraie dépendance métier prouvée : language lit la règle pays, notification traduit dans la langue de l'utilisateur, workflow déclenche notifyEvent). Corrigé en deux temps : (1) server/engine-registry/perimetres.ts déclare maintenant platformMap sous country, pas workflow — aucun fichier déplacé, aucun import changé, seule l'attribution du routeur dans le registre change ; (2) une fois cette preuve disparue, catalog.ts déclarait encore country -> workflow sans plus aucune preuve : dépendance retirée.",
    pourquoi:
      "Lot suivant demandé par la direction sur le cycle country/language/notification/scheduler/workflow, en cherchant la cause la plus directe avant de toucher aux autres arêtes (toutes prouvées métier, donc conservées).",
    ou: [
      "server/engine-registry/perimetres.ts",
      "server/engine-registry/catalog.ts",
      "server/data/moteurs.ts",
    ],
    lecon:
      "Une dépendance entre deux moteurs peut être un pur artefact d'attribution de fichier plutôt qu'un vrai couplage métier ou technique : deux routeurs tRPC qui n'ont rien à voir peuvent partager un fichier serveur pour des raisons historiques, et le générateur attribue alors le routeur au moteur propriétaire du fichier, pas à celui qui l'utilise réellement. Avant de qualifier une arête de « métier » ou « technique », vérifier d'abord si le routeur cible est correctement rattaché : ici, corriger l'attribution (perimetres.ts) a suffi à faire disparaître la fausse dépendance sans toucher à un seul import. workflow -> scheduler reste déclaré sans aucune preuve dans le code, mais workflow est explicitement « à créer (Phase 2) » dans catalog.ts : contrairement à comptabilite -> accounting_internal (moteur actif), ce n'est pas retiré ici — possible déclaration d'intention pour un moteur pas encore construit, pas une incohérence avérée.",
    domaine: "moteurs",
  },
  {
    cle: "branche-stabilisation-moteurs-pro-contract",
    titre: "pro_account <-> pro_portal : contrat neutre au lieu d'un import direct, cycle non forcé",
    moteurs: ["pro_account", "pro_portal"],
    quoi:
      "Vérifié preuve par preuve dans les deux sens, contrairement aux deux cycles précédents (comptabilite<->accounting_internal, country<->workflow) : ici les DEUX arêtes sont des besoins métier réels. pro_account -> pro_portal : pro-account/service.ts appelle requirementsFor() pour savoir quels justificatifs réunir pour un métier+pays donnés — une vraie donnée de catalogue que possède le portail (table proPortalProfessions). pro_portal -> pro_account : l'écran DossierPro.tsx (route /pro/dossier, dans le périmètre de pro_portal) appelle trpc.proAccount.{mine,requirements,check,save,submit} pour que l'utilisateur remplisse et soumette son dossier — l'écran orchestre, mais l'état et la soumission appartiennent à pro_account. Créé server/pro-portal/contract.ts (même doctrine que identity-os/contract.ts et permission-engine/contract.ts : seule porte d'entrée autorisée pour un moteur voisin) qui réexporte uniquement requirementsFor. pro-account/service.ts importe maintenant ce contrat au lieu de service.ts en entier (qui expose aussi panier/paiement/composition d'offre, hors sujet pour pro_account).",
    pourquoi:
      "La direction a demandé de casser ce cycle par une couche contractuelle neutre, pas en supprimant un appel fonctionnel, et de vérifier d'abord qu'une abstraction équivalente n'existe pas déjà (vérifié : aucun contract.ts sous pro-portal avant ce lot).",
    ou: ["server/pro-portal/contract.ts", "server/pro-account/service.ts", "server/data/moteurs.ts"],
    lecon:
      "Un contrat neutre nettoie l'import (pro_account ne dépend plus que d'une surface minimale documentée, pas de l'implémentation entière du panier/paiement de pro_portal) mais NE FAIT PAS disparaître le cycle dans le graphe : les deux dépendances restent réelles et prouvées dans les deux sens, donc classées métier — à juste titre. Le registre lui-même documente déjà cette philosophie (dependencies.ts : « une boucle ne bloque pas le démarrage, elle signale une coopération mutuelle à surveiller »). Forcer ce cycle à zéro aurait exigé de supprimer un appel fonctionnel réel des deux côtés, ce que la direction a explicitement interdit. Décision proposée à la direction plutôt qu'appliquée seul : documenter ce cycle comme coopération mutuelle acceptée (un mécanisme à ajouter au registre, distinct des dépendances non prouvées et des intégrations techniques) au lieu de le compter comme une anomalie à corriger.",
    domaine: "moteurs",
  },
  {
    cle: "branche-stabilisation-moteurs-mesh-ia",
    titre: "smart <- event_bus/monitoring/intelligences/ai_fabric : alertes et télémétrie, pas de la logique métier",
    moteurs: ["smart", "monitoring", "event_bus", "intelligences", "ai_fabric"],
    quoi:
      "Vérifié ligne à ligne les 4 arêtes entrant sur smart depuis le maillage observabilité / Intelligences : event_bus (raiseAlert + table smartAlerts via smart-engine/services/alert-engine.ts), monitoring (getPlatformHealth en lecture + écriture d'alerte), intelligences (écriture d'alerte + preuve d'émission d'événement — c'est Smart qui dépend de l'événement d'Intelligences, pas l'inverse), ai_fabric (logActivity, écriture de télémétrie pure, + smartActionTasks). Aucune des quatre ne lit de décision ou de logique métier de Smart : ce sont des écritures d'alerte/télémétrie à sens unique. Généralisé le motif « ouvre une alerte du Système Intelligent » (raiseAlert/smartAlerts) dans scripts/gen-moteurs.mjs comme intégration technique automatique — sans exception, ce motif ne se déclenche que pour ce signal précis. Ajouté les 3 cas résiduels (platform-health, alert-engine.ts, activity-log.ts — imports non couverts par un motif générique) dans technical-integrations.ts.",
    pourquoi:
      "Suite demandée de la stabilisation du cycle géant à 42 moteurs, en commençant par le sous-groupe lié à MKA.P-MS Intelligences (event_bus, intelligences, ai_fabric, smart, monitoring) que la direction a signalé vouloir examiner en même temps que les problèmes d'accès aux services externes connectés.",
    ou: ["scripts/gen-moteurs.mjs", "server/engine-registry/technical-integrations.ts", "server/data/moteurs.ts"],
    lecon:
      "Résultat mesuré, honnête : la composante fortement connexe à 42 moteurs NE RÉTRÉCIT PAS après ce lot. smart reste dans la même composante parce que d'autres moteurs du groupe des 42 (hors de ce lot — seo, garage, achat, etc., déjà repérés dans l'inventaire initial) dépendent aussi de smart pour des raisons encore à vérifier, et smart lui-même dépend légitimement de event_bus et monitoring (consomme moteur.degrade/retabli — c'est sa raison d'être, pas une intégration technique). Une classification correcte n'implique pas toujours une baisse du chiffre agrégé : chaque arête retirée est individuellement vraie et vérifiée, mais smart reste un point de passage central tant que ses autres dépendants (hors de ce lot) n'ont pas été vérifiés un par un. event_bus -> intelligences (memoire.ts : ecrire/retenir, service.ts : proposer) N'A PAS été reclassé : c'est le mécanisme réel d'apprentissage de MKA.P-MS Intelligence, une dépendance métier légitime et importante, pas une intégration technique à écarter.",
    domaine: "moteurs",
  },
  {
    cle: "branche-diagnostic-apis-externes",
    titre: "Diagnostic des intégrations externes signalées en panne : MKA.P-MS Intelligences, Google Search Console, Google Merchant",
    moteurs: ["intelligences", "ai_fabric", "seo", "product_engine"],
    quoi:
      "Diagnostic demandé par la direction (« les API connectées ne fonctionnent pas »), sans accès à la base de données ni aux journaux d'exécution en production depuis cet environnement. Deux constats distincts, tous deux vérifiés sans jamais lire une valeur de secret : (1) la liste des NOMS de variables d'environnement réellement configurées sur le service Railway de production ne contient les clés d'aucun des deux fournisseurs de repli déclarés dans la couche fournisseur (aucun repli de modèle configuré — un seul fournisseur est disponible), ni la clé Google Search Console (server/seo-dashboard.ts calcule connected = !!env.GOOGLE_SEARCH_CONSOLE_KEY : sans elle, le tableau de bord SEO affiche « Google Search Console non connecté » par conception, ce n'est pas un bug), ni les identifiants Google Client, Google Maps ou Google Merchant (product_engine, service.ts ligne 73). (2) Un vrai défaut de code corrigé : server/intelligences/provider.ts déclarait un nom de modèle qui n'a jamais existé chez son fournisseur — présent depuis le premier commit du fichier (33ca622), jamais corrigé. Sans effet tant que la découverte dynamique du modèle (appel à /v1/models) réussit, mais un appel voué à l'échec garanti dès qu'elle échoue (réseau, clé sans droit de listage). Remplacé par un identifiant de modèle réel et stable.",
    pourquoi:
      "La direction a demandé de vérifier en même temps que la stabilisation des cycles pourquoi les API connectées (MKA.P-MS Intelligences, Google, SEO) ne fonctionnent pas.",
    ou: ["server/intelligences/provider.ts"],
    lecon:
      "Deux causes de nature différente à ne pas confondre : un vrai bug de code (nom de modèle fictif, corrigé) et une absence de configuration en production (clés Google/Anthropic/Mistral non fournies à Railway, hors de portée d'un agent qui n'a pas mandat pour écrire des secrets). Le second point n'est pas « corrigé » par ce lot — seulement diagnostiqué et remonté à la direction, qui gère les secrets Railway. Vérifié sans jamais lire ni écrire de valeur de secret : uniquement la liste des noms de variables présentes.",
    domaine: "intelligences",
  },
  {
    cle: "branche-stabilisation-moteurs-seo-orphelines",
    titre: "5 dépendances vers seo déclarées sans aucune preuve, dont 2 fausses inverses",
    moteurs: ["garage", "indexation", "pieces", "product_engine", "visibility", "seo"],
    quoi:
      "garage, indexation, pieces, product_engine et visibility déclaraient tous une dépendance vers seo sans la moindre preuve d'usage dans le code (dependance_sans_preuve). Vérifié dans les deux sens pour chacun : garage -> seo était l'inverse de la vraie relation (seo -> garage est prouvé : GaragePublicFiche.tsx appelle trpc.garages) ; indexation -> seo pareil (seo -> indexation est prouvé : seo-hooks.ts importe indexation/service.ts). pieces -> seo, product_engine -> seo et visibility -> seo n'ont aucune contrepartie prouvée dans l'autre sens non plus : déclarations orphelines, sans lien réel constaté dans le code actuel. Les 5 retirées de catalog.ts.",
    pourquoi:
      "Suite de la stabilisation des 88 moteurs, en cherchant d'autres dependance_sans_preuve dans la composante à 42 moteurs après le succès de la même méthode sur comptabilite<->accounting_internal.",
    ou: ["server/engine-registry/catalog.ts", "server/data/moteurs.ts"],
    lecon:
      "Le même schéma qu'un lot précédent (comptabilite <-> accounting_internal) se reproduit à plus grande échelle : cinq déclarations orphelines ou inversées d'un coup vers le même moteur cible (seo), sans doute ajoutées ensemble sans vérification individuelle. Chercher systématiquement dependance_sans_preuve avant de chercher des cycles complexes : c'est le signal le plus fiable et le moins ambigu — soit la preuve existe dans l'autre sens (déclaration inversée à corriger), soit elle n'existe nulle part (déclaration orpheline à retirer), jamais un vrai choix d'architecture à trancher. N'a pas fait bouger la taille de la composante à 42 moteurs (garage, indexation, pieces, product_engine, visibility y restent reliés par d'autres arêtes bien réelles) : la métrique agrégée n'est pas le bon indicateur pour juger un lot précis.",
    domaine: "moteurs",
  },
  {
    cle: "branche-stabilisation-moteurs-politique-pays-smart-audit",
    titre: "politique_pays -> smart et smart -> smart_audit : deux dépendances inversées corrigées, le reste du grand chantier n'est PAS traité",
    moteurs: ["politique_pays", "smart", "smart_audit"],
    quoi:
      "Deux dépendances déclarées sans preuve, toutes deux inversées (même schéma que seo) : politique_pays -> smart n'a aucune preuve, alors que smart -> politique_pays est prouvé (smart-engine/services/action-tasks.ts importe country-policy/service.ts). smart -> smart_audit n'a aucune preuve, alors que smart_audit -> smart est prouvé (smart-audit/service.ts importe 3 services de smart-engine). Les deux corrigées dans catalog.ts. Résultat mesuré : la composante fortement connexe passe de 42 à 41 moteurs (politique_pays en sort).",
    pourquoi:
      "Recherche systématique de dependance_sans_preuve dans tout le registre (pas seulement la composante à 42), pour continuer à finir ce qui peut l'être avant la phase de construction réelle demandée par la direction.",
    ou: ["server/engine-registry/catalog.ts", "server/data/moteurs.ts"],
    lecon:
      "IMPORTANT — décision délibérée de ne PAS traiter le reste de la liste dependance_sans_preuve (une cinquantaine d'entrées restantes, sur des moteurs comme finance, controle_technique, encheres, location, vente, knowledge…). Vérifié : ces moteurs n'ont presque aucun fichier serveur réel (0 à 4 fichiers, plusieurs marqués sans_logique_serveur — finance n'a qu'un seul fichier, controle_technique aucun). Leurs dépendances déclarées sans preuve ne sont pas des erreurs comme comptabilite<->accounting_internal ou seo : ce sont des intentions d'architecture pour des moteurs pas encore construits. Les retirer effacerait à tort ce qu'ils devront réellement utiliser une fois développés — c'est exactement le travail de « construction et développement réel de chaque moteur » que la direction a explicitement mis dans la phase suivante, pas dans la stabilisation en cours. Règle à retenir : dependance_sans_preuve n'est un signal fiable de correction immédiate QUE lorsque le moteur source a une vraie implémentation serveur (plusieurs fichiers, d'autres dépendances prouvées) ; sur un moteur-écran ou un stub, c'est un manque de construction, pas un défaut de registre.",
    domaine: "moteurs",
  },
  {
    cle: "branche-stabilisation-moteurs-vente-connexions-manquantes",
    titre: "vente utilise réellement livraison_vehicule et boutons sans les déclarer",
    moteurs: ["vente", "livraison_vehicule", "boutons"],
    quoi:
      "Priorisé ce lot plutôt que product_engine/repli de modèle (cité en exemple par la direction) après un balayage de tout le registre : dependance_non_declaree (une dépendance détectée dans le code mais absente de catalog.ts — le sens inverse des lots précédents) signale un vrai défaut de connexion, plus structurel qu'une clé externe déjà diagnostiquée. client/src/pages/LivraisonVehicule.tsx est monté sous 3 routes : /louer/livraison (livraison_vehicule, déjà déclaré), /livraison-vehicule (orpheline, aucun moteur), et /vente/livraison — cette dernière capturée par la route générique /vente/* de vente. Le même écran y appelle réellement trpc.livraisonVehicule.{catalogue,devis,mesExpeditions,accepter} et utilise BoutonMoteur partout (composant du moteur boutons). vente ne déclarait ni l'un ni l'autre. Ajoutés dans catalog.ts : preuve de code directe (imports et appels réels), aucune invention.",
    pourquoi:
      "Après avoir mergé les lots sur les cycles, balayage demandé pour trouver le risque structurel le plus important avant de traiter l'exemple product_engine/repli de modèle cité par la direction — trouvé un défaut de connexion réel (registre incomplet, pas juste une clé absente) plus prioritaire.",
    ou: ["server/engine-registry/catalog.ts", "server/data/moteurs.ts"],
    lecon:
      "dependance_non_declaree est le signal miroir de dependance_sans_preuve : au lieu d'une fausse déclaration à retirer, c'est un vrai usage à déclarer. Les deux méritent le même balayage systématique. Reste ouvert, non traité dans ce lot pour respecter la limite de 1-2 moteurs : achat -> identity, avis_reputation -> identity (routers/annonces.ts et routers/reviews.ts importent identity-os/identite-officielle.ts), livraison -> boutons, livraison_vehicule -> boutons — 4 dépendances du même type, prouvées, à ajouter dans un prochain lot. Noté aussi : /livraison-vehicule reste une route sans moteur (le même écran, mais une 3e route, ni sous vente ni sous livraison_vehicule) — à vérifier si c'est voulu ou un doublon de route à nettoyer.",
    domaine: "moteurs",
  },
  {
    cle: "branche-stabilisation-moteurs-achat-avis-identity",
    titre: "achat et avis_reputation utilisent réellement identity sans le déclarer",
    moteurs: ["achat", "avis_reputation", "identity"],
    quoi:
      "Suite du lot précédent sur les dependance_non_declaree. routers/annonces.ts (achat) et routers/reviews.ts (avis_reputation) importent tous les deux IDENTITE_OFFICIELLE et estDirection depuis identity-os/identite-officielle.ts — le garde-fou qui masque l'identité personnelle de la direction sur les écrans publics (annonces, avis). Ni achat ni avis_reputation ne déclaraient identity. Ajouté dans catalog.ts pour les deux, preuve de code directe.",
    pourquoi:
      "Poursuite du balayage dependance_non_declaree commencé au lot précédent (vente), maximum 2 moteurs par lot.",
    ou: ["server/engine-registry/catalog.ts", "server/data/moteurs.ts"],
    lecon:
      "Même famille de manque que vente/livraison_vehicule : un garde-fou transversal (ici la protection de l'identité de la direction) peut être utilisé par n'importe quel écran public sans que le moteur propriétaire de cet écran ait pensé à déclarer identity. Reste ouvert pour le prochain lot : livraison -> boutons, livraison_vehicule -> boutons, et la route orpheline /livraison-vehicule.",
    domaine: "moteurs",
  },
  {
    cle: "branche-smart-engine-carte-a-valider-mal-reliee",
    titre: "Carte « À valider » du Centre de contrôle reliée au mauvais onglet, sans action de validation nulle part",
    moteurs: ["smart"],
    quoi:
      "Signalé par la direction sur la plateforme réelle : la carte « À valider » (289 alertes, 252+ en croissance) mène à un onglet qui affiche toujours « Aucune donnée à valider ». Cause trouvée : la carte compte activityStats.needsValidation (server/smart-engine/services/activity-log.ts — lignes de smartActivityLog où humanValidation est nul et proposedDecision existe, des décisions proposées par le système en attente d'approbation), mais son clic ouvrait l'onglet « Validations » qui interroge trpc.smartEngine.pendingValidations — une table totalement différente (smartLearnedData, des valeurs de véhicule proposées par les utilisateurs au dépôt d'annonce), vide en ce moment. Pire : la mutation validateActivityDecision qui valide réellement une décision du journal d'activité existait déjà côté serveur (server/smart-engine/router.ts) mais n'était appelée par aucun écran — impossible de valider quoi que ce soit, même en trouvant le bon onglet.",
    pourquoi:
      "Bouton relié au mauvais endroit et fonctionnalité serveur existante mais jamais câblée à un écran — exactement les deux catégories de défaut que la phase de stabilisation en cours doit éliminer (« mal connecté → reconnecte-le », « existe mais incomplet → complète-le »).",
    ou: [
      "client/src/pages/SmartEngine/ControlCenter.tsx",
      "server/smart-engine/router.ts",
      "server/smart-engine/services/activity-log.ts",
    ],
    lecon:
      "La carte pointe maintenant vers l'onglet Journal (déjà alimenté par la bonne table, smartActivityLog), et ce même onglet affiche désormais Valider/Refuser sur chaque entrée qui a une proposedDecision non encore tranchée, appelant la mutation validateActivityDecision déjà prête côté serveur. L'onglet Validations (smartLearnedData) n'a pas été supprimé : c'est une fonctionnalité réelle et distincte (confirmation de données véhicule saisies par les utilisateurs), juste mal raccordée à cette carte précise. Un chiffre qui grandit sur un tableau de bord (« 24 », « 252 » puis « 300 et quelques ») sans qu'aucun écran ne permette d'agir dessus est un signal fiable de connexion cassée, pas de fonctionnalité manquante à construire — la logique serveur existait déjà des deux côtés.",
    domaine: "moteurs",
  },
  {
    cle: "branche-activation-audit-matchrouter-perimetres",
    titre: "24 moteurs « Existe mais non connectée » : 13 avaient déjà un vrai routeur, mal détecté",
    moteurs: ["boutons", "workflow", "analytics", "achat", "location", "assurance", "energie_recharge", "avis_reputation", "connecteur_google_business", "connaissance_auto", "politique_pays", "journey"],
    quoi:
      "Remonté par la direction avec captures d'écran du Centre de contrôle : l'audit d'activation (point 91, server/activation-audit/) affichait 24 moteurs « Existe mais non connectée — aucune procédure tRPC ne l'expose ». Cause trouvée : matchRouter() dans service.ts devine le routeur d'un moteur par ressemblance de texte (« sans table de correspondance figée », commentaire d'origine), alors que server/engine-registry/perimetres.ts déclare déjà, moteur par moteur, la liste exacte des routeurs qui lui appartiennent — la même source que gen-moteurs.mjs utilise pour tout le reste du registre. Beaucoup de moteurs ont un nom français porté par un routeur au nom anglais que la ressemblance de texte ne peut pas deviner : avis_reputation -> reputationEngine/reviews, energie_recharge -> chargingEngine, politique_pays -> countryPolicy, connecteur_google_business -> googleBusiness, journey -> customerJourneyOs, achat -> annonces/favoris/reservations/devis, location -> lavage/karting, boutons -> buttonEngine, assurance -> insuranceEngine, connaissance_auto -> knowledgeEngine, analytics -> historique, workflow -> governance/platform/quality/hr/procurement/investor. Ces 12 moteurs avaient un vrai routeur monté et appelable ; l'audit se trompait, pas le code métier.",
    pourquoi:
      "Priorité immédiate demandée par la direction sur les 24 moteurs « non connectée » vus en production, avant toute autre tâche.",
    ou: ["server/activation-audit/service.ts"],
    lecon:
      "matchRouter() consulte maintenant en premier les routeurs déclarés dans server/data/moteurs.ts (généré depuis perimetres.ts), et ne retombe sur la ressemblance de texte qu'en repli pour un moteur pas encore déclaré. Vérifié statiquement (introspection réelle de appRouter, aucune base de données requise) : 24 -> 11 candidats sans routeur trouvé. IMPORTANT, honnêteté sur la limite : cette vérification ne couvre que la sous-cause « aucun routeur trouvé ». non_connectee peut aussi venir de engine.missingDependencies (dépendances du registre vivant, calculées en base) — donnée que je ne peux pas lire depuis cet environnement (accès PostgreSQL direct bloqué). Les 12 corrigés ici devraient repasser verts au prochain audit SI leurs dépendances vivantes sont par ailleurs saines ; à confirmer après déploiement, pas garanti à 100% depuis ici. Les 11 restants (vente, achat_officiel/pro/particulier, vente_pro/particulier, location_pro/particulier, controle_technique, finance, encheres) n'ont réellement aucun routeur : ce sont des moteurs-écran sans logique serveur, confirmé dans un lot précédent — ils ont besoin d'une vraie construction (phase suivante), pas d'une reconnexion.",
    domaine: "moteurs",
  },
  {
    cle: "branche-activation-audit-matchroutes-perimetres",
    titre: "Critère « Accessible » : 32 moteurs supplémentaires avaient déjà une route déclarée, mal détectée",
    moteurs: ["activation_audit"],
    quoi:
      "Même défaut que matchRouter (lot précédent), sur matchRoutes() cette fois : il devine les routes visiteur d'un moteur en comparant son nom au premier segment d'URL (« acheter », « garages »…), alors que server/data/moteurs.ts (généré depuis perimetres.ts) déclare déjà, moteur par moteur, la liste exacte de ses routes. Vérifié statiquement : 40 des 88 moteurs échouaient le critère « accessible » avec l'ancienne méthode ; 32 d'entre eux ont en réalité une route déclarée que la comparaison de segment ne pouvait pas deviner (account_routing, visibility, payment, search, monitoring, analytics, event_bus, scheduler, journey, achat_officiel/pro/particulier, location_pro/particulier, energie_recharge, politique_pays, et 16 autres).",
    pourquoi:
      "Suite directe de la demande de la direction sur les moteurs mal connectés, en vérifiant si le même défaut touchait aussi le critère Accessible.",
    ou: ["server/activation-audit/service.ts"],
    lecon:
      "matchRoutes() consulte maintenant en premier les routes déclarées dans server/data/moteurs.ts, comme matchRouter(). Il reste 8 moteurs sans route déclarée du tout après ce correctif (media_authenticity, boutons, payment_orchestrator, financial_intelligence, connecteur_google_business, media, ai_learning, risque_import) : ce n'est probablement pas un défaut à corriger pour la plupart — ce sont des moteurs transversaux consommés par d'autres écrans (ex. boutons, un composant partagé) plutôt que des univers avec leur propre page. À vérifier au cas par cas, pas à connecter de force. Deux défauts du même type trouvés coup sur coup (matchRouter puis matchRoutes) suggèrent de relire tout le reste de server/activation-audit/ (accessible, testé, utilisé, Système Intelligent) avec la même question : cet audit réinvente-t-il une correspondance que le registre connaît déjà ailleurs ?",
    domaine: "moteurs",
  },
  {
    cle: "branche-ensureSeeded-realignement-reel",
    titre: "ensureSeeded() n'effaçait jamais une dépendance retirée du catalogue — corrigé",
    moteurs: ["core", "engine_registry"],
    quoi:
      "Autorisé explicitement par la direction (sujet dépendants, pas un test de moteur, priorité immédiate). server/engine-registry/service.ts, ensureSeeded() calculait wanted = resolveDependencies(e.name, current) = UNION(catalog.dependencies, ce qui est déjà en base) au lieu de réaligner sur le catalogue seul. Conséquence : une dépendance retirée de catalog.ts ne pouvait plus jamais être effacée de la base vivante une fois seedée — chaque correctif de cycle de cette session (comptabilite<->accounting_internal, les 5 vers seo, politique_pays<->smart_audit, country<->workflow) est correct dans le code et dans server/data/moteurs.ts, mais restait potentiellement invisible dans le registre réellement lu par server/engine-registry/dependencies.ts (dependencyGraph, findCycles, requiredBy) en production, puisque la base ne se nettoie jamais toute seule. Corrigé : wanted = resolveDependencies(e.name, undefined) = catalogue seul, comme le documente déjà la fonction (« réaligne les dépendances des moteurs déjà présents sur le catalogue »). resolveDependencies(name, declared) reste utilisée telle quelle pour registerEngine() (les 4 contrats démarrés individuellement — Core, Smart, Permission, Redirection) : eux ont un declared propre à protéger contre un oubli, ensureSeeded() n'en a pas, le catalogue est sa seule source.",
    pourquoi:
      "La direction a explicitement demandé de corriger ce point avant l'envoi des prochaines instructions, en le distinguant du travail de tests de moteurs (qui suit sa propre règle : au moins 5 moteurs testés à chaque futur lot de correction).",
    ou: ["server/engine-registry/service.ts"],
    lecon:
      "Un mécanisme qui se documente comme « idempotent, réaligne sur le catalogue » doit être vérifié ligne à ligne pour confirmer qu'il fait vraiment ce qu'il dit — ici l'union avec l'état courant produisait un comportement strictement additif malgré la documentation contraire. Limite honnête, non vérifiable depuis cet environnement : impossible de confirmer contre la vraie base de production que ce correctif fait effectivement disparaître les dépendances fantômes déjà accumulées (accès PostgreSQL direct bloqué) — seule la logique est vérifiée (typecheck, lecture de code, cohérence avec resolveDependencies). À confirmer après déploiement et redémarrage du service en production : les dépendants de core, et plus généralement des moteurs déjà corrigés cette session, devraient refléter l'état réel du catalogue au prochain boot.",
    domaine: "moteurs",
  },
  {
    cle: "branche-lot5-livraison-achat-avis-boutons",
    titre: "Lot de 5 : redirection « accueil », route orpheline, dépendances vers boutons + premiers scénarios de contrôle continu",
    moteurs: ["redirection", "livraison", "livraison_vehicule", "boutons", "achat", "avis_reputation"],
    quoi:
      "Quatre défauts trouvés en suivant les captures d'écran de la direction sur le moteur de redirection, corrigés dans le même lot. 1) server/button-engine/catalogue.ts déclare un bouton (livraison_vehicule_retour, écran /livraison-vehicule) avec cleRedirection: \"accueil\", sans aucune règle correspondante dans server/redirection-engine/catalog.ts : le bouton fonctionnait déjà via son repli codé en dur (cible \"/\"), mais la direction ne pouvait pas la reconfigurer depuis le centre de pilotage. Règle manquante ajoutée. 2) La destination /acheter/pro signalée « inexistante » correspond aux moteurs sous-section pas encore construits (achat_pro et apparentés) — pas un bug de connexion, aucune correction faite : sujet de construction de phase 2. 3) La page /livraison-vehicule (composant client/src/pages/LivraisonVehicule.tsx) était une route orpheline dans server/engine-registry/perimetres.ts — le même composant sert déjà /louer/livraison (moteur livraison_vehicule) et /vente/livraison (moteur vente) ; ajoutée à la liste des routes de livraison_vehicule. 4) Dernières dependance_non_declaree du fil vente/achat/avis_reputation : livraison et livraison_vehicule embarquent chacun lib/boutonMoteur.tsx (trpc.buttonEngine) sans déclarer boutons — ajouté aux deux dans catalog.ts (0 dépendance non déclarée restante après régénération). En même temps (nouvelle règle : au moins 5 moteurs testés par lot), créé server/continuous-test/scenarios-univers.ts et branché dans catalog.ts : 5 premiers scénarios réels pour des moteurs qui avaient 0 preuve de test dans l'audit d'activation (livraison, livraison_vehicule, achat, avis_reputation, boutons — sur 71 moteurs à 0 preuve avant ce lot). Quatre scénarios interrogent une vraie page publique (http() + estIntrouvable(), avec vérification explicite du code HTTP 200) ; le cinquième (boutons.catalogue_coherent) vérifie ACTIONS_BOUTONS en mémoire, sans réseau ni base — exécuté ici même : 39 boutons déclarés, tous uniques.",
    pourquoi:
      "Suite directe des captures d'écran envoyées par la direction sur le moteur de redirection, et de la nouvelle règle de travail : chaque lot de correction inclut désormais au moins 5 moteurs testés, via le système de contrôle continu déjà existant (server/continuous-test/), pas un système parallèle, en continuant sans s'arrêter tant qu'il reste des dépendants ou connexions manquantes.",
    ou: [
      "server/redirection-engine/catalog.ts",
      "server/engine-registry/perimetres.ts",
      "server/engine-registry/catalog.ts",
      "server/continuous-test/scenarios-univers.ts",
      "server/continuous-test/catalog.ts",
      "server/data/moteurs.ts",
    ],
    lecon:
      "La même méthode continue de payer : chaque anomalie affichée au centre de pilotage a une cause traçable dans le code (un bouton avec repli codé en dur, un composant partagé entre plusieurs routes, un import direct non déclaré) — aucune n'a nécessité de deviner. Vérification après régénération (npm run gen:moteurs) : 0 route sans moteur, 0 dépendance non déclarée restante ; la composante fortement connexe du graphe (41 moteurs) ne change pas de taille avec l'ajout de boutons comme dépendance, boutons y était déjà. Les scénarios HTTP (livraison, livraison_vehicule, achat, avis_reputation) ne peuvent pas être exécutés depuis cet environnement (pas d'accès réseau à l'URL publique déployée) : leur syntaxe et leur logique sont vérifiées par lecture et par typecheck, mais leur premier vrai résultat n'arrivera qu'après déploiement, quand le moteur continuous_test les exécutera pour de vrai contre la plateforme réelle et déposera la preuve dans l'audit d'activation (point 91). Seul boutons.catalogue_coherent a pu être exécuté et vérifié ici, sans réseau ni base. 66 moteurs restent à 0 preuve de test après ce lot — à continuer, 5 par 5, à chaque prochain lot de correction.",
    domaine: "moteurs",
  },
  {
    cle: "branche-lot6-completion-center-identity-garage-pieces-visibility-monitoring",
    titre: "Lot de 5 : domaine de test mal attribué (completion_center) trouvé et corrigé + 5 nouveaux moteurs couverts",
    moteurs: ["completion_center", "identity", "garage", "pieces", "visibility", "monitoring"],
    quoi:
      "Après les deux défauts de correspondance par approximation de texte déjà trouvés (matchRouter, matchRoutes), même vérification appliquée au critère « Testée » : le scénario central.achevement_calcule déclarait domaine: \"completion\" alors que le moteur réellement inscrit au catalogue s'appelle completion_center — normalizeKey(\"completion\") ne correspond à aucune variante de normalizeKey(\"completion_center\"), donc la preuve de test existait mais ne pouvait jamais être retrouvée par ce moteur dans l'audit d'activation. Corrigé (id et domaine renommés en completion_center). Vérification élargie : comparaison de tous les domaines déclarés dans server/continuous-test/*.ts contre les 88 noms exacts du catalogue — les autres écarts (annonces, central, engine_registry) sont des contrôles transversaux volontaires sur une table ou un sous-système partagé par plusieurs moteurs, pas des fautes de frappe, laissés tels quels. En même temps (règle des 5 moteurs testés par lot), ajouté des scénarios réels dans server/continuous-test/scenarios-univers.ts pour identity (/connexion), garage (/garages), pieces (/pieces), visibility (/superadmin/visibilite-croissance) et monitoring (/superadmin/admin-statistiques) — même méthode que le lot précédent (page publique réelle, code HTTP 200 vérifié, pas d'écran introuvable).",
    pourquoi:
      "Suite logique de la leçon retenue au lot précédent : deux défauts du même type trouvés coup sur coup suggéraient de relire tout le reste de l'audit d'activation avec la même question. Continuité de la règle de travail (5 moteurs testés par lot, sans s'arrêter).",
    ou: [
      "server/continuous-test/scenarios-moteurs-centraux.ts",
      "server/continuous-test/scenarios-univers.ts",
    ],
    lecon:
      "Toute correspondance entre un identifiant libre (domaine d'un scénario, table sondée) et le nom d'un moteur au registre doit être vérifiée par égalité exacte contre le catalogue, jamais supposée juste parce qu'elle « ressemble ». Un balayage complet (comparer chaque valeur déclarée aux 88 noms exacts) trouve ce genre de faute plus vite qu'une relecture au cas par cas. Reste à vérifier avec la même méthode : le critère « Utilisée réellement » a déjà été vérifié dans ce lot (server/engine-registry/probes.ts — les 62 noms de moteur sondés correspondent tous exactement au catalogue, aucun défaut trouvé) ; « Système Intelligent connecté » ne dépend d'aucune correspondance de nom (juste lastHeartbeat), donc hors de portée de cette classe de défaut.",
    domaine: "moteurs",
  },
  {
    cle: "branche-lot7-nettoyage-dependances-sans-preuve",
    titre: "8 dépendances déclarées sans aucun usage réel retirées — composante cyclique réduite de 41 à 39 moteurs",
    moteurs: ["livraison", "depannage", "garage", "vo_engine", "monitoring", "media_authenticity"],
    quoi:
      "Le générateur signale 55 « dependance_sans_preuve » (une dépendance déclarée au catalogue sans aucun import, événement ou table trouvé dans le code du moteur qui la déclare). La plupart concernent des moteurs sous-section pas encore construits (phase 2, ex. controle_technique, encheres, marketing) — normal, rien à corriger. Six moteurs réellement construits ont été vérifiés un par un (lecture directe des fichiers déclarés dans perimetres.ts, recherche de l'usage exact) : livraison ne référence scheduler ni proximity_engine nulle part (retirés) ; depannage non plus (retirés, mais payment y est bien réellement importé — conservé) ; garage n'importe jamais payment dans routers/garages.ts (retiré, scheduler y reste car réellement prouvé) ; vo_engine n'importe jamais notification (retiré) ; monitoring-os n'importe jamais audit alors qu'il importe bien notification/identity/event_bus (retiré, le reste conservé) ; media_authenticity n'a aucun lien vers les moteurs document ou audit — le mot « document » n'y apparaît que comme valeur d'énumération de type de média (image/vidéo/document), pas comme dépendance réelle (les deux retirés).",
    pourquoi:
      "Continuité de l'instruction de la direction : toute anomalie constatée en travaillant les dépendants doit être complétée, y compris dans l'autre sens — une dépendance déclarée qui n'existe pas dans le code réel fausse le graphe de connexions autant qu'une dépendance manquante.",
    ou: ["server/engine-registry/catalog.ts"],
    lecon:
      "Retirer une dépendance sans preuve n'est pas une suppression de fonctionnalité : c'est corriger une déclaration jamais devenue réelle (souvent héritée d'une intention initiale — livrer avec des créneaux planifiés, garages via paiement direct — jamais construite). Effet mesurable : la composante fortement connexe du graphe de dépendances métier passe de 41 à 39 moteurs (document sort entièrement du cycle, n'y étant relié que par cette fausse dépendance de media_authenticity). Il reste 46 dependance_sans_preuve, très majoritairement portées par des moteurs sous-section de phase 2 encore non construits — à revérifier au cas par cas seulement quand ces moteurs seront construits, pas avant.",
    domaine: "moteurs",
  },
  {
    cle: "branche-lot8-search-support-messaging-atelier-estimation",
    titre: "Lot de 5 : couverture de test pour search, support, messaging, atelier, estimation",
    moteurs: ["search", "support", "messaging", "atelier", "estimation", "continuous_test"],
    quoi:
      "Cinq scénarios réels ajoutés dans server/continuous-test/scenarios-univers.ts : quatre pages publiques (search /rechercher, support /aide, messaging /messagerie, atelier /atelier-pro — même méthode, HTTP 200 réel + pas d'écran introuvable) et un contrôle en process pour estimation (import direct de estimation-hub/service.ts, controlCenterFeed(), échec si l'état de santé calculé est « degraded »). Ce dernier import a créé une dépendance réelle continuous_test -> estimation, détectée par le générateur au prochain gen:moteurs (dependance_non_declaree) — déclarée dans catalog.ts, même règle que la dépendance continuous_test -> boutons déjà existante pour la même raison (import direct d'un catalogue pour le tester).",
    pourquoi:
      "Continuité de la règle de travail (au moins 5 moteurs testés par lot) et de l'instruction de compléter toute anomalie constatée en travaillant — ici, une dépendance non déclarée créée par le travail de test lui-même, corrigée dans le même lot plutôt que laissée pour un lot séparé.",
    ou: ["server/continuous-test/scenarios-univers.ts", "server/engine-registry/catalog.ts"],
    lecon:
      "Un scénario de contrôle continu qui importe directement le service d'un autre moteur (plutôt que de l'interroger par HTTP public) crée une vraie dépendance de code, pas seulement une preuve de test : elle doit être déclarée comme telle. Les scénarios purement HTTP (page_publique) ne créent aucune dépendance détectable, puisqu'ils interrogent le serveur de l'extérieur comme le ferait un visiteur.",
    domaine: "moteurs",
  },
  {
    cle: "branche-lot9-atelier-assurance-controle-technique-finance",
    titre: "Vérification demandée par la direction sur atelier et assurance + 2 moteurs « actifs » sans aucun backend réel corrigés",
    moteurs: ["atelier", "assurance", "controle_technique", "finance"],
    quoi:
      "Suite à la demande directe de vérifier que chaque service a son propre moteur bien complet et connecté (exemples cités : garage pour les véhicules, pieces pour les pièces — déjà corrects). Vérification faite service par service (category: service au catalogue). atelier et assurance existent déjà comme moteurs dédiés, avec du vrai code (atelier-engine, insurance-engine, dizaines de routes réelles) : 4 dépendances sans aucune preuve d'usage retirées (atelier -> redirection, atelier -> intelligences ; assurance -> partner_engine, assurance -> document — aucun de ces quatre moteurs n'est jamais importé dans le code réel d'atelier ou d'assurance). En élargissant la vérification aux autres moteurs de category service : controle_technique et finance sont déclarés « active » alors qu'ils n'ont ni dossier serveur ni routeur déclaré (comme les sous-sections *_pro/*_particulier/*_officiel, mais eux sont honnêtement marqués « staging ») — leurs 4 dépendances chacun sont sans aucune preuve, confirmant l'absence totale de backend. finance a un fichier de schéma de tables (modules/financeplus.ts) mais aucune procédure serveur ne l'exploite. Les deux corrigés en state: \"staging\" pour refléter la réalité (ce n'était pas un mensonge délibéré, juste jamais mis à jour depuis leur création), sans toucher à leurs dépendances déclarées qui restent l'intention pour leur construction en Phase 2.",
    pourquoi:
      "Demande explicite de la direction : que chaque service ait son propre moteur, et que les moteurs déjà créés soient réellement complets et connectés à toutes les parties nécessaires — pas seulement déclarés.",
    ou: ["server/engine-registry/catalog.ts"],
    lecon:
      "Un moteur marqué « active » sans un seul dossier serveur ni routeur déclaré, et dont 100% des dépendances déclarées sont sans preuve, n'est pas actif : c'est un moteur pas encore construit auquel on a oublié de changer l'état, contrairement aux sous-sections *_pro qui, elles, sont honnêtement « staging ». Point non résolu à signaler à la direction plutôt qu'à trancher seul (changement de responsabilité majeur, pas une réparation) : encheres (category service, state active, 0 dossier, 0 routeur, mais dépend de auction_engine) et auction_engine (le vrai moteur construit, avec son propre dossier auction-engine et sa route /encheres/live) semblent couvrir le même domaine en double — à clarifier : encheres doit-il rester une simple façade univers au-dessus d'auction_engine, ou les deux devraient-ils fusionner ?",
    domaine: "moteurs",
  },
  {
    cle: "branche-lot10-depannage-vo-energie-media-google-business",
    titre: "Lot de 5 : couverture de test pour depannage, vo_engine, energie_recharge, media_authenticity, connecteur_google_business",
    moteurs: ["depannage", "vo_engine", "energie_recharge", "media_authenticity", "connecteur_google_business", "continuous_test"],
    quoi:
      "Cinq scénarios réels ajoutés dans scenarios-univers.ts. Trois pages publiques (depannage /depannage, vo_engine /louer/certifies, energie_recharge /labs/energy-recharge — même méthode que les lots précédents). Deux contrôles en process, choisis parce que ces deux moteurs n'exposent aucune route visiteur (backend pur) : media_authenticity.etat_calcule importe directement service.ts et vérifie que etat() répond avec une couverture de détecteurs cohérente (jamais plus d'opérationnels que de détecteurs déclarés) ; connecteur_google_business.etat_gracieux importe directement service.ts et vérifie que connectorStatus() répond honnêtement — échoue seulement si l'état affiché est « actif » sans jeton d'actualisation réel (le connecteur est censé rester « non configuré » tant que les clés Google ne sont pas fournies, jamais se prétendre actif sans elles). Les deux imports directs ont créé 2 dépendances réelles (continuous_test -> media_authenticity, continuous_test -> connecteur_google_business), déclarées dans catalog.ts, même raison que continuous_test -> boutons et -> estimation déjà déclarées.",
    pourquoi:
      "Continuité de la règle des 5 moteurs testés par lot, en priorisant des moteurs sans aucune route visiteur (donc invisibles aux scénarios HTTP habituels) pour élargir la méthode de contrôle en process déjà validée avec estimation.",
    ou: ["server/continuous-test/scenarios-univers.ts", "server/engine-registry/catalog.ts"],
    lecon:
      "Le contrôle du connecteur Google Business illustre la règle permanente sur les clés externes manquantes : le test ne vérifie jamais qu'une clé réelle est présente, seulement que le code se comporte honnêtement dans les deux cas (avec ou sans clé) — un connecteur qui se prétendrait « actif » sans jeton réel serait le vrai défaut, pas l'absence de la clé elle-même.",
    domaine: "moteurs",
  },
  {
    cle: "branche-lot11-balayage-final-dependances-sans-preuve",
    titre: "Balayage complet des 42 dependance_sans_preuve restantes : 7 nouvelles fausses déclarations trouvées et retirées",
    moteurs: ["avis_reputation", "comptabilite", "pro_account", "vo_espaces", "auction_engine", "estimation"],
    quoi:
      "En réponse à la question directe de la direction (tout est-il complété ?), balayage complet des 42 dependance_sans_preuve restantes pour distinguer, moteur par moteur, les vraies fausses déclarations des moteurs sous-section de phase 2 pas encore construits (achat_pro/particulier/officiel, vente_pro/particulier/officiel, location_pro/particulier, controle_technique, finance — laissés tels quels, déjà traités). 7 nouvelles fausses déclarations trouvées sur des moteurs réels et actifs, toutes causées par la même confusion : un nom de champ de données qui ressemble au nom d'un moteur, sans aucun import réel de ce moteur. avis_reputation -> country (countryCode n'est qu'une colonne de données, jamais un import du moteur country) ; comptabilite -> document (comptaDocuments/cabinetDocuments sont les tables DE comptabilite elle-même, pas le moteur document) ; pro_account -> payment (paymentStatus/paymentReference sont des colonnes, jamais un import de payment-engine) ; vo_espaces -> permission et -> redirection (le mot « redirection » n'apparaît que dans un commentaire et un champ de réponse serveur, jamais useRedirection/redirectionEngine) ; auction_engine -> payment (paymentId est une colonne, jamais un import de payment-engine) ; estimation -> vo (estimation importe réellement vo-engine/service.ts, un moteur distinct malgré le nom proche — le seul import réel vers « vo » est le mot utilisé comme étiquette d'affichage dans une réponse, pas un import du moteur vo lui-même). Toutes retirées. dependance_sans_preuve : 42 -> 35, composante cyclique inchangée (39 moteurs, ces dépendances n'étaient pas des arêtes de cycle).",
    pourquoi:
      "La direction a demandé une confirmation explicite que tout défaut repéré (dépendants, connexions) est traité avant l'envoi de nouvelles tâches — ce balayage final vérifie qu'aucune fausse dépendance n'a été oubliée parmi les moteurs réellement construits, avant de répondre.",
    ou: ["server/engine-registry/catalog.ts"],
    lecon:
      "Le même piège se répète : un champ de données nommé comme un moteur (paymentId, countryCode, document, redirection en tant que texte de réponse) n'est pas une preuve de dépendance — seul un import réel du module de l'autre moteur compte. knowledge (smart, seo, country non prouvés) et location (permission non prouvé) ont été examinés mais laissés tels quels : ce sont des univers réels avec du contenu réel (guides, formations) ou une orchestration réelle (routes /louer/* nombreuses, routeurs partagés), où le manque de preuve représente une intégration future légitime, pas une déclaration fausse — la différence avec les 7 corrigés ici est qu'eux avaient une preuve concrète du contraire (le nom du champ trouvé n'était jamais le moteur visé), alors qu'ici l'absence de preuve reste juste une absence.",
    domaine: "moteurs",
  },
  {
    cle: "branche-lot12-redirection-france-et-cycle-pro-formalise",
    titre: "Alias /france ajouté au moteur de redirection + cycle pro_account/pro_portal formalisé comme coopération acceptée",
    moteurs: ["redirection", "pro_account", "pro_portal"],
    quoi:
      "Deux points explicitement demandés par la direction. 1) La clé de redirection sans destination identifiée pour /france : recherche du slug dans le code réel — server/seo-generator.ts déclare { slug: \"france\", name: \"France\" } et /pays/:slug (SeoLandingPage) sert déjà les pages pays. Un visiteur tapant /france cherchait cette page, pas une destination inexistante ; alias ajouté (/france -> /pays/france). 2) Le cycle pro_account <-> pro_portal, examiné en détail avant de le documenter : les deux sens ne sont pas symétriques. pro_account -> pro_portal est un vrai import serveur (server/pro-account/service.ts importe server/pro-portal/contract.ts, requirementsFor) — déjà formalisé lors d'un lot précédent par l'extraction de ce contrat. pro_portal -> pro_account n'est PAS un import serveur : sa seule preuve est client/src/pages/pro/DossierPro.tsx, un écran qui appelle à la fois trpc.proPortal et trpc.proAccount — un couplage réel mais côté écran, pas côté moteur. Les deux catalog.ts portent maintenant un commentaire expliquant cette asymétrie exacte, pour qu'un futur lot ne la reprenne pas comme un défaut non résolu. Le registre traitait déjà cette boucle comme « à surveiller » (pas critique) dans registryAnomalies() — rien à changer côté code, seulement la documenter comme vue et acceptée.",
    pourquoi:
      "Réponse directe à la demande de la direction de traiter ces deux points avant l'envoi des prochaines tâches.",
    ou: ["server/redirection-engine/catalog.ts", "server/engine-registry/catalog.ts"],
    lecon:
      "Une « dépendance mutuelle » déclarée à deux endroits n'est pas forcément symétrique dans le code réel : ici un sens est un import serveur direct, l'autre n'est qu'un écran partagé qui appelle les deux API. Documenter l'asymétrie exacte évite qu'un futur passage tente de « corriger » le sens le plus faible en le prenant pour une erreur, ou au contraire lui suppose la même solidité que l'autre sens.",
    domaine: "moteurs",
  },
  {
    cle: "branche-socle-app-mkapms-intelligence",
    titre: "Socle de la 4e application mobile MKA.P-MS Intelligence — mécanisme multi-flavors, sans module fonctionnel",
    moteurs: ["intelligences"],
    quoi:
      "Demande explicite de la direction : une 4e variante mobile dédiée (com.mkapms.intelligence, route /intelligence), distincte de l'assistant intégré existant (AssistantIntelligences.tsx, route /intelligences inchangée), les deux appelant le même moteur derrière (server/intelligences/). Socle uniquement, aucun module fonctionnel : 1) mobile/variants.json reçoit l'entrée intelligence, même schéma que les 3 autres. 2) android/app/build.gradle converti de l'injection de propriétés (-PmkapmsAppId=...) vers de vrais « product flavors » Gradle, un par entrée de mobile/variants.json lue directement (JsonSlurper) — mécanisme standard qui permet à chaque application, à terme, sa propre icône/splash/liens en déposant des fichiers dans android/app/src/<flavor>/res/ (dossier réservé et documenté pour intelligence, avec un README expliquant comment s'en servir pour les 4 applications), sans dupliquer le projet natif. mobile/build-apps.mjs adapté aux nouveaux noms de tâches (bundle<Flavor>Release, plus jamais bundleRelease une fois des flavors déclarés). 3) client/src/pages/intelligence/ : page racine légère (shell + navigation, aucune grosse logique) affichant 16 modules à l'état de squelette (conversation, voix/temps réel, images, documents, recherche, mémoire, projets, agents, outils, code, automatisations, intégrations, paramètres, permissions, usage/coûts, historique), chacun dans son propre fichier sous modules/ pour que la page racine ne devienne jamais un fichier unique portant tout le produit. niveaux.ts prépare une architecture de 6 niveaux d'accès (public, professionnel, développeur, équipe interne, direction, PDG/super admin), dérivée des rôles déjà existants (userRoleEnum) et de la Plateforme développeur déjà existante — aucun rôle parallèle créé.",
    pourquoi:
      "Construire un produit MKA.P-MS Intelligence complet et autonome, sans jamais dupliquer le moteur qui existe déjà derrière l'assistant intégré, et sans que l'application devienne un fichier monolithique en grossissant.",
    ou: [
      "mobile/variants.json",
      "android/app/build.gradle",
      "mobile/build-apps.mjs",
      "android/app/src/intelligence/res/README.md",
      "client/src/pages/intelligence/",
      "client/src/App.tsx",
      "server/engine-registry/perimetres.ts",
    ],
    lecon:
      "Vérifié par un vrai build Android (SDK et build-tools installés dans l'environnement de travail, pas seulement une relecture de code) : les 4 variantes (grandpublic, pro, command, intelligence) compilent en debug et en release après la conversion en product flavors, avec l'applicationId et le nom attendus dans chaque APK — la conversion de l'injection de propriétés vers de vrais flavors Gradle ne casse aucune des 3 applications existantes. Un flavor Gradle sans dossier de ressources dédié hérite silencieusement de src/main/ : c'est ce qui permet de réserver le mécanisme (dossier + documentation) sans fabriquer d'icône avant que la direction ne le demande.",
    domaine: "moteurs",
  },
  {
    cle: "branche-provider-outils-sortie-structuree",
    titre: "Appel d'outils et sortie structurée réellement câblés dans la couche d'appel unique",
    moteurs: ["intelligences"],
    quoi:
      "Corrige le défaut trouvé pendant l'audit demandé par la direction : dans server/intelligences/fonctions.ts, les fonctionnalités appel_outils et sortie_structuree pouvaient être basculées sur « actif » dans l'écran sans que ça ne change quoi que ce soit, faute d'implémentation réelle dans provider.ts (qui n'envoyait jamais tools ni response_format, et n'appelait que /v1/chat/completions en texte simple). Corrigé au niveau de la couche d'appel unique : AppelInput accepte désormais outils (fonctions exposables au modèle) et sortieStructuree (schéma JSON exigé) ; la requête les transmet réellement (tools/tool_choice, response_format json_schema) ; la réponse est analysée pour en extraire les appels d'outils demandés (appelsOutils) au lieu de ne lire que le texte — une réponse qui ne contient qu'un appel d'outil, sans texte, est désormais traitée comme un succès et non comme une réponse vide en échec. server/intelligences/routeur.ts relaie ces deux champs de bout en bout, sans donner à un moteur métier un chemin parallèle vers le fournisseur.",
    pourquoi:
      "Préalable nécessaire à toute construction future (application MKA.P-MS Intelligence dédiée, modules Agents/Outils/Conversation) : ces modules ont besoin que ce câblage existe réellement avant d'avoir un sens à construire.",
    ou: ["server/intelligences/provider.ts", "server/intelligences/routeur.ts"],
    lecon:
      "Un bouton de fonctionnalité peut être honnêtement déclaré (spécification complète, permission, précaution) sans qu'aucune ligne de code ne l'exécute réellement — l'état affiché (« activable ») ne prouvait que la présence d'une clé de fournisseur pour la capacité texte générique, jamais l'existence du code qui ferait la différence. Reste à faire, volontairement pas construit ici : aucune boucle d'exécution d'outil n'existe encore (demander un appel, l'exécuter, renvoyer le résultat au modèle pour la réponse finale), ni de Tool Registry recensant quelles fonctions MKA.P-MS sont exposables à qui — décision sensible aux permissions, à traiter comme son propre lot. Non vérifiable depuis cet environnement (aucune clé fournisseur réelle) : à confirmer par un vrai appel après déploiement, avec au moins un scénario de contrôle continu dédié.",
    domaine: "moteurs",
  },
  {
    cle: "branche-tool-registry-boucle-execution",
    titre: "Tool Registry + boucle d'exécution d'outils — brique de sécurité et d'orchestration, pas un simple switch de function calling",
    moteurs: ["intelligences"],
    quoi:
      "Construit sur la plomberie du lot précédent (outils/sortieStructuree dans provider.ts) sans jamais y ajouter de logique métier — provider.ts reste la couche fournisseur. Quatre couches séparées dans server/intelligences/outils/ : registre.ts (ce qui existe — 5 outils de test non destructifs, chacun avec tool_id, description, version, schema_input/output, allowed_roles, required_permissions, requires_human_approval, risk_level parmi READ_ONLY/LOW/MEDIUM/HIGH/CRITICAL, idempotent, timeout, source, enabled, audit_category) ; politique.ts (qui peut — vérifie l'activation, le rôle, la permission via server/intelligences/permissions.ts, puis applique une règle non négociable : risque HIGH/CRITICAL toujours refusé quels que soient rôle et permission, et requiresHumanApproval renvoie « en attente d'approbation humaine » sans jamais exécuter, faute de mécanisme d'approbation construit) ; executeur.ts (exécute réellement — valide les arguments contre le schéma, applique le timeout déclaré, rattrape l'erreur de l'outil sans jamais inventer un résultat) ; audit.ts (journalise systématiquement dans une nouvelle table in_outils_journal, y compris les refus et les outils inconnus — l'échec du journal ne casse jamais la boucle, comme la mesure d'appels existante). boucle.ts enchaîne le tout via server/intelligences/routeur.ts (jamais provider.ts directement) : plusieurs appels d'outils par tour, plusieurs tours, limite d'itérations non négociable (5 par défaut) pour empêcher toute boucle sans fin, retour propre au modèle à chaque étape (jamais un silence). provider.ts reçoit un nouveau champ historique pour porter les tours assistant/tool successifs sans connaître le sens métier de ce qu'il transporte.",
    pourquoi:
      "Demande explicite et très précisément cadrée de la direction : jamais un simple tool-call → exécuter direct. Permissions, validations et journalisation doivent être au milieu, avec une séparation nette registre / politique / exécuteur / audit, et aucun outil réel (paiement, suppression, production, rôles, Railway, fournisseurs, VIN, transport) tant que le mécanisme n'est pas validé sur des outils sans risque.",
    ou: [
      "server/intelligences/outils/registre.ts",
      "server/intelligences/outils/politique.ts",
      "server/intelligences/outils/executeur.ts",
      "server/intelligences/outils/validation.ts",
      "server/intelligences/outils/outils-test.ts",
      "server/intelligences/outils/audit.ts",
      "server/intelligences/outils/boucle.ts",
      "server/intelligences/outils/__tests__/boucle.test.ts",
      "server/intelligences/provider.ts",
      "server/intelligences/routeur.ts",
      "server/intelligences/schema.ts",
      "drizzle/0110_intelligences_outils_journal.sql",
    ],
    lecon:
      "32 vérifications exécutées et réussies (npx tsx .../boucle.test.ts) : outil autorisé, outil désactivé, mauvais rôle, permission refusée (distincte du mauvais rôle), arguments invalides, outil inconnu au milieu d'une boucle réelle, outil en erreur (division par zéro, propagée telle quelle), un outil rapide jamais faussement chronométré, deux appels d'outils dans le même tour, boucle bloquée proprement à la limite déclarée (jamais un texte inventé à la place), sortie structurée obtenue après un appel d'outil, validation humaine qui bloque réellement l'exécution, et risque CRITICAL toujours refusé même avec rôle et permission autorisés. Aucun accès réseau ni base de données réels dans cet environnement de travail (PostgreSQL injoignable — une tentative de connexion sans garde-fou peut rester bloquée plutôt que d'échouer vite, contrairement à ce qu'on pourrait attendre) : le modèle et la vérification de permission sont injectés avec de faux comportements scriptés pour les tests, jamais en production (paramètres optionnels avec la vraie implémentation en valeur par défaut) — la boucle, le registre, la politique et l'exécuteur testés sont le vrai code de production. Reste volontairement non construit : le mécanisme d'approbation humaine en boucle (donc HIGH/CRITICAL et requiresHumanApproval restent bloqués sans exception dans ce lot), tout outil métier réel, et le branchement de cette boucle à un module de l'application MKA.P-MS Intelligence ou à l'assistant intégré — aucun des deux ne l'appelle encore.",
    domaine: "moteurs",
  },
  {
    cle: "registre-global-outils-lot-vehicules",
    titre: "Tool Registry global (29 familles, aucune omise) + premier lot d'implémentation réelle : véhicules / VIN / immatriculation / estimation",
    moteurs: ["intelligences"],
    quoi:
      "Corrige un principe, pas seulement du code : sur consigne explicite de la direction, on n'enlève ni ne cache plus aucune capacité du Tool Registry — la question n'est plus « quelle famille câbler en premier » mais « quelles règles d'accès décident qui peut l'utiliser ». server/intelligences/outils/registre.ts déclare désormais 29 catégories (vehicules, paiements, remboursements, payouts, ledger_comptabilite, fournisseurs, pieces, compatibilite_pieces, stock, transport, livraison, douane, documents, fichiers, recherche, communication, notifications, comptes, roles, permissions, securite, administration, donnees, marketplace, railway_deploiement, observabilite, api_externes, futurs_moteurs, test) et 77 fiches au total, chacune avec ses 14 champs de sécurité (toolId, category, version, schemas, available, enabled, implementationStatus, allowedRoles, allowedCountries/blockedCountries, requiredPermissions, requiredSubscription, requiresHumanApproval, requiresStrongAuthentication, riskLevel, legalBasis, provider, fallback, internalReplacementStatus, idempotent, timeoutMs, auditCategory) — un statut à trois valeurs (IMPLEMENTED / IMPLEMENTED_NOT_CONNECTED / REGISTERED_NOT_IMPLEMENTED) remplace l'ancien réflexe « absent si pas encore codé » : une fiche existe toujours, même verrouillée `enabled:false`, jamais retirée parce qu'elle est sensible (paiements notamment : 3 fiches enregistrées, toutes REGISTERED_NOT_IMPLEMENTED, aucun code de paiement ajouté dans ce lot). Premier lot d'implémentation réelle, la famille véhicules (17 outils demandés, tous présents) : 8 IMPLEMENTED (decodeVIN — décodage structurel ISO 3779 local, table WMI et années-modèle internes, aucun appel externe — getVehicleMarketValue, getTradeInValue, estimateRetailPrice, estimateMargin — réutilisent le seul et même server/vo-engine/service.ts::estimate() déjà existant, aucune règle de marge inventée, la marge est l'écart réel entre le bas et le haut de la même fourchette — checkVehicleConsistency, normalizeVehicleData, detectVehicleDuplicate — recherche réelle dans les annonces publiées), 6 IMPLEMENTED_NOT_CONNECTED avec dégradation honnête plutôt qu'un résultat inventé (identifyVehicleByVIN cherche dans les estimations déjà demandées pour ce VIN faute de colonne VIN sur les annonces publiées ; identifyVehicleByPlate, getVehicleTechnicalData, getVehicleOptions, checkVehicleHistory, checkRecall déclarent honnêtement l'absence de fournisseur, jamais « sain » ou « aucun rappel » sans preuve), 3 REGISTERED_NOT_IMPLEMENTED sans règle métier inventée (getWholesaleValue, getResidualValue, checkSupplierVehicleAvailability — décote gros, dépréciation résiduelle et réseau fournisseurs B2B n'existent pas encore comme politique de la direction). Le Country Engine (server/country-os/index.ts) est branché dans politique.ts comme un vrai filtre mondial, pas un slogan : allowedCountries/blockedCountries par outil, puis vérification que le pays demandé est réellement ouvert et actif au Country Engine — un pays absent ou fermé est refusé par prudence, jamais traité comme la France par défaut. executeur.ts distingue maintenant « non_implemente » (fiche REGISTERED_NOT_IMPLEMENTED, absence assumée) d'une vraie incohérence (registre dit IMPLEMENTED mais aucun code trouvé) pour qu'un oubli reste visible au lieu de se confondre avec une famille volontairement pas encore câblée.",
    pourquoi:
      "Consigne corrigée explicitement par la direction après le lot précédent : ne plus jamais faire choisir « une famille à la fois » à un agent au risque que les autres restent invisibles du registre — toutes les familles prévues doivent y apparaître dès maintenant, avec leur statut honnête, et les règles d'accès (rôle, pays, abonnement, risque, approbation humaine) sont ce qui protège une capacité sensible, jamais son absence du système.",
    ou: [
      "server/intelligences/outils/registre.ts",
      "server/intelligences/outils/familles/vehicules.ts",
      "server/intelligences/outils/familles/globales.ts",
      "server/intelligences/outils/familles/outils-vehicules.ts",
      "server/intelligences/outils/implementations.ts",
      "server/intelligences/outils/executeur.ts",
      "server/intelligences/outils/politique.ts",
      "server/intelligences/outils/boucle.ts",
      "server/intelligences/outils/audit.ts",
      "server/intelligences/outils/__tests__/boucle.test.ts",
    ],
    lecon:
      "60 vérifications exécutées et réussies (npx tsx .../boucle.test.ts), dont les nouvelles de ce lot : au moins 29 familles couvertes et 17 outils véhicules présents, tout REGISTERED_NOT_IMPLEMENTED forcément désactivé, la famille paiements présente mais non câblée, un outil mondial autorisé pour un pays ouvert au Country Engine (faux pays injecté, PostgreSQL injoignable dans cet environnement de travail), refusé pour un pays fermé ou absent du Country Engine (jamais un pays par défaut), allowedCountries/blockedCountries explicites respectés et prioritaires, decodeVIN correct sur un WMI connu et honnête (confiance faible, jamais un constructeur inventé) sur un WMI absent de la table interne, checkVehicleConsistency détecte réellement un écart marque/VIN, normalizeVehicleData reconnaît les synonymes connus, checkVehicleHistory/checkRecall ne déclarent jamais un véhicule sain sans preuve, et getWholesaleValue (REGISTERED_NOT_IMPLEMENTED) refusé par la politique avant même d'atteindre l'exécuteur. Non vérifiable depuis cet environnement (PostgreSQL injoignable) : identifyVehicleByVIN, identifyVehicleByPlate, getVehicleMarketValue, getTradeInValue, estimateRetailPrice, estimateMargin et detectVehicleDuplicate dépendent tous d'une requête réelle (vo-engine ou table annonces/vo_estimations) — vérifiés par relecture de code et par le typecheck complet (aucune nouvelle erreur sur les 54 déjà connues, indépendantes de ce lot), à confirmer par un vrai appel après déploiement. Reste volontairement non câblé : les 58 autres fiches REGISTERED_NOT_IMPLEMENTED des 27 familles restantes (paiements, remboursements, payouts, ledger, fournisseurs, pièces, transport, douane, rôles, permissions, sécurité, administration, Railway/déploiement, etc.) — chacune existe déjà dans le registre avec son statut honnête, en attente du prochain lot autorisé par la direction ; aucun mécanisme d'approbation humaine en boucle n'existe encore, donc risque HIGH/CRITICAL et requiresHumanApproval restent bloqués sans exception, comme dans le lot précédent.",
    domaine: "moteurs",
  },
  {
    cle: "mobile-mise-a-niveau-api-36",
    titre: "Mise à niveau Android vers l'API 36 (Android 16) sur les 4 variantes — priorité urgente de la direction",
    moteurs: ["core"],
    quoi:
      "android/variables.gradle (source unique lue par android/app/build.gradle et capacitor-cordova-android-plugins/build.gradle) passe compileSdkVersion et targetSdkVersion de 35 à 36 — un seul point de vérité, aucune valeur d'API dupliquée ailleurs dans le projet Android (vérifié par recherche exhaustive). package.json passe de 1.7.4 à 1.7.5, ce qui fait mécaniquement passer versionCode (calculé par android/app/build.gradle en major*10000+minor*100+patch, jamais saisi à la main) de 10704 à 10705, conformément à la demande. Rien n'a été modifié depuis l'écran Google Play Console : uniquement le projet Android/Capacitor versionné, comme demandé. Aucune fonction existante supprimée — seule la cible de compilation/exécution change.",
    pourquoi:
      "Demande explicite et classée en priorité la plus haute par la direction (avant le chantier des moteurs) dans la liste « PARTIE URGENTE » (U-001) : mettre à niveau l'API 36 sans jamais passer par l'écran Play Console directement, en repartant du projet source, avec build propre → AAB → tests → signature → import Play Console.",
    ou: ["android/variables.gradle", "package.json"],
    lecon:
      "Vérifié réellement, pas seulement relu : SDK Android 36 (platform + build-tools 36.0.0) installé dans cet environnement de travail, les 4 variantes (grandpublic/pro/command/intelligence) compilées avec succès en debug ET en release avec l'Android Gradle Plugin déjà présent (8.2.1, aucune mise à jour d'outillage nécessaire), aab généré pour les 4 applications via le script canonique mobile/build-apps.mjs, et confirmation par aapt dump badging que chaque APK embarque bien compileSdkVersion=36, targetSdkVersion=36, versionCode=10705 et le bon applicationId (com.mkapms.app / com.mkapms.pro / com.mkapms.command / com.mkapms.intelligence). Suite de tests unitaires Android existante rejouée avec succès. typecheck, tous les checks du dépôt et le build web complet inchangés (54 erreurs préexistantes, aucune nouvelle). Non réalisable depuis cet environnement de travail, par construction (trousseau de signature de production jamais dans le dépôt, ni ses variables d'environnement) : la signature réelle de production et l'import dans Google Play Console — les .aab produits ici sont volontairement non signés (mobile/build-apps.mjs le déclare honnêtement), l'étape de signature+publication doit se faire depuis l'environnement qui détient le vrai trousseau.",
    domaine: "moteurs",
  },
  {
    cle: "u002-particulier-audit-corrections-liens-morts",
    titre: "U-002 Application Particulier — audit complet puis correction des liens morts confirmés (aucune reconstruction, aucune suppression)",
    moteurs: ["identity", "garage", "achat"],
    quoi:
      "Audit demandé par la direction avant toute correction : croisement du registre réel des moteurs (server/data/moteurs.ts, généré depuis le code) avec les 21 moteurs accessibles à un compte Particulier dans la variante grandpublic, puis vérification à la source de chaque anomalie pour écarter les faux positifs (un cas trouvé : Validation.tsx:177, signalé bouton_sans_action par le scanner mais réellement câblé sur onClick={handleSubmit}). Correction des bugs réels confirmés, tous des destinations cassées (aucun câblage de logique métier dans ce lot) : GarageParticulier.tsx et GaragePublicFiche.tsx pointaient vers /garage/devis et /garage/rendez-vous, qui n'existent pas — corrigés vers les vraies routes déjà existantes /garage/demande-devis et /garage/prise-rendez-vous. TableauBordParticulier.tsx : /profil (inexistant) corrigé vers /compte, /acheter/mes-achats (inexistant) vers /utilisateurs/historique-achats, /support (inexistant) vers /aide. Découverte la plus importante : CompteParticulier.tsx (écran « Mon compte », /utilisateurs) avait ses 10 liens de menu tous morts (/utilisateurs/profil, /utilisateurs/vehicules, etc.) sans qu'aucun outil de vérification existant ne le signale — parce que ces liens sont générés dynamiquement (to={m.to} depuis un tableau) et que gen-cliquables.mjs/gen-moteurs.mjs ne détectent que les chemins littéraux (to=\"/...\"). Recherche du même motif sur toute la plateforme : 27 fichiers utilisent ce même style de lien dynamique — corrigés dans ce lot uniquement ceux du périmètre Particulier déjà audité, les autres restent une dette d'outillage à traiter séparément (voir leçon). Dernier bug, le plus répété : /services était référencé comme destination par une vingtaine de badges de confiance et boutons dans Vehicule.tsx, ProduitVtcTaxi.tsx et ProduitLocation.tsx — jamais une route inventée par erreur, une page manquante que plusieurs écrans attendaient déjà de façon cohérente. Construite (client/src/pages/Services.tsx, route /services enregistrée dans App.tsx et déclarée dans server/engine-registry/perimetres.ts sous le moteur achat, qui possède déjà /comparateur, /devis, /favoris) plutôt que de deviner 20 destinations différentes sans base produit.",
    pourquoi:
      "Consigne explicite de la direction, dans cet ordre : auditer d'abord, ne rien reconstruire, ne rien supprimer, vérifier le moteur avant de toucher un bouton ou un écran, puis corriger dans l'ordre d'exécution avant de passer à l'application suivante (Direction/PDG/Comptabilité, puis Pro, puis Investisseur).",
    ou: [
      "client/src/pages/garage/GarageParticulier.tsx",
      "client/src/pages/garage/GaragePublicFiche.tsx",
      "client/src/pages/TableauBordParticulier.tsx",
      "client/src/pages/utilisateurs/CompteParticulier.tsx",
      "client/src/pages/Services.tsx",
      "client/src/App.tsx",
      "server/engine-registry/perimetres.ts",
    ],
    lecon:
      "Un outil de vérification honnête reste aveugle à ce qu'il n'a pas été conçu pour lire : gen-cliquables.mjs/gen-moteurs.mjs ne détectent que les chemins littéraux to=\"/...\" et ratent tout lien construit depuis une variable ou un tableau — CompteParticulier.tsx (10 liens morts, écran central du compte Particulier) est passé inaperçu de tous les audits précédents pour cette raison précise, pas parce que personne n'avait relu le fichier. 27 fichiers dans toute la plateforme partagent ce même style ; seuls ceux du périmètre Particulier déjà audité ont été corrigés ici — corriger l'outil lui-même (détecter les motifs to={x.to}) serait plus sûr que de relire chaque fichier à la main, mais n'a pas été fait dans ce lot pour ne pas mélanger correction de contenu et correction d'outillage. Après régénération des inventaires (gen:moteurs, gen-client-routes, gen-boutons-sans-action, gen-cliquables, gen-sections) : total des manques nommés passé de 666 à 657 (-9, cohérent avec les corrections réelles), destination_inconnue passé de 56 à 47, aucune régression sur bouton_sans_action (198, ce lot ne touche aucun câblage d'action, seulement des destinations). Reste volontairement non traité dans ce lot, et documenté dans l'audit remis à la direction avant correction : les boutons non câblés sur les parcours reprise véhicule, assistance dépannage, filtres de location, contrôle documents (nécessitent de vérifier le moteur backend avant de câbler, pas seulement corriger une destination) ; le centre de notifications (20 écrans squelettes) et « Mon espace » (18 écrans squelettes, /utilisateurs/*) restent à construire ou à déclarer explicitement hors du périmètre de U-002 par la direction ; les 24 autres fichiers hors périmètre Particulier utilisant le même motif de lien dynamique.",
    domaine: "moteurs",
  },
  {
    cle: "investment-engine-socle-moteurs",
    titre: "Application Investisseur (priorité absolue de la direction) — socle moteurs réel avant toute interface : Contract Engine, Ownership Router, Revenue Engine, Ledger",
    moteurs: ["investment"],
    quoi:
      "Audit préalable qui a changé la forme du travail : l'« Investisseur » déjà présent dans le dépôt (investorRouter dans server/routers/operations.ts, routes /investisseurs/*, seed « Mode Investisseurs ») n'a aucun rapport avec la demande — c'est un tableau de bord interne masqué qui pitche des investisseurs en capital (VC, tours Pre-Seed/Seed/Série A, « valorisation indicative »). Le vrai sujet — un partenaire qui achète un droit économique temporaire sur univers+pays+durée — n'existait nulle part. Construit sous le nom « investment » (jamais « investor »/« investisseur » seuls) pour ne créer aucune collision de routeur, de moteur ou de route avec l'existant, qui reste intact. Nouveau module server/investment/ : schema.ts (investors — capacité additive à une identité existante, jamais une extension du userRoleEnum global pour que le cumul Pro+Investisseur explicitement demandé reste possible ; investorOrganizations ; investments avec les champs minimums exigés — investorId, organizationId, universeId, countryCode, contractDocumentId, startAt, endAt, status, pricingModel, fixedPrice, revenueShare, currency, payoutSchedule ; investmentStatusHistory pour un historique immuable ; investorLedger et investorPayouts pour une comptabilité séparée), contrat.ts (Investment Contract Engine — graphe strict des 12 statuts exigés, ACTIVE atteignable uniquement via activer(), qui vérifie réellement côté serveur un document_signatures.signed et un payments.status = \"paid\", jamais sur la confiance d'un écran), ownership.ts (Investment Ownership Router — attribution automatique pays+univers+date → contrat ACTIVE, et détection de conflit qui bloque un second contrat exclusif incompatible dès qu'un contrat existe sur le même périmètre, pas seulement s'il est déjà ACTIVE), revenu.ts (Investor Revenue Engine — calcule la part investisseur selon le modèle réel du contrat : fixed_price donne 100% du brut à l'investisseur pour ce mouvement, revenue_share/hybrid appliquent exactement la fraction contractuelle, jamais une commission par défaut inventée), health.ts (battement de cœur réel, ponté dans server/engine-registry/os-bridge.ts comme contract-os/country-os). Country Engine branché à la création d'un contrat (aucun investissement possible dans un pays non ouvert). contractTypeEnum (server/modules/contracts.ts) complété avec \"investissement\" pour réutiliser le Document OS et la signature électronique déjà existants — jamais un stockage de contrat dupliqué.",
    pourquoi:
      "Priorité absolue explicitement fixée par la direction, avant même de terminer U-002 : construire les moteurs d'abord, l'interface ensuite (règle non négociable rappelée dans l'instruction maître des 4 applications). Aucune propriété de MKA.P-MS ne doit jamais être confondue avec le droit économique contractuel de l'investisseur — la séparation vient d'exister au niveau des moteurs avant même qu'un écran existe.",
    ou: [
      "server/investment/schema.ts",
      "server/investment/contrat.ts",
      "server/investment/ownership.ts",
      "server/investment/revenu.ts",
      "server/investment/health.ts",
      "server/investment/router.ts",
      "server/investment/__tests__/investment.test.ts",
      "server/router.ts",
      "server/modules/contracts.ts",
      "server/engine-registry/perimetres.ts",
      "server/engine-registry/catalog.ts",
      "server/engine-registry/os-bridge.ts",
      "drizzle/0111_investment_engine.sql",
    ],
    lecon:
      "25 vérifications exécutées et réussies (npx tsx server/investment/__tests__/investment.test.ts) sur la logique réellement pure du moteur (extraite exprès de la couche base de données pour rester testable, jamais une réimplémentation parallèle) : calcul de revenu pour les trois modèles financiers, graphe des 12 statuts (aucun saut direct vers ACTIVE, statuts terminaux sans sortie), routeur d'attribution automatique (contrat trouvé, hors période, aucun contrat, incohérence signalée si deux contrats ACTIVE se chevauchent), isolation entre deux investisseurs de pays différents, blocage de double attribution incompatible y compris contre un contrat pas encore ACTIVE. Aucun accès réseau ni base de données réels dans cet environnement de travail (PostgreSQL injoignable) : l'activation réelle (vérification signature+paiement en base), l'attribution automatique en conditions réelles et l'isolation à deux vrais comptes investisseurs restent à confirmer après déploiement — code et typecheck complets vérifiés, aucune nouvelle erreur sur les 54 déjà connues. Reste volontairement non construit dans ce lot, par discipline de lot (moteurs d'abord, une seule brique à la fois) : toute interface (mobile ou web), la nouvelle variante Android Investisseur, le KYC/KYB réel, les versements réels, et le branchement à MKAPMS Intelligent — tous prévus dans les lots suivants de la même priorité.",
    domaine: "moteurs",
  },
  {
    cle: "mobile-5e-variante-investor",
    titre: "5e application Android — MKA.P-MS Investisseur (com.mkapms.investor) — ajoutée sans toucher aux 4 variantes existantes",
    moteurs: ["core"],
    quoi:
      "mobile/variants.json reçoit l'entrée « investor » (appId com.mkapms.investor, appName « MKA.P-MS Investisseur », startPath /investissement), même schéma que les 4 variantes déjà présentes (grandpublic/pro/command/intelligence), toutes intactes et non modifiées — le mécanisme de product flavors Gradle déjà en place (android/app/build.gradle lit mobile/variants.json directement, voir le lot du socle de la variante intelligence) l'a transformée automatiquement en 5e flavor sans aucune ligne de code Android à écrire. Package unique, sans collision avec un package déjà publié. /investissement n'a volontairement aucun écran encore (moteurs construits avant l'interface — server/investment/, lot précédent) : la variante build déjà et produit un .aab valide, l'écran arrive dans le lot d'interface suivant ; en son absence, l'application affiche l'écran 404 existant de la plateforme, jamais un crash.",
    pourquoi:
      "Demande explicite et classée priorité absolue par la direction : ajouter l'application Investisseur sans jamais remplacer ou dégrader intelligence, command, pro ou grandpublic, avec un package/applicationId propre analysé pour éviter toute collision.",
    ou: ["mobile/variants.json"],
    lecon:
      "Vérifié réellement, pas seulement relu : les 5 variantes (grandpublic/pro/command/intelligence/investor) compilées avec succès en debug ET en release avec l'outillage déjà en place (SDK Android 36, AGP 8.2.1, aucune mise à jour nécessaire), .aab générés pour les 5 applications via le script canonique mobile/build-apps.mjs, confirmation par aapt dump badging que l'APK investor embarque bien compileSdkVersion=36, targetSdkVersion=36, versionCode=10705 et applicationId=com.mkapms.investor. Tous les checks du dépôt et le build serveur inchangés. Non réalisable depuis cet environnement, par construction : la fiche Google Play Console de cette nouvelle application (elle n'existe encore nulle part sur Play), sa signature de production et son import — le trousseau de production n'est jamais présent dans ce dépôt ni dans cet environnement de travail.",
    domaine: "moteurs",
  },
  {
    cle: "investment-continuer-sans-sarreter-sur-acces-externes",
    titre: "Application Investisseur — continuer au maximum sans s'arrêter sur les accès externes : KYC réutilisé, Payout, Assistant, interface réelle, HANDOFF DEVAN",
    moteurs: ["investment"],
    quoi:
      "Correction avant que ça merge : le lot précédent avait ajouté un statut KYC/KYB dupliqué (investorKycStatusEnum) alors qu'un vrai moteur KYC générique existe déjà (kycProfiles/kycDocuments, server/routers/kyc.ts, contrôle d'authenticité des pièces via media-authenticity/service.ts, validation humaine). Supprimé, remplacé par server/investment/kyc.ts qui lit kycProfiles.status directement pour investors.userId (et investorOrganizations.proprietaireUserId pour le KYB) — aucun statut à tenir synchrone, un investisseur soumet ses pièces via le trpc.kyc.submitDocuments déjà en production. investisseurEligible() bloque désormais réellement le passage en AWAITING_SIGNATURE tant que le dossier n'est pas \"valide\". Investor Payout complété (payout.ts) : creerPayoutPourPeriode (agrège les vrais mouvements du Ledger sur une période, jamais un montant estimé), confirmerVersement (marque le Ledger \"verse\" seulement à la confirmation réelle), marquerEchec/reessayer/ouvrirLitige, historique immuable (investorPayoutHistory). Table investorPayouts enrichie (investmentId, contractDocumentId, datePrevue/dateReelle, motifEchec, tentatives) pour couvrir les champs minimums exigés. Accès Investisseur à MKA.P-MS Intelligence construit (assistant.ts::poserQuestion) : passe par server/intelligences/routeur.ts (jamais provider.ts), le contexte envoyé au modèle ne contient QUE les données déjà agrégées de cet investisseur (ses investissements, son Ledger, ses versements) — le cloisonnement vient du périmètre du prompt, pas d'une consigne demandée au modèle. Interface web réelle construite (client/src/pages/investissement/, route /investissement) : Dashboard (KPIs réels + onboarding \"devenir investisseur\"), MesInvestissements, Ledger, Versements, Assistant (question libre), Kyc (réutilise le vrai FileUpload + trpc.kyc.submitDocuments) — aucun écran factice, chaque module interroge le vrai routeur investment. 5e variante Android : android/app/src/investor/res/README.md documente le mécanisme d'icône/splash par flavor (identique à intelligence) et l'absence de mécanisme de permissions par variante (pré-existant, partagé par les 5 apps). 3 documents de passage de relais écrits pour tout ce qui dépend réellement d'un accès externe : docs/handoff/google-play-preparation.md (tableau de contrôle des 5 applications, rempli uniquement de faits vérifiables depuis le code), docs/handoff/signature-production.md, docs/handoff/publication-play-console.md.",
    pourquoi:
      "Consigne explicite de la direction : un accès manquant (Google Play Console, keystore de production) ne doit bloquer QUE l'étape qui l'exige, jamais le reste du projet — tout ce qui est techniquement faisable dans cet environnement doit être terminé, et pour chaque blocage réel un HANDOFF DEVAN complet doit être prêt à copier-coller, avec les étapes exactes, pour qu'un agent disposant des accès puisse terminer sans refaire l'audit.",
    ou: [
      "server/investment/schema.ts",
      "server/investment/kyc.ts",
      "server/investment/payout.ts",
      "server/investment/assistant.ts",
      "server/investment/contrat.ts",
      "server/investment/router.ts",
      "server/modules/contracts.ts",
      "drizzle/0111_investment_engine.sql",
      "client/src/pages/investissement/index.tsx",
      "client/src/pages/investissement/modules/",
      "client/src/App.tsx",
      "server/engine-registry/perimetres.ts",
      "android/app/src/investor/res/README.md",
      "docs/handoff/google-play-preparation.md",
      "docs/handoff/signature-production.md",
      "docs/handoff/publication-play-console.md",
    ],
    lecon:
      "Vérifié réellement : typecheck inchangé (54 erreurs préexistantes), tous les checks du dépôt verts, 25/25 vérifications réussies sur la logique pure du moteur, build web+serveur complet réussi, la nouvelle interface /investissement build et charge dans le bundle client réel (confirmé par recherche du texte de la page dans dist/public/assets). Découverte d'architecture qui change la lecture des .aab : les 5 applications Android chargent leur interface à distance (server.url de Capacitor vers www.mkapms.fr/<chemin>, voir capacitor.config.ts) — le .aab n'embarque que la coque native, jamais le contenu web ; c'est pourquoi les 5 .aab (empreintes SHA-256 documentées dans google-play-preparation.md) sont restés strictement identiques avant et après la construction de l'interface Investisseur. Aucun adapter Stripe Connect construit pour les versements réels : vérifié qu'aucun moteur de la plateforme n'en a un non plus (le Wallet Pro existant, server/routers/wallet.ts::requestPayout, s'arrête lui aussi à une demande tracée, jamais un virement automatisé) — investorPayouts suit exactement le même niveau de maturité déjà établi, ce n'est pas une lacune propre à ce lot. Non réalisable depuis cet environnement, par construction (aucun accès Google Play Console, aucun keystore de production) : les 3 HANDOFF DEVAN listent les étapes exactes plutôt que de laisser un simple constat de blocage. Reste à construire, non bloqué par un accès externe : les écrans squelettes détectés dans l'audit U-002 (centre de notifications, Mon espace), le lot Command/PDG/Comptabilité/Direction, le lot Pro, l'audit croisé final des quatre applications.",
    domaine: "moteurs",
  },
  {
    cle: "u002-depannage-ecrans-factices-vers-moteur-reel",
    titre: "U-002 Particulier — écrans dépannage/assistance 100% simulés reliés au vrai moteur depannage ; filtres réels sur Location Particulier",
    moteurs: ["depannage", "achat"],
    quoi:
      "client/src/pages/Depannage.tsx (écran /depannage) était intégralement simulé : un tableau DEPANNEURS de sociétés fictives avec de faux numéros de téléphone à l'apparence réelle, une progression de mission automatique par minuteur, un widget de notation en toast — aucun appel trpc. Remplacé par de vraies requêtes trpc.depannage.providers/myRequests/quotes, une vraie mutation createRequest (avec ses coordonnées GPS et ses photos déjà uploadées), un vrai paiement de devis via payQuote (Stripe Checkout), un renvoi vers le vrai système d'avis /compte/avis à la clôture — plus aucune donnée inventée, état honnête si aucun prestataire n'est encore inscrit. client/src/pages/AssistanceSinistre.tsx (/louer/assistance, écran distinct qui réutilise le même moteur, jamais un second système d'assistance) réécrit à l'identique dans l'esprit : géolocalisation réelle, photos réelles (FileUpload), historique réel filtré sur les statuts terminée/annulée de trpc.depannage.myRequests, bouton d'appel rendu fonctionnel (tel:) sur le numéro déjà affiché sans en inventer un nouveau. server/routers/depannage.ts::createRequest exposait la colonne photos du schéma sans jamais l'accepter en entrée — ajoutée (array d'URLs déjà uploadées, jamais un fichier brut). Par ailleurs, client/src/pages/LocationParticulier.tsx : les cases de filtres (boîte, carburant, équipements, places) et le bouton « Appliquer les filtres » ne modifiaient aucun résultat — trpc.annonces.list acceptait déjà ces paramètres (boite/carburants/equipements/places), simplement jamais transmis depuis cet écran. Reliés via un état filtresCoches/filtresAppliques, avec une divulgation honnête pour les deux cases qui ne correspondent à aucun champ moteur recherchable pour l'instant (« Kilométrage illimité », « Disponible immédiatement »). Le bloc de retour de recherche (compteur de résultats + bouton Effacer) ne s'affichait que si une ville/un texte de recherche était saisi ; étendu pour aussi s'afficher quand des filtres seuls sont appliqués, et le bouton Effacer réinitialise désormais aussi les filtres.",
    pourquoi:
      "Audit U-002 (Particulier) : un écran qui affiche des sociétés et des numéros de téléphone inventés comme s'ils étaient réels n'est pas seulement incomplet, c'est un problème de confiance — la consigne de la direction (« ce qui existe mais est incomplet : compléter sans casser ») imposait de relier ces écrans au moteur depannage déjà entièrement construit côté serveur plutôt que de le laisser inutilisé.",
    ou: [
      "client/src/pages/Depannage.tsx",
      "client/src/pages/AssistanceSinistre.tsx",
      "server/routers/depannage.ts",
      "client/src/pages/LocationParticulier.tsx",
    ],
    lecon:
      "Vérifié réellement : typecheck inchangé (54 erreurs préexistantes), tous les checks du dépôt verts (routers/naming/identite/providers/migrations), gen:moteurs recalculé avec seulement des suppressions d'anomalies (aucune nouvelle dependance_non_declaree ni bouton_sans_action introduite ; les deux dependance_non_declaree restants — country et vo_engine dans intelligences/outils/ — sont préexistants, non touchés par ce lot), build serveur et build client complets réussis. Catégorie de bug distincte à chercher ailleurs dans le même audit : un écran peut être « unwired » (bouton sans action) ou entièrement simulé (données fictives affichées comme réelles) — les deux exigent de vérifier d'abord quel routeur/table existe déjà avant d'écrire une seule ligne de logique serveur.",
    domaine: "moteurs",
  },
  {
    cle: "u002-boutons-non-cables-reprise-devis-historique",
    titre: "U-002 Particulier — boutons non câblés et écrans simulés reliés aux moteurs réels : reprise véhicule, contrôle documents, devis garage, historique véhicule",
    moteurs: ["vo_engine", "kyc", "devis", "garage"],
    quoi:
      "RepriseVehicule.tsx (/vendre/reprise) : formulaire non contrôlé (aucun state), estimation à un montant fixe inventé (18 500 €), boutons Accepter/Négocier sans onClick. Reconstruit sur le vrai moteur server/vo-engine : trpc.voEngine.estimate (fourchette réelle, jamais un prix ferme, avec son disclaimer honnête), trpc.voEngine.requestReprise, historique réel via myRepriseRequests. Accepter/Négocier n'avaient aucune contrepartie serveur exposée au client (seuls offerReprise et setRepriseStatus existaient, réservés à l'admin) : ajouté server/vo-engine/service.ts::accepterOffreReprise/negocierOffreReprise (vérifient que la demande appartient bien à l'appelant, transition uniquement depuis offre_proposee) et exposés en protectedProcedure (voEngineRouter.accepterOffre/negocierOffre) — complète une transition d'état déjà modélisée dans le moteur, n'invente pas une nouvelle règle métier. ControleDocuments.tsx (/louer/controle-documents) : les 5 vérifications étaient toutes câblées en dur sur \"valide\" quel que soit l'utilisateur. Relié au vrai moteur KYC générique (trpc.kyc.myProfile/submitDocuments, kycProfiles/kycDocuments) pour permis de conduire et pièce d'identité ; l'âge minimum et l'ancienneté du permis n'ont aucun détecteur automatique réel (le contrôle d'authenticité des pièces ne lit pas de date de naissance) — affichés comme relevant de l'examen humain du dossier plutôt que simulés \"valide\" ; le contrôle \"moyen de paiement\" n'a pas d'équivalent moteur (aucune carte enregistrée à l'avance nulle part sur la plateforme, le paiement se fait via Stripe Checkout au moment de la réservation) — remplacé par une note honnête plutôt qu'une case verte inventée. Devis.tsx (/devis, étapes 5-6-7) : le tableau GARAGES (5 garages fictifs, adresses et numéros de téléphone à l'apparence réelle) a été supprimé et remplacé par trpc.garages.list/get (annuaire réel garages_publics) ; la case \"Filtrer\" est désormais reliée à un refetch réel, le rayon en km reste honnêtement signalé comme non branché côté moteur. Le libellé de confirmation ne prétend plus que la demande de devis est envoyée au seul garage consulté (server/routers/devis.ts::create ne prend pas de garageId — la demande est diffusée aux garages partenaires, pas ciblée) : le texte a été corrigé en conséquence. HistoriqueVehiculeVente.tsx (/acheter/historique-vehicule) : cas le plus sérieux — un rapport 100% fictif et identique (\"aucun sinistre\", \"non gagé\", \"non volé\") s'affichait pour n'importe quel VIN/plaque saisi, ce qui pouvait induire un acheteur en erreur sur un vrai achat. Remplacé par l'identification technique réelle (trpc.annonces.lookupPlate, déjà utilisée ailleurs) et une divulgation honnête : aucun registre externe (assureurs, fichier des véhicules gagés/volés, historique constructeur) n'est branché sur la plateforme, donc ce périmètre n'est pas vérifié — HANDOFF DEVAN écrit (docs/handoff/historique-vehicule-registres-externes.md) pour la connexion future à ces registres, qui dépend d'accès et de contrats externes.",
    pourquoi:
      "Suite de l'audit U-002 : au-delà des simples boutons sans action, plusieurs écrans affichaient des données commerciales ou réglementaires inventées comme si elles étaient réelles (montant de reprise fixe, contrôle documentaire toujours vert, rapport d'historique véhicule toujours vierge) — un problème de confiance et, pour l'historique véhicule, un risque direct sur une décision d'achat.",
    ou: [
      "client/src/pages/RepriseVehicule.tsx",
      "server/vo-engine/service.ts",
      "server/vo-engine/index.ts",
      "client/src/pages/ControleDocuments.tsx",
      "client/src/pages/Devis.tsx",
      "client/src/pages/HistoriqueVehiculeVente.tsx",
      "server/engine-registry/catalog.ts",
      "docs/handoff/historique-vehicule-registres-externes.md",
    ],
    lecon:
      "Vérifié réellement : typecheck inchangé (54 erreurs préexistantes, aucune dans les fichiers touchés), tous les checks du dépôt verts, gen:moteurs recalculé avec 8 bouton_sans_action de moins et un dependance_non_declaree temporairement apparu (trpc.garages appelé depuis Devis.tsx sans que le moteur achat ne déclare garage en dépendance) — corrigé en l'ajoutant à catalog.ts, retour à la ligne de base. Build serveur et client complets réussis. Une transition d'état déjà modélisée côté serveur mais réservée à l'admin (setRepriseStatus) n'est pas forcément la bonne procédure à exposer au client : mieux vaut écrire une fonction dédiée qui vérifie la propriété de la ressource (accepterOffreReprise/negocierOffreReprise) que d'ouvrir l'accès admin existant. Quand aucun moteur réel n'existe pour une promesse affichée à l'écran (historique véhicule complet), la bonne réponse n'est pas un faux plus petit ou plus prudent : c'est une divulgation honnête de ce qui est vérifié et de ce qui ne l'est pas, avec un HANDOFF DEVAN si l'écart dépend d'un accès externe.",
    domaine: "moteurs",
  },
  {
    cle: "u002-centre-notifications-20-ecrans-relies",
    titre: "U-002 Particulier — les 20 écrans /notifications/* reliés aux vrais moteurs (notifications, KYC, préférences, contrats)",
    moteurs: ["notification", "kyc", "contract"],
    quoi:
      "Le centre de notifications (client/src/pages/Notifications.tsx) était lui-même 100% simulé (tableau NOTIFS de 23 notifications inventées — faux acheteurs, faux montants, fausses références) et ses 19 écrans dérivés sous /notifications/* se contentaient de rendre ce même composant sans filtre, quel que soit leur nom (dépannage, garage, paiements…) — 19 URLs différentes montrant strictement le même contenu fictif. Reconstruit en 3 couches réutilisables : (1) Notifications.tsx lit désormais trpc.notifications.list (table notifications, alimentée par la fonction notifyEvent depuis tout le serveur) et accepte un prop filtreTypes basé sur le champ réel `type` (= inappType du catalogue de déclencheurs, server/notification-os/triggers.ts) — 12 écrans (Générale, Vente, Location, Garage, Dépannage, Messages, Paiements, Démarches, AlertesUrgentes, AnnoncesImportantes, HistoriqueNotifications, RappelsAutomatiques) lui passent chacun un sous-ensemble réel et documenté de types, jamais une catégorie inventée ; markRead/markAllRead sont de vraies mutations, la modale de détail n'affiche plus les champs ref/montant/acteur qui n'existent pas dans le vrai schéma. (2) DocumentsVault.tsx (nouveau, partagé) réutilise le vrai coffre-fort KYC déjà en production (trpc.kyc.myProfile, kycDocuments) filtré par docType — sert CoffreFortNumerique (tout), DocumentsPersonnelsGlobal (identité/permis/domicile), DocumentsEntreprises (KBIS/RIB), DocumentsVehicules (carte grise/contrôle technique) : aucun second coffre-fort créé. (3) NotificationPreferences.tsx (nouveau, partagé) réutilise le vrai moteur de préférences (trpc.notificationOs.preferences.me/update, table notif_user_preferences) — sert ParametresNotifications (canaux + digest + heures de silence), CanauxCommunication (canaux seuls), ObjectifNotifications (rythme : digest + heures de silence). SignaturesGlobales.tsx reconstruit sur le vrai moteur de contrats (trpc.contracts.mine/sign, generated_documents/document_signatures) : liste réelle des documents en attente de signature et signés, bouton Signer réellement fonctionnel. Corrigé au passage une valeur d'énumération KYC fausse introduite dans le lot précédent (ControleDocuments.tsx utilisait \"non_verifie\", le vrai statut par défaut est \"non_demarre\").",
    pourquoi:
      "U-071 (finir U-002 Particulier) nommait explicitement les écrans de notifications comme des coquilles à compléter. Le problème dépassait la coquille vide : le centre de notifications affichait de fausses données commerciales (acheteurs, montants) comme si elles étaient réelles, et ses 19 déclinaisons n'avaient aucune valeur ajoutée l'une sur l'autre puisqu'aucune ne filtrait quoi que ce soit.",
    ou: [
      "client/src/pages/Notifications.tsx",
      "client/src/pages/DocumentsVault.tsx",
      "client/src/pages/NotificationPreferences.tsx",
      "client/src/pages/notifications/*.tsx",
      "client/src/pages/ControleDocuments.tsx",
      "server/engine-registry/catalog.ts",
    ],
    lecon:
      "Vérifié réellement : typecheck inchangé (54 erreurs préexistantes, aucune dans les 24 fichiers touchés), tous les checks du dépôt verts, gen:moteurs recalculé avec 1 ecran_sans_contenu et 3 bouton_sans_action de moins et un dependance_non_declaree temporairement apparu (trpc.contracts appelé depuis SignaturesGlobales.tsx sans que le moteur notification ne déclare contract en dépendance) — corrigé dans catalog.ts, retour à la ligne de base (2). Build serveur et client complets réussis. Vingt écrans au nom distinct qui délèguent tous au même composant sans le paramétrer ne sont pas vingt fonctionnalités : le bon niveau de correction est un seul composant de base réellement connecté au moteur, paramétré honnêtement par écran — jamais dix-neuf réécritures indépendantes du même faux contenu. Une catégorie affichée à l'écran doit toujours être un sous-ensemble documenté de valeurs qui existent réellement en base (ici le champ `type`), jamais une catégorie que l'écran invente pour faire joli.",
    domaine: "moteurs",
  },
  {
    cle: "u002-mon-espace-16-ecrans-relies-plus-3-procedures-ajoutees",
    titre: "U-002 Particulier — les 16 écrans squelettes de Mon espace reliés aux vrais moteurs ; 3 procédures manquantes ajoutées (mesPaiements, accepterOffreReprise déjà fait, sécurité restée inutilisée côté client)",
    moteurs: ["favoris", "abonnements", "reservations", "messaging", "support", "pieces", "annonces", "kyc", "pro_portal", "identity", "search"],
    quoi:
      "16 des 18 écrans sous client/src/pages/utilisateurs/ (AbonnementsUtilisateur, CentreAlertesUtilisateur, CentreFavorisUtilisateur, CentreSupportUtilisateur, CompteProUtilisateur, DocumentsPersonnels, FacturesUtilisateur, HistoriqueAchats, HistoriqueDemarches, HistoriqueDepannages, HistoriqueEntretiens, HistoriqueLocations, MesVehicules, MessagerieGlobale, ObjectifUtilisateur, SecuriteUtilisateur, TableauBordPerso) étaient des coquilles identiques de 10 lignes (« Module X », aucun appel serveur). Reliés chacun au moteur réel déjà construit et jusque-là inutilisé par un écran client : favoris.mine/toggle, abonnements.mine/listPlans/openPortal (portail Stripe réel), reservations.mine (filtré par type rental pour les locations), messages.listThreads, support.myTickets/submit/faq, pieces.myServiceTracking (suivi universel tous univers, pour l'écran « démarches »), annonces.mine (mes véhicules mis en ligne), kyc.myProfile (réutilisé, DocumentsPersonnels = CoffreFortNumerique sans filtre), pro.getProfile (compte professionnel), depannage.myRequests et garages.myInterventions (déjà utilisés ailleurs). Découverte au passage : historiqueRouter (server/routers/historique.ts, table vehicle_reports) est un vrai moteur de demande de rapport d'historique véhicule (VIN/plaque, statuts en_attente/pret/echec, colonnes sinistres/controlesTechniques/proprietaires/entretien/rappelsConstructeur) que le lot précédent (u002-depannage-ecrans-factices-vers-moteur-reel) n'avait pas trouvé — HistoriqueVehiculeVente.tsx et son HANDOFF DEVAN ont été corrigés en conséquence : la demande et le stockage sont réels, seul le remplissage depuis un registre externe reste bloqué. Découverte d'une vraie lacune serveur (jamais un moteur inventé pour la combler) : aucune procédure ne permettait à un client de lister ses propres paiements de la table `payments` (alimentée par createPaymentCheckout pour dépannage/garage/réservation/abonnement) — le routeur du moteur de paiement générique expose une procédure « mine » équivalente, mais elle lit une table différente (paymentTransactions) restée vide pour ces paiements. Ajouté reservations.mesPaiements (protectedProcedure, scope ctx.user.uid) — sert FacturesUtilisateur et HistoriqueAchats (filtré sur type vehicle_purchase / payment_kind pieces_order). Découverte d'un moteur de sécurité entier (server/identity-os/router.ts : changePassword, mfa.status/setup/enable/disable, sessions.list/revoke, audit.recent) déjà construit côté serveur mais jamais appelé par aucun écran client — SecuriteUtilisateur.tsx le branche entièrement. ObjectifUtilisateur.tsx affiche des étapes de complétion réelles (pièce d'identité envoyée, dossier validé, double authentification activée, première annonce, premier favori) — jamais un score ou pourcentage inventé, chaque étape est vraie ou fausse à partir d'un vrai moteur. TableauBordPerso.tsx agrège des compteurs réels déjà exposés (favoris, annonces, notifications/messages non lus, réservations).",
    pourquoi:
      "U-071 nommait explicitement les écrans « Mon espace » comme des coquilles à compléter. La quasi-totalité des moteurs nécessaires existaient déjà côté serveur, jamais appelés par un écran — la règle « auditer → conserver → compléter » s'appliquait ici presque intégralement en simple câblage, avec une seule vraie lacune serveur trouvée et comblée (mesPaiements) plutôt que travaillée autour.",
    ou: [
      "client/src/pages/utilisateurs/*.tsx",
      "server/routers/reservations.ts",
      "client/src/pages/HistoriqueVehiculeVente.tsx",
      "docs/handoff/historique-vehicule-registres-externes.md",
      "server/engine-registry/catalog.ts",
    ],
    lecon:
      "Vérifié réellement : typecheck inchangé (54 erreurs préexistantes, aucune dans les fichiers touchés — deux erreurs introduites puis corrigées : photoPrincipale absent d'annonces.mine, type optionnel du retour de mfa.setup), tous les checks du dépôt verts, gen:moteurs recalculé avec 10 dependance_non_declaree de moins (achat, depannage, garage, messaging, payment, pieces, pro_portal, search, support ajoutés à identity ; analytics ajouté à achat) et un faux positif détecté et corrigé : le scanner de dépendances repère tout appel textuel à la fonction notifyEvent, y compris dans une chaîne de description ; la précédente entrée de mémoire technique nommait cette fonction avec ses parenthèses d'appel, ce que le scanner ne pouvait pas distinguer d'un vrai appel — reformulé sans les parenthèses pour ne plus déclencher la détection, sans toucher au scanner lui-même. Build serveur et client complets réussis. Avant de conclure qu'une capacité manque (comme pour l'historique véhicule dans le lot précédent), chercher par le nom de la table ou du concept métier (ici `vehicle_reports`) et pas seulement par les routeurs déjà visités — une conclusion « aucun moteur réel » doit rester révisable.",
    domaine: "moteurs",
  },
  {
    cle: "u071-liens-dynamiques-audit-27-fichiers",
    titre: "U-071 point 1 — audit des liens dynamiques (to={variable}, le point mort du scanner) : dizaines de destinations mortes corrigées, deux écrans encore simulés découverts et reliés à de vrais moteurs",
    moteurs: ["achat", "analytics", "garage", "demarches", "finance", "pieces", "partenaires"],
    quoi:
      "Audit systématique des 35 fichiers utilisant `to={variable}` (le point mort connu du scanner de liens, qui ne lit que les chaînes littérales `to=\"/...\"`) : extraction de chaque valeur littérale assignée à to/url/link/chemin/path dans un tableau ou objet, comparaison avec le registre réel des 708 routes. Corrigées : GarageGenerale.tsx (7 liens : /garage/devis→/garage/demande-devis, /garage/rendez-vous→/garage/prise-rendez-vous, etc.), TableauBordChefAtelier.tsx (6 liens vers les vraies routes -atelier/gestion-*), DemarchesGenerale.tsx (7 liens vers les vraies routes -demarche/declaration-*), FinanceGenerale.tsx (6 liens), PiecesGenerale.tsx (9 liens vers pieces-*), PartenairesGenerale.tsx (8 occurrences du même lien mort /partenaires/inscription→/partenaires/inscription-partenaire), LocationVoiture.tsx (/location-particulier, /location-pro → /louer/particulier, /louer/pro), HomePro.tsx et TableauBordProVente.tsx/TableauBordVendeur.tsx (routes vers un composant jamais monté sous ce chemin), SmartEngine/ControlCenter.tsx (/messages→/messagerie), Vehicule.tsx (/assurance : aucune fiche assurance particulier n'existe nulle part sur la plateforme, ni côté route ni côté moteur — les 2 cartes publicitaires \"Assurance\" ont été retirées plutôt que pointées vers rien ; /compte/documents et /compte/factures qui ne correspondent à aucun onglet reconnu par Compte.tsx → /compte?tab=coffre et /comptabilite). Historique.tsx : 5 liens vers /compte/documents/* (jamais reconnus par Compte.tsx, qui ne lit que le paramètre ?tab=, jamais un segment de chemin) → corrigés vers /compte?tab=rapports, /compte?tab=coffre, /utilisateurs/factures-utilisateur. Découverte au passage, en vérifiant le contexte de ces liens : Favoris.tsx (écran /favoris, distinct de celui déjà refait dans Mon espace) et HistoriqueConsultations.tsx étaient entièrement simulés — véhicules, garages et carrosseries fictifs avec photos de stock Unsplash présentées comme de vraies annonces, notes inventées. Favoris.tsx reconstruit sur le vrai moteur trpc.favoris (mine/toggle) — qui ne couvre que les véhicules (table favoris, colonne annonceId unique) : les catégories garage/carrosserie/enchère/pièce n'ont aucune contrepartie réelle, retirées plutôt que maintenues fictives. HistoriqueConsultations.tsx reconstruit sur une découverte : trpc.annonces.get appelle déjà recordView() à chaque consultation réelle d'une fiche véhicule (server/smart-engine/services/user-memory.ts, table smart_user_memory), exposé via trpc.smartEngine.myMemory({type:\"view\"}) — jamais utilisé par aucun écran jusqu'ici. Compte.tsx : l'onglet \"rapports\" (Mes rapports historiques) affichait un DEMO_RAPPORTS de 2 plaques inventées — relié à trpc.historique.myReports (le même vrai moteur de demande de rapport découvert dans le lot précédent).",
    pourquoi:
      "Le point 1 de la clôture U-071 demandait explicitement l'audit des liens dynamiques en ne corrigeant que ceux réellement morts. Vérifier le contexte de chaque lien (pas seulement sa destination) a révélé, comme le prévoyait la consigne de clôture, deux écrans supplémentaires affichant des données inventées comme réelles — corrigés avec les mêmes moteurs réels déjà utilisés ailleurs (favoris, smart-engine, historique), jamais un nouveau système inventé.",
    ou: [
      "client/src/pages/garage/GarageGenerale.tsx",
      "client/src/pages/garage/TableauBordChefAtelier.tsx",
      "client/src/pages/demarches/DemarchesGenerale.tsx",
      "client/src/pages/finance/FinanceGenerale.tsx",
      "client/src/pages/pieces/PiecesGenerale.tsx",
      "client/src/pages/partenaires/PartenairesGenerale.tsx",
      "client/src/pages/LocationVoiture.tsx",
      "client/src/pages/HomePro.tsx",
      "client/src/pages/TableauBordProVente.tsx",
      "client/src/pages/vente/TableauBordVendeur.tsx",
      "client/src/pages/SmartEngine/ControlCenter.tsx",
      "client/src/pages/Vehicule.tsx",
      "client/src/pages/Historique.tsx",
      "client/src/pages/Compte.tsx",
      "client/src/pages/Favoris.tsx",
      "client/src/pages/HistoriqueConsultations.tsx",
      "server/engine-registry/catalog.ts",
    ],
    lecon:
      "Vérifié réellement : typecheck inchangé (54 erreurs préexistantes, aucune dans les fichiers touchés), tous les checks du dépôt verts, gen:moteurs recalculé avec destination_inconnue -1 et dependance_non_declaree temporairement +1 (achat ajouté à analytics pour couvrir trpc.annonces depuis HistoriqueConsultations.tsx) — retour à la ligne de base. Build serveur et client complets réussis. Le point mort du scanner (`to={variable}`) cache deux catégories différentes derrière la même syntaxe : une destination fixe mais mal orthographiée (corrigible mécaniquement par comparaison au registre) et un tableau de données entièrement inventées dont chaque `to` n'est que le symptôme le plus visible — la seconde catégorie n'apparaît qu'en lisant le contexte autour du lien, jamais par la seule comparaison de chaînes.",
    domaine: "moteurs",
  },
  {
    cle: "u071-isolation-pro-particulier-64-routes-gardees",
    titre: "U-071 point 2 — isolation Pro/Particulier : 64 routes professionnelles/internes verrouillées par rôle, réutilisant le Permission Engine déjà construit",
    moteurs: ["identity", "achat"],
    quoi:
      "Audit du web (une seule application React pour les 4 profils — l'isolement mobile ne vient que du startPath par variante Android, jamais d'un cloisonnement web) : aucune route professionnelle/interne n'était protégée côté client au-delà du cas VO Interne (VoProGate, déjà réel et server-verifié). /superadmin/* (46 routes), /comptabilite* et /compta-dirigeant (14), /atelier-pro, /catalogue-technique, /suivi-vehicule, /dossier-client, /journal-activite (1 chacune) rendaient leur composant réel pour n'importe quel visiteur tapant l'URL — seule leur visibilité dans le menu Compte.tsx était déjà filtrée par canAccessServicePath, jamais la route elle-même. Nouveau composant client/src/components/RequirePermission.tsx : réutilise exactement le Permission Engine déjà construit et partagé client/serveur (shared/permissions.ts, MODULE_ACCESS/canAccessModule) — aucune nouvelle règle d'accès inventée, seulement appliquée là où elle ne l'était pas. Nouveau wrapper `<P module=\"...\" name=\"...\">` dans App.tsx (même famille que `<U>`/`<V>` déjà existants) appliqué mécaniquement aux 64 routes concernées, script one-shot vérifiant la correspondance route→module contre le registre réel plutôt qu'une saisie manuelle. Les 46 routes /superadmin/* verrouillées sur le module \"back_office\" (accessible employee/admin/super_admin, jamais user/pro/garage/society) plutôt que \"super_admin\" (réservé PDG) — un verrouillage trop strict aurait cassé l'accès déjà fonctionnel du personnel admin/employé, hypothèse vérifiée contre la matrice MODULE_ACCESS existante avant d'écrire le code. Trois destinations \"Comptabilité Pro / Factures\" pointées par erreur vers /comptabilite (lot précédent) corrigées vers /utilisateurs/factures-utilisateur (écran personnel réel, ouvert à tout compte authentifié) puisque /comptabilite est réservé admin/PDG, pas accessible à un simple compte pro/vendeur.",
    pourquoi:
      "Consigne explicite de la direction : ne pas supprimer le contenu Pro visible depuis l'app Particulier (cartes publicitaires, CTA \"devenir professionnel\"…) mais empêcher tout accès réel aux espaces de travail professionnels — l'audit a montré que ce n'était déjà plus vrai dès qu'un particulier tapait directement l'URL, malgré le menu correctement filtré.",
    ou: [
      "client/src/components/RequirePermission.tsx",
      "client/src/App.tsx",
      "client/src/pages/Vehicule.tsx",
      "client/src/pages/TableauBordProVente.tsx",
      "client/src/pages/vente/TableauBordVendeur.tsx",
    ],
    lecon:
      "Vérifié réellement, pas seulement relu : base Postgres locale jetable montée dans cet environnement (aucune donnée réelle touchée, aucun identifiant Railway utilisé), 111 migrations appliquées, serveur et client lancés en développement, un vrai compte particulier et un vrai compte professionnel (profil pro_vente) créés par le vrai formulaire d'inscription — 26/27 vérifications automatisées réussies par navigateur piloté (Playwright) : le compte particulier accède à ses 12 écrans réels (recherche, favoris, Mon espace, notifications, sécurité, garage, dépannage, coffre KYC…) et se voit bloqué avec le verrou « Espace professionnel » sur les 9 routes désormais gardées ; le compte pro_vente reste également bloqué sur /comptabilite et /superadmin (réservés admin), et obtient le vrai verdict serveur VoProGate sur /vente. Le seul échec (1/27) était un bogue du script de test lui-même (sélecteur ambigu entre le menu devise et le menu type de compte), pas un bogue de l'application — corrigé et revérifié. Une visibilité de menu déjà filtrée ne prouve rien sur l'accès réel à la route : les deux doivent être vérifiés séparément, et le filtre de menu existant (canAccessServicePath) reste un bon indicateur de quel module chaque route protégée doit utiliser plutôt que de deviner.",
    domaine: "moteurs",
  },
  {
    cle: "u002-cloture-residu-18-liens-morts-particulier",
    titre: "U-002 clôture — balayage final des destination_inconnue restantes : 18 liens morts strictement Particulier corrigés, le reste (Pro/Vente/Garage) explicitement hors périmètre",
    moteurs: ["achat", "location", "vente", "pieces", "depot_annonce"],
    quoi:
      "Avant de clore U-002, relecture complète des 46 destination_inconnue du registre réel (server/data/cliquables.ts) plutôt que de s'arrêter aux fichiers déjà audités. Triées par appartenance réelle à l'app Particulier : MotoOccasion.tsx (2 liens vers /vente-moto, jamais créée — le vrai composant renommé vit sur /acheter/moto, déjà réel et lisant les mêmes paramètres de recherche transmis) ; Historique.tsx (2 liens /auth?redirect=… vers une route qui n'a jamais existé — /connexion, qui ne lit de toute façon aucun paramètre redirect/mode, donc pas de fonctionnalité perdue) ; Louer.tsx et VenteGenerale.tsx (/messages → /messagerie, même faute que dans le lot précédent, deux occurrences supplémentaires) ; les 9 écrans pieces/Pieces*.tsx (/pieces/recherche → /pieces/recherche-intelligente-pieces, vrai écran de recherche) ; VtcTaxi.tsx (CTA « Devenir partenaire » vers /inscription-pro, jamais créée — /connexion, où le profil VTC/Taxi est déjà sélectionnable au formulaire d'inscription réel) ; depot-annonce/OptionsAnnonce.tsx (/depot-annonce/analyse-ia → /depot-annonce/analyse-i-a, le sigle de MKA.P-MS Intelligences étant toujours découpé lettre par lettre par le générateur de routes). TableauBordProVente.tsx (/profil → /compte?tab=profil, onglet réel de Compte.tsx) corrigé au passage bien que ce tableau de bord soit un écran Pro, la ligne était déjà ouverte. Les 28 destination_inconnue restantes (vente/*.tsx vers /vente/tableau-de-bord-pro, garage/*.tsx vers des routes de gestion de flotte) appartiennent toutes à l'app Pro/Vente/Garage — explicitement laissées pour le futur lot Pro, pas ouvertes ici pour ne pas empiler un chantier non demandé sur celui-ci.",
    pourquoi:
      "Consigne de clôture stricte de la direction : une partie commencée se ferme à 100 % de ce qui est faisable avant d'en ouvrir une autre — un balayage final du registre réel (pas seulement des fichiers déjà visités) était nécessaire pour vérifier qu'aucune anomalie strictement Particulier ne restait derrière avant de déclarer U-002 terminé.",
    ou: [
      "client/src/pages/MotoOccasion.tsx",
      "client/src/pages/Historique.tsx",
      "client/src/pages/Louer.tsx",
      "client/src/pages/VenteGenerale.tsx",
      "client/src/pages/pieces/PiecesAccessoires.tsx",
      "client/src/pages/pieces/PiecesBatteries.tsx",
      "client/src/pages/pieces/PiecesCarrosserie.tsx",
      "client/src/pages/pieces/PiecesEclairage.tsx",
      "client/src/pages/pieces/PiecesFreinage.tsx",
      "client/src/pages/pieces/PiecesHuiles.tsx",
      "client/src/pages/pieces/PiecesMoteur.tsx",
      "client/src/pages/pieces/PiecesPneumatiques.tsx",
      "client/src/pages/pieces/PiecesSuspension.tsx",
      "client/src/pages/VtcTaxi.tsx",
      "client/src/pages/depot-annonce/OptionsAnnonce.tsx",
      "client/src/pages/TableauBordProVente.tsx",
    ],
    lecon:
      "Vérifié réellement : typecheck inchangé (54 erreurs préexistantes), tous les checks du dépôt verts, gen:moteurs recalculé — destination_inconnue passe de 46 à 28, exactement les 18 corrections attendues, aucune régression. Build serveur et client complets réussis. Un audit qui s'arrête aux fichiers déjà repérés par le fil des tâches précédentes laisse toujours un résidu : relire le registre généré au complet, une seule fois à la fin, coûte peu et referme ce que l'audit progressif avait manqué.",
    domaine: "moteurs",
  },
  {
    cle: "intelligences-chantier-developpement-24-outils-garage-vitrine-preuve",
    titre: "MKA.P-MS Intelligences — Chantier de développement : Project Engine, File System Tools, shell sandboxé, Preview Engine et 24 outils réellement exécutables, prouvés sur un site vitrine garage complet",
    moteurs: ["intelligences"],
    quoi:
      "Nouveau sous-dossier server/intelligences/chantier/ (fs.ts, shell.ts, projets.ts, scripts.ts, preview.ts, plan.ts, service.ts) : premier Project Engine du dépôt (table in_projets, un dossier disque réel isolé par propriétaire, jamais partagé entre deux comptes), 10 File System Tools confinés au workspace du projet (aucune sortie possible, chemin résolu et son vrai lien symbolique vérifiés à chaque appel), un exécuteur shell limité par liste fermée de binaires (npm/npx/node, arguments toujours un tableau — jamais une chaîne interprétée par un shell, donc aucune injection possible), ulimit (mémoire/temps CPU) et délai horloge strict, sortie plafonnée et journal complet écrit dans le workspace du projet plutôt que recopié en base. dependencies.install/build.run/test.run/lint.run/typecheck.run lisent le vrai package.json du projet et lancent le script qu'il déclare, sans jamais accepter de commande arbitraire — honnêtement « rien à faire » quand le script n'existe pas. Preview Engine à deux modes réels : serveur statique interne (aucune dépendance requise) quand un index.html existe, ou détection du port annoncé par un vrai script dev/start/preview quand les dépendances sont installées — jamais public, toujours sur localhost, arrêté explicitement ou remplacé au démarrage suivant. Planning Agent (plan.ts) qui produit un plan structuré (fichiers concernés, outils nécessaires, risques, ordre, critères de validation) avant chaque demande, injecté dans la conversation plutôt que bloquant une seule petite action. Les 24 outils demandés (project.create/open/read, filesystem.list/read/write/edit/move/delete/search, code.generate/edit/refactor, shell.execute, dependencies.install, build.run, test.run, lint.run, typecheck.run, preview.start/stop/status, error.analyze, code.fix) enregistrés au Tool Registry réel (nouvelles catégories « projets » et « developpement », server/intelligences/outils/familles/chantier.ts + outils-chantier.ts) avec implementationStatus « IMPLEMENTED » et riskLevel READ_ONLY à MEDIUM uniquement — jamais HIGH/CRITICAL, la règle non négociable de politique.ts (refus systématique au-delà de MEDIUM) reste donc pleinement respectée sans dérogation. Chaîne strictement Provider-Agnostic : le Planning Agent et error.analyze passent par routeur.ts::router() comme le reste du moteur, jamais un appel direct à un fournisseur. Extension additive nécessaire du socle Tool Registry, jamais touchée jusqu'ici : boucle.ts/executeur.ts transmettent maintenant un contexte d'appelant réel (rôle, moteur, actorId) à chaque implémentation — un projet ne peut être ouvert, lu ou modifié que par son propriétaire réel, jamais déduit du seul identifiant transmis par le modèle dans ses arguments. Nouveau point d'entrée intelligencesRouter.chantierDemander (pdgProcedure, réservé au PDG comme le reste du côté direction) : une demande en langage naturel devient un plan puis une exécution réelle via la boucle d'outils déjà existante (server/intelligences/outils/boucle.ts) — aucun second orchestrateur créé, orchestrateur.ts reste inchangé et sert un autre objectif (MKA.P-MS Intelligences corrigeant le code de la plateforme elle-même, pas construisant un nouveau projet isolé).",
    pourquoi:
      "Consigne explicite de la direction, immédiatement après la clôture de U-002 : rendre MKA.P-MS Intelligences capable de construire un petit site de bout en bout (« crée-moi un site vitrine pour un garage ») en construisant uniquement les capacités nécessaires à ce flux précis — sans coder les paiements, le déploiement Railway, GitHub ou tout autre outil métier déjà enregistré ailleurs, et sans dupliquer un moteur par langage de programmation.",
    ou: [
      "server/intelligences/schema.ts",
      "server/intelligences/chantier/fs.ts",
      "server/intelligences/chantier/shell.ts",
      "server/intelligences/chantier/projets.ts",
      "server/intelligences/chantier/scripts.ts",
      "server/intelligences/chantier/preview.ts",
      "server/intelligences/chantier/plan.ts",
      "server/intelligences/chantier/service.ts",
      "server/intelligences/outils/familles/chantier.ts",
      "server/intelligences/outils/familles/outils-chantier.ts",
      "server/intelligences/outils/registre.ts",
      "server/intelligences/outils/implementations.ts",
      "server/intelligences/outils/executeur.ts",
      "server/intelligences/outils/boucle.ts",
      "server/intelligences/outils/outils-test.ts",
      "server/intelligences/index.ts",
      "drizzle/0113_intelligences_chantier.sql",
    ],
    lecon:
      "Vérifié réellement, en trois couches, sur base Postgres locale jetable (aucun accès Railway) : (1) chaîne de production complète — registre.trouver → politique.evaluer → executeur.executer → audit.journaliser — exercée pour les 24 outils sur un vrai scénario garage vitrine, 27/27 vérifications réussies : projet créé sur disque réel, isolation confirmée (un autre compte ne peut pas ouvrir le projet), fuite hors workspace refusée, binaire hors liste refusé, dépendances réellement installées, premier build réellement échoué sur un bogue volontaire (balise <title> manquante), correction réellement écrite puis second build réellement réussi, aperçu statique réellement démarré et sa page réellement vérifiée en HTTP (200, contenu généré confirmé) puis arrêté ; (2) boucle d'outils réelle (executerAvecOutils) pilotée sur plusieurs tours par un modèle scripté injecté — même technique que le test existant de boucle.ts, puisqu'aucune variable d'environnement de clé de fournisseur de modèle n'est configurée dans cet environnement de travail — confirmant que la boucle de production, pas une simulation, exécute réellement project.create puis filesystem.write avec le fichier retrouvé sur disque ; (3) point d'entrée complet service.demander() appelé sans aucun mock : échoue honnêtement avec le motif exact (fournisseur de modèle absent), sans exception, sans texte fabriqué — la règle du moteur (jamais une réponse plausible inventée) tient aussi pour cette nouvelle capacité. Bogue réel trouvé et corrigé en cours de route : les trois appels routeur.ts (boucle principale, Planning Agent, error.analyze) omettaient `confidentialite: \"interne\"`, or « raisonnement » exige ce niveau exact — sans ce correctif, la capacité entière aurait toujours été refusée même avec une vraie clé de fournisseur configurée. Limite honnêtement documentée, jamais présentée comme résolue : les limites mémoire/CPU du shell sandboxé reposent sur `ulimit` (bash), un isolement en meilleur effort — aucun cgroup ni Docker n'existe dans cet environnement de travail, donc aucun isolement noyau réel n'est revendiqué. Les workspaces de projet vivent sur un disque local temporaire (hors du dépôt), cohérent avec la consigne « aperçu temporaire, jamais public » de ce lot — leur persistance durable (volume, stockage objet) reste un sujet du lot GitHub/déploiement à venir, pas de celui-ci. Test existant server/intelligences/outils/__tests__/boucle.test.ts mis à jour (29 → 31 familles au registre, nouveau compte exact) plutôt que contourné — 60/60 vérifications réussies après correction. Typecheck inchangé (54 erreurs préexistantes), gen:moteurs stable (aucune nouvelle dépendance non déclarée), build serveur et client complets réussis.",
    domaine: "intelligences",
  },
  {
    cle: "chantier-maitre-connexion-plateforme-lot-01-cartographie-contexte-couverture",
    titre: "Chantier maître — connexion de MKA.P-MS Intelligences à toute la plateforme, LOT 01 : Universe Registry, Context Engine, Intelligence Coverage",
    moteurs: ["intelligences"],
    quoi:
      "Nouveau Universe Registry (server/intelligences/univers/mapping.ts + registre.ts) : cartographie calculée, jamais retapée — chaque moteur du Engine Registry réel (server/engine-registry/catalog.ts, 89 moteurs) rattaché à exactement un « univers » métier (18 au total : identité & comptes, marketplace particulier, marketplace professionnel, VTC & taxi, garage & atelier, pièces & stock, transport & livraison, carte grise & documents, paiements & finance, comptabilité, marketing & visibilité, assurance & énergie, enchères, support & messagerie, partenaires & fournisseurs, investisseur, MKA.P-MS Intelligences produit, et un univers « infrastructure plateforme » qui regroupe nommément les 37 moteurs transversaux techniques sans les cacher) ; registre.ts échoue explicitement si un moteur réel n'a pas d'univers déclaré, ou si mapping.ts pointe vers un moteur qui n'existe plus — jamais un décalage silencieux. Routes, procédures et tables par univers viennent de server/data/moteurs.ts (déjà généré), jamais resaisies. Statut de connexion calculé (INTELLIGENCE_CONNECTED, PARTIALLY_CONNECTED, UI_ONLY, BACKEND_ONLY, REGISTERED_NOT_CONNECTED, NO_INTELLIGENCE_INTEGRATION) à partir de preuves concrètes : présence réelle de l'assistant embarqué (client/src/components/AssistantFlottant.tsx) sur les routes de l'univers, accès réel au Centre Intelligence direction, outils du Tool Registry réellement actifs ou seulement enregistrés pour cette catégorie. Nouveau Context Engine central (server/intelligences/contexte/service.ts::resoudreContexte) : un seul appel résout utilisateur, rôle, pays/langue/devise/TVA réels (Country Engine), univers résolu depuis la route, permissions de modules (shared/permissions.ts), projet Chantier actif (réutilise le lien session→projet du lot précédent), historique récent, moteurs et outils réellement disponibles pour ce rôle. Nouveau rapport « Intelligence Coverage » (server/intelligences/univers/couverture.ts, exposé aussi en script autonome scripts/gen-intelligence-coverage.ts qui réutilise scripts/check-providers.mjs en sous-processus plutôt que de le réimplémenter) : compte réel des univers par statut, des moteurs et routes couverts, des outils actifs contre seulement enregistrés. Anomalie réelle trouvée et gardée visible plutôt que masquée : « vtc_taxi » existe déjà comme catégorie de facturation reconnue (server/schema.ts::universEnum, tables subscriptions et finance_transactions) mais n'a aucun moteur déclaré au Engine Registry — marqué comme univers à moteur manquant, pas rattaché de force à un autre. Trois notions d'« univers » coexistaient déjà dans le dépôt sans être unifiées (le nouveau registre métier construit ici ; l'enum de facturation à 6 valeurs ; `country_countries.universes_enabled`, plus ancien, resté à un seul code générique) — documenté honnêtement en tête de fichier plutôt que réconcilié de force, une unification des trois dépasserait le périmètre de ce lot (qui ne doit reconstruire aucun moteur métier).",
    pourquoi:
      "Nouveau chantier maître de la direction, ouvert immédiatement après la clôture à 100 % du Chantier de développement : connecter MKA.P-MS Intelligences à toute la plateforme sans reconstruire les moteurs métier existants. Premier lot demandé explicitement borné à la cartographie, au Context Engine central et à l'audit de couverture — les connexions métier univers par univers restent pour les lots suivants, sur feu vert exprès de la direction.",
    ou: [
      "server/intelligences/univers/mapping.ts",
      "server/intelligences/univers/registre.ts",
      "server/intelligences/univers/couverture.ts",
      "server/intelligences/univers/__tests__/univers.test.ts",
      "server/intelligences/contexte/service.ts",
      "server/intelligences/index.ts",
      "scripts/gen-intelligence-coverage.ts",
      "package.json",
    ],
    lecon:
      "Vérifié réellement, sur base Postgres locale jetable : registre() calcule sans exception (couverture exacte des 89 moteurs vérifiée par du vrai code, pas par une liste comptée à la main), 24/24 vérifications réussies dans le nouveau test dédié, 60/60 toujours vertes sur le test existant du Tool Registry (aucune régression). Chiffres réels constatés à la clôture de ce lot : 5 applications (mobile/variants.json : grand public, pro, command, produit Intelligences, investisseur), 18 univers, 89 moteurs — tous couverts —, 739 routes déclarées — toutes couvertes —, 101 outils au Tool Registry (43 actifs, 58 enregistrés sans implémentation), 0 univers pleinement connecté, 3 partiellement connectés (marketplace particulier et le produit Intelligences lui-même, grâce aux outils déjà réels du lot précédent, plus l'infrastructure technique via ses 5 outils de test), 5 en interface seulement, 9 avec des fiches enregistrées mais aucun câblage, 1 sans aucun point de contact (vtc_taxi). 0 appel direct à un fournisseur de modèle détecté (scripts/check-providers.mjs, gate de build déjà existant, invoqué et vert). Aucun univers déclaré pleinement connecté par ce lot lui-même : le Context Engine existe et se lit, mais n'est pas encore branché à la boucle de conversation réelle (assistant embarqué, Centre Intelligence direction) — brancher ce fil est explicitement un lot suivant, sur autorisation de la direction, pas une omission de celui-ci. Le rapport de couverture reste volontairement informationnel (jamais un gate de build) : la plupart des univers étant honnêtement encore déconnectés à ce stade du chantier, un échec de build sur ce nombre aurait été une fausse alerte, pas une vraie régression. Typecheck inchangé (54 erreurs préexistantes), gen:moteurs stable, check:naming et check:providers verts, build serveur et client complets réussis.",
    domaine: "intelligences",
  },
  {
    cle: "chantier-maitre-connexion-plateforme-lot-02a-identite-fuites-fournisseurs",
    titre: "Chantier maître — connexion de MKA.P-MS Intelligences à toute la plateforme, LOT 02A : identité MKA.P-MS Intelligence et assainissement complet des fuites fournisseurs",
    moteurs: ["intelligences"],
    quoi:
      "Audit réel (trois recherches indépendantes sur le dépôt complet, aucune supposition) confirmant une fuite active et publique : l'assistant embarqué (client/src/components/AssistantFlottant.tsx, monté sur presque toutes les pages publiques) et la page publique /intelligences (client/src/pages/AssistantIntelligences.tsx, sans aucune garde de rôle) affichaient le motif brut d'un échec de modèle — nom du fournisseur, morceau du corps d'erreur HTTP renvoyé par son API — dès qu'un appel de modèle échouait, via une procédure tRPC publique et non authentifiée (intelligencesRouter.assistant). Une seconde procédure publique (configStatus) renvoyait en plus, à quiconque l'appelait, le nom de chaque fournisseur, le nom exact de sa variable d'environnement et l'URL pour obtenir une clé. Corrigé par une séparation stricte, jamais une réécriture de ce qui marchait : AppelResultat (server/intelligences/provider.ts) porte maintenant deux champs — motif (détail technique complet, réservé aux lectures internes/direction) et motifPublic (un seul texte générique MKA.P-MS Intelligence, sans jamais nommer un fournisseur, un modèle, un code HTTP ou une variable d'environnement). server/intelligences/service.ts::demander() choisit l'un ou l'autre selon le côté (public → motifPublic, jamais fournisseur/modèle ; direction → détail complet, conformément à la correction explicite de la direction : le tableau Direction/PDG a le droit de connaître le fournisseur pour en vérifier le coût, l'état et préparer sa déconnexion). Nouvelle colonne in_messages.motif_public (migration additive) pour que l'historique public (filPublic) ne rejoue jamais le détail technique stocké. Nouveau composant client EtatServiceIntelligence.tsx (disponible/dégradé/indisponible, identité MKA.P-MS uniquement) remplace IaConfigWarning.tsx sur la page publique ; IaConfigWarning.tsx reste réservé aux écrans direction (Centre Commandes, Centre Intelligence & Coûts), maintenant backé par une nouvelle procédure configStatusDirection réservée au PDG — configStatus (publique) ne renvoie plus qu'un état générique. Nouveau champ wireStatus au catalogue de fournisseurs (server/ai-fabric/service.ts) — REGISTERED, IMPLEMENTED_NOT_CONNECTED, CONNECTED_NOT_TESTED, CONNECTED_AND_TESTED, DISABLED — et règle non négociable ajoutée à chooseProvider() : un fournisseur non CONNECTED_AND_TESTED n'est plus jamais sélectionné, même si sa variable d'environnement est configurée. Correction explicite de la direction appliquée à la lettre : la capacité reste enregistrée avec son vrai statut plutôt que d'être retirée du registre — Anthropic reste catalogué, marqué REGISTERED (aucun point d'entrée d'appel réel dans provider.ts), jamais retiré. Identité centralisée (nouveau fichier server/intelligences/identite.ts, nom et motif générique en un seul endroit) et consigne explicite ajoutée au système des deux côtés (regles.ts) : l'assistant ne se présente jamais sous le nom d'un modèle ou d'un fournisseur, même si on le lui demande directement. Nouveau garde-fou de build scripts/check-public-provider-leaks.mjs (liste blanche motivée pour les écrans direction réellement backés par une procédure réservée), ajouté à la chaîne npm run build. Rapport de couverture (server/intelligences/univers/couverture.ts) complété d'un compteur réel routableNonConnecte (fournisseur configuré mais jamais sélectionnable).",
    pourquoi:
      "Consigne explicite de la direction, immédiatement après l'audit du chantier maître de connexion de MKA.P-MS Intelligences à la plateforme : aucune interface publique ou utilisateur ne doit jamais révéler l'identité d'un fournisseur de modèle externe, avec une correction précise sur la manière de le faire — jamais en retirant une capacité du registre, toujours en l'empêchant d'être sélectionnée tant qu'elle n'est pas réellement connectée et testée ; et jamais en cachant le fournisseur à la direction elle-même, qui doit au contraire le voir pour piloter son remplacement avant l'échéance fixée.",
    ou: [
      "server/intelligences/identite.ts",
      "server/intelligences/provider.ts",
      "server/intelligences/routeur.ts",
      "server/intelligences/service.ts",
      "server/intelligences/regles.ts",
      "server/intelligences/schema.ts",
      "server/intelligences/index.ts",
      "server/intelligences/univers/couverture.ts",
      "server/ai-fabric/service.ts",
      "server/intelligences/__tests__/fuite-fournisseurs.test.ts",
      "scripts/check-public-provider-leaks.mjs",
      "scripts/check-providers.mjs",
      "scripts/gen-intelligence-coverage.ts",
      "client/src/components/EtatServiceIntelligence.tsx",
      "client/src/components/IaConfigWarning.tsx",
      "client/src/pages/AssistantIntelligences.tsx",
      "drizzle/0114_intelligences_motif_public.sql",
      "package.json",
    ],
    lecon:
      "Vérifié réellement, sur base Postgres locale jetable, avec de vrais scénarios plutôt qu'une déclaration : 38/38 vérifications dans le nouveau test d'indépendance (server/intelligences/__tests__/fuite-fournisseurs.test.ts), qui exerce le VRAI code de production (appeler() réel, chooseProvider() réel, demander() réel) avec seulement `fetch` injecté — jamais une réimplémentation parallèle — couvrant : réponse normale, HTTP 401/429/500, délai dépassé, aucun fournisseur disponible, un fournisseur enregistré mais jamais connecté (le scénario Anthropic, la clé posée ne suffit plus), repli réussi, repli échoué, utilisateur public anonyme et connecté (fournisseur/modèle toujours rendus null), et côté direction (le détail reste bien transmis, confirmant que la correction ne casse pas ce qui doit rester visible au PDG). 25/25 et 60/60 toujours verts sur les tests existants (aucune régression). Le nouveau garde-fou scripts/check-public-provider-leaks.mjs, ajouté à la chaîne de build, ne trouve plus aucune occurrence hors de sa liste blanche motivée. Anomalie annexe repérée pendant l'audit, sciemment non corrigée ici pour rester strictement dans le périmètre de ce lot (identité Intelligence, pas permissions) : /admin/commandes et /admin/ia-couts (contrairement aux 46 routes /superadmin/* déjà verrouillées dans un lot antérieur) ne portent aujourd'hui aucune garde de rôle côté route — sans conséquence pour ce lot précis puisque les procédures tRPC qu'ils appellent sont maintenant elles-mêmes correctement réservées à la direction (configStatusDirection), mais à traiter dans un futur lot de permissions plutôt qu'ici. Typecheck inchangé (54 erreurs préexistantes), gen:moteurs stable, check:naming et check:providers verts, build serveur et client complets réussis.",
    domaine: "intelligences",
  },
  {
    cle: "chantier-maitre-connexion-plateforme-lot-02b-noyau-conversationnel-reel",
    titre: "Chantier maître — connexion de MKA.P-MS Intelligences à toute la plateforme, LOT 02B : noyau conversationnel réel de /intelligence",
    moteurs: ["intelligences"],
    quoi:
      "/intelligence était encore une coquille (16 modules sur le même socle inerte). Neuf modules mis à niveau sur le moteur direction déjà réel (conversation, historique, mémoire, projets, usage & coûts, permissions, paramètres, intégrations & API, outils) puis, sur feu vert explicite, construction du vrai noyau conversationnel : interface complète (saisie, envoi, régénérer, copier, reprendre une demande, renommer/supprimer une conversation), branchée sur service.ts::demander() qui appelle désormais, côté direction, la boucle d'outils déjà construite pour le Chantier de développement (server/intelligences/outils/boucle.ts) au lieu d'un appel direct au fournisseur — les outils réellement actifs deviennent utilisables en conversation selon permission, sans seconde boucle. Contexte utilisateur réel injecté via le Context Engine du lot précédent (rôle, pays, permissions, projet Chantier actif, univers résolu). Isolation par compte ajoutée et vérifiée en base (une conversation n'est lisible, renommable ou supprimable que par son propriétaire), trace_id partagé entre un message et l'audit des outils qu'il a déclenchés. Fuite d'identité réelle trouvée et corrigée en testant : le refus « capacité non constatée disponible » du routeur transmettait le libellé du fournisseur retenu et sa variable d'environnement manquante jusque dans le motif public — motif public générique restauré pour ce cas précis, sans toucher au détail conservé pour la direction. Deux régressions réelles trouvées et corrigées en testant dans un vrai navigateur : une redirection immédiate vers /connexion avant que la session ait fini de s'hydrater (aurait éjecté un compte PDG réel), et un bandeau d'état placé comme élément de la ligne flex au lieu d'un bandeau pleine largeur (écrasait la colonne de conversation).",
    pourquoi:
      "Feu vert explicite de la direction, avec un objectif précis : pouvoir ouvrir /intelligence, écrire un message et recevoir une réponse réelle de MKA.P-MS Intelligence — pas seulement un shell de navigation.",
    ou: [
      "client/src/pages/intelligence/modules/Conversation.tsx",
      "client/src/pages/intelligence/index.tsx",
      "server/intelligences/service.ts",
      "server/intelligences/outils/boucle.ts",
      "server/intelligences/routeur.ts",
      "server/intelligences/index.ts",
      "server/intelligences/schema.ts",
      "server/intelligences/__tests__/conversation-e2e.test.ts",
      "scripts/check-intelligence-chat.mjs",
      "drizzle/0115_intelligences_trace_id.sql",
    ],
    lecon:
      "Vérifié réellement : round-trip complet dans Chromium réel (Playwright) — ouverture, saisie, envoi, réponse honnête affichée, aucun nom de fournisseur visible, rendu mobile et desktop. 39/39 sur le test d'indépendance fournisseurs (revérifié après le rebranchement sur la boucle d'outils), 60/60 sur la boucle d'outils, 27/27 sur le nouveau scénario de bout en bout dédié à la conversation (session créée, contexte conservé entre deux messages, rechargement, reprise, refus de permission réel, isolation inter-comptes vérifiée en base, renommage et suppression réels). L'autorisation/refus d'un appel d'outil par le modèle reste couvert par la suite existante de la boucle, non dupliqué. Écart identifié et assumé plutôt que masqué : la compatibilité complète des six niveaux d'accès (public à PDG) attend une extension du système binaire « côté » (direction/public) — hors périmètre de ce lot, PDG seul pour l'instant. Typecheck inchangé (54 erreurs préexistantes), build serveur et client complets réussis. PR #318 mergée, vérifiée après merge.",
    domaine: "intelligences",
  },
  {
    cle: "gouvernance-permanente-versions-audit-semestriel-settings-registry",
    titre: "Gouvernance permanente MKA.P-MS Intelligence — registre de versions, audit semestriel, Settings Registry, statuts de connexion réels",
    moteurs: ["intelligences"],
    quoi:
      "Ajout, à la clôture du LOT 02B et avant l'ouverture du lot suivant, de règles transversales permanentes (pas un lot métier, jamais à redéfinir plus tard) : (1) registre de versions par application (server/governance/versions.ts), lisant les applications réelles déjà déclarées dans mobile/variants.json plutôt que d'en inventer une seconde liste — une release n'augmente jamais toutes les applications aveuglément, seul l'appelant décide au cas par cas laquelle est réellement touchée ; (2) audit global semestriel (server/governance/audit-semestriel.ts) qui orchestre les contrôles déjà réels (fuites fournisseurs, boucle d'outils, Intelligence Coverage, typecheck) plutôt que de les réimplémenter, calcule la prochaine échéance depuis le dernier audit réellement consigné, et accepte un déclenchement hors cycle pour incident réel sans jamais attendre les six mois ; (3) Settings Registry progressif (server/governance/settings-registry.ts, 56 réglages catalogués sur quatre catégories) avec un état réellement constaté par réglage — HARDCODED et NOT_CONNECTED assumés comme inventaire honnête, pas comme régression ; (4) test de génération de code permanent (server/intelligences/__tests__/generation-code.test.ts, prompt de référence TVA) ajouté aux contrôles périodiques Intelligence, avec dégradation honnête (vérifications de qualité annoncées ignorées, jamais fabriquées) tant qu'aucun fournisseur n'est câblé et testé dans un environnement donné.",
    pourquoi:
      "Consigne explicite de la direction : ces règles ne sont pas un chantier à part, elles deviennent des exigences obligatoires pour tous les lots futurs — versionner ce qui change réellement, auditer périodiquement plutôt que d'attendre qu'un problème se déclare, et rendre visibles les réglages encore dispersés au lieu de les laisser implicites.",
    ou: [
      "server/governance/schema.ts",
      "server/governance/versions.ts",
      "server/governance/settings-registry.ts",
      "server/governance/audit-semestriel.ts",
      "server/intelligences/index.ts",
      "server/intelligences/__tests__/generation-code.test.ts",
      "scripts/gen-intelligence-coverage.ts",
      "drizzle/0116_governance_versions_audits_settings.sql",
    ],
    lecon:
      "Le statut de connexion fournisseur à sept paliers (registered → clé présente → autorisé → point d'entrée joignable → modèle accessible → capacité accessible → test de fumée → connecté et testé) demandé par la direction n'est pas réimplémenté ici en doublon du wireStatus à cinq paliers du lot d'identité : il devient une exigence du prochain lot (Provider Registry), pour ne pas construire deux registres fournisseurs concurrents à quelques jours d'écart. Aucune application n'a reçu de changement de version dans ce commit lui-même (aucune fonctionnalité utilisateur nouvelle) : seule une entrée rétroactive et réelle a été consignée pour l'application Intelligence, reflétant le LOT 02B déjà mergé — conformément à la règle qui vient d'être adoptée, pas d'incrément pour les applications non concernées.",
    domaine: "intelligences",
  },
  {
    cle: "chantier-maitre-connexion-plateforme-lot-02d-provider-registry-independance",
    titre: "Chantier maître — connexion de MKA.P-MS Intelligences à toute la plateforme, LOT 02D : Provider Registry, indépendance API et échéance du 27 mars 2027",
    moteurs: ["intelligences"],
    quoi:
      "Nouveau Provider Registry (server/governance/dependencies.ts, table gv_dependencies) : source centrale de vérité pour les dépendances de modèles externes (openai, anthropic, mistral) — relie sans les dupliquer server/ai-fabric/service.ts (catalogue et état réel), server/intelligences/capacites.ts (capacités, remplacement MKA.P-MS visé) et server/intelligences/shadow.ts, infrastructure de montée en charge du remplacement interne déjà réelle et complète depuis un lot antérieur, découverte pendant l'audit de ce lot et donc réutilisée telle quelle plutôt que reconstruite. Disconnect readiness (point 5) calculé, jamais estimé : part réelle de trafic servie par un candidat interne (shadow.ts::etat), lacunes réelles du Settings Registry pour les réglages dont dépend la capacité, absence physique constatée d'un modèle auto-hébergé (variable LOCAL_LLM_URL absente dans ce bac à sable) — résultat honnête : 0 % pour les trois dépendances, aucun candidat interne n'existant encore. Statut de migration à cinq valeurs (ON_TRACK/AT_RISK/BLOCKED/READY_TO_DISCONNECT/DISCONNECTED) calculé depuis la readiness et l'échéance. Date cible du 27 mars 2027 posée comme vraie date exploitable (pas une note texte) pour openai et mistral, absente pour anthropic (jamais utilisé, donc hors échéance). Droits sur les données par défaut LEGAL_RIGHTS_UNKNOWN pour chaque dépendance, jamais supposés favorables tant qu'aucune revue juridique n'a eu lieu. Nouveau test d'indépendance dédié (server/intelligences/__tests__/independance-openai.test.ts) : OpenAI coupé avec Mistral configuré (le raisonnement continue), OpenAI seul coupé (échec honnête, aucun relais interne aujourd'hui), modèle supprimé du compte fournisseur, capacité désactivée par la direction (refusée avant tout appel réseau, indépendamment de l'état du fournisseur) — consigne réellement l'exécution dans le Provider Registry (last_independence_test). Vue Direction → Intelligence → Dependencies (point 14) ajoutée au module Usage & coûts existant plutôt que dans un nouvel écran séparé. Compteurs de couverture réels (external_dependencies_inventoried_pct, dependencies_without_adapter, critical_dependency_without_fallback, dependency_without_exit_plan/target_date, independence_test_stale, dependency_past_target_date, direct_provider_calls, public_provider_leakage) ajoutés au rapport Intelligence Coverage, avec anomalie honnête affichée plutôt que masquée (Anthropic reste sans adaptateur réel par choix du lot d'identité, comptabilisé 1, pas 0).",
    pourquoi:
      "Feu vert explicite de la direction, avec un objectif précis : savoir de quelles API externes MKA.P-MS dépend réellement, lesquelles bloqueraient la plateforme si elles étaient coupées aujourd'hui, où en est leur remplacement interne, et ne plus avoir de dépendance structurelle obligatoire à un fournisseur de modèle externe au plus tard le 27 mars 2027.",
    ou: [
      "server/governance/schema.ts",
      "server/governance/dependencies.ts",
      "server/intelligences/index.ts",
      "server/intelligences/__tests__/independance-openai.test.ts",
      "client/src/pages/intelligence/modules/UsageCouts.tsx",
      "scripts/gen-intelligence-coverage.ts",
      "scripts/check-providers.mjs",
      "drizzle/0117_governance_dependencies.sql",
    ],
    lecon:
      "Vérifié réellement, sur base Postgres locale : 10/10 vérifications dans le nouveau test d'indépendance, 39/39, 60/60, 27/27 et 25/25 toujours verts sur les suites existantes (aucune régression). Un vrai bug trouvé et corrigé en testant plutôt qu'en supposant : la première version du test d'indépendance supposait OpenAI toujours essayé en premier — même leçon que fuite-fournisseurs.test.ts scénario 8, l'ordre réel dépend de l'état constaté en base, pas d'un ordre fixe ; l'assertion a été reformulée sur le résultat (le raisonnement continue) plutôt que sur l'ordre d'essai. Un second bug trouvé et corrigé : enregistrerTestIndependance() mettait à jour une ligne qui pouvait ne pas encore exister quand le test est lancé seul (sans passer par registre()/couverture() avant) — corrigé en semant le registre avant toute mise à jour. Un troisième défaut trouvé par le build lui-même, pas par relecture : le nouveau fichier de test n'était pas dans la liste blanche de scripts/check-providers.mjs, provoquant un faux positif « appel direct fournisseur » sur ses lignes de manipulation de variables d'environnement — corrigé par ajout à la liste blanche, avec le même motif que le test existant. Périmètre assumé et documenté, pas silencieux : ce lot peuple le registre pour les dépendances de modèles de langage seulement (échéance réelle du 27 mars 2027) ; les dépendances non liées aux modèles du catalogue ai-fabric (paiement, hébergement, cartographie, e-mail…) restent dans ce catalogue existant, sans date de sortie fixée par la direction. Écarts honnêtement non couverts, consignés plutôt que masqués : refus par pays interdit (aucun moteur ne relie encore la Fabrique Intelligence au Country Policy pour cela) et suspension d'un fournisseur par le PDG dans un scénario d'indépendance dédié (le mécanisme existe, setProviderSuspended, mais n'est pas encore rejoué ici). Granularité du registre au niveau fournisseur, pas modèle par modèle (gpt-4o-mini vs mistral-large-latest) — jugé suffisant pour la readiness et l'échéance visées par ce lot ; benchmark de remplacement mécaniquement prêt (shadow.ts) mais sans donnée réelle de comparaison, faute de candidat interne configuré. Typecheck inchangé (54 erreurs préexistantes), build serveur et client complets réussis.",
    domaine: "intelligences",
  },
  {
    cle: "chantier-maitre-connexion-plateforme-lot-02e-estimate-gateway",
    titre: "Chantier maître — connexion de MKA.P-MS Intelligences à toute la plateforme, LOT 02E : Estimate Gateway, aucun prix inventé",
    moteurs: ["intelligences"],
    quoi:
      "Audit complet mené avant tout code (trois relevés parallèles sur véhicule/VO Engine, garage/pièces/LOA, VTC/transport/douane/devise/paiement) pour cartographier, moteur par moteur, ce qui calcule réellement un prix, ce qui refuse honnêtement d'en calculer un, et ce qui affiche un chiffre inventé. Nouveau server/estimate-gateway/ (types.ts + gateway.ts) : passerelle unique vers les moteurs déjà réels — server/vo-engine/service.ts::estimate (véhicule), server/vehicle-delivery/service.ts::devis (transport véhicule), server/routers/livraison.ts::calculerTarifColis (colis), server/routers/devis.ts::calculerMontantDevis (garage, à partir d'un devis déjà chiffré), server/routers/pieces.ts + server/estimation-hub/service.ts::voletPieces (pièces), server/import-risk/service.ts::diagnostiquer (risque d'importation), server/routers/currency.ts::getRates (devises) — aucune formule de prix dupliquée, chaque fonction de la passerelle ne fait que traduire le résultat réel dans un schéma canonique à quatre niveaux de qualité (LIVE_QUOTE/REAL_DATA_ESTIMATE/REFERENCE_RANGE/UNAVAILABLE). Nouveau statut de Tool Registry BUSINESS_ENGINE_MISSING (distinct de REGISTERED_NOT_IMPLEMENTED) : l'outil s'exécute réellement et répond honnêtement qu'aucun moteur métier n'existe — posé sur estimate.rental, estimate.loa, estimate.vtc et estimate.customs, confirmés absents par l'audit. 14 outils estimate.* enregistrés (nouvelle catégorie « estimations ») : 10 IMPLEMENTED, 4 BUSINESS_ENGINE_MISSING, aucun REGISTERED_NOT_IMPLEMENTED. CONSIGNE_DIRECTION étendue d'une règle explicite : tout prix cité doit venir d'un appel estimate.*, jamais d'un chiffre proposé par le modèle. Une vraie faille de sécurité corrigée pendant ce lot, comme demandé explicitement par la direction : server/routers/livraison.ts::payMission acceptait un montant transmis par le client (amount: input.amount) sans le recalculer — corrigé en le recalculant systématiquement depuis les champs réels de la mission (distance, gabarit, urgence) ; nouveau contrôle permanent scripts/check-payment-amounts.mjs pour empêcher toute régression sur ce point, sur ce fichier ou un autre. Un vrai bug de migration trouvé par les tests (pas par relecture) : drizzle/0011_boutique_tracking.sql tentait un CREATE TABLE IF NOT EXISTS delivery_pricing alors que la table existait déjà depuis 0001 avec d'autres colonnes — le IF NOT EXISTS avait silencieusement annulé 0011 ; la table réelle n'a donc jamais eu les colonnes que server/schema.ts déclare, cassant discrètement server/routers/livraison.ts::quote (et désormais payMission) en base réelle. Corrigé par une migration additive (drizzle/0118_fix_delivery_pricing_shape.sql) qui ajoute les colonnes manquantes et les rétro-remplit depuis les anciennes, sans rien supprimer. Deux écrans clients LOA (LocationLOA.tsx, LOAFinance.tsx) marqués honnêtement non contractuels et leur bouton de simulation désactivé, faute de moteur de calcul LOA réel — pas un moteur reconstruit dans ce lot, juste l'écran qui ne ment plus.",
    pourquoi:
      "Feu vert explicite de la direction, avec la règle absolue de ce lot : MKA.P-MS Intelligences ne doit plus jamais présenter un montant inventé ou déconnecté comme s'il était réel, quel que soit l'univers (véhicule, garage, pièces, location, VTC, transport, douane, devise).",
    ou: [
      "server/estimate-gateway/types.ts",
      "server/estimate-gateway/gateway.ts",
      "server/estimate-gateway/__tests__/gateway.test.ts",
      "server/intelligences/outils/familles/estimations.ts",
      "server/intelligences/outils/familles/outils-estimations.ts",
      "server/routers/livraison.ts",
      "server/routers/devis.ts",
      "server/routers/currency.ts",
      "server/estimation-hub/service.ts",
      "scripts/check-payment-amounts.mjs",
      "drizzle/0118_fix_delivery_pricing_shape.sql",
    ],
    lecon:
      "Vérifié réellement, sur base Postgres locale : 53/53 vérifications dans le nouveau test Estimate Gateway, et 60/60, 27/27, 39/39, 4/4 (5 ignorées, fournisseur non câblé), 10/10 toujours verts sur les suites existantes (aucune régression, une seule mise à jour de compteur attendue : 31→32 familles, une nouvelle catégorie ajoutée). Le seul défaut trouvé par relecture pure, sans le vérifier par un test réel, aurait été manqué : lancer le test Estimate Gateway contre la vraie base a immédiatement fait échouer estimate.delivery sur « column vehicle_type does not exist », révélant que server/routers/livraison.ts::quote et payMission étaient réellement cassés en base depuis la migration 0011 — corrigé par une migration additive plutôt que masqué en adaptant la passerelle à la mauvaise table. Portée assumée et documentée, pas silencieuse : estimates_without_country_context reste à 2 (estimate.parts.price par marque/modèle, estimate.delivery) faute de filtre pays câblé dans ces deux moteurs sous-jacents ; rien inventé pour le ramener à 0. estimate.import répond avec un vrai diagnostic de risque/légalité (Import Risk Engine) mais jamais un montant de droits — estimate.customs reste BUSINESS_ENGINE_MISSING pour cette raison précise, conformément à l'instruction de ne pas construire le moteur douanier manquant. Les quatre outils estimate.vehicle.* coexistent avec les outils historiques vehicules.getVehicleMarketValue et consorts (même moteur VO Engine appelé par les deux, jamais deux moteurs) : documenté en tête de fichier pour qu'un futur lot ne les prenne pas pour un doublon accidentel à supprimer. Typecheck : aucune nouvelle erreur (fichiers touchés tous propres), erreurs préexistantes hors périmètre inchangées. Build serveur et client complets réussis.",
    domaine: "intelligences",
  },
  {
    cle: "chantier-maitre-connexion-plateforme-lot-02f-memoire-fichiers-recherche-rag",
    titre: "Chantier maître — connexion de MKA.P-MS Intelligences à toute la plateforme, LOT 02F : mémoire, fichiers, recherche et RAG",
    moteurs: ["intelligences"],
    quoi:
      "Audit complet mené avant tout code (trois relevés parallèles sur mémoire/conversation, fichiers/documents, recherche/RAG/knowledge base), qui a révélé une pièce déjà réelle et non documentée dans le résumé précédent : un vrai Context Engine existe depuis le LOT IA01 (server/intelligences/contexte/service.ts::resoudreContexte) et assemblait déjà utilisateur/pays/univers/projet actif, sans jamais avoir été relié à une mémoire ou un RAG — ce lot le complète plutôt que d'en construire un second. Cinq types de contexte désormais séparés, chacun sa table, jamais mélangés : Conversation Memory (additif — server/intelligences/conversation-resume.ts, résumé + faits importants au-delà de 16 messages non couverts, la fenêtre brute de 8 messages reste inchangée) ; User Memory (nouvelle, server/intelligences/memoire-utilisateur.ts — n'existait pas du tout avant ce lot, à ne pas confondre avec la mémoire d'entreprise déjà réelle de memoire.ts) ; Project Memory (server/intelligences/memoire-projet.ts, append-only, isolation réutilisée telle quelle depuis chantier/projets.ts::ouvrir()) ; File System Intelligence (server/intelligences/fichiers.ts + fichiers-extraction.ts — pipeline honnête uploaded→validated→parsed→chunked→indexed→searchable→ready_for_rag, ou failed avec l'erreur réelle ; nouvelles dépendances réelles pdf-parse/mammoth/exceljs après audit de sécurité npm, xlsx/SheetJS écarté pour une vulnérabilité critique) ; Global Knowledge Base (server/intelligences/connaissance.ts, distincte du graphe automobile technique déjà réel de server/knowledge-engine/, catégorie connaissance_islamique posée en architecture seule, visibilité pdg_uniquement forcée). Search Engine interne centralisé (server/intelligences/recherche-globale.ts) et RAG Engine (server/intelligences/rag.ts, retrieval PostgreSQL plein texte réel avec ts_rank et requête en OU logique — server/intelligences/recherche-texte.ts — plutôt qu'un ET logique qui aurait fait échouer toute question en langage naturel) : citations exactes, refus explicite SOURCE_NOT_FOUND/INSUFFICIENT_SOURCE_DATA plutôt qu'une réponse inventée. Embedding Gateway (rag.ts::embeddingGateway) posée et remplaçable, honnêtement NOT_CONNECTED — aucun fournisseur d'embeddings dans ce dépôt, confirmé par l'audit et par le Settings Registry lui-même avant ce lot. 16 nouveaux outils Tool Registry (nouvelle catégorie « memoire » + extensions des catégories déjà réservées « fichiers »/« documents »/« recherche »), tous IMPLEMENTED. Trois modules client remplacés ou étendus : Fichiers & documents et Recherche (placeholders purs avant ce lot, réellement câblés maintenant, upload→indexation→recherche vérifié en direct au navigateur avec un vrai fichier), Mémoire (section mémoire utilisateur ajoutée à côté de la mémoire d'entreprise déjà réelle, sans y toucher).",
    pourquoi:
      "Feu vert explicite de la direction pour que MKA.P-MS Intelligence se souvienne réellement, retrouve une information ancienne pertinente, exploite des fichiers, cite ses sources internes, distingue mémoire/conversation/documents/connaissances, et ne réponde jamais en inventant ce qu'elle n'a pas trouvé.",
    ou: [
      "server/intelligences/schema.ts",
      "server/intelligences/memoire-utilisateur.ts",
      "server/intelligences/memoire-projet.ts",
      "server/intelligences/conversation-resume.ts",
      "server/intelligences/fichiers.ts",
      "server/intelligences/fichiers-extraction.ts",
      "server/intelligences/connaissance.ts",
      "server/intelligences/recherche-globale.ts",
      "server/intelligences/recherche-texte.ts",
      "server/intelligences/rag.ts",
      "server/intelligences/contexte/service.ts",
      "server/intelligences/__tests__/memoire-fichiers-rag.test.ts",
      "client/src/pages/intelligence/modules/{FichiersDocuments,Recherche,Memoire}.tsx",
      "scripts/check-embedding-calls.mjs",
      "drizzle/0119_intelligences_memoire_fichiers_rag.sql",
    ],
    lecon:
      "Vérifié réellement, sur base Postgres locale : 33/33 vérifications dans le nouveau test dédié, et 60/60, 27/27, 39/39, 53/53 toujours verts sur les suites existantes (aucune régression, une seule mise à jour de compteur attendue : 32→33 familles, une nouvelle catégorie ajoutée). Vérification navigateur réelle en plus des tests service (pas seulement une revue de code) : upload d'un vrai fichier texte, indexation observée jusqu'à « Prêt pour le RAG », recherche plein texte retrouvant l'extrait exact, suppression confirmée en base — les trois modules client étaient des placeholders purs avant ce lot, aucune régression visuelle sur le module Mémoire déjà réel (compteurs par catégorie inchangés à l'écran). Un vrai bug trouvé en testant, pas en relisant le code : la première version du retrieval utilisait `plainto_tsquery` (ET logique entre tous les mots) — une question en langage naturel contenant ne serait-ce qu'un mot absent du document échouait à zéro résultat même quand la réponse était clairement présente ; corrigé par une requête en OU logique avec préfixe (server/intelligences/recherche-texte.ts), qui laisse `ts_rank` faire le tri par pertinence plutôt que d'exiger une correspondance totale. Choix de sécurité assumé : xlsx (SheetJS) écarté malgré sa popularité pour une vulnérabilité de prototype pollution non corrigée sur le registre npm public ; exceljs retenu à la place (une seule alerte modérée, sans rapport avec un contenu attaquant). Portée assumée et documentée, pas silencieuse : OCR explicitement hors périmètre (images acceptées mais sans extraction de texte, déclaré tel quel dans le pipeline) ; aucun fournisseur d'embeddings connecté, retrieval purement lexical mais réel, jamais présenté comme sémantique ; /intelligence restant strictement réservé au PDG (LOT IA02B), l'isolation multi-utilisateur de la mémoire/des fichiers est réelle et testée avec un second identifiant de compte fictif, mais n'a pas encore de second utilisateur réel pour l'exercer en production. Les 10 compteurs de couverture demandés sont tous à zéro (aucune anomalie non nulle à assumer pour ce lot, contrairement aux lots précédents). Typecheck : aucune nouvelle erreur (fichiers touchés tous propres), erreurs préexistantes hors périmètre inchangées (55). Build serveur et client complets réussis.",
    domaine: "intelligences",
  },
  {
    cle: "vo-tableaux-cliquables-cartes-moteur",
    titre: "Tableaux de bord VO — chaque carte compteur déclarée et calculée par le moteur, cliquable vers sa liste filtrée",
    moteurs: ["vo", "vo_espaces", "boutons", "redirection"],
    quoi:
      "Le moteur VO interne (server/routers/vo.ts) déclare CARTES_TABLEAU_VO : pour chaque carte (total, en_stock, en_reparation, en_vente, en_location, vendus, total_achats, total_ventes, marges_nettes) le libellé, le genre (nombre/montant) et les statuts qu'elle ouvre ; la procédure stats renvoie `cartes` avec la valeur calculée côté serveur. Le moteur des espaces VO professionnels (server/vo-espaces/service.ts) déclare CARTES_TABLEAU_PRO (stock, actives, reservees, vendues, ventes_mois, ca_mois) avec le tableau où elle s'affiche, la cible et le statut ; compteursPro renvoie `cartes`. Six actions ajoutées au Moteur de boutons (vo_interne_carte_compteur, vente_pro_factures, vente_pro_profil, vente_pro_resume_vendeur, vente_resume_factures, vente_resume_retour_tableau) et quatre règles + trois alias au Moteur de redirection (/vente/factures, /profil, /vente/tableau-de-bord). Les trois écrans (VOInterne, TableauBordProVente, TableauBordVendeur) ne font plus qu'afficher stats.cartes / compteurs.cartes ; GestionStockVO lit ?statut= pour ouvrir la liste déjà filtrée. Les chiffres de démonstration en dur du Résumé vendeur (24 / 3 / 8 / 186k €) sont supprimés.",
    pourquoi:
      "Les trois tableaux de bord VO affichaient des compteurs non cliquables, et le Résumé vendeur affichait des valeurs inventées. Règle de la direction : la puissance s'ajoute dans le calculateur, pas sur la carrosserie — c'est le moteur qui sait quelle carte ouvre quels statuts, l'écran n'est que le tableau de bord.",
    ou: [
      "server/routers/vo.ts",
      "server/vo-espaces/service.ts",
      "server/button-engine/catalogue.ts",
      "server/redirection-engine/catalog.ts",
      "client/src/pages/VOInterne.tsx",
      "client/src/pages/TableauBordProVente.tsx",
      "client/src/pages/vente/TableauBordVendeur.tsx",
      "client/src/pages/vente/GestionStockVO.tsx",
    ],
    lecon:
      "Une carte de tableau de bord est une capacité du moteur (code, statuts ouverts, cible), jamais un tableau statique de l'écran. Quand un écran a besoin d'un lien compteur → liste, on l'ajoute au contrat du moteur, puis au Moteur de boutons et au Moteur de redirection, et l'écran le consomme. Point à confirmer avec la direction : ventes_mois/ca_mois utilisent updatedAt et la colonne prix des annonces vendues, faute de date de vente dédiée.",
    domaine: "moteurs",
  },
  {
    cle: "intelligences-domaine-religion-direction-seule",
    titre: "Assistant public MKA.P-MS AI — domaine religieux retiré du côté public, réservé à la direction par le moteur",
    moteurs: ["intelligences"],
    quoi:
      "Chaque domaine de server/intelligences/domaines.ts porte désormais `cotes` (public / direction). Le domaine religion n'a que « direction » : domainesPublics ne le renvoie plus au guide public, et le service refuse explicitement toute demande publique sur un domaine réservé (contrôle serveur, pas seulement visuel). La procédure direction accepte un domaine facultatif et peut l'interroger. Le domaine n'est pas supprimé du catalogue interne.",
    pourquoi:
      "Décision de la direction : l'assistant ouvert au public depuis la barre de recherche est un guide commercial neutre ; la partie religieuse reste disponible uniquement pour le PDG.",
    ou: ["server/intelligences/domaines.ts", "server/intelligences/index.ts", "server/intelligences/service.ts"],
    lecon:
      "Un cloisonnement public/direction se décide dans le moteur (propriété du domaine + refus serveur), jamais en cachant un onglet dans l'écran : sinon l'interrupteur d'un domaine ouvert suffisait à le rendre visible.",
    domaine: "intelligences",
  },
  {
    cle: "chantier-maitre-connexion-plateforme-lot-02g-comparaison-prix-externe-pays",
    titre: "Chantier maître — connexion de MKA.P-MS Intelligences à toute la plateforme, LOT 02G : comparaison de prix externe par pays",
    moteurs: ["intelligences", "vo_engine"],
    quoi:
      "Demande de la direction : partout où la plateforme estime un prix, une seconde intelligence doit comparer ce chiffre à ce qui se vend réellement à l'extérieur, publiquement, pays par pays. Audit préalable de tout point d'estimation existant (server/estimate-gateway/gateway.ts, 14 outils estimate.* déjà réels) : aucun n'interrogeait de source externe — la capacité recherche_web_externe était cataloguée dans server/ai-fabric/service.ts (envKeys WEB_SEARCH_API_KEY) mais son code d'appel n'existait nulle part (wireStatus non renseigné, donc jamais sélectionnable). Nouveau server/market-price-intelligence/service.ts (comparerPrixExterne) : seul point du code qui interroge une source publique hors plateforme, en deux étapes réelles jamais fabriquées — 1) recherche Brave Search (WEB_SEARCH_API_KEY), honnêtement UNAVAILABLE si la clé est absente, si la recherche échoue ou si elle ne retourne rien ; 2) extraction de prix par le modèle de texte déjà connecté (server/intelligences/provider.ts::appeler, capacité ia_texte, sortie structurée stricte), avec un filtre serveur qui rejette tout prix dont l'URL ne correspond pas à un résultat de recherche réellement obtenu — un modèle ne peut donc jamais faire apparaître une source qui n'existe pas. Nouvel outil Tool Registry estimate.vehicle.externalComparison (15e outil de la famille estimations, IMPLEMENTED), nouvelle procédure publique voEngine.comparaisonExterne, nouveau champ optionnel ResultatEstimation.externalSources (titre + URL réelles, jamais reformulées). Écran client EstimationAuto.tsx étendu d'un bloc « Comparer avec le marché public à l'extérieur » (code pays éditable, bouton à la demande — pas d'appel automatique pour ne pas dépenser un appel de recherche à chaque estimation). server/ai-fabric/service.ts : recherche_web_externe passe de wireStatus non renseigné à IMPLEMENTED_NOT_CONNECTED (code réel écrit, mais aucune clé WEB_SEARCH_API_KEY fournie sur ce serveur ni test bout-en-bout réel effectué — pas CONNECTED_AND_TESTED tant que ces deux conditions ne sont pas réunies, même règle que pour les fournisseurs de modèle).",
    pourquoi:
      "Feu vert explicite de la direction : chaque estimation de prix (véhicule aujourd'hui, tout autre univers demain) doit pouvoir être mise en regard d'un prix public réel constaté à l'extérieur, par pays, sans jamais présenter un montant externe inventé ou une source qui n'a pas été réellement consultée.",
    ou: [
      "server/market-price-intelligence/service.ts",
      "server/market-price-intelligence/__tests__/service.test.ts",
      "server/estimate-gateway/types.ts",
      "server/estimate-gateway/gateway.ts",
      "server/estimate-gateway/__tests__/gateway.test.ts",
      "server/intelligences/outils/familles/estimations.ts",
      "server/intelligences/outils/familles/outils-estimations.ts",
      "server/vo-engine/index.ts",
      "server/ai-fabric/service.ts",
      "server/engine-registry/catalog.ts",
      "server/engine-registry/perimetres.ts",
      "scripts/check-providers.mjs",
      "client/src/pages/EstimationAuto.tsx",
    ],
    lecon:
      "Vérifié réellement, sur base Postgres locale : 19/19 vérifications dans le nouveau test market-price-intelligence (dont le rejet d'une URL de source non recherchée par le modèle), et 60/60, 57/57 (53→57, quatre nouvelles vérifications), 39/39, 25/25, 10/10, 20/20, 7/7 toujours verts sur les suites existantes (aucune régression). Un vrai défaut trouvé par le générateur des moteurs, pas par relecture : ajouter l'import de market-price-intelligence/service.ts dans vo-engine/index.ts a fait apparaître dependance_non_declaree=33 (32→33) — corrigé en déclarant intelligences comme dépendance réelle de vo_engine dans server/engine-registry/catalog.ts, retombé à 32 après régénération. Portée assumée et documentée, pas silencieuse : recherche_web_externe reste IMPLEMENTED_NOT_CONNECTED sur ce serveur faute de clé WEB_SEARCH_API_KEY fournie — la fonction répond honnêtement UNAVAILABLE dans cet état, jamais un prix ou une source inventée ; la comparaison n'est câblée qu'au véhicule (VO Engine) pour ce lot, les autres univers d'estimation (garage, pièces, transport, livraison) pourront réutiliser le même moteur sans doublon le jour où la direction le demandera. Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle dans les fichiers touchés. Build client et serveur complets réussis.",
    domaine: "intelligences",
  },
  {
    cle: "boutons-morts-connectes-moteur-alerte-vivant",
    titre: "Boutons sans action connectés au Smart Engine — alerte vivante et rejouée automatiquement, plus seulement visible en CI",
    moteurs: ["smart", "boutons"],
    quoi:
      "Demande de la direction : les boutons qui ne sont pas cliquables doivent être connectés à tout le moteur, et un problème signalé de façon répétitive par un moteur doit déclencher une intervention réelle. Audit : l'inventaire statique des boutons sans action (server/data/boutons-sans-action.ts, ~177-180 boutons réels sur ~140 écrans, régénéré par gen-boutons-sans-action.mjs) bloquait déjà la construction (check:boutons) mais n'était JAMAIS lu par le Smart Engine — invisible côté direction, jamais alerté, jamais rejoué par le scan autonome (server/index.ts::smartAutoWork, déjà réel, déjà planifié toutes les 6h + au démarrage). Nouveau server/smart-engine/services/health-monitor.ts::syncBoutonsSansAction() : upsert idempotent de chaque bouton mort dans smart_health_checks (statut « broken », préfixe static_L<ligne> pour ne jamais toucher les lignes seedées par registerCriticalElements ; un bouton corrigé et disparu de l'inventaire repasse à « ok »). Appelé au début de runAlertScan() (server/smart-engine/services/alert-engine.ts) : la boucle « 1. Boutons cassés » déjà existante s'en charge ensuite sans aucune duplication de logique — chaque bouton mort devient une alerte réelle, catégorie « bouton », sévérité critique, visible et résolvable dans les écrans déjà réels CentreActions.tsx et SmartEngine/ControlCenter.tsx, rejouée automatiquement toutes les 6h. Un vrai bug trouvé par le test, pas par relecture : sept fichiers ont deux boutons morts sur la même ligne (JSX compact) — la clé page+ligne collisionnait et n'enregistrait qu'un seul des deux ; corrigé avec un compteur d'occurrence par fichier+ligne (static_L<ligne>, puis static_L<ligne>_1, _2…).",
    pourquoi:
      "La direction a explicitement demandé que les boutons non cliquables et les tableaux soient connectés à tout le moteur, et que l'IA intervienne directement quand un moteur signale un problème répétitif — pas seulement qu'il soit consigné dans un fichier vu uniquement en CI.",
    ou: [
      "server/smart-engine/services/health-monitor.ts",
      "server/smart-engine/services/alert-engine.ts",
      "server/smart-engine/services/__tests__/boutons-sans-action-sync.test.ts",
      "server/engine-registry/catalog.ts",
    ],
    lecon:
      "Vérifié réellement, sur base Postgres locale : 10/10 vérifications dans le nouveau test dédié (synchronisation idempotente, résolution automatique d'un bouton corrigé, alerte réelle levée pour le premier bouton mort de l'inventaire, déduplication au second scan), aucune régression sur les suites Smart Engine et Engine Registry existantes. Un vrai défaut de dépendance non déclarée trouvé et corrigé par le générateur des moteurs (smart → boutons), retombé à la ligne de base après régénération. Portée assumée et documentée, pas silencieuse : ceci connecte la DÉTECTION et l'ALERTE en direct — corriger le code métier réel derrière chacun des ~177 boutons (répartis sur ~140 écrans, souvent une fonctionnalité entière manquante par bouton : paiement de pénalité, contestation, démarches administratives…) reste un chantier cluster par cluster, comme pour les écrans finance ou le parcours fournisseur avant lui, pas un correctif générique automatisable comme l'inférence de route de redirection. Un premier cluster orphelin réel a été repéré pendant cet audit (client/src/pages/demarches/*.tsx, 8 écrans à boutons morts) : server/routers/cartegrise.ts (carteGriseRouter) existe déjà côté serveur avec un type de dossier correspondant à chacun (changement_titulaire, declaration_cession, duplicata, vehicule_etranger, ww_cpi…) et n'est branché à aucun de ces écrans — prochain lot proposé, pas encore traité ici. La détection de « cartes de tableau de bord non cliquables » (l'autre moitié de la demande) n'a aucun inventaire généré aujourd'hui : seuls les tableaux VO/vente en ont un (lot antérieur, cartes déclarées manuellement) ; construire l'équivalent statique de gen-boutons-sans-action.mjs pour les cartes est un chantier distinct, honnêtement non commencé. Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build client et serveur complets réussis.",
    domaine: "moteurs",
  },
  {
    cle: "document-os-audit-referentiel-documentaire-2026",
    titre: "Document OS — audit et premières corrections contre le Référentiel Documentaire Officiel MKA.P-MS 2026",
    moteurs: ["document"],
    quoi:
      "Demande de la direction : reconstruire/ajuster le système documentaire selon un référentiel officiel (PDF 45 pages non transmis + fichier « Instructions Maîtres Agents Documents MKA.P-MS 2026 », transmis en texte intégral — 15 règles + compléments). Consigne explicite : ne pas reconstruire le moteur PDF existant (server/document-os/, déjà réel et fonctionnel), auditer d'abord, corriger seulement ce qui n'est pas conforme. Audit mené contre les 15 règles, sans l'asset visuel verrouillé (VO v7, référentiel 45 pages — non reçus malgré trois tentatives, toujours des liens image cassés) : ce qui en dépend reste explicitement non traité, jamais approximé. Trois non-conformités réelles trouvées et corrigées, ne nécessitant aucun asset visuel : (1) règle #6, ordre des signatures — MKA.P-MS était affiché à GAUCHE et la contrepartie à DROITE dans les deux templates serveur (facture/devis, contrat) ET dans le composant client DocumentPDF.tsx ; inversé pour que la contrepartie soit toujours à gauche, MKA.P-MS toujours à droite. (2) règle #7, pied de page par défaut — aucun des templates ni du composant client n'affichait « www.mkapms.site » (trois domaines différents coexistaient ailleurs dans le code : mkapms.fr en base de vérification QR, mkapms.co pour le lien de signature partagé, aucun mkapms.site) ; ajouté dans les deux. (3) règle #8, donnée obligatoire manquante — renderDocument() remplaçait silencieusement toute variable non fournie par une chaîne vide ; distingue désormais une valeur explicitement vide (assumée) d'une variable jamais fournie (marquée visiblement « [À COMPLÉTER] », jamais blanche, jamais inventée).",
    pourquoi:
      "La direction a explicitement demandé un audit de l'existant contre le référentiel avant toute reconstruction, avec l'instruction absolue de ne jamais redessiner ou approximer les réglages déjà validés (filigrane, logo, signatures) et de ne jamais inventer de donnée manquante.",
    ou: [
      "server/document-os/index.ts",
      "server/document-os/templates.ts",
      "server/document-os/__tests__/templates.test.ts",
      "client/src/components/DocumentPDF.tsx",
    ],
    lecon:
      "Vérifié réellement : 30/30 vérifications dans le nouveau test dédié (variable manquante marquée visible sur les 13 templates par défaut, pied de page conforme sur les 13, ordre de signature conforme sur les 13), 30/30 toujours vert sur document-engine (aucune régression, moteur distinct confirmé — document-engine reste un suivi de garde de documents fournisseurs/véhicules, il délègue déjà explicitement le rendu à document-os). Portée assumée et documentée, pas silencieuse : quatre chantiers restent bloqués ou non commencés, chacun avec une tâche dédiée plutôt qu'un correctif approximatif — identité légale MKA.P-MS Guinée manquante partout dans le code (RCCM/NIF/adresse), impossible à compléter sans la donnée réelle de la direction (jamais inventée) ; couverture premium multi-pages et filigrane 148mm exact, bloqués sans le PDF référentiel et le Dossier VO v7 réels ; recordEdition() qui ne rattache aujourd'hui aucun document à son véhicule/transaction réel (règle #10) ; immuabilité d'un document signé non garantie (aucun instantané figé au moment de la signature) et aucun pipeline de rendu-image + contrôle visuel avant validation (règles #9 et #12). Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build client et serveur complets réussis.",
    domaine: "moteurs",
  },
  {
    cle: "document-os-identite-globale-guinee-registre-entites",
    titre: "Document OS — identité mondiale MKA.P-MS d'origine guinéenne, registre des entités juridiques, fin du repli France par défaut",
    moteurs: ["document"],
    quoi:
      "Correction explicite de la direction sur la tâche précédente : MKA.P-MS n'est pas une plateforme française par défaut. L'identité mondiale et l'origine historique sont la République de Guinée ; la France est une entité locale d'exploitation créée ensuite, au même titre que de futures entités pays — jamais un repli mondial. Architecture demandée : global_brand → legal_entities[] → countries[] → document_context, jamais « France → reste du monde ». Réalisé sans attendre les données légales réelles (toujours non fournies, jamais inventées) : nouvelle table doc_legal_entities (code, countryCode, isOriginEntity, legalName, registrationNumber, taxId, address, legalRepresentative) — seedée avec « guinee » (isOriginEntity=true, tous les champs légaux NULL, rien inventé) et « france » (entité locale, reprend les valeurs déjà présentes dans le code avant cet audit, authenticité non vérifiée par ce lot). BRAND_DEFAULTS de renderDocument() scindé : identité globale (brand_name, brand_origin=«République de Guinée», brand_scope) toujours disponible sans donnée de pays ; issuer_name/issuer_address/issuer_legal_line ne viennent plus jamais d'un défaut français mais de l'entité juridique réellement résolue (nouvelle renderDocumentPourEntite(), jamais un repli silencieux — [À COMPLÉTER] sans entité). Le header des templates affichait en dur « SIRET : {{issuer_siret}} · TVA : {{issuer_vat}} » — un libellage français câblé dans le HTML lui-même, jamais adapté à un autre pays : remplacé par {{issuer_legal_line}}, calculé selon le countryCode de l'entité résolue (RCCM/NIF pour la Guinée, SIRET/TVA pour la France, libellé générique pour un futur pays). Règle #5 (jamais de finalisation silencieuse) appliquée réellement : updateDocumentStatus()/signDocument() bloquent désormais la transition vers émis/signé pour tout document juridiquement engageant (montant renseigné, ou type contractuel) sans entité juridique explicite — le document reste en brouillon, jamais associé de force à la France. Nouvelle procédure documentOs.legalEntities.upsert (adminProcedure) pour que la direction saisisse elle-même les données réelles dès qu'elles seront fournies, sans jamais qu'un moteur les invente.",
    pourquoi:
      "La direction a explicitement rejeté l'hypothèse d'une France par défaut : MKA.P-MS est une marque internationale d'origine guinéenne, et le code doit le refléter structurellement, pas seulement documentairement — même avant que les données légales exactes de la société guinéenne soient disponibles.",
    ou: [
      "server/document-os/index.ts",
      "server/document-os/templates.ts",
      "server/document-os/__tests__/legal-entities.test.ts",
      "server/index.ts",
      "drizzle/0133_document_os_legal_entities.sql",
    ],
    lecon:
      "Vérifié réellement, sur base Postgres locale : 19/19 vérifications dans le nouveau test dédié (guinee marquée entité d'origine avec champs légaux NULL, france jamais traitée comme origine, aucun repli silencieux vers une identité française sans entité résolue, libellés RCCM/NIF vs SIRET/TVA corrects selon le pays, blocage réel de l'émission/signature d'une facture sans entité, émission réussie une fois l'entité attribuée même avec des champs encore [À COMPLÉTER], document non engageant jamais bloqué), 30/30 toujours vert sur le test de conformité précédent et sur document-engine (aucune régression). Portée assumée, pas silencieuse : ensureDefaultLegalEntities() ne écrase jamais une entité déjà en base — une donnée juridique saisie par la direction survit à tout redémarrage. recordEdition() (chemin réellement emprunté par les écrans qui tracent une édition A4) accepte désormais un legalEntityCode mais aucun écran ne le fournit encore — c'est exactement la tâche #35, non traitée ici pour ne pas mélanger deux chantiers. Les valeurs françaises héritées (SIRET, TVA, adresse) n'ont pas été vérifiées par ce lot : leur authenticité reste à confirmer par la direction, au même titre que les données guinéennes restent à fournir. Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build client et serveur complets réussis.",
    domaine: "moteurs",
  },
  {
    cle: "document-os-rattachement-entite-metier-reelle",
    titre: "Document OS — rattachement des documents à leur objet métier réel (règle #10), deux fabrications critiques découvertes en audit",
    moteurs: ["document"],
    quoi:
      "Suite explicitement autorisée par la direction (« tu n'as pratiquement rien à préciser, il peut le corriger sans demander ») : chaque document doit être relié à son vrai vehicle_id/annonce/mission/enchère, jamais un repli. Audit : recordEdition() (le chemin réellement emprunté par tout écran qui trace une édition A4 via imprimerFeuille/telechargerCSV, server/document-os/index.ts) ne recevait et ne transmettait jamais linkedEntityType/linkedEntityId à createDocument(), alors que ce champ existe dans le schéma depuis l'origine du moteur — un manque de plomberie pur, pas une décision. Corrigé de bout en bout : recordEdition()/documentOs.editions.record acceptent désormais linkedEntityType/linkedEntityId ; côté client, tracerEdition()/imprimerFeuille()/telechargerCSV() (client/src/lib/documents.ts) acceptent un entiteLiee: {type, id} et le propagent. Câblé sur les deux écrans dont l'audit a confirmé un objet métier réel unique et backé par un vrai routeur : vente/AttestationVente.tsx (annonceId de la route, trpc.voEspaces.attestations) et VenteEncheres.tsx (lotId, trpc.auctionEngine — bordereau d'adjudication et rapport d'expertise du lot). Audit des 16 autres écrans producteurs de documents (comptabilité TVA, analytique, publicités, relevé bancaire, garages…) : la plupart sont des rapports agrégés sans un objet métier unique — ne rien y rattacher est le comportement honnête, pas un oubli.",
    pourquoi:
      "La direction a demandé que chaque document soit relié à son vrai objet métier (véhicule, transaction, mission…), en autorisant explicitement une correction directe sans validation préalable pour ce point précis.",
    ou: [
      "server/document-os/index.ts",
      "client/src/lib/documents.ts",
      "client/src/pages/vente/AttestationVente.tsx",
      "client/src/pages/VenteEncheres.tsx",
      "server/document-os/__tests__/linked-entity.test.ts",
      "server/engine-registry/catalog.ts",
    ],
    lecon:
      "Vérifié réellement : 6/6 dans le nouveau test dédié (entité réellement stockée quand fournie, jamais inventée quand absente), 19/19 et 30/30×2 toujours verts sur les suites document-os/document-engine existantes. Un vrai défaut de dépendance non déclarée trouvé par le générateur (intelligences → document, provoqué par le propre texte de clôture du lot précédent qui nommait documentOs.legalEntities.upsert — jamais corrigé à l'époque faute d'avoir relancé gen:moteurs après le dernier commit de cette PR) : corrigé, retombé à la ligne de base. Portée assumée et documentée, pas silencieuse : deux écrans se sont révélés être des données 100% locales sans aucun vehicule_id serveur (garage/ReceptionVehicule.tsx, garage/RestitutionClient.tsx, déjà documentés comme non enregistrés côté serveur) — rien à rattacher tant qu'aucun backend réel n'existe, hors périmètre de ce lot. Deux fabrications bien plus graves, découvertes pendant cet audit et sorties en tickets dédiés plutôt que masquées : Historique.tsx affiche un faux paiement Stripe confirmé (« Votre paiement de 4,99€ a été accepté ») sans aucun appel de paiement réel dans tout le fichier, une détection de véhicule figée en dur quel que soit le VIN saisi, et un score de fiabilité tiré au hasard — risque réel de tromperie commerciale si cet écran est accessible en production ; DossierClient.tsx affiche un dossier client entièrement inventé (achats, historique d'entretien, documents « Disponible ») sans un seul appel serveur. Ni l'un ni l'autre n'a été touché ici : ce sont des chantiers de fond distincts, pas des rattachements d'entité. Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build client et serveur complets réussis.",
    domaine: "moteurs",
  },
  {
    cle: "historique-fin-fabrication-paiement-detection-score",
    titre: "Historique.tsx — fin du faux paiement Stripe, de la fausse détection véhicule et du faux score de fiabilité, convergence vers le moteur réel déjà en production",
    moteurs: ["document"],
    quoi:
      "Écran public /historique entièrement réécrit (l'ancien fichier de 1466 lignes remplacé). Avant ce lot : simulatePayment() était un pur setTimeout affichant « Paiement sécurisé via Stripe — SSL 256 bits » puis « Votre paiement de 4,99 € a été accepté » sans un seul appel de paiement réel dans tout le fichier ; handleVerify() renvoyait toujours {marque:\"Renault\",modele:\"Clio IV\",annee:\"2019\"} quel que soit le VIN ou la plaque saisie ; un « score de fiabilité » et un « doublon détecté » étaient tirés au hasard (Math.random()) ; des statistiques sociales fabriquées (« 537 842 rapports générés », « 4,8/5 sur 12 684 avis », garantie satisfait-ou-remboursé) habillaient le tout. Remplacé par le même modèle honnête que l'écran jumeau déjà en production HistoriqueVehiculeVente.tsx : identification technique réelle via trpc.annonces.lookupPlate (vrai appel externe déjà utilisé ailleurs sur la plateforme), et demande de rapport détaillé réelle et tracée via trpc.historique.requestReport/myReports (table vehicle_reports, statut en_attente/pret/echec) — plus aucune affirmation de paiement, puisqu'aucune intégration de paiement réelle n'existe nulle part pour cette fonctionnalité (tables vehicleReportPayments/vinChecks confirmées orphelines par grep, jamais référencées). L'exemple illustratif dans la modale de démonstration est conservé mais explicitement étiqueté comme fictif.",
    pourquoi:
      "Découvert pendant l'audit du rattachement documentaire (tâche précédente) et sorti en ticket dédié plutôt que masqué : un écran accessible aux utilisateurs réels affichait une confirmation de paiement et un résultat d'identification totalement fabriqués — un risque de tromperie commerciale, pas un simple défaut d'affichage.",
    ou: [
      "client/src/pages/Historique.tsx",
    ],
    lecon:
      "Vérifié réellement, pas seulement relu : après réécriture, vérification visuelle par Playwright sur un serveur de développement réellement démarré (viewport mobile 390×844), qui a mis en évidence un vrai bug introduit par ma propre réécriture — la carte « Demander le rapport détaillé » était conditionnée à la présence d'un résultat d'identification (lookup.data), donc ne s'affichait jamais quand la recherche externe ne trouvait rien, alors que le message d'état vide promettait explicitement ce bouton juste en dessous. Corrigé (condition sur !lookup.isFetching plutôt que sur lookup.data) et revérifié par une seconde capture d'écran confirmant l'affichage correct, sans aucune trace de paiement, de score aléatoire ou de statistique fabriquée, et une console propre (à l'exception d'un ERR_CERT_AUTHORITY_INVALID attendu, dû à l'interception TLS du bac à sable sur l'appel externe réel, sans rapport avec le code applicatif). Portée assumée, pas silencieuse : comme pour l'écran jumeau déjà accepté en production, aucune mutation admin n'existe nulle part pour faire passer une ligne vehicle_reports de en_attente à prêt avec de vraies données — une demande reste en attente tant qu'aucun traitement humain ou connecteur externe (assureurs, fichier des véhicules gagés/volés) n'existe ; défaut préexistant, non introduit ni corrigé par ce lot, hors périmètre. Régénération des données dérivées dans l'ordre établi (routes→cliquables→boutons→sections→moteurs) : amélioration réelle et non une régression déguisée (175 boutons fantômes contre 177, 179 anomalies cliquables contre 181, 608 manques moteurs contre 610), plusieurs faux boutons disparaissant avec la fabrication qu'ils accompagnaient (ex. « Pack Pro Acheter »). Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build client et serveur complets réussis.",
    domaine: "confiance",
  },
  {
    cle: "dossier-client-fin-fabrication-vers-moteurs-reels",
    titre: "DossierClient.tsx — fin des achats/ventes/entretiens/documents inventés, chaque onglet relié au moteur réel déjà utilisé par l'écran jumeau honnête correspondant",
    moteurs: ["vente"],
    quoi:
      "/dossier-client (« Mon dossier », lié depuis Compte.tsx et Admin.tsx) affichait huit onglets (achetés, vendus, devis, réservations, locations, paiements, favoris, messages) entièrement fabriqués en dur : véhicules achetés avec historique d'entretien et documents marqués « Disponible » inventés, réservation avec un bouton « Annuler » qui n'appelait aucune mutation, paiements et messages fictifs — zéro appel serveur dans tout le fichier. Réécrit entièrement : chaque onglet reprend exactement le moteur réel déjà utilisé par l'écran jumeau honnête correspondant sous client/src/pages/utilisateurs/ (HistoriqueAchats → trpc.reservations.mesPaiements filtré vehicle_purchase, MesVehicules → trpc.annonces.mine filtré vendue, HistoriqueLocations/réservations → trpc.reservations.mine filtré par type, FacturesUtilisateur → trpc.reservations.mesPaiements, HistoriqueEntretiens → trpc.garages.myInterventions, MessagerieGlobale → trpc.messages.listThreads, CentreFavorisUtilisateur → trpc.favoris.mine/toggle) et server/routers/devis.ts (trpc.devis.mine) — jamais un second registre inventé pour cette page. Ce qui n'a aucune donnée réelle correspondante a été retiré plutôt que remplacé par une fabrication : la liste de documents par véhicule (aucun coffre documentaire par véhicule n'existe), et le bouton « Annuler » d'une réservation (le moteur de réservation n'expose aucune mutation d'annulation) — remplacé par l'action réelle déjà disponible ailleurs sur la plateforme (Compte.tsx) : trpc.reservations.payCaution pour régler un acompte réellement en attente. Les modales « Historique » et « Entretien » d'un achat combinent désormais l'événement d'achat réel (paiement) et les rendez-vous garage réels rattachés au même véhicule (garages.myInterventions filtré par annonceId), et sont exportées via imprimerFeuille avec entiteLiee: {type: \"annonce\", id: vehicleId} (règle #10, document-os).",
    pourquoi:
      "Découvert pendant l'audit du rattachement documentaire (lot précédent) et sorti en ticket dédié plutôt que masqué : un « dossier centralisé » présentait à l'utilisateur des achats, un historique d'entretien et des documents entièrement inventés comme s'ils étaient ses données réelles.",
    ou: [
      "client/src/pages/DossierClient.tsx",
      "server/engine-registry/catalog.ts",
    ],
    lecon:
      "Vérifié réellement, avec des données réelles insérées puis nettoyées en base locale (jamais laissées en base) : connecté en tant que compte réel (pdg-test@mkapms.local, seul moyen d'atteindre cette page — le module dossier_client est volontairement réservé aux comptes employé/admin dans shared/permissions.ts, jamais un particulier ; vérifié avant toute modification que ce n'est pas un bug — Compte.tsx filtre déjà ALL_SERVICES par canAccessServicePath avant affichage, aucun particulier ne voit jamais ce lien), les 8 onglets affichent un état vide honnête à zéro donnée réelle, puis un paiement réel + une annonce réelle + un rendez-vous garage réel insérés en base ont fait apparaître les compteurs corrects (Achetés (1), Vendus (1)) et la modale Historique a combiné correctement les deux événements réels dans le bon ordre chronologique — capture d'écran à l'appui. Un vrai défaut de dépendance non déclarée trouvé par le générateur (vente → garage, vente → messaging : l'ancien fichier fabriqué n'appelait jamais ces moteurs, le nouveau si) : corrigé dans server/engine-registry/catalog.ts, retombé à la ligne de base (608 manques, identique à avant ce lot). Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build client et serveur complets réussis.",
    domaine: "confiance",
  },
  {
    cle: "compta-dirigeant-fin-fabrication-ca-employes-alertes",
    titre: "ComptaDirigeant.tsx — fin du CA par univers inventé, des 28 employés fictifs (salaire, email, téléphone, performance) et des alertes financières fabriquées",
    moteurs: ["accounting_internal"],
    quoi:
      "Tableau de bord dirigeant (/compta-dirigeant, module comptabilite réservé admin/PDG) entièrement fabriqué sur ses 4 onglets : CA par univers (vente/location/garage/enchères/publicité) avec pourcentages inventés, commissions plateforme inventées, un roster de 28 employés fictifs avec salaire/email/téléphone/date d'embauche/performance/présence/formation inventés, 6 paiements fictifs avec nom de client et méthode de paiement inventés, 8 plans d'abonnement avec abonnés et revenu inventés, et 12 alertes (facture impayée, abonnement expiré, stock critique) entièrement fabriquées — zéro appel serveur. Reconnecté à ce qui existe réellement : admin.dashboard (CA jour/semaine/mois/année, commissions et remboursements réels du mois, compteurs réels paiements en attente/échoués/abonnements actifs), admin.paymentsList (paiements réels tous utilisateurs, étendu au préalable de rien — déjà complet), admin.staffList (équipe réelle : email, rôle, poste — étendu avec le téléphone réel déjà présent sur users mais jamais sélectionné), et smartEngine.alerts/alertStats/resolveAlert (le vrai Smart Engine déjà utilisé par SmartEngine/ControlCenter.tsx, avec un vrai bouton « Marquer comme résolue » qui écrit réellement en base — avant ce lot ce bouton ne faisait que naviguer sans rien résoudre). Retiré plutôt que fabriqué, faute de toute donnée réelle correspondante : le CA par univers (aucun type de paiement ne distingue garage/enchères/publicité aujourd'hui), le salaire/la performance/la présence/la date d'embauche/la formation des employés (aucune de ces colonnes n'existe dans le schéma), le nom du client et la méthode de paiement sur chaque paiement (remplacés par la référence réelle #userId, sans jamais inventer un nom), et le détail des abonnements par plan avec revenu (aucune agrégation de ce type n'existe) — remplacé par le seul total réel disponible.",
    pourquoi:
      "Poursuite de la mission de fond : chaque écran fabriqué découvert doit être reconnecté à un moteur réel ou voir sa fonctionnalité honnêtement réduite, jamais laissé à afficher des chiffres inventés à la direction elle-même.",
    ou: [
      "client/src/pages/ComptaDirigeant.tsx",
      "server/routers/admin.ts",
      "server/engine-registry/catalog.ts",
    ],
    lecon:
      "Recherche préalable poussée (agent dédié) avant d'écrire une seule ligne : a évité de fabriquer une catégorisation CA par univers ou des champs RH qui n'existent nulle part, et a permis de découvrir deux fabrications sœurs non traitées ici (AdminEmployes.tsx sous superadmin/, lié depuis cet écran, et CentrePilotage.tsx sous comptabilite/ qui importe trpc sans jamais l'appeler) — sorties en tâches dédiées plutôt que masquées, de même que les deux vrais manques d'infrastructure (CA par univers, revenu par plan d'abonnement) qui nécessitent une vraie extension de schéma, jamais une invention côté écran. Vérifié réellement avec des données insérées puis nettoyées en base locale : un vrai paiement (15 900 EUR) apparaît correctement dans le CA du mois et dans la liste des derniers paiements ; le compte de test réel (rôle PDG) apparaît correctement dans l'onglet Équipe sans aucune donnée inventée ; une vraie alerte Smart Engine insérée apparaît dans l'onglet Alertes, et le bouton « Marquer comme résolue » a réellement mis à jour son statut en base (vérifié par relecture directe de la table). Un vrai bug attrapé par Playwright pendant la vérification, hérité tel quel de l'ancien fichier fabriqué sans jamais avoir été corrigé : un <button> imbriqué dans un <button> (carte CA cliquable contenant les boutons de période J/S/M/A), HTML invalide générant un avertissement React — corrigé en transformant le conteneur en div avec role=button. Un vrai défaut de dépendance non déclarée trouvé par le générateur (accounting_internal → smart, l'ancien fichier n'appelait jamais le Smart Engine) : corrigé dans server/engine-registry/catalog.ts, retombé à la ligne de base (608 manques). Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build client et serveur complets réussis.",
    domaine: "confiance",
  },
  {
    cle: "demarches-carte-grise-fin-coquilles-vers-cartegrise-router",
    titre: "8 écrans demarches/*.tsx orphelins reconnectés au moteur carte grise réel (server/routers/cartegrise.ts)",
    moteurs: ["cartegrise"],
    quoi:
      "ChangementAdresse, ChangementTitulaire, DeclarationCession, DuplicataDemarche, EspaceProDemarches, ImmatriculationProvisoire, ImportationVehicule et WWGarage (client/src/pages/demarches/) étaient des coquilles de 13 à 20 lignes : champs de formulaire sans state React, boutons « Télécharger »/« Soumettre »/« Valider » sans le moindre gestionnaire de clic, listes de documents ou de demandes codées en dur (statuts, dates d'expiration inventés). Le vrai moteur carte grise (server/routers/cartegrise.ts, table cg_dossiers) existe et fonctionne déjà, utilisé par le seul écran honnête client/src/pages/CarteGrise.tsx (onglets Info/Mes dossiers/Nouveau dossier/Espace agence) — jamais trouvé par ces 8 écrans faute d'avoir été branché. Chacun reconnecté à trpc.carteGrise.createDossier avec le type réel de l'énumération cg_dossier_type quand il existe (changement_titulaire, declaration_cession, duplicata, vehicule_etranger, ww_cpi pour l'immatriculation provisoire, w_garage), à trpc.carteGrise.mesDossiers filtré côté client pour l'historique, et à trpc.carteGrise.addDocument + FileUpload (composant réel, /api/upload) pour les pièces jointes. ChangementAdresse n'a aucun type dédié dans le schéma réel : créé en type « autre » avec la nouvelle adresse portée dans le champ notes réel plutôt que d'inventer une colonne. EspaceProDemarches (fausse société « SAS Auto+ » et 3 faux dossiers) reconnecté à trpc.carteGrise.monAgence + dossiersPourAgence, le même moteur agence déjà utilisé par l'onglet Espace agence de CarteGrise.tsx. La fausse « Signature numérique » de DeclarationCession et les statuts de document individuels inventés (valide/en_attente/non_envoyé par pièce) ont été retirés faute de backing réel : le statut réel est celui du dossier entier (cg_dossiers.status), jamais un statut par pièce inventé.",
    pourquoi:
      "Poursuite de la tâche de fond déjà identifiée : reconnecter les écrans démarches orphelins au routeur carte grise existant plutôt que d'en laisser huit afficher des formulaires qui ne soumettent jamais rien.",
    ou: [
      "client/src/pages/demarches/ChangementAdresse.tsx",
      "client/src/pages/demarches/ChangementTitulaire.tsx",
      "client/src/pages/demarches/DeclarationCession.tsx",
      "client/src/pages/demarches/DuplicataDemarche.tsx",
      "client/src/pages/demarches/EspaceProDemarches.tsx",
      "client/src/pages/demarches/ImmatriculationProvisoire.tsx",
      "client/src/pages/demarches/ImportationVehicule.tsx",
      "client/src/pages/demarches/WWGarage.tsx",
    ],
    lecon:
      "Vérifié réellement, pas seulement relu : connecté avec un compte particulier réel, un dossier changement_titulaire (réf. CT-…-001) a été réellement créé en base via le formulaire, apparaissant immédiatement dans la liste « Vos dossiers » — puis supprimé après vérification, jamais laissé en base de test. Amélioration mesurée par les générateurs, pas déclarée : 175→163 boutons sans action, 179→167 anomalies cliquables, 608→595 manques moteurs, sans aucune régression. Portée assumée : les 13 autres fichiers du dossier demarches/ (CarteGriseDemarche.tsx et DemarchesGenerale.tsx compris, également à 0 appel trpc) n'ont pas été traités dans ce lot, faute de temps — CarteGrise.tsx expose déjà toutes les démarches de façon générique et pourrait rendre certains de ces doublons obsolètes plutôt qu'à corriger un par un ; à trancher dans un lot dédié plutôt que fabriqué à la hâte ici. Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build client et serveur complets réussis.",
    domaine: "confiance",
  },
  {
    cle: "payment-engine-fix-enum-invalide-devis-cartegrise",
    titre: "[CRITIQUE] Paiement devis et abonnements/packs carte grise réellement cassés — valeur enum invalide",
    moteurs: ["payment"],
    quoi:
      "devis.ts (payerDevis) et cartegrise.ts (souscrireAbonnement, acheterPack) appelaient createPaymentCheckout() avec un paymentTypeSql explicite (« garage_prestation », « carte_grise ») absent de l'énumération Postgres réelle payment_type (rental_caution, society_acompte, pro_subscription, franchise_subscription, vehicle_boost, vehicle_purchase). Confirmé par un INSERT direct en base locale : Postgres rejette avec « invalid input value for enum payment_type ». Concrètement : tout client réel payant un devis garage accepté, ou toute agence souscrivant un abonnement ou achetant un pack de dossiers carte grise, recevait une erreur serveur au lieu d'un paiement — trois parcours de paiement réels et déjà exposés aux utilisateurs, cassés depuis leur écriture. Corrigé en retirant les trois overrides invalides : le sqlTypeMap déjà présent dans checkout.ts sait mapper ces kinds (garage_prestation, carte_grise_service) vers « vehicle_boost », une valeur réellement acceptée — jamais un nouveau code, juste laisser le mécanisme existant faire son travail.",
    pourquoi:
      "Découvert en creusant le signalement direct de la direction sur le Centre de contrôle (écran « Cas de paiement », majoritairement rouge) : l'investigation a révélé que certains cas rouges reflètent un vrai système de paiement (payments/Stripe) invisible à l'audit du Payment Engine (qui n'observe qu'une table paymentTransactions dans laquelle rien n'écrit jamais) plutôt qu'une absence de code — mais elle a aussi mis au jour ce bug d'un tout autre ordre : un paiement réellement câblé qui échoue à chaque tentative réelle.",
    ou: [
      "server/routers/devis.ts",
      "server/routers/cartegrise.ts",
      "server/payment-engine/__tests__/checkout.test.ts",
    ],
    lecon:
      "Vérifié réellement, pas supposé : un INSERT direct avec chaque valeur invalide a été exécuté contre Postgres local pour confirmer le rejet exact avant toute correction, puis un nouveau test de non-régression (5/5) vérifie à la fois que ces valeurs restent rejetées par l'enum ET que les deux fichiers appelants ne les repassent plus — le test a été validé en le faisant échouer délibérément (git stash de la correction) avant de la restaurer, pour prouver qu'il attrape réellement la régression et pas seulement le chemin déjà correct. Portée assumée : la cause racine plus large (deux systèmes de paiement parallèles — l'ancien, réellement utilisé partout, table payments ; et le nouveau Payment Engine avec sa propre table paymentTransactions jamais alimentée) reste un chantier distinct, non traité ici pour ne pas retarder ce correctif critique — sa réparation (rendre l'audit honnête) fait l'objet d'un lot séparé. Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build client et serveur complets réussis. Aucune donnée dérivée affectée (changement serveur pur, aucun nouvel écran ni bouton).",
    domaine: "confiance",
  },
  {
    cle: "vehicle-delivery-connecteur-distance-routiere",
    titre: "Vehicle Delivery Engine — connecteur de distance routière réelle (Google Maps), jamais une distance approximée",
    moteurs: ["livraison_vehicule"],
    quoi:
      "Le devis d'acheminement de véhicule (server/vehicle-delivery/service.ts) affichait « Non mesuré » sur toute étape au barème kilométrique dès que la distance entre les deux villes n'était pas connue — comportement honnête et volontaire (aucun prix n'est jamais inventé), mais aucun connecteur ne calculait jamais cette distance : distanceKm dépendait entièrement d'un appelant qui ne la fournissait jamais. Construit server/vehicle-delivery/routing.ts (calculerDistanceRoutiere) : appelle réellement l'API Google Maps Distance Matrix avec les deux villes/pays, retourne la distance routière réelle en km. Tant que GOOGLE_MAPS_API_KEY n'est pas configurée (aucune clé fournie à ce jour), ou en cas d'échec réel de l'appel (réseau, quota, ville introuvable), retourne null sans exception — le devis reste alors exactement aussi honnête qu'avant, avec le même manque nommé « connecteur d'itinéraire ». Câblé dans devis() : la distance fournie par l'appelant reste prioritaire ; à défaut, tentative réelle via ce connecteur si les deux villes/pays sont connus.",
    pourquoi:
      "Signalé directement par la direction via une capture d'écran du devis d'acheminement affichant « Non mesuré » avec un manque « connecteur d'itinéraire » nommé explicitement. Un vrai choix de méthode (distance à vol d'oiseau déjà disponible localement vs distance routière réelle via API externe) a été explicitement demandé et tranché par la direction en faveur de la distance routière réelle, malgré l'absence de clé API immédiate — jamais décidé unilatéralement, l'exactitude du prix facturé au client étant en jeu.",
    ou: [
      "server/vehicle-delivery/routing.ts",
      "server/vehicle-delivery/service.ts",
      "server/env.ts",
      "server/vehicle-delivery/__tests__/routing.test.ts",
    ],
    lecon:
      "Vérifié réellement dans les limites de ce qui est vérifiable sans la clé réelle (non encore fournie, tâche dédiée créée) : 5/5 vérifications, dont la plus critique — devis() sans clé configurée (état réel actuel) produit exactement le même distanceKm: null et le même manque qu'avant ce lot, prouvant l'absence de régression — puis, avec une clé factice et un fetch réseau simulé portant une vraie forme de réponse Google Distance Matrix, la logique de parsing du succès (465 km) et celle d'un échec Google (NOT_FOUND → null, jamais une distance inventée) sont vérifiées. Le seul point non vérifiable ici, assumé et non caché : le vrai appel réseau vers Google avec une vraie clé, qui ne pourra être confirmé que le jour où la direction fournira une clé réelle — jamais déclaré « actif » avant cette vérification. Typecheck : 49 erreurs préexistantes hors périmètre, aucune nouvelle. Build complet réussi.",
    domaine: "confiance",
  },
  {
    cle: "moteur-boutons-cluster-confiance-superadmin",
    titre: "Moteur des boutons — 5 écrans superadmin confiance/sécurité 100% fabriqués reconnectés aux moteurs réels",
    moteurs: ["smart", "vente", "avis_reputation"],
    quoi:
      "5 écrans du cluster confiance/sécurité superadmin (AdminFraude.tsx, AdminLitiges.tsx, AdminSecurite.tsx, AdminModerationAnnonces.tsx, AdminModerationAvis.tsx) étaient chacun 100% fabriqués : tableaux en dur (faux comptes suspects, faux litiges nommés, faux événements de sécurité, fausses annonces/avis en attente), zéro appel trpc, 16 boutons fantômes au total (ex: « Bloquer », « Investiguer », « Mediation », « Resoudre »). Reconnectés chacun à un moteur réel déjà existant, jamais un second registre inventé : AdminFraude → smartEngine.unresolvedSuspects/resolveSuspect (table smart_suspect_accounts, déjà alimentée par la détection de fraude réelle) ; AdminLitiges → disputes.listAll/decide (server/routers/operations.ts, déjà utilisé côté client par disputes.mine/open) ; AdminSecurite → admin.auditLog (server/audit.ts, journal « radar Direction » déjà alimenté par logAction() à chaque connexion, échec de connexion, blocage, suppression…) ; AdminModerationAnnonces → admin.annoncesPending/moderateAnnonce (statut réel annonce_status.en_validation, déjà câblé) ; AdminModerationAvis → reviewsV2.adminDashboard/moderate (moteur d'avis universel réel avec motif obligatoire pour masquer/refuser un avis, déjà utilisé par le site public).",
    pourquoi:
      "Directive explicite de la direction : arrêter toute autre piste et concentrer l'effort sur le moteur des boutons, le moteur de redirection et les connexions entre les moteurs, suite à une capture d'écran du Centre de contrôle montrant « Boutons & liens : 16% OK, 30/193 fonctionnels, 163 à corriger » en rouge. Ce cluster confiance/sécurité a été traité en priorité car il prolonge directement le thème « confiance » déjà travaillé dans ce chantier (AdminFraude notamment), et parce qu'aucun de ces 5 écrans n'avait le moindre appel réel (grep trpc = 0 partout).",
    ou: [
      "client/src/pages/superadmin/AdminFraude.tsx",
      "client/src/pages/superadmin/AdminLitiges.tsx",
      "client/src/pages/superadmin/AdminSecurite.tsx",
      "client/src/pages/superadmin/AdminModerationAnnonces.tsx",
      "client/src/pages/superadmin/AdminModerationAvis.tsx",
    ],
    lecon:
      "Découverte assumée, jamais masquée : en reconnectant AdminFraude.tsx au moteur de détection de fraude réel, il est apparu qu'aucune capacité de suspension de compte n'existe réellement sur la plateforme (userStatusEnum déclaré dans le schéma mais jamais attaché à la table users ; l'authentification ne revérifie jamais l'état en base après émission du token JWT 30 jours) — le bouton « Bloquer » fabriqué n'a donc pas été remplacé par un bouton réel mais retiré, et une tâche dédiée (#51) trace ce vrai manque plutôt que de le cacher derrière un bouton qui n'aurait rien fait. Vérifié réellement, pas seulement relu : les 5 fichiers typechecks (0 erreur les concernant, 55 erreurs préexistantes hors périmètre inchangées — confirmé cette fois par un git stash direct des modifications sur la base actuelle : les 55 erreurs existent identiquement sans mes changements, ce chiffre de référence était noté 49 dans les livraisons précédentes de ce chantier et a dérivé à 55 au fil des lots mergés depuis, jamais corrigé ni caché ici). Amélioration mesurée par les générateurs, pas déclarée : boutons sans action 163→147 (les 5 écrans disparaissent intégralement de la liste, vérifié par grep), anomalies cliquables 167→151, manques moteurs 595→579, sans aucune régression sur dependance_non_declaree (32) ni dependance_sans_preuve (41). Build client et serveur complets réussis. Portée assumée : ceci ne couvre que 5 des 98 fichiers restants de la liste des boutons fantômes (147 boutons répartis sur ~93 fichiers restent à traiter), la vérification du moteur de redirection (100% résolues, 12005/12023 auto-déclarées) reste à auditer indépendamment, et l'audit proactif des connexions entre moteurs (dependance_non_declaree/dependance_sans_preuve) n'a pas encore été mené comme chantier dédié — seulement corrigé de façon réactive jusqu'ici.",
    domaine: "confiance",
  },
  {
    cle: "moteur-boutons-sauvegardes-support-superadmin",
    titre: "Moteur des boutons — AdminSauvegardes.tsx et AdminSupport.tsx reconnectés à deux moteurs réels jamais raccordés",
    moteurs: ["core", "smart"],
    quoi:
      "AdminSauvegardes.tsx (5 boutons fantômes) et AdminSupport.tsx (4 boutons fantômes) affichaient des tableaux en dur (fausses sauvegardes, faux tickets) avec zéro appel trpc. Reconnectés à deux moteurs déjà entièrement construits mais jamais câblés à un écran : backup-os (server/backup-os/index.ts — manifeste logique de sauvegarde par comptage de lignes, restauration jamais automatique, toujours soumise à une demande puis une décision explicite, garde-fou assumé dans le code lui-même) et support-os (server/support-os/index.ts — file d'attente triée par priorité au-dessus de la table support_tickets déjà utilisée par le centre d'aide public, avec support.respond/setStatus pour répondre/résoudre). Pas de bouton « Télécharger » sur les sauvegardes : les sauvegardes physiques de la base sont gérées par l'hébergeur, aucun export de fichier n'existe réellement — un tel bouton aurait été un nouveau bouton fantôme.",
    pourquoi:
      "Suite de la directive direction de concentrer l'effort sur le moteur des boutons. Ces deux fichiers étaient les plus chargés en boutons fantômes après le lot précédent (5 et 4), et les deux avaient déjà un moteur backend entièrement écrit et documenté, simplement jamais relié à un écran — la reconnexion ne demandait donc aucune nouvelle logique métier, seulement un vrai câblage.",
    ou: [
      "client/src/pages/superadmin/AdminSauvegardes.tsx",
      "client/src/pages/superadmin/AdminSupport.tsx",
    ],
    lecon:
      "Vérifié en conditions réelles, pas seulement relu : contre la base locale, une vraie sauvegarde manuelle a été déclenchée (143 lignes/11 tables réellement comptées), une vraie demande de restauration créée puis approuvée (le compteur « Restaurations en attente » passe bien de 1 à 0), et un vrai ticket support créé, répondu puis résolu (disparaît bien de la file une fois resolu) — toutes les données de test supprimées après vérification. Deux fichiers candidats de ce même lot (PubliciteDetail.tsx, AdminAbonnements.tsx) ont été délibérément exclus après investigation : contrairement à AdminSauvegardes/AdminSupport, aucun moteur admin réel n'existe pour eux (le système de publicité — PubliciteDetail/PublicitesPro/PublicitesRevenu/PubliciteInterne — est fabriqué de bout en bout sans aucune table ni routeur ; le routeur abonnements n'expose qu'un `mine` pour l'utilisateur connecté, aucune vue admin listant tous les abonnés ni CA récurrent). Construire ces backends aurait dépassé le cadre d'une reconnexion de boutons fantômes vers l'existant — tracés en tâches dédiées (#52, #53) plutôt que bâclés ici ou fabriqués une deuxième fois. Typecheck : 0 erreur sur les 2 fichiers modifiés, 55 erreurs préexistantes hors périmètre inchangées. Boutons sans action : 147→138. Anomalies cliquables : 151→142. Manques moteurs : 579→570. Aucune régression sur les dépendances déclarées entre moteurs. Build complet réussi.",
    domaine: "confiance",
  },
  {
    cle: "redirection-auto-reparation-immediate-dependance-direction",
    titre: "Moteur de redirection — l'auto-réparation passe de « jusqu'à 6 h plus tard » à « immédiate, au premier signalement »",
    moteurs: ["redirection", "smart"],
    quoi:
      "Demande explicite de la direction : « dès qu'il y a un problème, le Système Intelligent le résout directement ». L'auto-réparation des redirections existait déjà (server/smart-engine/services/auto-fix.ts : applyRedirectionFix, healRecent404s — ne corrige QUE vers une route client réellement existante, jamais une destination devinée), mais n'était rejouée que par le scan périodique (toutes les 6 h). Un bouton/lien cassé, ou une page 404 jamais vue, restait donc cassé pour tout le monde jusqu'au prochain scan. Corrigé à la racine (dans le moteur lui-même, pas écran par écran) : resolveKey() et resolvePath() (server/redirection-engine/service.ts) tentent désormais la même correction sûre IMMÉDIATEMENT, dans l'appel qui découvre le problème — la toute première personne qui clique sur un bouton sans règle, ou tombe sur une page 404 réparable, repart déjà corrigée. Extrait de auto-fix.ts en une fonction réutilisable (healSinglePath) pour que le scan périodique et la réparation immédiate partagent exactement la même logique, jamais deux implémentations divergentes. Le scan périodique (server/index.ts) reste nécessaire pour le reste (recettes supprimées par erreur, boutons fantômes détectés en CI, bilans de santé) — son intervalle est rapproché de 6 h à 30 min pour que ces cas-là aussi remontent bien plus vite.",
    pourquoi:
      "Message vocal direct de la direction : travailler exclusivement sur le moteur des boutons et le moteur de redirection, et connecter le Système Intelligent pour qu'un problème critique soit résolu directement plutôt que simplement signalé. Investigation du chiffre cité par la direction (« 90 et quelques moteurs, seulement 87 connectés et actifs ») : le registre réel (base locale) compte 94 moteurs — 74 actifs, 19 en préproduction (staging), 1 désactivé — chiffres proches mais pas identiques à ceux cités, la différence relevant probablement d'une lecture d'écran plutôt que d'un chiffre à corriger ici. Point important vérifié : les moteurs « boutons » et « redirection » eux-mêmes sont TOUS LES DEUX déjà état=active/santé=ok dans le registre — l'écart entre moteurs déclarés et actifs concerne d'autres moteurs (achat_*, vente_*, location_*, finance, payment, investment, controle_technique, connecteur_google_business — tous en staging faute de preuve d'usage réel suffisante pour l'audit d'activation), pas ceux visés par cette directive.",
    ou: [
      "server/redirection-engine/service.ts",
      "server/smart-engine/services/auto-fix.ts",
      "server/index.ts",
      "server/redirection-engine/__tests__/redirection-engine.test.ts",
    ],
    lecon:
      "Vérifié en conditions réelles de bout en bout, pas seulement en test unitaire : après le lot, un navigateur réel (Playwright) a visité une page 404 jamais vue auparavant sur le serveur réel (build de production, base locale) — le Système Intelligent a créé la règle et redirigé le navigateur vers la bonne page en une seule requête, sans qu'aucun scan périodique n'ait jamais tourné entre-temps. Complété par 5 nouvelles assertions dans le test réel existant du moteur (19/19 au lieu de 14/14) : une clé de bouton réelle sans règle est résolue et la règle réellement créée en base dès le premier appel (pas seulement une valeur renvoyée en mémoire), un chemin 404 réel est de même réparé et son alias réellement inséré. Portée assumée : ce mécanisme ne peut réparer que ce qui a une cible SÛRE et déductible (route client réellement existante) — un bouton fantôme sans destination évidente (la grande majorité des 138 restants) ne peut pas être auto-réparé sans jugement humain sur quel moteur métier réel le connecter, exactement le travail fait manuellement lot par lot dans ce chantier (PR #383, #384) : c'est là, concrètement, la façon dont « l'IA résout le problème » pour les boutons aujourd'hui — il n'existe pas de raccourci honnête au-delà. Typecheck : 0 erreur sur les 4 fichiers touchés, 55 erreurs préexistantes hors périmètre inchangées. Aucune régression sur les générateurs (boutons 138, cliquables 142, manques 570 — inchangés, ce lot ne touche aucun écran). Build complet réussi.",
    domaine: "confiance",
  },
  {
    cle: "alertes-resolu-mensonge-etat-boucle-reouverture",
    titre: "[CRITIQUE] « Résolu » sur une alerte bouton mentait sur l'état réel — l'alerte revenait dès le contrôle suivant",
    moteurs: ["smart"],
    quoi:
      "Signalement direct et très concret de la direction, capture d'écran à l'appui : « je clique le bouton résolu, je réactualise la page, ça revient direct ». Cause racine trouvée dans le moteur, pas dans un écran : resolveAlertWithLearning() (server/smart-engine/services/alert-engine.ts), pour une alerte de type « bouton/page cassé » (signature health:), marquait le contrôle de santé correspondant « ok » en base — SANS que le code ait réellement changé. Au scan suivant (rapproché à 30 min dans le lot précédent), syncBoutonsSansAction() reconstate que le bouton est TOUJOURS dans l'inventaire statique réel (server/data/boutons-sans-action.ts, jamais corrigé en code), le repasse donc à « broken » avec un NOUVEAU lastCheckedAt — et cette preuve d'occurrence toute fraîche fait légitimement rouvrir l'alerte selon la règle anti-récurrence déjà en place (qui, elle, était correcte). Autrement dit : le bouton « Résolu » faisait une fausse promesse que le moteur lui-même démentait quelques minutes plus tard. Corrigé à la racine : une nouvelle fonction isKnownGhostButton() (server/smart-engine/services/health-monitor.ts, exportée pour être réutilisée sans dupliquer la logique) vérifie AVANT de faire cette promesse si le bouton est toujours réellement présent dans l'inventaire en direct. Si oui, le contrôle de santé reste honnêtement « broken », l'alerte ne peut plus être marquée « resolved » en base (rétrogradée en « acknowledged » — vu, pris en compte, mais pas réglé) et un motif exact est renvoyé au PDG. Le Centre de contrôle (client) affiche désormais ce motif dans un bandeau ambré au lieu d'un message vert générique et rassurant qui, pour ce cas précis, était lui-même mensonger (« ne reviendra plus »).",
    pourquoi:
      "Frustration directe et légitime de la direction, qui avait déjà validé de nombreuses alertes sans effet visible persistant et le vivait comme le système qui « ment ». Message explicite reçu en même temps : changer de méthode de vérification quand un problème signalé persiste plutôt que refaire la même chose — cette fois, au lieu de re-suivre le protocole habituel (typecheck/build/générateurs), l'investigation est partie du symptôme exact décrit (clic → rafraîchissement → retour immédiat) pour remonter à la cause réelle dans le moteur, comme demandé (« tu as accès au moteur, fais le travail dans le moteur directement »). Découverte annexe utile : les corrections mergées ne sont pas instantanément en ligne sur https://www.mkapms.fr — Railway redéploie automatiquement sur push vers main mais le build prend quelques minutes (confirmé via /api/version, qui expose désormais le commit réellement en cours d'exécution) ; ce n'était PAS la cause de ce bug précis (largement vérifié plus tard, hors délai de déploiement) mais explique pourquoi un correctif tout juste mergé peut sembler ne rien changer pendant quelques minutes.",
    ou: [
      "server/smart-engine/services/alert-engine.ts",
      "server/smart-engine/services/health-monitor.ts",
      "client/src/pages/SmartEngine/ControlCenter.tsx",
      "server/smart-engine/services/__tests__/boutons-sans-action-sync.test.ts",
    ],
    lecon:
      "Vérifié en conditions réelles de bout en bout, exactement le scénario décrit par la direction, pas une approximation : connexion PDG réelle sur le serveur en build de production (base locale), clic réel sur « Résolu » pour un vrai bouton cassé réel de la plateforme (vente/ReservationsVente.tsx), vérification directe en base (pas seulement à l'écran) que l'alerte passe en « acknowledged » (jamais « resolved ») et que le contrôle de santé reste « broken » avec son lastCheckedAt d'origine inchangé — puis rechargement de la page confirmant sa disparition de la liste des alertes ouvertes, sans qu'un scan n'ait eu besoin de tourner entre-temps pour le confirmer. Test réel étendu (15/15, était 10/10) couvrant précisément la boucle : résolution d'un vrai bouton toujours mort → motif honnête renvoyé → contrôle de santé inchangé → alerte jamais « resolved » → un scan complet rejoué ensuite ne la rouvre pas. Portée assumée : ce correctif rend le système honnête sur ce qu'il peut faire, il ne rend pas les 138 boutons fantômes fonctionnels — seule leur correction réelle en code (le travail continu de ce chantier) les fera disparaître de cette liste. Typecheck : 0 erreur sur les 3 fichiers de code modifiés, 55 erreurs préexistantes hors périmètre inchangées. Aucune régression sur les générateurs (boutons 138, cliquables 142 — +1 cliquable réel pour le nouveau bouton de fermeture du bandeau, correctement déclaré —, manques 570). Build complet réussi.",
    domaine: "confiance",
  },
  {
    cle: "moteur-boutons-location-carte-mondiale-bug-annonces-pro",
    titre: "Moteur des boutons — Louer/LocationParticulier/LocationPro reconnectés à la vraie carte, un vrai bug de recherche pro corrigé au passage",
    moteurs: ["core", "vente"],
    quoi:
      "7 boutons fantômes corrigés sur 3 écrans de l'univers location (Louer.tsx, LocationParticulier.tsx, LocationPro.tsx) : les blocs « Carte interactive » de chacun n'étaient que des placeholders visuels sans aucune action, alors qu'une vraie carte interactive existe déjà et fonctionne (client/src/pages/CarteMondiale.tsx, route /carte, données réelles via trpc.platformMap.publicMap, Leaflet + OpenStreetMap) — jamais utilisée depuis ces écrans. « Voir sur la carte » et « Voir les agences proches » (renommé depuis « Voir les véhicules proches », la carte réelle affiche des agences/garages, pas des véhicules individuels — jamais promettre plus que ce qui existe) pointent maintenant vers /carte. Les boutons sans cible réelle (« Véhicules disponibles » sur Louer.tsx, « Destinations populaires » sur LocationParticulier.tsx — Vacances/Week-end/Mariage n'ont aucun champ recherchable côté moteur) font défiler vers une vraie section déjà existante sur la même page (véhicules populaires / formulaire de recherche), exactement le même choix honnête déjà fait ailleurs sur ces pages plutôt qu'une fausse promesse de filtrage.",
    pourquoi:
      "Suite du chantier « moteur des boutons ». En corrigeant LocationPro.tsx (bouton « Rechercher » et « Appliquer les filtres » jamais câblés, contrairement à son écran jumeau LocationParticulier.tsx déjà entièrement fonctionnel), un vrai bug a été découvert : realAnnonces.data était traité comme un tableau alors que trpc.annonces.list renvoie { total, items } — la section « Dernières annonces » ne pouvait donc littéralement jamais s'afficher, et TypeScript le signalait déjà (5 erreurs réelles TS2339/TS7006, invisibles jusqu'ici car noyées dans les 55 erreurs de base jamais triées une à une). Corrigé en répliquant exactement le pattern déjà réel et fonctionnel de LocationParticulier.tsx (état criteres/filtresAppliques, lancerRecherche, annoncesTrouvees = data?.items ?? []) — jamais une nouvelle logique inventée, seulement le pattern jumeau déjà prouvé.",
    ou: [
      "client/src/pages/Louer.tsx",
      "client/src/pages/LocationParticulier.tsx",
      "client/src/pages/LocationPro.tsx",
    ],
    lecon:
      "Vérifié en conditions réelles via Playwright contre le serveur en build de production : clic réel sur chaque bouton corrigé — navigation effective vers /carte (2 fois), défilement réel de la page vers la section cible (2 fois), et une vraie recherche pro (ville « Paris ») déclenchant la requête réelle et affichant honnêtement « 0 résultat(s) » plutôt qu'un faux résultat (aucune annonce pro réelle ne correspond en base locale — comportement correct, pas un bug). Bénéfice inattendu et vérifié : le correctif du bug realAnnonces a fait baisser le compteur d'erreurs TypeScript de 55 à 50 — la référence « 55 erreurs préexistantes hors périmètre » citée dans les lots précédents de ce chantier incluait donc, sans que cela ait été remarqué jusqu'ici, ces 5 erreurs bien réelles et bien liées à un vrai bug fonctionnel, pas seulement des signalements théoriques sans conséquence utilisateur. Boutons sans action : 138→131. Anomalies cliquables : 142→135. Manques moteurs : 570→563. Build complet réussi.",
    domaine: "confiance",
  },
  {
    cle: "detecteur-boutons-faux-positif-3-vrais-tiers-prix",
    titre: "Détecteur de boutons sans action : un faux positif corrigé, 3 vrais boutons prix rendus fonctionnels",
    moteurs: ["core", "vente"],
    quoi:
      "Suite au signalement direct de la direction (captures d'écran : 148 alertes ouvertes, 131 boutons cassés, 32% seulement des boutons/liens OK), audit complet des 131 boutons de l'inventaire. Verdict honnête : contrairement au lot précédent (Location, un simple défaut de câblage vers un moteur déjà existant), 77 des 89 écrans concernés n'importent trpc nulle part — ce sont des maquettes statiques (12 à 25 lignes, données codées en dur), sans aucun moteur backend à réutiliser. Vérifié sur échantillon (CentreEssaiRoutier.tsx, « Demander un devis flotte » de LocationPro.tsx) : aucun routeur correspondant n'existe dans server/. Ce constat, bien plus large que le pattern déjà connu, a été décomposé en 7 nouvelles tâches de fond par domaine (garage, vente B2B, superadmin, location flotte, vente véhicule, démarches) au lieu d'être traité par un correctif superficiel qui aurait fabriqué une fausse réussite.\n\nEn auditant le détecteur lui-même (scripts/gen-boutons-sans-action.mjs) pour comprendre le périmètre exact, un vrai bug de detection a été trouvé et corrigé : sa regex d'attributs (`[^>]*`) s'arrêtait au premier caractère `>` rencontré, y compris à l'intérieur d'une expression JSX (`disabled={a.length > 0}`) — ratant alors un `onClick` placé après. Conséquence vérifiée : Validation.tsx (ligne 177) était signalé cassé alors qu'il a réellement `onClick={handleSubmit}` (faux positif confirmé en lisant le code). Corrigé en repérant le vrai `>` de fermeture par comptage de profondeur d'accolades/guillemets plutôt qu'un arrêt naïf au premier caractère. Effet du correctif du détecteur, mesuré : 131 → 132 (le faux positif Validation.tsx disparaît, mais 4 boutons réellement cassés que l'ancienne regex ratait par le même défaut apparaissent : le sélecteur de tarif dans ProduitParticulier.tsx et ProduitVtcTaxi.tsx, un jumeau resté invisible dans ProduitLocation.tsx, et un bouton pays sur superadmin/AdminCarteMoniale.tsx, ajouté à la tâche superadmin de fond).\n\nCes 3 boutons sélecteurs de tarif (Jour/3 Jours/Semaine/2 Sem./Mois/3 Mois) ont ensuite été rendus réellement fonctionnels, jamais juste démasqués : ProduitParticulier.tsx et ProduitVtcTaxi.tsx (qui ont déjà un vrai sélecteur de dates dateDebut/dateFin) calculent maintenant la date de fin exacte à partir du nombre de jours du palier choisi et font défiler vers la réservation ; ProduitLocation.tsx (qui n'a aucun champ de date propre, la réservation passant par le composant réel ReserverLocationButton → trpc.reservations.requestLocation, déjà existant) a reçu un état de sélection de palier, avec mise en évidence visuelle, dont les dates calculées sont maintenant transmises à ce même composant réel — aucun nouveau moteur, réutilisation stricte de l'existant.",
    pourquoi:
      "La direction avait explicitement demandé de ne pas re-suivre le même protocole quand un problème persiste, et de vérifier avant de déclarer un correctif réussi. Face à un chiffre agrégé (131 cassés) qui pouvait laisser croire à 131 défauts de câblage similaires au lot Location, l'investigation a d'abord vérifié l'hypothèse en échantillonnant plusieurs fichiers avant d'agir — découvrant que la réalité est très différente (85% des écrans concernés sont des maquettes jamais reliées à un backend, pas des oublis de câblage) et qu'il aurait été malhonnête de les « corriger » superficiellement. Le bug du détecteur lui-même méritait d'être corrigé en priorité car il fausse directement le chiffre que la direction surveille sur son tableau de bord — une inexactitude dans l'outil de mesure aurait sapé la confiance déjà entamée.",
    ou: [
      "scripts/gen-boutons-sans-action.mjs",
      "server/data/boutons-sans-action.ts",
      "client/src/pages/ProduitParticulier.tsx",
      "client/src/pages/ProduitLocation.tsx",
      "client/src/pages/ProduitVtcTaxi.tsx",
    ],
    lecon:
      "Vérifié en conditions réelles via Playwright contre le serveur de développement : sur les 3 écrans, ouverture réelle de l'accordéon tarifs, clic réel sur un palier, et lecture directe du DOM confirmant le résultat attendu — ProduitParticulier.tsx (palier « 2 Sem. », 14 jours) : dateFin passée de 2026-09-25 à 2026-10-02, exactement +14 jours, et défilement réel vers la section réservation confirmé (scrollY changé) ; ProduitVtcTaxi.tsx (palier « 3 Mois », 90 jours) : dateFin passée de 2026-10-18 à 2026-12-17, exactement +90 jours ; ProduitLocation.tsx (palier « Semaine ») : classe CSS de sélection visuelle changée après clic, confirmant l'état choisi. Typecheck : 0 nouvelle erreur introduite (vérifié par comparaison stash avant/après, les 15 erreurs préexistantes dans ces 2 fichiers sont identiques et sans rapport avec cette zone du code). Détecteur re-exécuté deux fois de suite après les correctifs : compte stable et cohérent (132 après le correctif du détecteur seul, 129 après les 3 vrais correctifs). Portée assumée et non maquillée : ceci ne réduit le compteur public que de 131 à 129 boutons cassés (129, pas moins, car AdminCarteMoniale.tsx est une découverte nette, non un correctif) — la baisse visible sur le tableau de bord de la direction sera donc modeste, et 7 nouvelles tâches de fond (#52 à #58) documentent honnêtement l'ampleur réelle du travail de construction de moteurs restant, qui n'a pas été entamé ici pour ne pas fabriquer de fausses réussites sur des écrans qui n'ont tout simplement pas encore de backend.",
    domaine: "confiance",
  },
  {
    cle: "moteur-boutons-ligne-instable-et-integre-menteur",
    titre: "[CRITIQUE] Deux mensonges d'état trouvés DANS le moteur, pas dans un écran : identité de bouton instable + « intégré » sans vérification",
    moteurs: ["smart"],
    quoi:
      "Message vocal direct de la direction, très clair : arrêter de corriger écran par écran et « aller dans le moteur, identifier le bouton, puis regarder les redirections et l'action des boutons ». Deux captures d'écran fournies montraient le même bouton « Demander un devis flotte » (LocationPro.tsx) listé DEUX FOIS dans le Centre de contrôle — une fois « ok » sous static_L520, une fois « broken » sous static_L599 — et un onglet « Évolution autonome » avec 667 propositions passées « Intégré ».\n\nCause n°1 trouvée dans le moteur : health-monitor.ts identifie chaque bouton mort par son NUMÉRO DE LIGNE (`static_L<ligne>`). Toute modification de code plus haut dans le même fichier décale les lignes suivantes — le bouton réapparaît sous un nouvel identifiant, jamais corrigé. syncBoutonsSansAction() considérait alors l'ancienne ligne « disparue de l'inventaire » et la refermait en « ok », alors que le même bouton, sous son nouveau numéro de ligne, était déjà réinséré « broken » juste au-dessus dans la même fonction. Un bouton jamais corrigé se comptait donc deux fois : une fois cassé (vrai), une fois « ok » (faux), gonflant silencieusement le nombre de boutons « OK » affiché à la direction à chaque modification de code ailleurs dans le fichier — sans qu'aucun bouton n'ait jamais été réellement réparé. Corrigé : avant de refermer une ligne disparue, le moteur vérifie si le même libellé de bouton existe encore ailleurs dans le même fichier ; si oui, l'ancienne ligne est supprimée (jamais menteusement remise « ok »), la nouvelle ligne porte déjà l'alerte réelle.\n\nCause n°2, plus grave, trouvée dans le moteur d'Évolution autonome (autonomous-evolution.ts / preproduction.ts) : approuver une proposition crée réellement une tâche exécutable (correctif déjà livré au lot précédent, point 69) — mais pour une correction de bouton, aucun exécuteur automatique n'existe (corriger du code JSX n'est pas automatisable sans danger), donc la tâche reste honnêtement « manuel_requis ». Le problème : le bouton « Marquer intégré » de l'écran était accessible juste après, SANS AUCUN lien avec ce résultat réel — rien n'empêchait de le cliquer même si rien n'avait été corrigé. C'est très vraisemblablement l'explication des 667 propositions « Intégré » vues par la direction : approuver puis marquer intégré semblait être le mode d'emploi normal de l'écran, alors que pour une correction de bouton, cela ne change jamais une ligne de code. Corrigé : le résultat réel de l'exécution est maintenant mémorisé sur la proposition, affiché en clair sur sa carte (bandeau ambré si non réalisé automatiquement), et transitionStaging() REFUSE la transition vers « intégré » tant que ce résultat n'est pas un vrai succès (« termine ») — avec un message explicite expliquant pourquoi et invitant soit à corriger réellement le code, soit à rejeter la proposition.",
    pourquoi:
      "La direction avait raison sur le fond : corriger des boutons un par un sans jamais interroger le mécanisme qui les compte et les fait « disparaître » de la liste ne pouvait qu'aboutir à une stagnation apparente, même quand du vrai travail est fait ailleurs (7 boutons corrigés au lot précédent, 3 de plus à celui-ci). Les deux captures d'écran fournies n'étaient pas de simples doublons d'affichage : elles pointaient vers deux défauts réels et distincts du moteur lui-même, jamais examinés jusqu'ici parce que l'attention portait sur les écrans un par un plutôt que sur la mécanique de suivi. Consigne suivie à la lettre : identifier le bouton dans le moteur, comprendre pourquoi son état ne reflète pas la réalité, corriger la cause plutôt que le symptôme visible à l'écran.",
    ou: [
      "server/smart-engine/services/health-monitor.ts",
      "server/smart-engine/services/preproduction.ts",
      "client/src/pages/SmartEngine/ControlCenter.tsx",
      "server/smart-engine/services/__tests__/bouton-deplace.test.ts",
      "server/smart-engine/services/__tests__/staging-integre-guard.test.ts",
    ],
    lecon:
      "Vérifié réellement, pas supposé : la base de données de production (Railway, via PGHOST/PGPORT injectés dans cet environnement) s'est révélée inaccessible depuis ce bac à sable (raw-TCP non autorisé par la politique réseau — confirmé, pas contourné). Un Postgres local a donc été installé et le schéma complet y a été poussé (drizzle-kit push) pour exécuter les VRAIES fonctions du moteur, pas une simulation : les 15 vérifications existantes (résolution d'alerte) repassent sans régression, une nouvelle suite pure (4/4, sans base) reproduit exactement le cas des captures d'écran (static_L520 vs static_L599, même fichier, même libellé) et confirme que l'ancienne ligne est maintenant supprimée plutôt que menteusement remise « ok », et une nouvelle suite avec base (4/4) confirme qu'une proposition de correction de bouton, une fois approuvée, obtient bien le verdict honnête « manuel_requis » et que tenter de la marquer « intégré » est refusé avec un message clair — le statut ne bouge pas. Découverte annexe, tracée séparément (tâche de suivi) et non traitée ici (hors périmètre de ce signalement) : server/country-policy/schema.ts (tables cpe_rules/cpe_evaluations, utilisées par CHAQUE exécution de tâche du Centre d'Actions) n'est pas inclus dans server/schema.ts, le point d'entrée que lit drizzle-kit — reproduit en conditions réelles (erreur « relation cpe_evaluations does not exist » à la première tentative d'exécution d'une tâche sur une base fraîchement migrée). À vérifier d'urgence si la base de production a bien ces tables par un autre chemin, sans quoi le Centre d'Actions échouerait silencieusement sur toute validation, bien au-delà des seuls boutons. Portée assumée : ce lot ne corrige aucun bouton supplémentaire (0 nouveau bouton fonctionnel) — il corrige la fiabilité du compteur et de la validation eux-mêmes, condition posée par la direction avant de continuer à en corriger d'autres.",
    domaine: "confiance",
  },
  {
    cle: "location-mkapms-camions-utilitaires-recherche-reelle",
    titre: "Recherche câblée sur 3 écrans clients (MKA.P-MS, Camions, Utilitaires) + un vrai bug d'affichage corrigé",
    moteurs: ["core", "vente"],
    quoi:
      "Demande explicite de la direction : prioriser ce qu'un client ou visiteur rencontre en premier sur la plateforme (produits, vente, location, particuliers) avant de continuer les chantiers de fond plus larges. Trois écrans de location traités entièrement, avec vérification réelle en navigateur avant tout commit.\n\nLocationMKAPMS.tsx (flotte officielle MKA.P-MS) : un vrai bug a été trouvé au passage — trpc.annonces.list était traité comme un tableau (`.length`, `.map`) alors qu'il renvoie { total, items }, exactement le même bug déjà corrigé une fois dans LocationPro.tsx. Conséquence concrète : la section « Dernières annonces » ne s'affichait JAMAIS, quel que soit le nombre de vraies annonces officielles en base — un vrai manque à gagner silencieux sur l'écran vitrine du flottage propre MKA.P-MS. Corrigé (`.items`), et le bouton « Rechercher un véhicule MKA.P-MS » (jusque-là mort) déclenche maintenant une vraie requête filtrée par ville.\n\nLocationCamions.tsx et LocationUtilitaires.tsx : ces écrans n'avaient aucune connexion backend (catalogue 100% codé en dur). Câblés sur trpc.annonces.list avec categorie: \"camion\" / \"utilitaire\" — ces deux valeurs existent réellement dans l'enum Postgres annonce_categorie (vérifié dans server/schema.ts avant d'écrire le code, pas supposé). Le catalogue statique reste affiché en dessous (aucune promesse retirée), les vraies annonces s'ajoutent au-dessus quand une recherche est lancée.",
    pourquoi:
      "Le choix des trois écrans n'est pas arbitraire : ce sont les seuls, parmi les écrans de location sans backend recensés, à disposer d'une catégorie réellement déclarée dans le schéma de la base (camion, utilitaire) — donc les seuls où une vraie recherche peut être construite immédiatement sans inventer de nouvelle catégorie ni fabriquer une correspondance approximative. LocationMinibus.tsx a été volontairement laissé de côté : aucune catégorie \"minibus\" n'existe dans l'enum, une décision consciente (rattacher à \"utilitaire\" ou en créer une) reste à trancher plutôt que d'être devinée.",
    ou: [
      "client/src/pages/LocationMKAPMS.tsx",
      "client/src/pages/LocationCamions.tsx",
      "client/src/pages/LocationUtilitaires.tsx",
    ],
    lecon:
      "Méthode changée comme demandé : avant ce lot, plusieurs correctifs consécutifs avaient été poussés sans faire tourner `npm run build` en entier, ce qui avait cassé le déploiement Railway pendant 18h (inventaires générés périmés). Cette fois, l'ordre a été inversé : les 3 écrans ont d'abord été vérifiés en conditions réelles dans un navigateur (Playwright, serveur de développement réel) — recherche lancée sur les 3 écrans, bandeau de recherche affiché, message honnête « aucune annonce ne correspond » retourné (aucune vraie annonce ne correspond à « Paris » dans la base locale, comportement correct et non maquillé) — puis seulement après cette vérification, les 3 inventaires générés (boutons, cliquables, moteurs) ont été régénérés ENSEMBLE et `npm run build` a été rejoué intégralement jusqu'au bout avant tout commit. Effet mesuré : boutons sans action 129 → 126. Portée assumée : la baisse du pourcentage \"moteur des boutons\" restera modeste au vu de l'ampleur réelle du chantier (77 écrans sans aucun backend au total) — la suite continue dans l'ordre annoncé (écrans clients d'abord), 3 à la fois, chacun vérifié avant d'être livré plutôt que traité en masse sans preuve.",
    domaine: "confiance",
  },
  {
    cle: "vente-camions-utilitaires-categories-bug-hook-partage",
    titre: "Catégories cliquables câblées (Vente Camions/Utilitaires) — un vrai bug trouvé dans un hook partagé par 11 écrans",
    moteurs: ["core", "vente"],
    quoi:
      "Suite du chantier « ce qu'un client rencontre en premier » : les cartes de catégorie de VenteCamions.tsx et VenteUtilitaires.tsx (ex. « Bennes », « Master / Boxer ») n'avaient aucun gestionnaire de clic, alors qu'une vraie recherche fonctionnelle existe déjà sur ces deux écrans (client/src/lib/vehicleSearch.ts, utilisé par 11 écrans de vente). Câblage évident au premier abord (search.set(\"categorie\", c.label) puis search.apply()) — mais la vérification en navigateur réel (jamais sautée, comme demandé) a montré que le nombre d'annonces affichées ne changeait JAMAIS après le clic, quelle que soit la catégorie choisie.\n\nCause trouvée dans le hook partagé, pas dans les deux écrans : apply() lisait un draftRef mis à jour uniquement au moment du RENDU (draftRef.current = draft, exécuté à chaque rendu). Un clic qui appelle set() puis apply() dans le MÊME gestionnaire ne laisse pas React re-rendre entre les deux appels : apply() republiait donc le filtre précédent, pas celui qui vient d'être posé. Le bouton « Rechercher » existant fonctionnait par coïncidence, car il est cliqué séparément, après que les changements de select ont déjà eu le temps d'être rendus — mais tout code appelant set()+apply() dans le même clic (exactement ce que le câblage des catégories devait faire) était silencieusement inopérant. Corrigé en remplaçant le draftRef par `setDraft(d => { setApplied(d); return d; })`, qui lit toujours le brouillon le plus à jour quel que soit le moment de l'appel — supprime la classe de bug entièrement, pour les 11 écrans qui partagent ce hook, pas seulement les 2 traités ici.",
    pourquoi:
      "Exactement le scénario que la direction demandait de traquer : un correctif qui a l'air correct au premier coup d'œil (le bouton réagit, la classe de sélection change visuellement) mais qui ne produit aucun effet réel tant qu'il n'est pas vérifié en conditions réelles. Sans la vérification systématique en navigateur (déjà adoptée depuis l'incident Railway), ce lot aurait été livré avec un bouton « techniquement câblé » mais silencieusement inerte — une nouvelle version du même problème de fond (des indicateurs qui donnent l'illusion d'un travail fait).",
    ou: [
      "client/src/lib/vehicleSearch.ts",
      "client/src/pages/VenteCamions.tsx",
      "client/src/pages/VenteUtilitaires.tsx",
    ],
    lecon:
      "Vérifié en navigateur réel à chaque étape, pas seulement au typecheck : premier test après câblage → compteur d'annonces inchangé après clic (3→3, 4→4) malgré un clic détecté et un bouton visuellement sélectionné — signal that quelque chose ne marchait pas malgré une apparence correcte. Creusé jusqu'à la cause réelle dans le hook plutôt que de conclure « pas assez d'annonces pour voir la différence ». Après correctif du hook et ajout d'un champ categorie réaliste aux annonces de démonstration (absent jusque-là, ce qui aurait masqué le vrai correctif) : filtrage réellement vérifié (3→1 et 4→1 sur les deux écrans). npm run build rejoué intégralement jusqu'au bout avant commit (leçon du lot précédent appliquée). Boutons sans action : 126 → 124.",
    domaine: "confiance",
  },
  {
    cle: "vente-4-ecrans-categories-bug-comparaison-directionnelle",
    titre: "Catégories cliquables câblées sur les 4 derniers écrans de vente (MKA.P-MS, Particulier, Pro, VTC) — deuxième vrai bug trouvé dans le même hook partagé",
    moteurs: ["core", "vente"],
    quoi:
      "Suite directe du lot précédent (Vente Camions/Utilitaires) : les cartes de catégorie des 4 écrans de vente restants (VenteMKAPMS.tsx, VenteParticulier.tsx, VentePro.tsx, VenteVTC.tsx) n'avaient elles non plus aucun gestionnaire de clic. Avant de câbler, relecture complète de matchesVehicle() dans le hook partagé (vehicleSearch.ts) comme demandé — « aller dans le moteur avant l'écran ».\n\nDeuxième vrai bug trouvé dans ce même hook, distinct de celui du lot précédent : le filtre catégorie/énergie comparait `contains(valeurBrute, libelléAffiché)` — teste si la valeur COURTE en base (« suv ») CONTIENT le libellé LONG affiché à l'écran (« SUV & 4x4 »), ce qui échoue presque toujours puisqu'une chaîne courte ne peut pas contenir une chaîne plus longue. Le filtre catégorie/énergie était donc structurellement inopérant sur toute vraie annonce dès que son libellé n'était pas un mot unique strictement identique — un défaut qui aurait rendu le câblage des 4 écrans inerte, exactement comme le premier bug l'avait fait pour les 2 précédents. Corrigé par une comparaison dans les deux sens (overlaps()), vérifiée avant tout câblage d'écran.\n\nCâblage ensuite : les 3 écrans à données réelles (VenteMKAPMS, VenteParticulier, VentePro) ne faisaient remonter ni `categorie` ni `carburant`/`energie` depuis trpc.annonces.list dans leur transformation d'annonce — ajoutés. Les libellés « Hybrides »/« Électriques » ne correspondent à aucune valeur de l'énumération annonce_categorie (vérifié dans server/schema.ts) : ils appartiennent en réalité au carburant, donc routés vers le filtre énergie plutôt que catégorie. VenteVTC.tsx (catalogue 100% statique, aucun backend) a reçu directement des champs categorie/energie sur son tableau de démonstration.",
    pourquoi:
      "Consigne de la direction suivie à la lettre une deuxième fois : identifier le moteur concerné, corriger le code réel dedans, puis seulement ensuite câbler l'écran et vérifier la redirection — dans cet ordre. La relecture du hook avant tout câblage a évité de livrer 4 boutons « techniquement câblés » mais silencieusement inertes, comme cela avait failli arriver au lot précédent avant que la vérification en navigateur ne révèle le premier bug.",
    ou: [
      "client/src/lib/vehicleSearch.ts",
      "client/src/pages/VenteMKAPMS.tsx",
      "client/src/pages/VenteParticulier.tsx",
      "client/src/pages/VentePro.tsx",
      "client/src/pages/VenteVTC.tsx",
    ],
    lecon:
      "Vérifié en navigateur réel sur les 4 écrans avant commit (Playwright, serveur de développement réel, requêtes réseau réelles) : nombre de liens d'annonces affichés mesuré avant et après clic sur une carte de catégorie — VenteParticulier 6→4, VenteMKAPMS 5→1, VentePro 4→2, VenteVTC 4→1. Une vraie diminution mesurée sur les 4, pas une supposition. Limite assumée, non maquillée : certains libellés marketing (« Familiales », « Premium », « 7 places », « Pick-up / 4x4 ») ne correspondent à aucune colonne réelle de la base (ni catégorie, ni carburant) — leur clic reste honnête (le filtre s'applique réellement) mais peut légitimement retourner zéro résultat tant qu'aucune vraie catégorie ou dérivation fiable n'est décidée pour eux ; aucune correspondance n'a été inventée pour masquer ce manque. npm run build rejoué intégralement jusqu'au bout avant commit. Boutons sans action : 124 → 120.",
    domaine: "confiance",
  },
  {
    cle: "espace-pro-vente-tarifs-fabriques-et-programme-vtc-cta",
    titre: "EspaceProVente.tsx affichait des tarifs INVENTÉS, différents de ceux réellement facturés — corrigé + CTA Programme VTC reconnectée à l'abonnement réel",
    moteurs: ["core", "vente", "confiance"],
    quoi:
      "En poursuivant la liste des écrans vente sans backend (tâche #57), EspaceProVente.tsx (page publique « Devenir professionnel ») affichait un catalogue d'abonnements 100% codé en dur : Pro Start 29€, Pro Premium 79€, Pro Elite 149€, Pro Business 299€. Comparaison avec la source unique des tarifs réellement facturés (shared/plans.ts, lue par Stripe via abonnements.createCheckout) : AUCUN de ces montants ne correspond à une offre réelle — les vraies offres « pro_vente » sont Pro Start 49€, Pro Premium 89€, Pro Elite 149€ (149€ coïncide par hasard), Pro Max 249€. Un visiteur professionnel voyait donc des prix qui ne seraient jamais ceux facturés au moment de payer, avec un bouton « Choisir » qui de toute façon ne faisait rien (aucun gestionnaire de clic). Corrigé en importantant directement les vrais plans (getPlansByCategory(\"pro_vente\")) au lieu d'un tableau local, et en redirigeant le clic vers le tunnel d'abonnement réel déjà existant (/abonnements?categorie=pro_vente, moteur Stripe déjà opérationnel — aucun nouveau moteur créé).\n\nDans la foulée, le bouton « Rejoindre le programme VTC & Taxi » de ProgrammeVTC.tsx (jusque-là aussi sans effet) a été reconnecté au même moteur réel, sur sa catégorie propre (/abonnements?categorie=vtc_taxi), qui existe déjà (offres VTC/TAXI Start/Premium/Elite/Max).",
    pourquoi:
      "Un tarif affiché qui ne correspond pas au tarif réellement facturé n'est pas un simple détail cosmétique — c'est une donnée fabriquée qui aurait pu induire un professionnel en erreur au moment de s'engager, exactement le type de défaut que la doctrine interdit. Le correctif privilégié n'a pas été de construire un nouveau tunnel de paiement pour cette page (un moteur d'abonnement complet existe déjà et fonctionne, vérifié dans ce même lot) mais de la relier à lui, conformément à la règle : ne jamais recréer un moteur existant.",
    ou: [
      "client/src/pages/EspaceProVente.tsx",
      "client/src/pages/ProgrammeVTC.tsx",
    ],
    lecon:
      "Vérifié en navigateur réel (Playwright) : les tarifs affichés sur EspaceProVente correspondent maintenant exactement au catalogue réel une fois convertis en devise locale (49€→52,92$, 89€→96,12$, 149€→160,92$, 249€→268,92$ — même taux de conversion appliqué uniformément, aucune valeur isolée), et le clic sur « Choisir Pro Start » redirige réellement vers /abonnements?categorie=pro_vente ; le clic sur « Rejoindre le programme VTC & Taxi » redirige réellement vers /abonnements?categorie=vtc_taxi. Portée assumée, non maquillée : les véhicules « recommandés » de ProgrammeVTC.tsx et les données de EtatVehicule.tsx/InspectionNumerique.tsx/JournalActivite.tsx/PubliciteDetail.tsx restent fabriqués — ce ne sont pas des boutons mal câblés vers un moteur existant mais des écrans qui nécessitent la construction d'un moteur qui n'existe pas encore (upload photo, signature électronique, caution, journal d'audit réel, workflow d'approbation publicitaire) ; non traités ici pour ne pas les livrer à moitié faits, et reportés explicitement en tâche de suivi plutôt que devinés. npm run build rejoué intégralement. Boutons sans action : 120 → 118.",
    domaine: "confiance",
  },
  {
    cle: "decision-pdg-memoire-rag-reste-reservee-pdg",
    titre: "Décision PDG rendue : mémoire/RAG (files.*/knowledge.search/rag.*) reste strictement réservée au PDG",
    moteurs: ["intelligences"],
    quoi:
      "Décision en attente depuis le LOT 02F (mémoire/fichiers/RAG) : fallait-il ouvrir ces outils au-delà du PDG (super_admin) ? Question posée explicitement à la direction plutôt que devinée, avec les deux options réelles du code (rester PDG seul, ou ouvrir à Direction = admin+PDG, ou plus largement au personnel métier). Réponse de la direction : accès conservé au PDG uniquement.",
    pourquoi:
      "Une décision d'accès à de la mémoire d'entreprise et une base de connaissances interne (dont une catégorie forcée pdg_uniquement) est par nature une décision de la direction, jamais une supposition côté code — demander plutôt que fabriquer un choix par défaut, conformément à la doctrine.",
    ou: [
      "server/trpc.ts (pdgProcedure, inchangé)",
      "server/intelligences/outils/familles/fichiers-rag.ts (allowedRoles, inchangé)",
    ],
    lecon:
      "Aucun changement de code nécessaire : l'état actuel du dépôt (pdgProcedure = role === \"super_admin\" ; allowedRoles: [\"super_admin\"] sur files.*/documents.*/knowledge.search/rag.*) correspondait déjà exactement à la décision rendue. Décision actée et tracée ici pour que la question ne soit pas reposée à un futur lot faute de mémoire du choix déjà fait.",
    domaine: "confiance",
  },
  {
    cle: "triage-captures-ecran-moteur-boutons-2-vrais-fixes-9-non-fabriques",
    titre: "Triage de 5 captures d'écran du Centre de contrôle : 2 vrais défauts corrigés, 9 identifiés comme nécessitant un moteur inexistant — aucun câblage fabriqué",
    moteurs: ["core", "vente", "location", "confiance"],
    quoi:
      "La direction a fourni 5 captures d'écran de la liste réelle des boutons « broken » du Centre de contrôle et a demandé explicitement : corriger un vrai défaut trouvé, ne rien toucher si aucun défaut réel n'est identifiable — consigne suivie à la lettre plutôt que de fabriquer un câblage pour faire disparaître le voyant rouge.\n\nDeux vrais défauts identifiés et corrigés :\n1. LocationMKAPMS.tsx:363 « Réserver ce véhicule » — le bouton était imbriqué dans un <Link> parent sans son propre gestionnaire (HTML invalide, bouton dans un lien), invisible au détecteur bien que le clic fonctionnait par accident via la bulle d'événement du parent. Corrigé en lui donnant sa propre navigation réelle (stopPropagation + useNavigate vers la même fiche véhicule, où vit le vrai composant ReserverLocationButton).\n2. vente/CentreFavorisVente.tsx — écran entièrement fabriqué (3 véhicules en dur, sans id réel, un cœur et une corbeille sans aucun gestionnaire). Un vrai moteur de favoris existe déjà et fonctionne (server/routers/favoris.ts, déjà utilisé par client/src/pages/Favoris.tsx et CentreFavorisUtilisateur.tsx) : réécrit pour utiliser trpc.favoris.mine/toggle au lieu d'inventer un second registre, exactement le même moteur, jamais un doublon.\n\nNeuf cas examinés et volontairement NON câblés faute de moteur réel derrière le bouton (fabriquer le câblage aurait simulé un succès inexistant) :\n- LocationPro.tsx « Demander un devis flotte » (déjà connu : aucun routeur de lead B2B flotte n'existe ; server/routers/devis.ts est un moteur de devis GARAGE, sémantiquement différent — le détourner aurait été une fausse correspondance, pas une correction).\n- superadmin/AdminCarteMoniale.tsx — au-delà du bouton, les statistiques par pays (utilisateurs, annonces, CA) affichées sont elles-mêmes 100% inventées ; le seul routeur géographique réel (platformMapRouter) couvre des sites physiques (garages, karting, lavage), pas des agrégats utilisateurs/CA par pays — aucun moteur de ce type n'existe.\n- ProduitVtcTaxi.tsx « Télécharger » (dépôt de dossier VTC/Taxi) — le parcours en 3 étapes (durée/km, dépôt de documents, signature) est 100% local (aucun appel trpc dans tout le fichier) ; un vrai moteur KYC existe (server/routers/kyc.ts, submitDocuments) mais sert un parcours d'inscription différent (garage/pro), pas la location d'un véhicule VTC précis — câbler juste le bouton \"Télécharger\" sans le reste du parcours aurait simulé un dépôt de dossier qui ne mène nulle part.\n- vente/ReservationsVente.tsx, MultiSites.tsx, GestionEmployes.tsx, DroitsAcces.tsx, CentreVisiteVehicule.tsx, CentreRetourClient.tsx, CentreReservationAchat.tsx, CentreRapportsVehicule.tsx, CentrePhotosMedias.tsx, CentreNegociation.tsx, CentreFournisseurs.tsx : vérifié un par un (grep trpc. sur chacun) — ZÉRO appel serveur dans les 11, confirmant qu'il ne s'agit pas d'un oubli de câblage mais de l'absence totale d'un moteur métier pour chacun (réservations vente, gestion de sites, équipe du vendeur, droits d'accès du vendeur, visites, avis client, réservation d'achat, rapport véhicule, validation photos, négociation, fournisseurs). GestionEmployes.tsx en particulier modélise l'équipe PROPRE à un compte professionnel (Commercial, Comptable, Mécanicien…) — à ne pas confondre avec rbacRouter.staffProfiles qui est l'organigramme interne MKA.P-MS ; les détourner l'un vers l'autre aurait attribué de vraies données internes à un contexte vendeur, ou l'inverse.",
    pourquoi:
      "La direction a explicitement mis en garde contre le risque de fabriquer un faux succès pour faire baisser un chiffre affiché — exactement le type de dérive que la doctrine interdit depuis le début de ce chantier. Sur 11 écrans vente/Centre* vérifiés un par un, tous sans exception se sont révélés être des maquettes sans aucune tentative d'appel serveur : la bonne réponse n'était pas de les câbler à la va-vite mais de confirmer précisément l'absence de moteur et de le documenter, pour que le prochain lot construise le bon moteur au bon endroit plutôt que de deviner.",
    ou: [
      "client/src/pages/LocationMKAPMS.tsx",
      "client/src/pages/vente/CentreFavorisVente.tsx",
    ],
    lecon:
      "Vérifié réellement avant toute conclusion : LocationMKAPMS.tsx confirmé en navigateur réel (Playwright) — le clic sur « Réserver ce véhicule » déclenche maintenant une vraie navigation (le catalogue utilise encore des id de démonstration 8001-8006 non reliés à de vraies annonces, limite déjà connue et distincte, non maquillée). CentreFavorisVente.tsx confirmé sans erreur console/page malgré l'impossibilité de dérouler le parcours complet dans ce bac à sable (l'écran est réservé aux comptes pro abonnés, porte d'accès préexistante et non modifiée) — le code réutilise ligne pour ligne le pattern déjà vérifié et fonctionnel de Favoris.tsx. Pour les 9 cas non traités, aucune ligne de câblage n'a été écrite : la liste précise ci-dessus sert de base au prochain lot de construction (tâche #54), plutôt que de laisser la direction deviner ce qui manque réellement derrière chaque bouton rouge.",
    domaine: "confiance",
  },
  {
    cle: "sante-plateforme-cartes-cliquables-et-valider-tout",
    titre: "Les 3 cartes OK/Cassés/Lents deviennent des filtres cliquables + bouton « Valider tout » sur les actions en attente",
    moteurs: ["smart"],
    quoi:
      "Deux demandes directes de la direction sur le Centre de contrôle Smart Engine.\n\n1) Onglet « État plateforme » (SanteTab) : les 3 cartes de résumé (OK/Cassés/Lents) étaient de simples compteurs, pas des boutons — la liste détaillée en dessous affichait toujours tout mélangé, sans moyen de filtrer sur une catégorie précise. Ajout d'un filtre local (statusFilter) : cliquer une carte affiche uniquement les éléments de ce statut, recliquer dessus l'enlève, un bouton « Voir tout » réapparaît pendant qu'un filtre est actif. Le composant StatCard partagé (déjà utilisé ailleurs dans l'écran) reçoit une prop `active` optionnelle pour l'anneau doré de sélection, sans toucher aux autres usages du même composant.\n\n2) Onglet « Actions à valider » (JournalTab, mode pendingOnly) : la direction devait valider un par un un grand nombre d'éléments (« ça prend du temps »). Deux vraies causes trouvées avant d'écrire du code : (a) aucun bouton de validation groupée n'existait ; (b) le nombre réellement en attente peut dépasser les 100 lignes chargées à l'écran (déjà documenté dans un commentaire du moteur : jusqu'à 929 constatées historiquement) — un « Valider tout » qui ne validerait que ce qui est affiché laisserait un reliquat invisible. Ajout d'une vraie fonction serveur `validateAllPending()` (server/smart-engine/services/activity-log.ts) : une seule requête UPDATE ... WHERE humanValidation IS NULL AND proposedDecision IS NOT NULL, sur la table entière, jamais limitée à la page affichée ; exposée via smartEngine.validateAllActivityDecisions (pdgProcedure). Le bouton client affiche le total réel (trpc.smartEngine.activityStats, déjà existant, jamais un second calcul inventé), demande une confirmation explicite avant d'agir (action irréversible sur potentiellement des centaines de lignes), puis invalide activityLog/activityStats/dashboard pour que la liste se vide réellement à l'écran.",
    pourquoi:
      "Une carte de résumé qui ne fait qu'afficher un nombre alors que la direction s'attend à cliquer dessus pour voir le détail est exactement le type de défaut que le moteur de boutons est censé traquer ; il se trouve ici dans un écran interne au Smart Engine lui-même, pas dans un écran client. Pour le bouton de validation groupée, la contrainte du volume réel (jusqu'à 929 lignes en attente déjà constatées) imposait un vrai traitement serveur sur l'ensemble de la table plutôt qu'une boucle client sur les seules lignes visibles, qui aurait laissé la direction croire à tort que tout était traité.",
    ou: [
      "client/src/pages/SmartEngine/ControlCenter.tsx",
      "server/smart-engine/services/activity-log.ts",
      "server/smart-engine/router.ts",
      "server/smart-engine/services/__tests__/valider-tout.test.ts",
    ],
    lecon:
      "Vérifié réellement sur base Postgres locale (nouvelle suite dédiée, 6/6) : trois cas mélangés dans la même table (une action en attente, une déjà décidée par un autre acteur, une sans décision proposée du tout) — validateAllPending() ne touche que les actions réellement en attente, jamais celles déjà tranchées ni celles qui n'attendaient rien, et rejouer l'appel sur un reliquat vide ne valide rien de plus (idempotent, pas de faux positif). Vérification navigateur réelle en plus (Playwright) : la route reste protégée par la porte d'accès back_office déjà existante (aucune régression d'accès introduite), rendu sans erreur console. npm run build rejoué intégralement.",
    domaine: "confiance",
  },
  {
    cle: "reservations-vente-cote-vendeur-connecte-au-moteur-acompte-existant",
    titre: "ReservationsVente.tsx (tâche #54) : le vrai moteur d'acompte avait un côté acheteur, jamais de côté vendeur — construit sans en recréer un second",
    moteurs: ["vente", "confiance"],
    quoi:
      "Premier écran traité de la liste des 11 écrans vente/Centre* confirmés sans aucun backend (rapport précédent). Avant d'écrire du code : recherche du moteur réel derrière « réservation avec acompte » plutôt que d'en inventer un — trouvé (server/routers/reservations.ts, table bookings type purchase_visit, déjà utilisé par le bouton « Réserver » côté acheteur, avec Stripe et un vrai statut booking_status pending/accepted/rejected). Il ne manquait qu'un seul côté du même moteur : le vendeur ne pouvait ni voir les réservations reçues sur ses propres annonces, ni les valider/refuser. Ajout de deux procédures dans ce même routeur (jamais un second) : mesReservationsRecues (jointure bookings→annonces→users, filtrée sur annonces.ownerId = vendeur connecté) et repondreReservationRecue (accepte/refuse, vérifie que l'annonce appartient bien à l'appelant, notifie l'acheteur de la vraie décision). ReservationsVente.tsx réécrit pour consommer ces deux procédures au lieu du tableau RESERVATIONS codé en dur (3 clients inventés).",
    pourquoi:
      "Exactement la règle rappelée par la direction : ne jamais recréer un moteur qui existe déjà. La table bookings, ses statuts et son intégration Stripe étaient déjà réels et éprouvés côté acheteur — construire un système parallèle de « réservations vente » aurait dédoublé la source de vérité (deux tables pour la même réalité métier) et cassé la cohérence des paiements déjà réels.",
    ou: [
      "server/routers/reservations.ts",
      "client/src/pages/vente/ReservationsVente.tsx",
      "server/routers/__tests__/reservations-vente.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (nouvelle suite dédiée, 8/8) avec deux vendeurs et un acheteur réels : chaque vendeur ne voit que les réservations reçues sur SES propres annonces (jamais celles d'un autre vendeur, testé explicitement en tentant de répondre à la réservation d'un tiers — refusé) ; une réservation déjà tranchée ne peut pas recevoir une seconde décision ; l'acheteur reçoit une vraie notification mentionnant le vrai nom de son véhicule. Vérification navigateur réelle en plus (Playwright) : aucune erreur console, la route reste protégée par la porte d'accès pro déjà existante. npm run build rejoué intégralement. Portée assumée : 10 écrans restants de la même liste (MultiSites, GestionEmployes, DroitsAcces, CentreVisiteVehicule, CentreRetourClient, CentreReservationAchat, CentreRapportsVehicule, CentrePhotosMedias, CentreNegociation, CentreFournisseurs) suivent le même traitement un par un, pas en masse.",
    domaine: "confiance",
  },
  {
    cle: "fournisseurs-vente-nouveau-schema-plus-panne-drizzle-generate-decouverte",
    titre: "CentreFournisseurs.tsx construit (nouveau schema minimal) + panne réelle découverte : drizzle-kit generate cassé depuis la migration 0010",
    moteurs: ["vente", "confiance"],
    quoi:
      "Deuxième écran de la liste des 11 vente/Centre* (tâche #54). Contrairement à ReservationsVente.tsx, aucun moteur existant ne couvrait « le carnet de fournisseurs propre à un vendeur » (le supplier_engine/supplier-portal.ts existant est l'accès plateforme fournisseur/transporteur — un tout autre sujet). Nouveau schema minimal ajouté (vente_fournisseurs : nom, type, téléphone, email, notes) et volontairement SANS les champs « commandes »/« total » que l'écran fabriquait avant : aucun système de bons de commande n'existe sur la plateforme pour les calculer honnêtement.\n\nEn préparant la migration, découverte d'une panne réelle et jusque-là invisible : `npm run db:generate` échoue sur TOUT le dépôt (pas seulement sur ce changement) avec une collision de chaîne de snapshots — les fichiers drizzle/meta/0010 à 0015_snapshot.json partagent tous le même id/prevId, signe que les instantanés se sont arrêtés d'être maintenus à la migration 0010 alors que le journal réel (drizzle/meta/_journal.json) et les fichiers .sql continuent jusqu'à 0133 : quelqu'un a manifestement écrit les migrations suivantes à la main (ou via `drizzle-kit push`, qui n'a pas besoin des instantanés) sans jamais régénérer les instantanés. Vérifié que cette panne ne bloque PAS le build (check:migrations ne lit que le journal et les .sql, jamais les instantanés) ni `drizzle-kit push` (qui introspecte la base en direct) — seule la commande `generate` est inutilisable en l'état. Migration 0134 donc écrite à la main, suivant exactement le format des migrations précédentes (0130-0133), plutôt que de contourner le contrôle en l'ignorant.",
    pourquoi:
      "Une nouvelle table ajoutée sans migration durable est exactement le défaut qui a rendu cpe_rules/cpe_evaluations invisibles en production (tâche #59) : mieux valait vérifier tout de suite que le nouvel outil de génération fonctionnait avant d'écrire une seule ligne de routeur, plutôt que de découvrir après coup qu'aucune migration n'avait été produite.",
    ou: [
      "server/modules/pro.ts",
      "server/routers/pro.ts",
      "client/src/pages/vente/CentreFournisseurs.tsx",
      "drizzle/0134_vente_fournisseurs.sql",
      "drizzle/meta/_journal.json",
      "server/routers/__tests__/vente-fournisseurs.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (migration appliquée à la main, nouvelle suite dédiée, 7/7) : un vendeur ne voit jamais le carnet d'un autre, ne peut jamais supprimer le contact d'un tiers (refusé explicitement), une suppression réelle retire bien la ligne de la base. npm run build rejoué intégralement, check:migrations toujours vert (133 migrations journalisées). Portée assumée, non silencieuse : la panne de `drizzle-kit generate` elle-même n'a pas été réparée (réparer une chaîne de snapshots divergente à la main est un risque disproportionné par rapport à ce lot) — seulement contournée proprement en écrivant la migration à la main selon le format déjà en usage depuis la 0011, comme le fait manifestement déjà l'équipe. 9 écrans restants de la liste #54 suivent le même traitement un par un.",
    domaine: "confiance",
  },
  {
    cle: "equipe-vente-et-droits-acces-nouveau-schema-partage-plus-route-corrigee",
    titre: "GestionEmployes.tsx + DroitsAcces.tsx construits ensemble (nouveau schema partagé) + un vrai défaut de routage corrigé",
    moteurs: ["vente", "confiance"],
    quoi:
      "Troisième et quatrième écrans de la liste des 11 vente/Centre* (tâche #54), traités ensemble car intrinsèquement liés : DroitsAcces.tsx édite les droits d'UN employé de GestionEmployes.tsx, mais sa route (/vente/droits) n'acceptait aucun identifiant — l'écran affichait toujours un employé fictif figé (« Commercial — Jean D. ») quel que soit celui réellement visé, et n'était d'ailleurs référencé nulle part dans l'application (aucun lien ne menait vers lui). Défaut réel corrigé avant toute donnée : route changée en /vente/droits/:id, et un vrai bouton « Gérer les droits d'accès » ajouté dans la fiche employé de GestionEmployes.tsx pour y accéder avec le bon identifiant.\n\nAucun moteur existant ne couvrait « l'équipe propre à un vendeur » (rbacRouter.staffProfiles est l'organigramme interne MKA.P-MS, un sujet différent — vérifié avant d'écrire le code). Nouveau schema partagé vente_employes (nom, poste, email, téléphone, actif, permissions en jsonb) : une seule table sert les deux écrans, les droits étant simplement une colonne de l'employé plutôt qu'un second registre. GestionEmployes.tsx réécrit pour lister/recruter/désactiver de vrais collaborateurs (les employés fictifs Jean Dupont/Marie Curie retirés) ; DroitsAcces.tsx réécrit pour charger et enregistrer les vraies permissions de l'employé réellement visé.",
    pourquoi:
      "Corriger DroitsAcces.tsx isolément (juste brancher un formulaire sur une donnée fictive) aurait laissé le vrai défaut intact : l'écran restait inaccessible et incapable de savoir de qui il parle. Remonter à la cause — l'absence d'identifiant dans la route — était la seule façon de rendre les deux écrans réellement utilisables ensemble, pas seulement de faire taire le détecteur de boutons.",
    ou: [
      "client/src/App.tsx",
      "server/modules/pro.ts",
      "server/routers/pro.ts",
      "client/src/pages/vente/GestionEmployes.tsx",
      "client/src/pages/vente/DroitsAcces.tsx",
      "drizzle/0135_vente_employes.sql",
      "server/routers/__tests__/vente-employes.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (migration appliquée, nouvelle suite dédiée, 11/11) : un vendeur ne voit jamais l'équipe d'un autre, ne peut jamais consulter ni modifier les droits du collaborateur d'un tiers (refusé explicitement dans les deux cas), un droit accordé est réellement relu après enregistrement, une désactivation persiste réellement. Aucune permission accordée par défaut à la création (jamais un accès implicite). Régénération de l'inventaire des routes (gen:routes) après le changement de route, vérifiée par check:routes avant commit. npm run build rejoué intégralement. 8 écrans restants de la liste #54.",
    domaine: "confiance",
  },
  {
    cle: "centre-visite-vehicule-type-test-drive-reutilise-plus-porte-acces-corrigee",
    titre: "CentreVisiteVehicule.tsx : un type de réservation déclaré depuis toujours mais jamais utilisé, plus deux vrais défauts corrigés avant toute donnée",
    moteurs: ["vente", "confiance"],
    quoi:
      "Cinquième écran de la liste des 11 vente/Centre* (tâche #54). Avant d'écrire une seule ligne, vérifié l'enum bookingTypeEnum (server/schema.ts) : il déclare trois valeurs (test_drive, rental, purchase_visit) mais purchase_visit est le seul réellement utilisé, par le moteur de réservation à acompte existant (reservations.create) ; test_drive n'apparaissait dans AUCUN fichier du dépôt en dehors de sa propre déclaration. Plutôt que de créer un second registre « visites » à côté du registre « réservations », le type existant a été activé : mesReservationsRecues et repondreReservationRecue (déjà construits pour ReservationsVente.tsx) ont été élargis pour couvrir purchase_visit ET test_drive (inArray sur le type), avec un libellé de notification distinct selon le cas (« Visite confirmée » vs « Réservation acceptée »). Une première version dupliquait ces deux procédures sous les noms mesVisitesRecues/repondreVisiteRecue avant d'être supprimée au profit de cet élargissement, en application de la règle : ne jamais reconstruire un moteur déjà existant.\n\nDeux vrais défauts découverts et corrigés en chemin, avant tout branchement de données : (1) la route /vente/visite n'acceptait aucun identifiant de véhicule (comme DroitsAcces.tsx avant elle) et n'était référencée nulle part dans l'application — aucun bouton n'y menait ; route changée en /vente/visite/:id, et un vrai bouton « Planifier une visite » ajouté sur la fiche véhicule (Vehicule.tsx) pour les acheteurs non-propriétaires. (2) l'écran était verrouillé derrière la porte d'accès professionnelle <V> (VoProGate, réservée aux vendeurs abonnés) alors qu'il s'adresse à un acheteur ordinaire souhaitant visiter un véhicule — gate changée en <U>, la porte d'accès générale. Ce même schéma de défaut (écran acheteur verrouillé derrière <V>) a été repéré par grep sur au moins 4 autres écrans du même dossier (CentreRetourClient, CentreReservationAchat, CentreRapportsVehicule, CentreNegociation) — non corrigés dans ce lot, faute d'avoir encore construit leur backend respectif, mais consignés pour traitement à leur tour.",
    pourquoi:
      "Corriger uniquement le formulaire de visite sans toucher à la route ni à la porte d'accès aurait produit un écran fonctionnel mais inatteignable par un vrai acheteur : ni lien pour y arriver, ni droit d'y entrer une fois le lien connu. Élargir le moteur existant plutôt que d'en écrire un second évite de dupliquer la logique d'isolation vendeur déjà testée sur les réservations à acompte.",
    ou: [
      "server/routers/reservations.ts",
      "client/src/pages/vente/CentreVisiteVehicule.tsx",
      "client/src/pages/vente/ReservationsVente.tsx",
      "client/src/pages/Vehicule.tsx",
      "client/src/App.tsx",
      "server/routers/__tests__/reservations-visite.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (nouvelle suite dédiée, 9/9, plus les trois suites précédentes rejouées sans régression — 8/8, 11/11, 7/7 — pour confirmer que l'élargissement du type de retour de mesReservationsRecues n'a rien cassé) : une demande de visite crée une vraie réservation test_drive, le vendeur la voit dans SA liste unifiée (jamais un second registre), la confirme via la même mutation que les réservations à acompte, et l'acheteur reçoit une notification au libellé réellement distinct (« Visite confirmée », pas un « Réservation acceptée » générique). Une visite déjà tranchée refuse une seconde décision. Vérifié aussi en navigateur réel : la fiche annonce s'affiche correctement sur /vente/visite/:id, l'état honnête « Véhicule introuvable » s'affiche sur un identifiant invalide, le nouveau bouton apparaît sur la fiche véhicule, et /vente/reservations affiche toujours à bon droit la porte professionnelle (écran resté vendeur-only, lui). En vérifiant, découvert que le serveur de développement local héritait d'une variable DATABASE_URL du conteneur pointant vers le proxy Railway bloqué (dotenv ne réécrit jamais une variable déjà présente dans l'environnement) — sans lien avec ce lot, corrigé uniquement pour la vérification en cours en fixant explicitement la variable au démarrage. 6 écrans restants de la liste #54, plus le schéma de porte d'accès <V>/<U> mal posée à corriger sur les 4 écrans repérés dès que leur backend existera.",
    domaine: "confiance",
  },
  {
    cle: "centre-negociation-reutilise-messagerie-plus-bouton-offre-repare",
    titre: "CentreNegociation.tsx : la négociation EST une conversation — aucun second registre, un vrai bouton cassé réparé",
    moteurs: ["vente", "confiance"],
    quoi:
      "Sixième écran de la liste des 11 vente/Centre* (tâche #54). Avant d'écrire une seule ligne, vérifié s'il existait déjà un moteur d'offres/négociation : aucun (le seul champ « offres » du schéma appartient à devisGarageStatusEnum, un tout autre sujet — les devis garage). En revanche, server/routers/messages.ts porte déjà un moteur de messagerie complet et modéré (blocage, anti-spam, signalement) rattaché à une annonce précise (messageThreads.annonceId), déjà utilisé par le bouton « Contacter le vendeur » de la fiche véhicule. Une négociation de prix n'est rien d'autre qu'une conversation sur cette même annonce : plutôt que d'inventer un second registre d'offres, CentreNegociation.tsx a été réécrit pour ouvrir/lire/écrire ce même fil (openThread/getThread/send), une offre chiffrée n'étant qu'un message formé (« 💰 Nouvelle offre : … »). Le faux sélecteur de « mode de vente » (fixe/offre/négociation), que l'écran laissait un acheteur régler lui-même sur l'annonce d'un tiers, a été retiré au profit du vrai champ annonces.negociable, affiché en lecture seule.\n\nEn cherchant l'origine réelle de « Faire une offre au vendeur » sur la fiche véhicule (les deux occurrences, dans les blocs de financement MKA.P-MS OFFICIEL), découverte d'un vrai bouton cassé : il redirigeait vers /finance, une page sans aucun rapport avec une offre sur CE véhicule. Corrigé pour ouvrir la vraie négociation de l'annonce (/vente/negociation/:id), au lieu de router vers une page générique. Même défaut de porte d'accès que les écrans précédents de cette liste : /vente/negociation n'acceptait aucun identifiant et était verrouillée derrière <V> (pro) alors qu'elle s'adresse à un acheteur — route changée en /vente/negociation/:id, gate en <U>. Contrairement aux écrans précédents, la fiche annonce (titre, prix, badge négociable) reste visible avant connexion ; seule l'ouverture du fil de messages exige une connexion, avec un vrai appel à se connecter plutôt qu'une erreur brute.",
    pourquoi:
      "Construire un système d'offres séparé aurait dupliqué exactement ce que le moteur de messagerie fait déjà (fil par annonce, isolement des tiers, modération) pour un gain nul : une offre EST un message dans cette conversation. Corriger uniquement l'écran sans remonter jusqu'au bouton qui y mène (mal routé vers /finance) aurait laissé le vrai point d'entrée cassé.",
    ou: [
      "client/src/App.tsx",
      "client/src/pages/vente/CentreNegociation.tsx",
      "client/src/pages/Vehicule.tsx",
      "server/routers/__tests__/negociation-messagerie.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (nouvelle suite dédiée, 7/7, contre le moteur de messagerie EXISTANT sans aucune modification de code serveur) : ouvrir deux fois le même fil ne crée jamais de doublon, une offre envoyée apparaît bien dans l'historique, le vendeur voit et peut répondre à la même conversation, un tiers étranger à l'annonce ne peut jamais lire ce fil (refusé explicitement). Vérifié en navigateur réel : la fiche annonce et le badge négociable s'affichent avant connexion, un acheteur non connecté est invité à se connecter (jamais une erreur brute), un identifiant invalide affiche l'état honnête « introuvable », et le bouton « Faire une offre au vendeur » (vérifié en promouvant temporairement une annonce de test au palier officiel, seul palier où ce bloc s'affiche) mène désormais réellement à la négociation de CE véhicule au lieu de /finance. 5 écrans restants de la liste #54.",
    domaine: "confiance",
  },
  {
    cle: "centre-photos-medias-reutilise-update-annonce-plus-point-entree-stock",
    titre: "CentrePhotosMedias.tsx : upload et remplacement de photos via le moteur d'annonce existant, un vrai point d'entrée ajouté au stock",
    moteurs: ["vente", "confiance"],
    quoi:
      "Septième écran de la liste des 11 vente/Centre* (tâche #54). Contrairement aux six précédents, cet écran était déjà correctement verrouillé derrière la porte professionnelle <V> (un vrai outil vendeur, jamais destiné à un acheteur). Vérifié avant tout code : trpc.annonces.update gère déjà le remplacement complet des photos d'une annonce existante avec un champ categorie libre (server/routers/annonces.ts, déjà utilisé par l'écran d'édition Vendre.tsx), et /api/upload gère déjà l'envoi de fichier avec conversion HEIC et compression (déjà utilisé par le dépôt d'annonce PhotosVehicule.tsx). Aucun des deux n'a été modifié : CentrePhotosMedias.tsx a été réécrit pour les réutiliser tels quels, une zone (« Avant gauche », « Moteur »…) devenant simplement une valeur de categorie. Le même défaut d'écran orphelin que les précédents : /vente/photos n'acceptait aucun identifiant et n'était référencé nulle part — corrigé en route /vente/photos/:id, avec un vrai bouton « Photos » ajouté dans le tableau d'actions de GestionStockVO.tsx (déjà un écran réel, aux côtés de Workflow/Dossier/Attestation qui existaient déjà).",
    pourquoi:
      "Construire un second mécanisme d'upload ou un second champ de stockage de photos aurait dupliqué exactement ce que annonces.update et /api/upload font déjà, pour un écran qui ne fait, au fond, que remplir 8 zones précises d'un même jeu de photos. Corriger l'écran sans lui donner de point d'entrée réel (comme les six précédents) l'aurait laissé aussi inatteignable qu'avant.",
    ou: [
      "client/src/App.tsx",
      "client/src/pages/vente/CentrePhotosMedias.tsx",
      "client/src/pages/vente/GestionStockVO.tsx",
      "server/routers/__tests__/photos-medias.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (nouvelle suite dédiée, 7/7, contre annonces.update SANS aucune modification de code serveur) : une photo écrite pour une zone est bien relue rattachée à cette même zone, ajouter une deuxième zone ne perd jamais la première (annonces.update remplaçant tout le jeu de photos, l'écran envoie systématiquement l'ensemble courant), remplacer la photo d'une zone déjà remplie la remplace réellement sans dupliquer la ligne, un autre vendeur ne peut jamais modifier les photos d'une annonce qui n'est pas la sienne (refusé explicitement — la même règle de propriété que testée pour les écrans précédents). Vérifié en navigateur réel : la porte professionnelle reste correctement active pour un visiteur non connecté (aucune régression), sans crash. 4 écrans restants de la liste #54 (CentreRetourClient, CentreReservationAchat, CentreRapportsVehicule, MultiSites), les trois premiers nécessitant une décision produit avant construction (moteur d'avis existant mais écran orphelin sans contexte de rattachement clair ; modèle de tarification incohérent avec les paliers d'acompte réels ; rapport d'historique véhicule nécessitant une source de données que la plateforme ne possède pas encore).",
    domaine: "confiance",
  },
  {
    cle: "centre-retour-client-cible-vrai-vendeur-plus-critere-reels",
    titre: "CentreRetourClient.tsx : les 4 critères fabriqués remplacés par les vrais modèles semés, l'avis cible le vendeur réel et non l'annonce",
    moteurs: ["vente", "confiance"],
    quoi:
      "Huitième écran de la liste des 11 vente/Centre* (tâche #54). L'écran notait 4 critères entièrement fabriqués (Vendeur/Véhicule/Livraison/Service) sans jamais rien enregistrer. Vérifié avant tout code : server/routers/reviewsV2.ts porte un moteur d'avis multi-critères complet (modération, anti-doublon, anti-auto-évaluation, badges, scores de confiance) avec ses propres modèles de critères RÉELLEMENT semés pour l'univers vente (server/seed.ts) — un jeu pour un vendeur professionnel (qualite_annonce/disponibilite/transparence/service_client) et un jeu différent pour un particulier (serieux/communication/respect_rdv/exactitude_annonce). L'écran a été réécrit pour charger le bon jeu via trpc.reviewsV2.getCriteria selon annonces.vendeurType, puis soumettre via trpc.reviewsV2.create en ciblant réellement le VENDEUR (targetType/targetId = le propriétaire de l'annonce), jamais l'annonce elle-même — aucune modification du code serveur.\n\nDéfaut annexe découvert en vérifiant le contrat réel : review_criteria_templates n'a aucune contrainte d'unicité, et server/seed.ts réinsère ses modèles à chaque démarrage sans onConflictDoNothing() efficace (aucune cible de conflit déclarée) — la base locale contenait déjà 8 exemplaires de chaque critère « vente ». Non corrigé dans ce lot (réparer une contrainte d'unicité sur une table déjà dupliquée en production nécessiterait d'abord une purge des doublons existants, hors périmètre disproportionné) : contourné côté client par une déduplication stricte par criteriaKey avant affichage, et tracé comme nouvelle tâche de fond. Même défaut d'écran orphelin que les précédents : route /vente/retour-client/:id (identifiant manquant avant), gate <V>→<U>, et un vrai point d'entrée « Donner mon avis sur le vendeur » ajouté sur la fiche véhicule.",
    pourquoi:
      "Continuer à noter 4 critères inventés (jamais semés en base) aurait produit un écran qui semble fonctionner sans jamais alimenter le vrai moteur de confiance de la plateforme (scores, badges, mentions « vérifié »). Cibler l'annonce plutôt que le vendeur aurait aussi cassé silencieusement l'agrégation des avis par vendeur, qui est la donnée réellement utilisée ailleurs (fiche pro, badges).",
    ou: [
      "client/src/App.tsx",
      "client/src/pages/vente/CentreRetourClient.tsx",
      "client/src/pages/Vehicule.tsx",
      "server/routers/__tests__/retour-client-avis.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (nouvelle suite dédiée, 8/8, contre reviewsV2 SANS aucune modification de code serveur) : le jeu de critères diffère réellement selon particulier/professionnel, aucun des 4 critères fabriqués de l'ancien écran n'existe dans les modèles réels, un avis déposé cible bien l'identifiant du vendeur (jamais l'annonce), il n'est jamais marqué « vérifié » en l'absence d'une demande d'avis émise par la plateforme (jamais fabriqué), l'anti-doublon déjà présent dans le moteur s'applique tel quel (refusé explicitement pour un second avis sur le même vendeur), et un avis sur un second vendeur reste indépendant. Vérifié en navigateur réel : fiche annonce visible avant connexion, invitation réelle à se connecter, état honnête sur identifiant invalide, nouveau point d'entrée présent sur la fiche véhicule. Nouvelle tâche de fond tracée : réparer l'absence de contrainte d'unicité sur review_criteria_templates (dédoublonnage nécessaire avant toute contrainte). 3 écrans restants de la liste #54 (CentreReservationAchat — modèle de tarification incohérent avec les paliers d'acompte réels ; CentreRapportsVehicule — nécessite une source de données d'historique véhicule que la plateforme ne possède pas ; MultiSites — nécessiterait un concept de sites multiples par vendeur qui n'existe pas encore, un chantier de schéma disproportionné pour ce lot).",
    domaine: "confiance",
  },
  {
    cle: "audit-activation-faux-positifs-routeurs-partages-achat-vente-location",
    titre: "Système Intelligent : 8 moteurs signalés « non connectée » à tort — infrastructure partagée jamais déclarée à l'auditeur",
    moteurs: ["achat_officiel", "achat_pro", "achat_particulier", "vente", "vente_pro", "vente_particulier", "location_pro", "location_particulier", "activation_audit"],
    quoi:
      "Le PDG a signalé une série d'alertes du Système Intelligent (Centre de contrôle → Santé) : « Achat Officiel Engine », « Vente Professionnelle Engine », « Vente Particulier Engine », « Univers Vente Engine », « Location Professionnelle Engine », « Location Particulier Engine », « Achat Professionnel Engine », « Achat Particulier Engine » — toutes « 🟠 Existe mais non connectée », motif « aucune procédure tRPC ne l'expose ». Vérifié : ce sont de FAUX positifs. Ces 8 moteurs sont de simples filtres du catalogue « annonces » partagé (par exemple achat_officiel = annonces.list filtré categorieAnnonce=\"officielle\", déjà vérifié et documenté dans server/engine-registry/perimetres.ts lors de l'audit précédent) ou, pour vente_pro, de l'inscription professionnelle via kyc/pro — jamais un routeur en propre, car gen-moteurs.mjs impose qu'un routeur tRPC n'appartienne qu'à un seul moteur. L'auditeur d'activation (server/activation-audit/service.ts, fonction matchRouter) ne consultait que les routeurs déclarés EN PROPRE de chaque moteur : sans routeur propre, il concluait à tort qu'aucune procédure ne sert le moteur, alors qu'une vraie procédure le sert bel et bien, juste sous le nom d'un autre.\n\nCorrigé en ajoutant ROUTEURS_PARTAGES (server/engine-registry/perimetres.ts) : une déclaration manuelle, séparée de `routeurs` (qui reste soumis à la règle d'unicité), listant pour chaque moteur d'écran le(s) routeur(s) réellement appelé(s) mais possédé(s) par un autre. matchRouter() la consulte désormais en repli avant l'approximation de texte. Neuvième alerte du même lot, « Contrôle Technique Engine », N'A PAS été touchée : c'est un manque réel, déjà documenté dans perimetres.ts (« Manque réel, pas un défaut de déclaration ») — les 3 écrans concernés (ControleTechnique.tsx, EtatVehicule.tsx, InspectionNumerique.tsx) n'appellent réellement aucune procédure tRPC. Cette construction reste à faire (tâche #60), volontairement distincte de cette correction d'audit.",
    pourquoi:
      "Laisser l'auditeur crier au loup sur une infrastructure déjà vérifiée et documentée comme saine aurait fini par noyer les vraies pannes sous le bruit — exactement le risque qu'une alerte doit éviter. La correction porte sur l'outil d'audit, pas sur les moteurs eux-mêmes : aucun code métier n'a changé, seule la capacité de l'auditeur à reconnaître une infrastructure partagée déjà connue.",
    ou: [
      "server/engine-registry/perimetres.ts",
      "server/activation-audit/service.ts",
      "server/activation-audit/__tests__/routeurs-partages.test.ts",
    ],
    lecon:
      "Vérifié sans base de données (les procédures tRPC réellement montées sont lues directement depuis server/router.ts, aucune donnée à charger) : les 7 moteurs partagés avec « annonces » trouvent désormais ce routeur, vente_pro trouve kyc ou pro, et — point de contrôle négatif essentiel — controle_technique continue à raison de ne trouver aucun routeur (la correction ne masque jamais un vrai manque, elle ne fait que reconnaître une infrastructure déjà prouvée). npm run check:moteurs rejoué : aucune dérive de l'inventaire des moteurs (la nouvelle déclaration ne touche jamais `routeurs`/`dossiers`/`routes`, seulement un repli de détection pour l'auditeur). npm run build rejoué intégralement.",
    domaine: "confiance",
  },
  {
    cle: "correction-controle-technique-partiellement-connecte",
    titre: "Correction : controle_technique n'était pas un témoin négatif propre — garage/ControleTechnique.tsx appelle bien trpc.devis.mine",
    moteurs: ["controle_technique", "activation_audit"],
    quoi:
      "En vérifiant le lot précédent (faux positifs de l'auditeur d'activation), relecture effective des 3 écrans que le commentaire de perimetres.ts affirmait « n'appeler aucune procédure tRPC » : garage/ControleTechnique.tsx appelle en réalité trpc.devis.mine (déjà honnête — n'affiche que les vraies demandes de RDV envoyées, jamais un statut CT officiel fabriqué, faute d'accès à un registre gouvernemental). Seuls EtatVehicule.tsx et InspectionNumerique.tsx n'appellent réellement aucune procédure. Le commentaire et le test précédemment livrés traitaient donc controle_technique comme un témoin négatif propre (aucune connexion) — c'était inexact pour un tiers de son périmètre. Corrigé : controle_technique ajouté à ROUTEURS_PARTAGES (routeur \"devis\"), commentaire de perimetres.ts mis à jour pour distinguer précisément ce qui est déjà connecté (ControleTechnique.tsx) de ce qui reste un manque réel (EtatVehicule.tsx, InspectionNumerique.tsx — tâche #60), et le témoin négatif du test remplacé par un moteur totalement fictif plutôt que par un domaine dont l'état réel était mal connu.",
    pourquoi:
      "Un témoin négatif qui s'avère lui-même partiellement faux ne prouve plus rien : il aurait fallu vérifier le code réel des 3 écrans avant de leur faire porter une affirmation aussi précise (« aucune procédure tRPC »), pas seulement faire confiance à un commentaire déjà en place.",
    ou: [
      "server/engine-registry/perimetres.ts",
      "server/activation-audit/__tests__/routeurs-partages.test.ts",
    ],
    lecon:
      "Vérifié sans base de données (10/10, dont le nouveau témoin négatif sur un nom de moteur totalement inventé) : controle_technique trouve désormais le routeur \"devis\", et le témoin négatif ne peut plus jamais être mis en défaut par une découverte future sur un domaine réel. check:moteurs rejoué : aucune dérive. Le manque réel (EtatVehicule.tsx, InspectionNumerique.tsx) reste entièrement à construire — non traité ici, delibérément distinct de cette correction d'audit.",
    domaine: "confiance",
  },
  {
    cle: "etat-vehicule-inspection-numerique-fabrication-retiree",
    titre: "EtatVehicule.tsx et InspectionNumerique.tsx : fabrication retirée, données réelles (honnêtement vides) en attendant le vrai moteur de location",
    moteurs: ["controle_technique", "location"],
    quoi:
      "En corrigeant la classification de controle_technique (lot précédent), découverte que EtatVehicule.tsx et InspectionNumerique.tsx affichaient des réservations de location ENTIÈREMENT fabriquées (réf. LOC-2025-0042, cautions, contrats « signés », checklists). Recherche de la cause : bookingTypeEnum déclare le type \"rental\" depuis toujours, et une table dédiée rental_applications existe même avec ses propres champs de caution — mais AUCUNE procédure, nulle part dans le dépôt, ne crée jamais de réservation de l'un ou l'autre type. Aucun flux de réservation de location individuelle n'existe donc sur la plateforme (le même défaut que \"test_drive\" avant la tâche #54.5, en plus grand : là où activer test_drive ne demandait qu'une mutation de demande, ici tout le parcours de réservation — dates, tarif, paiement — reste à construire, tâche #56 déjà trackée séparément).\n\nPlutôt que d'attendre la construction de ce moteur pour corriger ces deux écrans, la fabrication a été retirée immédiatement : les deux lisent désormais trpc.reservations.mine (déjà réel, déjà utilisé par la vente) filtré sur type=\"rental\", honnêtement vide aujourd'hui pour tout le monde puisqu'aucune réservation de ce type ne peut encore être créée. Un état amical explique pourquoi (« apparaîtra ici dès votre première réservation confirmée ») plutôt que de laisser un écran vide sans explication. Les deux écrans, déjà correctement accessibles aux acheteurs, ont reçu la même porte d'accès conditionnelle qu'ajoutée aux écrans vente/Centre* de ce lot (invitation réelle à se connecter, pas d'appel à une procédure protégée pour un visiteur anonyme).",
    pourquoi:
      "Un utilisateur qui ouvre ces écrans aujourd'hui n'a jamais eu la moindre réservation de location — lui montrer un contrat signé et une caution bloquée sur un véhicule qu'il n'a jamais réservé est une fabrication au sens plein du terme, pas un simple manque d'ergonomie. La retirer ne coûte rien et ne peut pas attendre la construction du moteur complet.",
    ou: [
      "client/src/pages/EtatVehicule.tsx",
      "client/src/pages/InspectionNumerique.tsx",
      "server/routers/__tests__/etat-vehicule-honnete.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (nouvelle suite dédiée, 3/3, contre reservations.mine sans le modifier) : un booking d'un autre type (test_drive) n'apparaît jamais dans le filtre \"rental\" (jamais un faux positif visuel), et un vrai booking rental — inséré directement en base pour la démonstration, puisqu'aucune procédure produit ne le crée encore — apparaît avec ses vrais champs de caution, sans aucune donnée inventée autour. Vérifié en navigateur réel : aucune trace des anciennes données fabriquées, invitation réelle à se connecter pour un visiteur anonyme, aucun plantage. L'état des lieux photo, la checklist et la signature numérique restent à construire une fois le moteur de réservation de location (tâche #56) en place — tâche #60 mise à jour pour refléter cette dépendance, non traitée ici.",
    domaine: "confiance",
  },
  {
    cle: "gestion-annonce-expiration-reutilise-moteur-mesannonces",
    titre: "Gérer l'annonce + Expiration : deux écrans orphelins reconnectés au moteur déjà utilisé par MesAnnonces.tsx",
    moteurs: ["vente", "confiance"],
    quoi:
      "Signalés par le PDG parmi une série de boutons détectés sans action (« bouton sans gestionnaire de clic »). ModificationAnnonce.tsx (Suspendre/Republier/Supprimer) et ExpirationAnnonce.tsx (renouvellement) n'acceptaient aucun identifiant d'annonce et n'étaient référencés nulle part. Vérifié avant tout code : trpc.annonces.update/remove/prolong existent déjà et sont déjà utilisés par MesAnnonces.tsx pour modifier/supprimer/prolonger — jamais un second moteur. Suspendre/Republier ne sont que le même champ status (\"archivee\"/\"publiee\") déjà géré par update ; Supprimer appelle le même remove (suppression logique, passe déjà à \"archivee\" côté serveur) ; le renouvellement appelle le même prolong (+30 jours).\n\nCorrigé : routes /depot-annonce/modification-annonce/:id et /depot-annonce/expiration-annonce/:id (identifiant manquant avant), points d'entrée réels ajoutés dans MesAnnonces.tsx (bouton « Gérer » et lien sur la date d'expiration, déjà un écran réel utilisant trpc.annonces.myList). Le bouton de renouvellement, qui affichait « Renouveler automatiquement » alors qu'aucun mécanisme de renouvellement récurrent n'existe (seul un prolong manuel de 30 jours est réel), a été renommé « Prolonger de 30 jours » — corriger le libellé pour qu'il dise la vérité sur l'action réelle, pas une réduction de fonctionnalité.",
    pourquoi:
      "Construire un second mécanisme de suspension/republication/suppression aurait dupliqué exactement ce que annonces.update/remove font déjà pour MesAnnonces.tsx. Laisser le libellé « automatiquement » sur une action strictement manuelle aurait été une fabrication de plus, du même ordre que les données inventées corrigées dans les lots précédents — juste dans le texte d'un bouton plutôt que dans des données.",
    ou: [
      "client/src/App.tsx",
      "client/src/pages/depot-annonce/ModificationAnnonce.tsx",
      "client/src/pages/depot-annonce/ExpirationAnnonce.tsx",
      "client/src/pages/MesAnnonces.tsx",
      "server/routers/__tests__/gestion-annonce.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (nouvelle suite dédiée, 6/6, contre annonces.update/remove/prolong SANS aucune modification de code serveur) : suspendre passe réellement le statut à archivee, republier repasse réellement à publiee, prolonger avance réellement la date d'expiration, supprimer passe réellement à archivee (suppression logique), et un tiers ne peut jamais suspendre ni prolonger l'annonce d'un autre vendeur (refusé explicitement dans les deux cas). Vérifié en navigateur réel : fiche annonce affichée, actions réelles présentes, état honnête « introuvable » sur un identifiant invalide, prolongation réelle disponible.",
    domaine: "confiance",
  },
  {
    cle: "demarches-cinq-ecrans-reconnectes-moteur-cartegrise-plus-paiement-dossier",
    titre: "5 écrans demarches/* reconnectés au moteur cartegrise déjà complet, une seule vraie lacune comblée : payer les frais réels d'un dossier",
    moteurs: ["cartegrise", "confiance"],
    quoi:
      "Signalés parmi une série de boutons sans action détectés par le PDG. SuccessionVehicule.tsx, PlaquesImmatriculation.tsx, PaiementDemarches.tsx, MessagerieDemarches.tsx et SignaturesElectroniques.tsx étaient tous fabriqués (dossiers, montants, messages, statuts de signature inventés). Vérifié avant tout code : server/routers/cartegrise.ts porte déjà un moteur de dossiers complet (createDossier/detail/addDocument/étapes), déjà connecté à 9 autres écrans demarches/* (tâche #31) — jamais un second moteur créé. Succession et Plaques suivent exactement le même schéma que DuplicataDemarche.tsx : type \"autre\" + motif dans notes, faute d'une valeur d'enum dédiée côté serveur. Messagerie et Signatures ont été rebâtis en écrans de consultation RÉELS (étapes cg_etapes, documents cg_documents) plutôt que de continuer à simuler un chat ou une signature électronique qui n'existent pas encore côté serveur — un message honnête l'indique désormais, au lieu de les fabriquer.\n\nUne vraie lacune, distincte du simple défaut de câblage, a été comblée : aucune procédure ne permettait de payer les frais réels d'un dossier (montantTaxe/montantPrestation, des colonnes réelles jamais exploitées côté client). Ajout de carteGrise.payerDossier : calcule le total à partir des VRAIS montants du dossier (jamais un tarif deviné côté client comme l'ancien écran le faisait avec 257,66 €), refuse tant que l'agence n'a pas chiffré le dossier, et ouvre un vrai paiement Stripe via le Payment Engine déjà utilisé par les abonnements/packs carte grise (kind \"carte_grise_service\"). Point d'entrée réel ajouté : CarteGrise.tsx (déjà un écran réel listant les dossiers) porte désormais 3 liens (Suivi/Documents/Paiement) vers ces écrans, par dossier.",
    pourquoi:
      "Construire un second moteur de dossiers, ou faire semblant qu'une messagerie/signature électronique existe déjà, aurait ajouté de la fabrication là où le PDG demandait justement de la retirer. Le seul vrai manque — payer les frais d'un dossier — méritait d'être comblé plutôt que contourné, une fois établi qu'il s'agissait d'une lacune ponctuelle et non d'un chantier disproportionné (les colonnes de montant existaient déjà, seule la procédure de paiement manquait).",
    ou: [
      "client/src/App.tsx",
      "client/src/pages/CarteGrise.tsx",
      "client/src/pages/demarches/SuccessionVehicule.tsx",
      "client/src/pages/demarches/PlaquesImmatriculation.tsx",
      "client/src/pages/demarches/PaiementDemarches.tsx",
      "client/src/pages/demarches/MessagerieDemarches.tsx",
      "client/src/pages/demarches/SignaturesElectroniques.tsx",
      "server/routers/cartegrise.ts",
      "server/routers/__tests__/demarches-reconnexion.test.ts",
    ],
    lecon:
      "Vérifié sur base Postgres réelle (nouvelle suite dédiée, 7/7) : les dossiers succession/plaques sont créés avec le bon type et le bon motif ; le paiement est refusé tant que l'agence n'a pas chiffré le dossier (jamais un tarif inventé) ; une fois chiffré, il ouvre une vraie redirection de paiement ; un tiers ne peut jamais payer le dossier d'un autre client (refusé explicitement) ; le suivi affiche bien une vraie étape créée automatiquement, jamais un message fabriqué. Une erreur de rédaction dans le test lui-même (une regex qui ne correspondait pas au message exact du refus) a été débusquée en reproduisant l'appel isolément plutôt qu'en supposant le code serveur en cause — la leçon : vérifier le test autant que le code avant de conclure à un bug. Vérifié en navigateur réel sur les 5 écrans : aucune erreur de rendu. Reste explicitement hors périmètre : l'écran ControleDocuments.tsx (déjà réel à 90%, un seul bouton terminal bloqué par l'absence du moteur de réservation de location, tâche #56) et la vraie signature électronique (tâche #36).",
    domaine: "confiance",
  },
  {
    cle: "garage-carrosserie-annuaire-reel-plus-diagnostic-honnete",
    titre: "CarrosserieGarage.tsx : annuaire de carrossiers fabriqué remplacé par le vrai moteur garages ; DiagnosticAvance.tsx : codes défaut inventés retirés",
    moteurs: ["garage", "confiance"],
    quoi:
      "Signalés parmi une série de boutons sans action détectés par le PDG. CarrosserieGarage.tsx (déjà largement réel — identification plaque/VIN, devis via trpc.devis.create, photos avant/après) affichait une liste de 4 carrossiers entièrement inventés (adresses, notes, avis, distances), et son bouton « Rechercher » n'avait aucun gestionnaire de clic. Vérifié avant tout code : trpc.garages.list (table garages_publics) est déjà le vrai annuaire de garages, déjà utilisé par PriseRendezVous.tsx (tâche #24) — jamais un second annuaire créé. Liste fabriquée remplacée par ce vrai annuaire, filtrable par ville, avec un état honnête « aucun garage trouvé » plutôt qu'une liste toujours pleine. Aucun calcul de distance : pas de clé Google Maps configurée (tâche #50, non traité ici).\n\nDiagnosticAvance.tsx affichait 3 codes défaut OBD-II fixes (P0301, P0420, B1234) comme s'ils provenaient d'une vraie lecture véhicule. Aucune intégration avec un scanner OBD-II physique n'existe côté MKA.P-MS — impossible à fabriquer honnêtement côté serveur, ce n'est pas un manque de câblage mais une dépendance matérielle absente. Écran réécrit pour le dire clairement, avec un vrai renvoi vers la prise de rendez-vous garage (moteur devis déjà utilisé ailleurs) plutôt que de continuer à simuler un diagnostic qui n'a jamais eu lieu — « Capture écran »/« Exporter PDF » retirés, exporter un diagnostic inventé aurait été la même fabrication dans un fichier.",
    pourquoi:
      "Construire un second annuaire de carrossiers aurait dupliqué exactement ce que garages_publics fait déjà pour PriseRendezVous.tsx. Pour le diagnostic OBD-II, aucune quantité de code serveur ne peut produire une vraie lecture sans le matériel — le seul choix honnête était de le dire, pas de continuer à l'inventer.",
    ou: [
      "client/src/pages/garage/CarrosserieGarage.tsx",
      "client/src/pages/garage/DiagnosticAvance.tsx",
    ],
    lecon:
      "Vérifié directement contre l'API réelle (garages.list interrogé avec une fiche de test insérée en base : la réponse correspond exactement aux champs désormais utilisés côté client — name, addressLine, city, phone, hours, specialites, rating, reviewCount — fiche retirée après vérification). Vérifié en TypeScript strict (aucune régression sur les autres écrans). Reste hors périmètre, tracés dans la tâche #53 : ControleQualiteGarage.tsx (checklist qualité par ordre de réparation — nécessiterait un nouveau schéma de validation atelier/responsable, une décision de conception plutôt qu'un simple câblage) et les autres écrans garage/* sans backend.",
    domaine: "confiance",
  },
  {
    cle: "centre-penalites-calendrier-dispo-fabrication-retiree",
    titre: "CentrePenalites.tsx et CalendrierDispo.tsx : pénalités et calendrier d'occupation entièrement inventés retirés, bloqués par l'absence du moteur location (tâche #56)",
    moteurs: ["reservations"],
    quoi:
      "Signalés parmi la même série de boutons sans action que EtatVehicule.tsx/InspectionNumerique.tsx (tâche #60), avec exactement la même cause racine déjà documentée : bookingTypeEnum contient bien la valeur \"rental\", mais aucune procédure ne crée jamais de réservation de ce type — aucun moteur de location individuelle n'existe (tâche #56, lacune large, non traitée ici).\n\nCentrePenalites.tsx affichait un tableau PENALITES fabriqué : 3 pénalités précises (retard, carburant, nettoyage) avec montants, références de réservation (LOC-2025-00xx) et boutons « Payer »/« Contester » inventés — aucune colonne pénalité n'existe sur `bookings`. Remplacé par trpc.reservations.mine (déjà utilisé par EtatVehicule.tsx) filtré sur type \"rental\", avec un état honnête « aucune réservation de location active » puisqu'aucune ne peut exister aujourd'hui. Le barème (BAREME) est conservé car c'est une vraie politique tarifaire publique, pas une donnée d'incident inventée — même logique que les grilles tarifaires conservées dans PlaquesImmatriculation.tsx (tâche #58).\n\nCalendrierDispo.tsx affichait 3 véhicules fabriqués (photos stock Unsplash) et un calendrier d'occupation généré par une fonction locale avec des jours \"occupés\" codés en dur (5-12, 20-25 de chaque mois) — jamais dérivé d'une vraie réservation. Comme aucune réservation de location réelle ne peut exister, tout calendrier d'occupation serait nécessairement inventé : écran remplacé par un message honnête et un vrai lien vers /louer (recherche réelle de véhicules de location).",
    pourquoi:
      "Construire une vraie pénalité ou un vrai calendrier d'occupation suppose une réservation de location réelle en amont — cette capacité n'existe pas encore (tâche #56). Continuer à afficher des données inventées sur ces deux écrans aurait simulé une activité de location qui n'a jamais eu lieu.",
    ou: [
      "client/src/pages/CentrePenalites.tsx",
      "client/src/pages/CalendrierDispo.tsx",
    ],
    lecon:
      "Vérifié qu'aucune colonne pénalité n'existe sur `bookings` et qu'aucune procédure ne crée de réservation \"rental\" (grep exhaustif sur server/routers). Vérifié en TypeScript strict. Ces deux écrans restent bloqués par la tâche #56 comme EtatVehicule.tsx/InspectionNumerique.tsx — dès que le moteur location existera, ces deux écrans devront être repris pour afficher les vraies pénalités et la vraie disponibilité.",
    domaine: "confiance",
  },
  {
    cle: "controle-documents-continuer-reservation-relie-louer",
    titre: "ControleDocuments.tsx : bouton « Continuer vers la réservation » relié à /louer (aucune action même une fois le dossier KYC validé)",
    moteurs: ["kyc"],
    quoi:
      "Écran déjà réel à 90 % (moteur KYC générique server/routers/kyc.ts, aucun second moteur créé) : la progression, l'envoi des pièces et le statut du dossier sont tous réels. Seul le bouton final « Continuer vers la réservation » ne faisait strictement rien au clic, y compris une fois `dossierValide` vrai (bouton visuellement plein, doré, avec ombre — donc perçu comme pleinement actionnable). Comme aucun flux de réservation de location individuelle n'existe encore (tâche #56 : le type \"rental\" n'a aucune procédure de création), il n'y a pas de destination dédiée de réservation vers laquelle continuer. Le bouton devient un vrai lien vers /louer (recherche réelle de véhicules de location) une fois le dossier validé, au lieu de rester inerte.",
    pourquoi:
      "Un bouton visuellement activé qui ne fait rien au clic est le pire cas : contrairement à un bouton grisé, l'utilisateur croit avoir raté quelque chose. Tant que le moteur de réservation de location n'existe pas (tâche #56), /louer est la seule destination réelle et honnête après validation du dossier.",
    ou: ["client/src/pages/ControleDocuments.tsx"],
    lecon:
      "Vérifié en TypeScript strict. Les deux autres boutons désactivés du même type trouvés dans le même balayage — PreparationVenteVO.tsx et CentreControleQualite.tsx — reposent sur des listes de contrôle (CHECKLIST) entièrement fabriquées (aucune donnée réelle par véhicule/annonce), donc non traités ici : ce sont des lacunes de modèle de données plus larges, tracées sous les tâches #53 et #54 comme ControleQualiteGarage.tsx. LOAFinance.tsx et LocationLOA.tsx restent inchangés : déjà honnêtes (bouton désactivé avec motif affiché, aucun calcul inventé).",
    domaine: "confiance",
  },
  {
    cle: "publicite-detail-reconnecte-moteur-pub-requests",
    titre: "PubliciteDetail.tsx : 3 demandes de publicité fabriquées (DEMO_DEMANDES) remplacées par le vrai moteur pub_requests déjà utilisé par Admin.tsx",
    moteurs: ["marketing"],
    quoi:
      "PubliciteDetail.tsx (/publicite/:id) affichait 3 demandes de publicité inventées, avec des champs qui n'existent nulle part en base : SIRET, adresse complète, lien de site, photo, tarif, et des statuts « Mettre en pause »/« Remettre en ligne » sans aucune existence réelle. Or Admin.tsx dispose déjà d'un moteur de revue de publicités entièrement réel et fonctionnel (server/routers/admin.ts : pubRequestsList/pubRequestDetail/decidePubRequest/deletePubRequest, table pub_requests réelle avec entreprise/type/emplacement/description/contactName/contactEmail/contactPhone/budget/duree/status/refusalReason) — jamais utilisé par PubliciteDetail.tsx, resté un doublon orphelin (aucun lien ne pointe vers /publicite/:id nulle part dans l'app). Écran reconnecté à ce moteur réel : mêmes trois actions qu'Admin.tsx (Approuver/Refuser tant que en_attente, Supprimer), aucun second moteur créé. Les champs sans existence réelle (SIRET, adresse, lien, photo, tarif) et les statuts pause/remise en ligne (aucune notion de campagne active/en pause n'existe) ont été retirés plutôt que fabriqués.",
    pourquoi:
      "Un second moteur de gestion de publicités aurait dupliqué exactement ce qu'Admin.tsx fait déjà. Les champs et statuts sans existence en base auraient nécessité soit de les inventer (fabrication), soit d'étendre le schéma sans besoin réel démontré — aucune des deux options n'était acceptable ici.",
    ou: ["client/src/pages/PubliciteDetail.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/publicite-detail.test.ts, 5/5 assertions : accès refusé à un anonyme, détail réel exposé à un admin, refus avec vrai motif persisté et relu, suppression réelle). Vérifié en TypeScript strict. Découverte plus large en cours de route, tracée séparément sous la tâche #62 : DemandePublicite.tsx (formulaire public réel avec upload de fichier réel) ne persiste jamais la demande — son bouton d'envoi final simule juste un succès (setTimeout) sans jamais appeler le serveur, donc le moteur pub_requests réel côté admin ne reçoit aujourd'hui aucune vraie demande. Non corrigé ici : nécessite l'ajout d'une procédure de création et probablement une colonne de schéma pour le contenu créatif, qui se heurtera à la tâche #61 (chaîne de migrations drizzle-kit cassée).",
    domaine: "confiance",
  },
  {
    cle: "journal-activite-reconnecte-moteur-audit-logs",
    titre: "JournalActivite.tsx : 23 entrées fabriquées sur 3 catégories inventées remplacées par le vrai moteur d'audit (audit_logs / logAction / admin.auditLog)",
    moteurs: ["admin"],
    quoi:
      "JournalActivite.tsx affichait 23 entrées entièrement inventées réparties sur 3 catégories (Utilisateurs/Garages/Admin), avec des acteurs, IP et détails fictifs, des liens de redirection fabriqués, et des boutons « Imprimer »/« PDF » sans aucun moteur d'export. Un vrai moteur d'audit existait déjà pour la traçabilité radar Direction (server/audit.ts : logAction(), table audit_logs, déjà exposé par trpc.admin.auditLog et déjà utilisé par de nombreuses mutations admin : annonce.*, garage.*, kyc.*, account.*, promo.*, pub.*, staff.create) — jamais branché sur cet écran. Écran reconnecté à ce moteur réel : les catégories Utilisateurs/Garages ont été retirées plutôt que fabriquées, car audit_logs ne trace aujourd'hui QUE les actions du back-office, jamais les actions des utilisateurs ou des garages eux-mêmes (aucune instrumentation de ce type n'existe). Le filtrage par catégorie est désormais basé sur les vraies valeurs d'entityType présentes dans les données (annonce, garage, kyc_profile, user, promo_code, pub_request…), jamais une liste fixe inventée. La gravité (info/alerte/critique) est dérivée du nom réel de l'action (delete → critique, refus/reject → alerte, sinon info) plutôt qu'attribuée à la main par enregistrement fabriqué. « Imprimer »/« PDF » retirés : aucun moteur d'export n'existe.",
    pourquoi:
      "Un second moteur de journal d'activité aurait dupliqué exactement ce que logAction()/audit_logs font déjà pour la traçabilité radar Direction. Inventer des catégories Utilisateurs/Garages aurait affiché une couverture de traçabilité qui n'existe pas : le journal doit refléter honnêtement son périmètre réel (actions back-office uniquement) plutôt que prétendre couvrir tout le monde.",
    ou: ["client/src/pages/JournalActivite.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/journal-activite.test.ts, 6/6 assertions : une action réellement journalisée via logAction() apparaît bien dans le journal avec le vrai email d'auteur joint et la vraie IP, un employé (accès back-office mais pas Direction) n'a pas accès — directionProcedure —, un anonyme non plus). Vérifié en TypeScript strict. Tâche #60 : les quatre écrans qu'elle listait (EtatVehicule/InspectionNumerique/JournalActivite/PubliciteDetail) ont maintenant tous reçu un traitement honnête.",
    domaine: "confiance",
  },
  {
    cle: "essai-routier-reconnecte-moteur-visite-plus-kyc",
    titre: "CentreEssaiRoutier.tsx : écran orphelin sans identifiant de véhicule reconnecté à reservations.demanderVisite (mode sur_place) et au vrai dossier KYC",
    moteurs: ["reservations", "kyc"],
    quoi:
      "CentreEssaiRoutier.tsx (/vente/essai) n'acceptait aucun identifiant de véhicule, n'était référencé nulle part dans l'application, et était verrouillé derrière la porte VO professionnelle (VoProGate) alors qu'il s'agit d'une action acheteur — exactement le même profil d'écran orphelin que CentreVisiteVehicule.tsx (tâche #54) avant sa correction. Sa checklist « Permis valide / Pièce d'identité / Rendez-vous confirmé » était intégralement fabriquée (toujours ok:true/ok:true/ok:false). Reconnecté : nouvelle route /vente/essai/:id sous la porte d'accès générale (comme la visite véhicule), réutilise exactement reservations.demanderVisite (même moteur bookings/test_drive que CentreVisiteVehicule.tsx, jamais un second registre), figé en mode \"sur_place\" — un essai routier exige une présence physique, contrairement à une visite qui peut se faire en visio. Les deux premières conditions reflètent désormais le vrai dossier KYC de l'acheteur (trpc.kyc.myProfile, même moteur que ControleDocuments.tsx) : permis_conduire et piece_identite réellement envoyés, jamais supposés acquis. Un bouton « Réserver un essai routier » a été ajouté sur Vehicule.tsx, à côté du bouton « Planifier une visite » déjà réel, pour que l'écran soit enfin atteignable.",
    pourquoi:
      "Un écran qui prétend nécessiter permis + pièce d'identité pour un essai routier mais coche ces deux cases par défaut sans jamais vérifier quoi que ce soit est une fausse barrière de sécurité. Créer un second moteur de réservation aurait dupliqué exactement ce que demanderVisite fait déjà pour la visite véhicule.",
    ou: ["client/src/pages/vente/CentreEssaiRoutier.tsx", "client/src/App.tsx", "client/src/pages/Vehicule.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/essai-routier.test.ts, 5/5 assertions) : sans document envoyé, les deux conditions KYC sont honnêtement à faux (jamais 'ok' par défaut) ; une fois le permis réellement envoyé via le moteur KYC, la condition passe à vrai ; la demande d'essai crée une vraie réservation test_drive avec le message \"Visite sur place\" (jamais un mode visio pour un essai routier). Le moteur demanderVisite lui-même reste couvert par reservations-visite.test.ts (déjà existant, non dupliqué). Vérifié en TypeScript strict.",
    domaine: "confiance",
  },
  {
    cle: "demande-publicite-persistance-reelle-plus-devise-internationale",
    titre: "DemandePublicite.tsx : le formulaire public simulait un succès sans jamais rien enregistrer — parcours complet reconnecté au vrai moteur pub_requests, tarifs internationalisés",
    moteurs: ["marketing"],
    quoi:
      "DemandePublicite.tsx (formulaire public, upload de fichier réel vers /api/upload avec URL obtenue) ne persistait jamais la demande : son bouton d'envoi final faisait un simple `setTimeout(1500)` puis affichait un faux message de succès, sans jamais appeler le serveur. Pendant ce temps, le moteur de revue admin (server/routers/admin.ts : pubRequestsList/pubRequestDetail/decidePubRequest/deletePubRequest, table pub_requests) était déjà entièrement réel et fonctionnel (utilisé par Admin.tsx et par PubliciteDetail.tsx, corrigé dans un lot précédent) — mais ne recevait jamais aucune vraie demande.\n\nAjout d'une procédure `marketing.createPubRequest` (publique, sans connexion requise — le formulaire collecte lui-même nom/email/téléphone, exactement comme marketing.subscribeNewsletter déjà existant) qui persiste réellement la demande, avec validation serveur (zod .refine : un contenu \"lien\" sans URL de lien, ou une photo/vidéo sans fichier uploadé, est rejeté — jamais un succès affiché sur une demande incomplète). Migration additive sur pub_requests (drizzle/0136, chaîne de journal manuelle car drizzle-kit generate reste cassé — tâche #61, mais le garde-fou check:migrations valide la cohérence) : content_type/media_url/link_url (contenu créatif réel, jamais fabriqué) et pays (ISO 3166-1 alpha-2, même convention que newsletterSubscribers.pays) et budget_amount_eur (montant de référence en euros, devise pivot interne).\n\nAdaptation internationale (la plateforme n'est pas française uniquement) : les tarifs d'emplacement, auparavant affichés en euros fixes (\"50€/jour\") texte en dur dans le JSX, sont désormais convertis dans la devise réelle du visiteur via useCurrency().format() — moteur déjà construit et déjà utilisé ailleurs sur la plateforme (CountrySelectModal, sélection pays/devise/langue), jamais un second moteur de devise créé. Le pays réel du visiteur (déjà choisi via ce même moteur) est transmis et stocké, jamais supposé \"FR\" par défaut. Admin.tsx et PubliciteDetail.tsx affichent désormais le contenu créatif réel (photo/vidéo/lien) et le pays de la demande au lieu de rester muets sur ces champs.",
    pourquoi:
      "Un formulaire qui affiche « Demande envoyée ! » sans jamais rien enregistrer est une fausse confirmation faite à un client réel — la pire forme de fabrication, car elle induit un tiers en erreur, pas seulement l'équipe interne. Un second moteur de gestion de publicités aurait dupliqué exactement ce qu'Admin.tsx/PubliciteDetail.tsx font déjà. Des prix figés en euros sur une plateforme internationale auraient été trompeurs pour tout visiteur hors zone euro alors qu'un moteur de conversion réel existe déjà.",
    ou: [
      "server/modules/marketing.ts",
      "server/routers/marketing.ts",
      "client/src/pages/DemandePublicite.tsx",
      "client/src/pages/Admin.tsx",
      "client/src/pages/PubliciteDetail.tsx",
      "drizzle/0136_pub_requests_contenu_creatif.sql",
    ],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/demande-publicite.test.ts, 8/8 assertions) : le serveur refuse une demande \"lien\" sans URL (jamais un succès sur données incomplètes) ; une vraie soumission avec pays hors France (\"CD\") est réellement enregistrée, le pays et le lien réels sont conservés tels quels ; l'admin voit exactement les données réellement soumises ; la décision de l'admin (approbation) est réellement persistée ; une resoumission (double clic) crée une ligne distincte et traçable plutôt qu'une fusion silencieuse. Testé aussi que publicite-detail.test.ts (lot précédent) ne régresse pas avec les nouvelles colonnes. Vérifié en TypeScript strict. npm run build (dont check:migrations) vert de bout en bout. Tâche #62 clôturée.",
    domaine: "confiance",
  },
  {
    cle: "moteur-candidature-location-flotte-plus-correction-paiement-cg",
    titre: "Construction du moteur de candidature de location flotte (tâche #56, lot 1/n) + correction d'un vrai bug de paiement carte grise découvert au passage",
    moteurs: ["location", "reservations"],
    quoi:
      "Tâche #56 : aucun parcours réel de réservation de location individuelle n'existait — confirmé de nouveau par audit avant toute construction (aucune duplication) : rentalApplications (server/schema.ts, ligne ~890) existait dans le schéma depuis toujours avec des colonnes complètes (token/userId/vehicleId/garageId/applicantType/data jsonb/currentStep/status/rejectionReason/depositAmount/depositCurrency/depositPaid/depositStripeSessionId, énumérations rental_applicant_type et rental_application_status déjà réelles) mais AUCUN routeur ne la touchait — grep exhaustif confirmé, zéro usage. C'est un modèle de candidature/qualification (comme une demande de financement : brouillon → soumis → approuvé/refusé → payé → terminé), pas un calendrier de créneaux jour par jour — le modèle correspond à des écrans B2B de location flotte (camions, minibus, utilitaires), pas à une réservation Airbnb.\n\nAjout de server/routers/rentalApplications.ts (create/mine/detail/updateStep/submit/payDeposit côté candidat ; list/decide côté agent), monté sur trpc.rentalApplications.*, réutilisant exactement le schéma existant — aucune seconde table créée. La caution n'est jamais un montant inventé côté client : payDeposit refuse tant que l'agent ne l'a pas explicitement fixée lors de l'approbation (decide avec depositAmount/depositCurrency réels). Nouveau kind de paiement rental_deposit (server/payment-engine/checkout.ts) avec son propre gestionnaire dans server/stripeWebhook.ts (met à jour depositPaid/status à la confirmation réelle du paiement).\n\nDécouverte en cours de route, corrigée dans le même lot (pas une nouvelle tâche séparée, un vrai bug de production) : payerDossier (server/routers/cartegrise.ts, ajouté en PR #407) crée bien un vrai checkout Stripe avec kind \"carte_grise_service\" depuis le début, mais aucun gestionnaire de ce kind n'existait dans server/stripeWebhook.ts — un client qui payait réellement ses frais de dossier carte grise ne voyait jamais son dossier avancer après paiement (statut resté figé à son état d'avant paiement). Corrigé dans ce même lot : le webhook fait maintenant avancer le dossier vers \"en_traitement\" (statut réel existant, aucun statut inventé) et ajoute une vraie étape cg_etapes \"Paiement reçu — dossier en traitement\".\n\nEncore à faire pour clore la tâche #56 (lots suivants) : reconnecter les écrans clients (LocationCamions, LocationMinibus, LocationUtilitaires, RenouvellementFlotte, RenouvellementLocation, ReservationMulti, ReservationRecurrente, GestionConducteurs, GestionFranchises, RemplacementVehicule, TableauBordLoueur) à ce moteur, puis EtatVehicule.tsx/InspectionNumerique.tsx/CentrePenalites.tsx/CalendrierDispo.tsx (déjà honnêtement traités mais toujours fonctionnellement bloqués — tâche #60) pourront enfin afficher de vraies données au lieu d'un état vide honnête.",
    pourquoi:
      "Construire une nouvelle table de réservation aurait dupliqué rentalApplications, déjà conçue pour ce besoin exact et jamais utilisée. Laisser le paiement carte grise sans confirmation réelle aurait continué à faire croire à un client payant que son dossier avance, alors que rien ne change jamais en base après son paiement — un problème plus grave que celui que ce lot était censé résoudre au départ.",
    ou: [
      "server/routers/rentalApplications.ts",
      "server/router.ts",
      "server/engine-registry/perimetres.ts",
      "server/payment-engine/checkout.ts",
      "server/stripeWebhook.ts",
    ],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/rental-applications.test.ts, 12/12 assertions) : création réelle liée à un vrai véhicule, sauvegarde progressive multi-étapes fusionnée sans perte, isolation stricte entre candidats, verrouillage après soumission, refus avec motif réel conservé, paiement honnêtement refusé tant que la caution n'est pas fixée par l'agent, checkout réel une fois fixée, et la transition que le webhook Stripe applique à la confirmation (depositPaid/status) validée directement en base. La confirmation de paiement elle-même (signature Stripe) n'est testée par aucun test de ce dépôt — convention déjà en place avant ce lot, non introduite ici. Vérifié en TypeScript strict. server/engine-registry/perimetres.ts mis à jour (routeur et fichier orphelins ramenés à 0). npm run build vert de bout en bout.",
    domaine: "confiance",
  },
  {
    cle: "location-camions-catalogue-reel-plus-bug-id-collision-corrige",
    titre: "LocationCamions.tsx : catalogue de 8 camions fabriqués (ids 6001-6008) remplacé par les vraies annonces — corrige un vrai risque de collision d'identifiant avec ProduitLocation.tsx",
    moteurs: ["annonces"],
    quoi:
      "LocationCamions.tsx (/louer/camions) affichait un catalogue de 8 camions entièrement fabriqués (ids 6001-6008, prix inventés), des sous-catégories avec des compteurs inventés (« 8 véhicules », « 5 véhicules »…), et des filtres de sous-type (Porteur/Benne/Plateau/Engin) sans aucun champ réel correspondant (categorieEnum côté serveur ne connaît que la valeur de haut niveau « camion »). Plus grave qu'une simple fabrication d'affichage : ces ids fabriqués menaient vers ProduitLocation.tsx qui, ne les reconnaissant pas comme des démonstrations connues (son propre catalogue de démo utilise des ids \"8001\"+, une autre plage), tentait une vraie requête trpc.annonces.get(id) — soit une fiche introuvable, soit, en cas de collision d'id avec une annonce réelle sans rapport, l'affichage de la fiche de CETTE annonce sous le nom et le prix d'un camion qui n'existe pas.\n\nRemplacé par le vrai catalogue déjà interrogé plus haut dans ce même fichier (trpc.annonces.list, categorie: \"camion\", type: \"location\") affiché directement sans recherche préalable requise, avec un état honnête si aucune annonce réelle n'existe. Les dates de location ont été retirées de la recherche : elles étaient collectées mais jamais transmises à la requête (aucun filtrage réel n'avait jamais lieu) — aucun moteur de disponibilité par date n'existe encore pour les annonces de location (même racine que la tâche #56).",
    pourquoi:
      "Un catalogue fabriqué qui redirige vers une vraie fiche produit par coïncidence d'identifiant est plus dangereux qu'un simple contenu inventé : un visiteur pourrait voir la fiche réelle (photos, coordonnées) d'un tiers sous le nom d'un camion qui n'a jamais existé. Le filtrage par sous-type aurait nécessité soit d'inventer un champ, soit d'étendre le schéma sans besoin démontré — aucune des deux options n'était justifiée pour ce lot.",
    ou: ["client/src/pages/LocationCamions.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/location-camions.test.ts, 3/3 assertions) : un vrai camion en location apparaît bien dans le catalogue filtré, une annonce en vente n'apparaît jamais dans un catalogue de location, un utilitaire n'apparaît pas dans le filtre \"camion\" (jamais une sous-catégorie fabriquée mélangée à une vraie donnée). Vérifié en TypeScript strict. LocationMinibus.tsx et LocationUtilitaires.tsx partagent très probablement le même patron (même fichier ProduitLocation.tsx en aval, même risque de collision d'id) — non traités dans ce lot, à reprendre en suivant exactement la même méthode, tâche #56.",
    domaine: "confiance",
  },
  {
    cle: "location-minibus-utilitaires-catalogue-reel",
    titre: "LocationUtilitaires.tsx et LocationMinibus.tsx : mêmes catalogues fabriqués retirés, filtre minibus honnête par nombre de places réel (aucune catégorie \"minibus\" n'existe)",
    moteurs: ["annonces"],
    quoi:
      "Suite immédiate du correctif LocationCamions.tsx : LocationUtilitaires.tsx affichait 23 utilitaires fabriqués (ids 5001-5023) et LocationMinibus.tsx 8 minibus fabriqués (ids 7001-7008), tous deux avec le même risque de collision d'identifiant vers ProduitLocation.tsx (une vraie requête trpc.annonces.get(id) tentée sur un id fabriqué, potentiellement une vraie annonce sans rapport). LocationUtilitaires.tsx interrogeait déjà trpc.annonces.list (categorie: \"utilitaire\") en plus du faux catalogue — le faux catalogue et ses sous-catégories à compteurs inventés ont été retirés, le vrai catalogue reste seul affiché.\n\nLocationMinibus.tsx n'avait AUCUNE requête réelle (contrairement aux deux autres écrans) et son bouton « Rechercher » n'avait aucun gestionnaire de clic. Vérifié avant tout code : categorieEnum côté serveur ne contient aucune valeur \"minibus\" (citadine/berline/break/suv/coupe/cabriolet/monospace/utilitaire/camion/moto/scooter/quad/luxe/autre) — l'approximer avec \"monospace\" aurait été une fabrication déguisée en filtre réel. Le vrai champ utilisé à la place : annonces.places (nombre de places, déjà filtrable côté serveur à correspondance exacte), plus pertinent pour un minibus que n'importe quelle catégorie de carrosserie.",
    pourquoi:
      "Approximer une catégorie \"minibus\" inexistante avec une valeur d'enum existante mais différente (monospace) aurait été aussi trompeur que le catalogue fabriqué qu'elle remplaçait — juste plus discret. Le nombre de places est un champ réel, déjà rempli par les vendeurs, et directement pertinent pour ce cas d'usage.",
    ou: ["client/src/pages/LocationUtilitaires.tsx", "client/src/pages/LocationMinibus.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/location-minibus-utilitaires.test.ts, 5/5 assertions) : un utilitaire réel apparaît dans le catalogue utilitaires, un minibus 9 places n'y apparaît jamais (catégories réellement distinctes) ; le filtre par 9 places renvoie le minibus 9 places réel et exclut le 17 places (correspondance exacte, jamais approximative) ; sans filtre, les deux minibus réels apparaissent. Vérifié en TypeScript strict. Compteur de boutons sans action : 72 → 71 (bouton « Rechercher » de LocationMinibus.tsx désormais réellement câblé).",
    domaine: "confiance",
  },
  {
    cle: "paiement-idempotence-caution-honnete-plus-fiche-eligible",
    titre: "Paiements : idempotence réelle contre les redélivrances Stripe, correction du vocabulaire caution/acompte, et fermeture d'une fuite d'accès sur les fiches non publiées",
    moteurs: ["reservations", "annonces"],
    quoi:
      "Trois correctifs de robustesse sur les livraisons précédentes de ce chantier, demandés en vérification directe (jamais auto-certifiés) :\n\n1) Idempotence des confirmations de paiement (server/stripeWebhook.ts) : aucun garde n'existait contre une redélivrance du même événement checkout.session.completed (retry réseau Stripe, rejeu manuel depuis le dashboard). Sans garde, chaque redélivrance aurait ajouté une étape « Paiement reçu » en double dans l'historique d'un dossier carte grise, ou renotifié un client sur une caution déjà payée. confirmerPaiementCarteGrise() et confirmerCautionLocation() sont désormais des fonctions exportées et testables indépendamment, qui ne traitent que si la transition n'a pas déjà eu lieu (dossier pas déjà en_traitement, acompte pas déjà depositPaid).\n\n2) Vocabulaire caution/acompte (server/routers/rentalApplications.ts, server/stripeWebhook.ts) : le paiement de location utilise Stripe en mode \"payment\" sans capture manuelle — un encaissement immédiat et définitif, pas une autorisation bancaire bloquée puis libérée. Tout le texte utilisateur (libellé Stripe, notifications, messages d'erreur) disait pourtant « Caution », terme qui suggère en français un blocage réversible. Corrigé partout en « Acompte », avec une mention explicite « encaissé immédiatement » là où l'ambiguïté était la plus risquée.\n\n3) Fuite d'accès sur trpc.annonces.get (server/routers/annonces.ts) : cette procédure, utilisée par tous les écrans produit de la plateforme (Vehicule.tsx, ProduitLocation.tsx, CentreVisiteVehicule.tsx, CentreEssaiRoutier.tsx…), n'avait aucun filtre d'accessibilité — connaître ou deviner l'id d'une annonce brouillon, refusée, archivée, vendue ou louée suffisait à la consulter intégralement, quel que soit son vrai statut. Corrigé : une fiche non publiée n'est désormais visible que par son propriétaire (pour la modifier/republier, ModificationAnnonce.tsx) ou un administrateur — jamais par un visiteur anonyme ou un tiers.",
    pourquoi:
      "Une redélivrance Stripe non gérée aurait fini par produire des doublons visibles par le client (étapes de dossier, notifications) — un défaut qui aurait fini par ressembler à un bug de facturation aux yeux d'un client, même si l'argent lui-même n'était jamais prélevé deux fois. Le mot « caution » employé pour un encaissement définitif aurait laissé croire à tort qu'une somme reste récupérable sans démarche. L'absence de filtre sur annonces.get exposait potentiellement des données privées (brouillons, coordonnées vendeur) à quiconque devinait un identifiant — un problème plus large que le risque de collision d'id déjà corrigé sur les écrans de catalogue location.",
    ou: [
      "server/stripeWebhook.ts",
      "server/routers/rentalApplications.ts",
      "server/payment-engine/checkout.ts",
      "server/routers/annonces.ts",
    ],
    lecon:
      "Vérifié directement contre la base réelle : server/routers/__tests__/webhook-idempotence.test.ts (8/8) — un premier appel confirme réellement (dossier → en_traitement avec exactement une étape créée, candidature → paid avec depositPaid=true), un second appel identique (simulant une redélivrance) ne produit plus aucun effet et ne crée aucun doublon, pour les deux mécanismes. server/routers/__tests__/annonces-get-eligibilite.test.ts (5/5) — un anonyme et un tiers connecté ne voient jamais un brouillon, le propriétaire et un admin le voient toujours, et une annonce réellement publiée reste visible par tous (aucune régression). Rejoué aussi rental-applications.test.ts (12/12), gestion-annonce.test.ts (6/6) et photos-medias.test.ts (7/7), tous verts sans modification : le garde sur annonces.get ne casse aucun flux d'édition propriétaire existant. Vérifié en TypeScript strict. npm run build vert de bout en bout.\n\nPoint encore ouvert, documenté plutôt que construit dans ce lot : le filtre \"nombre de places\" de LocationMinibus.tsx reste un champ réel et honnêtement décrit (aucune valeur de catégorie \"minibus\" n'existe côté serveur), mais ne garantit pas seul le type de carrosserie — un véhicule à 7 places pourrait techniquement ne pas être un minibus. Aucune classification supplémentaire fiable n'existe aujourd'hui pour la distinguer sans deviner ; à concevoir explicitement si ce filtre s'avère insuffisant en usage réel.",
    domaine: "confiance",
  },
  {
    cle: "candidature-location-flotte-interface-reelle",
    titre: "Candidature de location flotte : le moteur backend testé (tâche #56 LOT 1) était réellement orphelin — aucun écran ne l'appelait",
    moteurs: ["location"],
    quoi:
      "Audit demandé sur ReservationMulti.tsx, ReservationRecurrente.tsx et RemplacementVehicule.tsx pour vérifier s'ils étaient réutilisables tels quels avec server/routers/rentalApplications.ts (livré précédemment, testé unitairement). Constat plus large que prévu : les trois écrans sont 100% fabriqués avec des besoins métier distincts d'une simple candidature mono-véhicule (panier multi-véhicules avec remise inventée, abonnement récurrent nécessitant Stripe mode=\"subscription\", workflow de remplacement présupposant un contrat de location actif qui n'existe pas) — documenté en détail dans la tâche #56, aucun des trois n'a été construit dans ce lot.\n\nMais l'audit a révélé un problème plus fondamental et plus urgent : server/routers/rentalApplications.ts (create/mine/detail/updateStep/submit/payDeposit/list/decide), livré et testé unitairement (12/12) lors d'un lot précédent, n'était appelé par AUCUN écran client — recherche exhaustive confirmée (grep sans résultat). Le successPath codé en dur dans payDeposit (/location/mes-candidatures) pointait même vers une route qui n'existait pas. Un moteur testé unitairement mais jamais atteignable par un utilisateur réel ne satisfait pas le critère \"connecté et utilisable\" déjà posé dans ce chantier — corrigé en priorité avant toute extension de schéma (multi-véhicules, abonnement, contrats actifs).\n\nAjouts : client/src/pages/location/CandidatureLocationFlotte.tsx (formulaire réel en 4 étapes : profil individual/society/vtc/taxi, coordonnées, justificatif selon profil, récapitulatif — reprend un brouillon existant au lieu d'en créer un doublon) ; client/src/pages/location/MesCandidaturesLocation.tsx (suivi réel via rentalApplications.mine, bouton \"Payer l'acompte\" réel via payDeposit) ; point d'entrée réel ajouté sur LocationPro.tsx (bannière \"Société, VTC ou taxi ?\") et dans le menu Compte.tsx (\"Mes candidatures location\") ; section de décision ajoutée à Admin.tsx (rentalApplications.list/decide — approuver fixe un acompte réel saisi par l'agent, jamais un défaut inventé).",
    pourquoi:
      "Un backend testé en isolation prouve que la logique serveur est correcte, pas qu'un utilisateur réel peut s'en servir — sans point d'entrée, sans écran de suivi et sans interface de décision côté agence, la candidature de location flotte n'existait pour personne. Continuer à construire des extensions (multi-véhicules, contrats) sur un socle inatteignable aurait aggravé l'écart entre \"moteur livré\" et \"fonctionnalité utilisable\", exactement le risque que ce chantier cherche à éliminer.",
    ou: [
      "client/src/pages/location/CandidatureLocationFlotte.tsx",
      "client/src/pages/location/MesCandidaturesLocation.tsx",
      "client/src/pages/LocationPro.tsx",
      "client/src/pages/Compte.tsx",
      "client/src/pages/Admin.tsx",
      "client/src/App.tsx",
      "server/engine-registry/perimetres.ts",
    ],
    lecon:
      "Vérifié par un parcours HTTP complet contre la base réelle (serveur démarré en local, JWT signé pour un compte candidat et un compte super_admin, appels tRPC identiques à ceux des nouveaux écrans) : create → updateStep (x2) → submit → admin list(status=submitted) → decide(approved, depositAmount=250 EUR) → mine (reflète le statut approuvé) → payDeposit (retourne une URL, mode simulation faute de clé Stripe locale) — chaque étape a produit exactement l'état attendu, aucune ne s'est comportée différemment de ce que l'écran fait. Nettoyage confirmé en base après coup. rental-applications.test.ts rejoué sans modification (12/12). npx tsc --noEmit propre sur les fichiers touchés. Compteur de boutons sans action : 71 → 71 (inchangé, aucun bouton mort ajouté ni retiré par erreur) ; cliquables 2550 → 2562 sur 2 écrans supplémentaires ; routes sans moteur ramené à 0 après déclaration de /location/mes-candidatures dans server/engine-registry/perimetres.ts. npm run build vert de bout en bout.\n\nPoints encore ouverts, documentés dans la tâche #56 : ReservationMulti/ReservationRecurrente/RemplacementVehicule/GestionConducteurs restent à construire avec leur propre schéma (aucun tarif ni règle non fixé par l'agence n'a été inventé) ; TableauBordLoueur.tsx reste 100% fabriqué et n'a pas encore été ré-audité individuellement.",
    domaine: "produit",
  },
  {
    cle: "vehicules-certifies-selection-mka-reelle",
    titre: "VehiculesCertifies.tsx : catalogue fabriqué remplacé par le vrai moteur de certification déjà existant (selectionMka)",
    moteurs: ["annonces"],
    quoi:
      "VehiculesCertifies.tsx affichait un catalogue VEHICULES 100% fabriqué (ids 1-3, notes 4.8-4.9 inventées, checklist d'inspection par véhicule inventée) au lieu d'un vrai mécanisme de certification. Avant tout code, vérifié qu'un moteur existait déjà : annonces.selectionMka (« Sélection MKA.P-MS »), réglable uniquement par la Direction via server/routers/admin.ts:certifyVehicle (avec journal d'audit), déjà filtrable via trpc.annonces.list({ selectionMka: true }) et déjà utilisé sur Home.tsx pour une section « premium ». Reconnecté à ce moteur existant plutôt que d'en recréer un second : trpc.annonces.list({ type: \"location\", selectionMka: true }). La note et la checklist par véhicule (données qui n'existent nulle part côté serveur) ont été retirées ; les critères de certification restent affichés sous forme de liste statique de la démarche générale (pas un résultat inventé par véhicule), conformément à la distinction déjà posée dans ce chantier entre une checklist de référence statique et un résultat qui doit appartenir à un dossier réel.",
    pourquoi:
      "Un badge « Certifié » adossé à des identifiants et des notes inventés aurait laissé croire à un contrôle qualité réel qui n'avait jamais eu lieu — un risque de confiance plus grave qu'un simple bouton mort, puisqu'il porte sur la fiabilité perçue du véhicule lui-même. Le moteur de certification existait déjà et fonctionnait (utilisé sur Home.tsx) : le reconnecter évite de fabriquer un second mécanisme concurrent.",
    ou: ["client/src/pages/VehiculesCertifies.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/vehicules-certifies.test.ts, 3/3) : une annonce location avec selectionMka=true apparaît, une annonce location non certifiée n'apparaît jamais, une annonce certifiée mais de type vente n'apparaît jamais dans le catalogue location (le filtre type + selectionMka se combinent correctement, pas une confusion entre univers). Vérifié en TypeScript strict. Compteur de boutons sans action inchangé (71). npm run build vert.\n\nDécouverte annexe non traitée dans ce lot : ListeAttente.tsx (même dossier location) a le même défaut de catalogue fabriqué (ATTENTES, ids 1-3) mais représente un besoin métier réellement différent (liste d'attente par véhicule avec position et notification de disponibilité) sans moteur existant à réutiliser — nécessite une vraie table dédiée et un déclenchement sur changement de statut d'annonce, pas une simple reconnexion. Ajoutée comme tâche #63 plutôt que corrigée superficiellement.",
    domaine: "confiance",
  },
  {
    cle: "rental-contracts-schema-plus-renouvellement-honnete",
    titre: "Contrat de location actif (nouvelle table rentalContracts) : la pièce manquante entre une candidature payée et un véhicule réellement attribué",
    moteurs: ["location"],
    quoi:
      "Item 2 de la demande utilisateur : RenouvellementFlotte.tsx et RemplacementVehicule.tsx présupposaient l'existence d'un contrat de location actif (véhicule attribué + dates de période) — pièce qui n'existait nulle part dans le schéma. rentalApplications (la candidature) prouve un acompte payé, jamais une attribution datée. Conçue et migrée : rentalContracts (id, applicationId, vehicleId, userId, startDate, endDate nullable, status actif/termine/remplace/renouvele/annule) — drizzle/0137_rental_contracts.sql, contournement établi pour la tâche #61 (journal manuel).\n\nserver/routers/rentalContracts.ts : createContract (adminProcedure — un agent crée le contrat une fois la candidature au statut \"paid\", avec un véhicule et des dates réels fixés explicitement à ce moment, jamais devinés ; vérifie que le véhicule référencé existe réellement ; refuse toute candidature non payée) ; fait passer la candidature à \"completed\" (statut terminal déjà existant, pas une valeur inventée) ; myContracts (protectedProcedure — le locataire voit ses contrats avec le véhicule attaché) ; list (adminProcedure).\n\nRenouvellementFlotte.tsx entièrement reconstruit : plus de CONTRATS_EXPIRATION ni de SUGGESTIONS fabriquées (le \"Sélectionnées automatiquement selon vos besoins\" était un moteur de recommandation qui n'existe pas). Affiche les vrais contrats actifs du locataire (rentalContracts.myContracts), un vrai compte à rebours calculé depuis endDate (jamais une valeur inventée), et pour \"renouveler\" renvoie vers une VRAIE nouvelle candidature (CandidatureLocationFlotte.tsx) plutôt que d'inventer une prolongation instantanée ou un véhicule de remplacement automatique. Lien réel ajouté depuis MesCandidaturesLocation.tsx (statut \"completed\" → \"Voir mon contrat de location\"). Section admin ajoutée dans Admin.tsx (\"Candidatures payées — créer le contrat\") : un agent saisit l'id du véhicule et les dates réelles, jamais un défaut inventé.",
    pourquoi:
      "Construire RenouvellementFlotte/RemplacementVehicule sur des dates ou des suggestions inventées aurait juste déplacé le problème de fabrication d'un écran à l'autre. La bonne pièce manquante était plus fondamentale : sans un contrat réellement daté, aucun écran de ce groupe ne peut afficher une échéance vraie. La construire une fois, proprement, débloque plusieurs écrans à la fois plutôt que de rafistoler chacun séparément.",
    ou: [
      "server/schema.ts",
      "drizzle/0137_rental_contracts.sql",
      "server/routers/rentalContracts.ts",
      "server/router.ts",
      "server/engine-registry/perimetres.ts",
      "client/src/pages/RenouvellementFlotte.tsx",
      "client/src/pages/location/MesCandidaturesLocation.tsx",
    ],
    lecon:
      "Vérifié par un parcours HTTP complet contre la base réelle (serveur local, JWT signés) : createContract refuse une candidature non payée, refuse un véhicule inexistant, crée réellement le contrat pour une candidature payée + un véhicule réel, fait passer la candidature à completed, et myContracts renvoie le contrat avec le véhicule attaché au bon locataire — jamais à un tiers. server/routers/__tests__/rental-contracts.test.ts (6/6) couvre les mêmes cas contre la base de test. rental-applications.test.ts rejoué sans modification (12/12). node scripts/check-migrations.mjs : 136 migrations, ordre cohérent. Compteur de boutons sans action : 71 → 68 (RenouvellementFlotte.tsx supprimait net 7 boutons morts — suggestions et \"Voir\" fabriqués — pour 1 seul lien réel). npm run build vert de bout en bout.\n\nPoints encore ouverts dans la tâche #56 : RemplacementVehicule.tsx (workflow de remplacement lié à un rentalContracts actif, étapes propres décidées par un agent) et GestionConducteurs.tsx (nouvelle table indépendante) restent à construire.",
    domaine: "produit",
  },
  {
    cle: "tableau-bord-loueur-agregation-reelle",
    titre: "TableauBordLoueur.tsx : tableau de bord fabriqué remplacé par une vraie agrégation des annonces et demandes du loueur",
    moteurs: ["location", "reservations"],
    quoi:
      "TableauBordLoueur.tsx affichait des statistiques, réservations récentes, score qualité et taux d'occupation 100% fabriqués. Avant de construire, corrigé un vrai obstacle : reservations.requestLocation stockait toujours serviceId=0 quel que soit le véhicule demandé, rendant impossible toute jointure fiable entre une demande de réservation et l'annonce concernée. Corrigé : quand vehiculeRef est un id réel d'annonce (cas de tous les écrans déjà reconnectés au catalogue), il est désormais stocké dans serviceId ; sinon (catalogue pas encore reconnecté) serviceId reste 0, jamais une valeur devinée.\n\nAjout server/routers/rentalContracts.ts:myLoueurStats (protectedProcedure) : agrège les vraies annonces de location du compte connecté (actifs/loués/disponibles, filtrés sur ownerId et type=location), le vrai score qualité déjà maintenu par le moteur d'avis existant (users.rating/reviewCount, recalculé par reviews.ts à chaque avis — jamais un nouveau moteur de notation créé), et les vraies demandes récentes (serviceTracking, jointes via le serviceId désormais réel). Aucun CA ni taux d'occupation n'est renvoyé : reservations.requestLocation n'est qu'une demande, jamais un encaissement (aucun paiement de location n'existe — tâche #44), et aucun calendrier jour par jour n'existe pour calculer une occupation réelle — un chiffre absent plutôt qu'inventé.\n\nTableauBordLoueur.tsx entièrement reconstruit sur myLoueurStats : plus de STATS/RESERVATIONS_RECENTES/DOCS_PENDING fabriqués, plus de score 4.9 inventé, plus de graphique d'occupation à barres inventé (7 valeurs 60-90% sans aucune source).",
    pourquoi:
      "Un tableau de bord affichant un CA, un taux d'occupation et un score de satisfaction inventés aurait laissé un loueur professionnel prendre des décisions sur des chiffres qui n'existaient nulle part — le risque de confiance le plus direct de tout ce chantier, puisque ces écrans s'adressent justement à des comptes qui gèrent une activité réelle. Corriger le serviceId manquant dans requestLocation avant de construire évite de refabriquer une jointure approximative texte-vers-id (le même risque déjà corrigé sur les catalogues location).",
    ou: ["server/routers/reservations.ts", "server/routers/rentalContracts.ts", "client/src/pages/TableauBordLoueur.tsx"],
    lecon:
      "Vérifié directement contre la base réelle : server/routers/__tests__/reservations-request-location.test.ts (2/2 — un vehiculeRef numérique remplit serviceId avec le même id, un vehiculeRef non numérique laisse serviceId à 0) et server/routers/__tests__/rental-contracts-loueur-stats.test.ts (5/5 — compte correctement actifs/loués/disponibles, une annonce d'un AUTRE loueur n'est jamais comptée, une réservation réelle apparaît avec le bon titre de véhicule, reviewCount à 0 sans avis). Vérifié aussi par un parcours HTTP direct contre un serveur local (myLoueurStats renvoie exactement la forme attendue par l'écran). rental-contracts.test.ts rejoué sans modification (6/6). Compteur de boutons sans action : 68 → 67 (le bouton \"Vérifier\" sur des documents en attente fabriqués a disparu avec eux). npm run build vert de bout en bout.",
    domaine: "confiance",
  },
  {
    cle: "admin-abonnements-donnees-reelles-plus-historique-facturation",
    titre: "AdminAbonnements.tsx (superadmin) : tableau fabriqué remplacé par les vraies souscriptions et le vrai historique de facturation",
    moteurs: ["payment"],
    quoi:
      "Reconnexion effectuée à la reprise de session (2026-09-25), après réconciliation avec 18 PR fusionnées par d'autres agents pendant l'interruption (voir docs/audits/2026-09-24-captures-plateforme.md, table exhaustive des signalements restants — AdminAbonnements.tsx y figurait toujours comme non traité). AdminAbonnements.tsx affichait un tableau ABOS 100% fabriqué (342 actifs, MRR 48 200 EUR, 6 clients inventés) et deux boutons morts par ligne (Gérer, Historique).\n\nAjout de trois procédures à server/routers/abonnements.ts : adminList (liste réelle jointe à users pour le nom/email, filtrable par statut), adminStats (actifs/expirés/nouveaux ce mois calculés par comptage réel, MRR sommé par devise depuis les abonnements actifs — jamais un taux de change inventé pour fusionner plusieurs devises), adminHistory (paiements réels liés via payments.subscriptionId, une colonne déjà présente et jusqu'ici inutilisée pour cet usage). \"Gérer\" a été retiré plutôt que simulé : annuler ou changer un plan côté admin sans passer par l'API Stripe créerait un abonnement dont la base et le vrai statut Stripe divergent — cette action reste déléguée à abonnements.openPortal (le vrai portail client Stripe), déjà existant.",
    pourquoi:
      "Un MRR et un nombre d'abonnés inventés auraient pu être lus par la Direction comme un indicateur de pilotage réel — exactement le risque déjà identifié sur ComptaDirigeant.tsx et TableauBordLoueur.tsx dans ce chantier. Ajouter un vrai bouton d'annulation admin aurait introduit un risque plus grave qu'un bouton mort : un état payé chez Stripe mais annulé en base (ou l'inverse), invisible jusqu'au prochain webhook.",
    ou: ["server/routers/abonnements.ts", "client/src/pages/superadmin/AdminAbonnements.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/abonnements-admin.test.ts, 6/6) : les compteurs actifs/expirés reflètent les statuts réels, le MRR EUR correspond exactement au montant du seul abonnement actif inséré, la liste filtrée par statut n'inclut jamais un abonnement d'un autre statut, le nom du client est bien joint depuis users, et l'historique ne renvoie que le paiement réellement lié à cet abonnement (jamais un paiement d'un autre abonnement ou d'un autre type). Vérifié en TypeScript strict. Compteur de boutons sans action : 56 → 53. npm run build vert de bout en bout.\n\nCette tâche fait partie d'un lot de reconnexion plus large (tâche #55, ~19 écrans encore fabriqués recensés par l'audit externe du 24 septembre) — traité un écran à la fois, jamais en bloc, pour permettre une vérification réelle de chacun.",
    domaine: "confiance",
  },
  {
    cle: "admin-objectif-indicateurs-reels-plus-cible-direction",
    titre: "AdminObjectif.tsx : 6 indicateurs fabriqués remplacés par un calcul réel, la cible restant une décision de la Direction",
    moteurs: ["workflow"],
    quoi:
      "AdminObjectif.tsx affichait 6 indicateurs 100% fabriqués (CA mensuel, nouveaux inscrits, taux rétention, annonces actives, NPS, temps réponse support) avec une valeur ACTUELLE et une CIBLE toutes deux inventées. Les deux ne se traitent pas pareil : nouveau routeur server/routers/objectifs.ts avec list (calcule l'actuel en direct depuis les données réelles — payments pour le CA mensuel du mois en cours par devise, users pour les nouveaux inscrits, annonces pour les annonces publiées, support_tickets pour le temps de réponse moyen via respondedAt-createdAt — jamais stocké, toujours recalculé) et setCible (adminProcedure, persiste la cible fixée par un agent dans la nouvelle table objectifsPlateforme, NULL tant qu'elle n'a jamais été réglée).\n\nDeux indicateurs de la maquette (taux de rétention, NPS) n'ont aucune méthode de calcul réelle dans le dépôt aujourd'hui : pas de cohortes de réactivation pour la rétention, pas de question 0-10 « recommanderiez-vous » pour un vrai NPS (le système d'avis existant note de 1 à 5, une échelle différente qu'on ne peut pas convertir honnêtement en NPS). Affichés « Non mesuré » plutôt qu'approximés par une autre donnée disponible.",
    pourquoi:
      "Un CA mensuel ou un taux de rétention inventés auraient pu orienter une vraie décision de pilotage — le même risque déjà traité sur ComptaDirigeant.tsx, TableauBordLoueur.tsx et AdminAbonnements.tsx dans ce chantier. Convertir une note sur 5 en un NPS sur une échelle 0-10 aurait été une fabrication déguisée en calcul : plus trompeur qu'une case vide, puisqu'un chiffre présenté comme réel invite à lui faire confiance.",
    ou: ["server/schema.ts", "drizzle/0140_objectifs_plateforme.sql", "server/routers/objectifs.ts", "server/router.ts", "server/engine-registry/perimetres.ts", "client/src/pages/superadmin/AdminObjectif.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/objectifs.test.ts, 6/6) : le CA mensuel reflète exactement le paiement réel du mois en cours, les annonces actives comptent l'annonce publiée insérée, le temps de réponse support calcule un vrai écart en heures depuis un ticket réel avec réponse, taux_retention et nps restent explicitement nonMesure=true avec actuel=null (jamais approximés), et une cible fixée par un admin est bien persistée et relue à l'appel suivant. node scripts/check-migrations.mjs : 139 migrations, ordre cohérent. Compteur de boutons sans action : 53 → 52. npm run build vert de bout en bout.",
    domaine: "confiance",
  },
  {
    cle: "admin-badges-catalogue-reel-plus-comptage-attributions",
    titre: "AdminBadges.tsx : tableau de badges fabriqué remplacé par un vrai catalogue et un vrai comptage d'attributions",
    moteurs: ["payment"],
    quoi:
      "AdminBadges.tsx affichait un tableau BADGES 100% inventé (5 badges avec un nombre d'« attribués » fictif par badge). Recherché un moteur de badges/récompenses/fidélité existant dans le dépôt : aucun (aucune table badges/userBadges, aucun fichier reward/loyalty). Ajout des tables badges et badgeAttributions (drizzle/0141_badges.sql), de server/routers/badges.ts (list, setCriteres, titulaires) et de seedBadgesCatalogue() (idempotent, appelé au démarrage comme seedStructure) qui déclare le même catalogue de 5 badges que la maquette, mais comme un vrai catalogue plutôt que des chiffres inventés à chaque rendu.\n\nLes critères d'attribution mélangent des seuils hétérogènes d'un badge à l'autre (comptage de ventes, moyenne de notes, statut KYC, certification atelier) : les coder en une règle numérique unique aurait exigé d'inventer des seuils que la Direction n'a jamais fixés. Le critère reste donc un texte modifiable par un admin (setCriteres), et l'attribution effective (badgeAttributions) reste manuelle pour l'instant — documenté explicitement en tête de badges.ts comme une limite de portée volontaire, aucun moteur d'évaluation automatique n'existe encore. Le nombre « attribués » commence donc honnêtement à 0 pour tous les badges tant qu'aucune attribution réelle n'est enregistrée.\n\nBug réel trouvé et corrigé pendant la vérification : la première version de list comptait les attributions via une sous-requête corrélée écrite en SQL brut (sql`(select count(*) from badge_attributions where badge_id = ${badges.id})`). badge_attributions possède elle-même une colonne id — Postgres résolvait donc le \"id\" non qualifié à l'intérieur de la sous-requête sur la colonne badge_attributions.id (une colonne réelle de la table interne), jamais sur badges.id de la requête externe, si bien que la comparaison badge_id = id ne correspondait jamais et le comptage retournait toujours 0, silencieusement, sans aucune erreur. Remplacé par un leftJoin + groupBy(badges.id), où drizzle qualifie explicitement chaque colonne (\"badges\".\"id\" / \"badge_attributions\".\"badge_id\"), ce qui élimine l'ambiguïté à la source plutôt que de la contourner par une réécriture manuelle du SQL brut.",
    pourquoi:
      "Un nombre de titulaires par badge inventé aurait pu être lu comme une vraie mesure d'engagement ou de qualité de la plateforme — le même risque déjà traité sur ComptaDirigeant.tsx, AdminAbonnements.tsx et AdminObjectif.tsx dans ce chantier. Construire un moteur d'évaluation automatique des critères sans seuils réels validés par la Direction aurait remplacé une fabrication visible (un tableau statique) par une fabrication invisible (un badge \"réel\" mais attribué selon un seuil deviné) — plus trompeur, pas moins.",
    ou: ["server/schema.ts", "drizzle/0141_badges.sql", "server/routers/badges.ts", "server/index.ts", "server/router.ts", "server/engine-registry/perimetres.ts", "client/src/pages/superadmin/AdminBadges.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/badges.test.ts, 8/8) : seedBadgesCatalogue crée exactement les 5 badges au premier appel puis 0 au second (idempotent), list renvoie attribues=0 tant qu'aucune attribution n'existe, une vraie attribution insérée fait passer ce badge précis à 1 sans affecter les autres (le bug de comptage corrélé aurait fait échouer cette assertion précise, ce qui l'a effectivement révélé), setCriteres persiste et est relu, et titulaires ne renvoie que les attributions du badge demandé, jointes au bon nom d'utilisateur. node scripts/check-migrations.mjs : 140 migrations, ordre cohérent. Compteur de boutons sans action : 52 → 51. npm run build vert de bout en bout.\n\nLeçon générale : une sous-requête corrélée en SQL brut référençant une colonne externe par son seul nom (sans qualifier la table) est dangereuse dès que la table interne possède une colonne du même nom — l'échec est silencieux (0 résultat, jamais une erreur), donc une simple exécution qui ne lève pas d'erreur ne suffit pas à prouver qu'un comptage est juste ; il faut vérifier une valeur non nulle attendue, pas seulement l'absence de crash. Cette tâche fait partie du même lot de reconnexion (tâche #55) que AdminAbonnements.tsx et AdminObjectif.tsx — traité un écran à la fois.",
    domaine: "confiance",
  },
  {
    cle: "admin-utilisateurs-suspension-reelle-plus-revocation-immediate",
    titre: "AdminUtilisateurs.tsx : suspension de compte réelle (tâche #51) avec révocation immédiate, pas seulement à la prochaine connexion",
    moteurs: ["workflow"],
    quoi:
      "AdminUtilisateurs.tsx affichait 8 comptes 100% fabriqués (USERS en dur) avec des actions Suspendre/Réactiver/Supprimer/Modifier/Contacter qui ne mutaient qu'un tableau React local — aucune n'atteignait la base. userStatusEnum (active/suspended/deleted) était déclaré dans le schéma depuis longtemps mais jamais posé sur une colonne : la tâche #51 (« aucune capacité de suspension n'existe ») était donc exacte.\n\nAjout de users.status (drizzle/0142_user_status.sql) et de admin.suspendUser/reactivateUser (server/routers/admin.ts), avec la même hiérarchie que la suppression de compte déjà existante (extraite dans assertPeutModererCible, réutilisée par les deux) : un Directeur (admin) ne peut pas agir sur le PDG, un autre admin, ou un compte professionnel.\n\nLe point critique : un jeton JWT dure 30 jours (server/auth.ts). Une suspension qui ne serait vérifiée qu'à la connexion laisserait un compte déjà connecté totalement fonctionnel jusqu'à l'expiration de son jeton — une suspension qui ne suspend rien pendant un mois. Corrigé en revérifiant le statut à CHAQUE requête authentifiée : server/trpc.ts createContext (déjà appelé par createExpressMiddleware à chaque appel tRPC) interroge maintenant users.status après avoir décodé le jeton, et ne peuple ctx.user que si status='active' — un jeton suspendu redevient un jeton anonyme dès la requête suivante, sans toucher aux 5 middlewares de rôle (requireAuth/requireAdmin/requireDirection/requirePro/requirePdg) qui restent inchangés. login/googleLogin (server/routers/auth.ts) rejettent aussi explicitement un compte suspendu, pour un message clair plutôt qu'un jeton émis puis immédiatement invalidé.\n\n« Supprimer le compte » n'a jamais reçu de nouvelle procédure : branché sur admin.requestUserDeletion, le moteur employé-demande/direction-approuve déjà existant (jamais dupliqué). « Contacter » crée une vraie notification in-app (table notifications déjà existante, type='systeme') au lieu d'un \"Message envoyé !\" simulé. « Modifier le profil » persiste réellement nom/téléphone/adresse/ville/code postal (jamais l'email, identifiant de connexion). admin.usersList a été enrichi (recherche, filtre par statut, vraie dernière connexion lue depuis auditLogs, vrai nombre d'annonces) sans changer sa forme de retour (toujours un tableau), pour ne pas casser Admin.tsx qui le consomme déjà. « achats » a été retiré du profil plutôt qu'inventé : aucune notion d'achat de véhicule n'existe dans ce dépôt (une annonce n'a qu'un propriétaire/vendeur, jamais un acheteur enregistré).",
    pourquoi:
      "Une suspension qui ne coupe l'accès qu'à la prochaine connexion volontaire n'est pas une suspension pour un compte déjà ouvert — exactement le scénario où elle sert le plus (fraude en cours, compte compromis). Réutiliser le moteur de suppression existant plutôt que d'en écrire un second évite une divergence entre deux systèmes qui géreraient le même compte différemment.",
    ou: ["server/schema.ts", "drizzle/0142_user_status.sql", "server/trpc.ts", "server/routers/auth.ts", "server/routers/admin.ts", "client/src/pages/superadmin/AdminUtilisateurs.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/admin-user-status.test.ts, 11/11) : suspendUser pose bien status='suspended', login rejette ensuite ce compte avec un message explicite, et surtout — la vérification la plus importante — un jeton JWT signé AVANT la suspension perd l'accès dès l'appel suivant à createContext (pas seulement à la prochaine tentative de connexion), redevient valide après reactivateUser, la hiérarchie bloque un employé sur un compte professionnel mais autorise le PDG, l'auto-suspension et la double suspension sont rejetées proprement, contactUser insère une vraie notification lisible par le destinataire, et updateUserProfile persiste bien les champs modifiés. Suite de régression rejouée sans modification (abonnements-admin 6/6, objectifs 6/6, badges 8/8, reservations-request-location 2/2, rental-contracts-loueur-stats 5/5) pour vérifier que rendre createContext asynchrone (nécessaire pour l'appel base de données) ne casse aucun appelant existant — correction faite en cours de route : Context = ReturnType<typeof createContext> devait devenir Awaited<ReturnType<...>>, sans quoi tRPC recevait un type Promise et une quarantaine de fichiers cessaient de typechecker. node scripts/check-migrations.mjs : 141 migrations, ordre cohérent. Compteur de boutons sans action : 51 → 50. npm run build vert de bout en bout.\n\nCette tâche ferme la tâche #51 et avance la tâche #55 ; restent AdminStatistiques.tsx et AdminPaiements.tsx (ce dernier avec l'avertissement de l'audit externe sur les identifiants de paiement de démonstration à ne jamais réutiliser).",
    domaine: "confiance",
  },
  {
    cle: "admin-statistiques-indicateurs-reels-conversion-non-mesuree",
    titre: "AdminStatistiques.tsx : 6 indicateurs fabriqués remplacés par un calcul réel avec variation mensuelle, taux de conversion honnêtement non mesuré",
    moteurs: ["analytics"],
    quoi:
      "AdminStatistiques.tsx affichait 6 indicateurs 100% fabriqués (CA, nouveaux inscrits, annonces, taux de conversion, panier moyen, taux de désabonnement), chacun avec une variation ET un détail inventés (jusqu'à un motif de désabonnement chiffré : « prix trop élevé (38%) » sans aucune source). Nouveau server/routers/statistiques.ts (moteur analytics — la route /superadmin/admin-statistiques était déclarée sous le moteur monitoring, qui ne la servait pas réellement : monitoring-os couvre la santé technique de la plateforme, pas ces indicateurs métier, donc la route a été déplacée vers analytics, qui héberge déjà routers/historique.ts) avec une seule procédure globales calculant en direct : CA du mois en cours par devise (jamais fusionné par un taux de change deviné) avec sa vraie variation vs le mois précédent, nouveaux inscrits (+ répartition particuliers/pros réelle), annonces publiées (statut publiee/vendue/louee, + répartition vente/location réelle), panier moyen (moyenne réelle des paiements payés en EUR).\n\nDeux indicateurs de la maquette n'ont pas de source réelle équivalente : le taux de conversion (visites → contact) n'a aucune donnée, ce dépôt ne trace aucune visite ni session côté serveur — affiché « Non mesuré » plutôt qu'approximé. Le taux de désabonnement, lui, a une vraie source (subscriptions.status='cancelled' + updatedAt, mis à jour précisément à l'annulation par stripeWebhook.ts, jamais à un autre moment) mais seulement un calcul approximatif du churn (annulés ce mois / (actifs + annulés)), pas un vrai churn par cohorte — affiché comme tel, étiqueté « approx. », avec les deux chiffres bruts visibles plutôt qu'un pourcentage présenté comme définitif.",
    pourquoi:
      "Un motif de désabonnement chiffré à 38% sans aucune enquête client réelle est le type de fabrication le plus trompeur de ce chantier : il a l'apparence d'une étude alors qu'il n'existe nulle part. Convertir un taux de conversion en un chiffre \"plausible\" aurait été pire qu'une case vide, puisqu'un nombre présenté comme réel invite la Direction à agir dessus.",
    ou: ["server/routers/statistiques.ts", "server/router.ts", "server/engine-registry/perimetres.ts", "client/src/pages/superadmin/AdminStatistiques.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/statistiques.test.ts, 8/8) : le CA reflète le paiement réel du mois, les nouveaux inscrits et leur répartition particulier/pro comptent le compte réel inséré, les annonces publiées et leur répartition vente/location comptent l'annonce réelle insérée, le panier moyen reflète un vrai montant non nul, tauxConversion.nonMesure reste true, et le taux de désabonnement compte le vrai abonnement actif inséré. node scripts/check-migrations.mjs : 141 migrations, ordre cohérent (aucune migration nécessaire, aucune nouvelle table). Compteur de boutons sans action : 50 → 49. npm run build vert de bout en bout.\n\nCette tâche avance la tâche #55 ; reste AdminPaiements.tsx (avec l'avertissement de l'audit externe sur les identifiants de paiement de démonstration à ne jamais réutiliser).",
    domaine: "confiance",
  },
  {
    cle: "admin-paiements-liste-reelle-relance-par-notification",
    titre: "AdminPaiements.tsx : liste et stats réelles, relance d'un paiement échoué par notification (jamais un identifiant de démonstration réutilisé)",
    moteurs: ["payment"],
    quoi:
      "AdminPaiements.tsx affichait une liste de 6 paiements 100% fabriqués (références « PAY-20250609-001 » inventées), des stats CA jour/mois fictives, et un bouton « Relancer » sans aucune action. L'audit externe du 24 septembre (docs/audits/2026-09-24-captures-plateforme.md) signalait un risque précis sur cet écran : ne jamais construire une relance qui réutiliserait les identifiants de paiement de démonstration affichés.\n\nadmin.paymentsList a été enrichi (jointure users pour le vrai nom/email du client, filtre par statut réel) et admin.paymentsStats ajouté (CA du jour/du mois en EUR, échoués, en attente — tous des comptages réels sur la table payments déjà alimentée par stripeWebhook.ts). La référence affichée par transaction est soit le vrai stripePaymentIntentId, soit l'id interne réel du paiement (PAY-<id>) — jamais une référence inventée au format demandé par l'audit.\n\n« Relancer » (admin.relancerPaiement) a délibérément évité de recréer une session Stripe à partir des données d'un paiement passé : les métadonnées d'origine (kind, produit, chemins de succès/annulation) ne sont pas conservées sur la ligne payments, les reconstituer aurait exigé de deviner — exactement le risque signalé par l'audit. À la place, une vraie notification in-app est envoyée au client (moteur notifications existant, réutilisé comme pour AdminUtilisateurs.tsx), l'invitant à relancer lui-même son paiement depuis son espace. Seul un paiement au statut réel 'failed' peut être relancé (vérifié serveur, pas seulement caché côté écran).\n\nL'audit Payment OS et le registre produits & tarifs déjà présents sur cet écran (trpc.paymentEngine.audit/productsAll/seedProducts) étaient déjà réels et n'ont pas été touchés.",
    pourquoi:
      "Une référence de paiement affichée comme 'PAY-20250609-001' aurait pu être confondue avec un vrai identifiant Stripe consultable côté support — le risque exact signalé par l'audit externe. Recréer une session de paiement à partir de métadonnées reconstituées aurait pu facturer le mauvais montant ou le mauvais produit ; une notification qui renvoie le client vers son propre parcours de paiement ne peut pas se tromper de produit puisqu'elle ne recrée aucune transaction.",
    ou: ["server/routers/admin.ts", "client/src/pages/superadmin/AdminPaiements.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/admin-payments.test.ts, 7/7) : paymentsList joint le vrai nom du client et le vrai montant/statut, le filtre par statut n'inclut jamais un autre statut, paymentsStats.caMoisEur et .echoues reflètent les paiements réels insérés, relancerPaiement insère une vraie notification lisible par le client, et refuse explicitement de relancer un paiement déjà réussi. Suite de régression rejouée sans modification (abonnements-admin 6/6, objectifs 6/6, badges 8/8, admin-user-status 11/11, statistiques 8/8). node scripts/check-migrations.mjs : 141 migrations, ordre cohérent (aucune nouvelle table). Compteur de boutons sans action : 49 → 48. npm run build vert de bout en bout.\n\nCette tâche ferme la tâche #55 (superadmin) après AdminAbonnements.tsx (#443), AdminObjectif.tsx (#444), AdminBadges.tsx (#445), AdminUtilisateurs.tsx (#447) et AdminStatistiques.tsx (#448) — chaque écran traité un à la fois, jamais en bloc, pour permettre une vérification réelle de chacun.\n\nNouvelle tâche identifiée en cours de route (pas corrigée ici, hors périmètre de cet écran) : le composant partagé client/src/components/DocumentPDF.tsx (buildFactureData) fabrique toujours une adresse client (« Adresse client ») et un email deviné à partir du nom affiché, quel que soit l'appelant — un problème du composant partagé, utilisé par une quinzaine d'écrans, pas spécifique à AdminPaiements.tsx.",
    domaine: "confiance",
  },
  {
    cle: "waitlist-inscription-position-reelle-disponibilite-non-fabriquee",
    titre: "ListeAttente.tsx : moteur de liste d'attente réel (position calculée en direct), aucune transition automatique fabriquée faute de moteur de disponibilité",
    moteurs: ["location"],
    quoi:
      "ListeAttente.tsx (tâche #63, « aucun [moteur de liste d'attente] n'existe ») affichait 3 entrées 100% fabriquées, dont une avec un faux statut « disponible » prêt à réserver. Aucune page de l'application ne permettait même de rejoindre une liste d'attente : la page était orpheline, sans point d'entrée réel nulle part dans le dépôt (vérifié : aucune référence à « M'avertir » ni à /louer/liste-attente ailleurs que dans son propre routage).\n\nAjout de la table waitlistEntries (userId, annonceId, status en_attente/annule, createdAt) et de server/routers/waitlist.ts (join/list/cancel). La position affichée n'est jamais stockée ni devinée : recalculée à chaque lecture comme le rang réel parmi les inscriptions en_attente antérieures sur la même annonce, donc toujours exacte même après une annulation d'un rang précédent. join refuse une annonce qui n'est pas de type location, refuse le propriétaire de l'annonce, et refuse une double inscription active.\n\nUn vrai point d'entrée a été ajouté sur ProduitLocation.tsx (fiche véhicule de location) : bouton « Rejoindre la liste d'attente pour ce véhicule » appelant waitlist.join, avec redirection vers la connexion si nécessaire — le même motif que ReserverLocationButton.\n\nLe statut « disponible » de la maquette d'origine n'a délibérément pas d'équivalent réel : recherche exhaustive dans server/ confirmant qu'aucun code ne marque jamais une annonce de location comme 'louee' (l'enum existe, la valeur n'est écrite nulle part) — il n'existe donc aucun moteur de verrou de disponibilité/calendrier (tâches #44 paiement location, #56 réservation flotte) et par conséquent aucun signal réel de « ce véhicule vient de se libérer » à observer. Plutôt que d'inventer une transition automatique ou un faux bouton de réservation instantanée, ce statut a été retiré de l'écran : seuls « en_attente » et « annulé », tous deux réels, sont affichés.",
    pourquoi:
      "Un statut « disponible » avec un bouton de réservation immédiate, alors qu'aucun mécanisme ne détecte jamais réellement qu'un véhicule s'est libéré, aurait pu laisser un client croire qu'il peut réserver instantanément un véhicule dont la disponibilité n'a en réalité jamais été vérifiée — un risque de confiance direct sur une promesse commerciale (« premier arrivé, premier servi »). Une page de liste d'attente qu'aucun autre écran ne permet de rejoindre n'est pas un moteur, c'est une vitrine : le vrai point d'entrée sur ProduitLocation.tsx était nécessaire pour que la fonctionnalité existe réellement, pas seulement sa page de consultation.",
    ou: ["server/schema.ts", "drizzle/0143_waitlist.sql", "server/routers/waitlist.ts", "server/router.ts", "server/engine-registry/perimetres.ts", "client/src/pages/ListeAttente.tsx", "client/src/pages/ProduitLocation.tsx"],
    lecon:
      "Vérifié directement contre la base réelle (server/routers/__tests__/waitlist.test.ts, 9/9) : join refuse une annonce de vente, refuse le propriétaire sur sa propre annonce, refuse une double inscription ; deux inscriptions réelles sur la même annonce obtiennent les positions 1 et 2 dans l'ordre réel d'inscription (pas devinées) ; après annulation de la première, la seconde repasse réellement en position 1 (preuve que la position est recalculée, pas mise en cache) ; une inscription annulée ne peut pas être annulée une seconde fois. Suite de régression rejouée sans modification (abonnements-admin 6/6, objectifs 6/6, badges 8/8, admin-user-status 11/11, statistiques 8/8, admin-payments 7/7). node scripts/check-migrations.mjs : 142 migrations, ordre cohérent. Compteur de boutons sans action : 49 → 48. npm run build vert de bout en bout.\n\nFerme la tâche #63. Le statut « disponible » et la notification automatique promise par le texte d'aide de la page restent hors de portée tant que les tâches #44/#56 (verrou de disponibilité réel pour la location) ne sont pas construites — documenté explicitement dans le code plutôt que fabriqué.",
    domaine: "confiance",
  },
  {
    cle: "controlcenter-carte-propositions-cible-corrigee",
    titre: "Système Intelligent MKA.P-MS : la carte « Propositions » du Rapport quotidien pointait vers un système de validation sans rapport avec ce qu'elle comptait",
    moteurs: ["monitoring"],
    quoi:
      "Signalé par le PDG avec captures d'écran : sur l'onglet « Rapport quotidien » du Centre de contrôle (ControlCenter.tsx), la carte « Propositions » affiche un nombre (ex. 2) calculé depuis buildDailyReport() (server/smart-engine/services/daily-report.ts) — une liste de suggestions textuelles dérivées à la volée des vrais problèmes détectés (boutons cassés, catégories qualité faibles, recherches sans résultat), sans identifiant ni statut, jamais destinées à être « validées » individuellement. Ces mêmes suggestions sont déjà affichées plus bas sur CE MÊME onglet, dans la section « Propositions d'amélioration ».\n\nOr la carte redirigeait (onNavigate(\"optimisation\")) vers l'onglet « Évolution autonome », un système totalement différent et déjà réel (table smart_staging, cycle brouillon → à_valider → approuvé/rejeté, décision PDG via reviewEvolution) dont le compte de propositions n'a aucun rapport avec celui affiché sur la carte. Résultat exactement décrit par le PDG : ouvrir la carte « 2 propositions » amène sur un écran dont les chiffres ne correspondent pas, valider une proposition dans cet autre écran ne fait jamais bouger le « 2 » d'origine (deux compteurs indépendants), donnant l'impression qu'une tâche validée « n'est jamais faite ».\n\nCorrigé en changeant la cible du clic : la carte fait maintenant défiler la page jusqu'à la section « Propositions d'amélioration » du même onglet (le même contenu que celui compté), au lieu de sauter vers un système de décision distinct dont les nombres ne coïncideront jamais.",
    pourquoi:
      "Un compteur qui renvoie vers un écran dont le nombre ne correspond jamais à celui affiché — et où une action réelle (valider une proposition) n'a aucun effet visible sur le compteur d'origine — a l'apparence d'un bug de persistance (« la tâche n'est pas faite ») alors que ce sont deux systèmes distincts qui n'ont jamais été censés se répondre. Rediriger vers le contenu réellement compté était la seule correction qui n'invente ni ne supprime aucune des deux fonctionnalités réelles.",
    ou: ["client/src/pages/SmartEngine/ControlCenter.tsx"],
    lecon:
      "Vérifié par lecture directe des deux sources de données (server/smart-engine/services/daily-report.ts pour les suggestions dérivées, server/smart-engine/services/preproduction.ts pour smart_staging/evolutionProposals) : confirmé qu'aucun champ commun ne relie les deux, et que listStaging() ne filtre jamais par statut (une proposition validée reste visible avec son nouveau statut, par conception — « rien ne disparaît après validation », déjà documenté dans le code depuis une correction du 18/09 sur les faux « intégré »). npx tsc --noEmit : aucune erreur nouvelle (44 pré-existantes, inchangées). npm run build vert de bout en bout. Aucune migration, aucun inventaire à régénérer (le gestionnaire de clic existait déjà sur cette carte, seule sa destination change).\n\nLeçon générale : un compteur affiché à un endroit et une action de validation exposée ailleurs doivent partager la même source de vérité, sinon la Direction ne peut pas distinguer une vraie régression d'une simple confusion de navigation entre deux systèmes réels.",
    domaine: "confiance",
  },
];

/**
 * Écrit dans la mémoire technique les livraisons encore inconnues et retient
 * leur leçon. Idempotent : une clé déjà active n'est pas réécrite, pour ne pas
 * déclasser le souvenir en historique à chaque redémarrage.
 */
export async function seedLivraisons(): Promise<{ nouvelles: number; total: number }> {
  let nouvelles = 0;
  for (const l of LIVRAISONS) {
    const cle = `livraison:${l.cle}`;
    const [existant] = await db
      .select({ id: inMemoire.id })
      .from(inMemoire)
      .where(and(eq(inMemoire.categorie, "technique"), eq(inMemoire.cle, cle), eq(inMemoire.cycle, "actif")))
      .limit(1);
    if (existant) continue;

    await ecrire({
      categorie: "technique",
      cle,
      titre: `Livraison — ${l.titre}`,
      contenu: [
        `Moteurs : ${l.moteurs.join(", ")}.`,
        `Quoi : ${l.quoi}`,
        `Pourquoi : ${l.pourquoi}`,
        `Où : ${l.ou.join(", ")}.`,
        `Leçon : ${l.lecon}`,
      ].join("\n"),
      liens: { livraison: l.cle, moteurs: l.moteurs.join(",") },
      source: "livraisons",
    });
    await retenir({
      domaine: l.domaine,
      probleme: l.pourquoi,
      diagnostic: l.lecon,
      solution: l.quoi,
      resultat: "livre",
    });
    nouvelles++;
  }
  return { nouvelles, total: LIVRAISONS.length };
}
