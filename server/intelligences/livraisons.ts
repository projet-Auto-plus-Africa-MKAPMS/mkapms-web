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
