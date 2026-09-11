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
