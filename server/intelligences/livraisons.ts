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
