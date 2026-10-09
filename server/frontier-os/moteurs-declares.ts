/**
 * Registre étendu des moteurs déclarés du Centre (demande du PDG, 9 octobre 2026, migration 0005) : au moins 100
 * moteurs internes propres au Centre dès le démarrage, au moins 40 par ensemble de connecteur entre deux
 * plateformes (Connecteur A, Connecteur B), des moteurs de réserve désactivés, des emplacements vides pour les
 * futures plateformes. Tous posés `kind: "declared"`, `origin: "center"`, `declaredOnly: true`, `running: false` :
 * DÉCLARÉS, PRÉPARÉS, JAMAIS actifs par défaut. Un moteur devient réellement actif seulement si le PDG actionne
 * son interrupteur manuel (quand `manualSwitch` est vrai) — jamais automatiquement, jamais au démarrage.
 *
 * N'écrit RIEN de nouveau dans les moteurs de chaîne de commande déjà posés (moteurs-internes.ts, fondation.ts) :
 * ce fichier ajoute une couche d'inventaire déclaratif à côté, dans la MÊME table `engines` (jamais une seconde
 * vérité). Le journal des changements d'état d'un moteur déclaré se fait via `config_history` (configHistory.ts /
 * journal.ts), comme pour tout le reste du centre — pas de nouvelle table de journal.
 */
import { dbFrontier, type BaseFrontier } from "./base/connexion.js";
import { engines, rooms, type EtatMoteurCentre } from "./base/schema.js";

// ───────────────────────── Salles (codes stables, cohérents avec CentreCyberElectrique.tsx) ─────────────────────────
export const SALLE_TRAVAIL = "travail-dialogue-controle";
export const SALLE_CONTROLE_CENTRALE = "controle-centrale";
export const SALLE_SURVEILLANCE = "surveillance-externe";
export const SALLE_MOTEURS_COMPLETS = "moteurs-complets";
export const SALLE_OUTILS = "outils-travail";
export const SALLE_REUNION = "salle-reunion";
export const SALLE_CONNECTEUR_INTERVENTION = "connecteur-intervention";
// Salles déjà existantes et réutilisées comme emplacement de connecteur (jamais redéfinies ici) :
export const SALLE_CONNEXIONS_EXISTANTE = "connexions";
export const SALLE_BOUTIQUES_EXISTANTE = "boutiques";

export const NOUVELLES_SALLES = [
  { code: SALLE_TRAVAIL, name: "Travail, dialogue et contrôle", description: "Chat, Contrôle, Travail, Cyberdéfense (inactif), Cyberattaques (inactif).", securityLevel: 3 },
  { code: SALLE_CONTROLE_CENTRALE, name: "Contrôle centrale", description: "Vue globale mesurée : moteurs actifs/arrêtés, connecteurs préparés, erreurs, alertes.", securityLevel: 2 },
  { code: SALLE_SURVEILLANCE, name: "Surveillance externe", description: "Ce qui est réellement observable autour du centre — jamais une suspicion inventée.", securityLevel: 3 },
  { code: SALLE_MOTEURS_COMPLETS, name: "Salle complète des moteurs", description: "Tous les moteurs, leur état, leur mémoire, leurs réparations et extensions possibles.", securityLevel: 2 },
  { code: SALLE_OUTILS, name: "Outils de travail", description: "Emplacements extensibles pour les outils de réparation, audit, lecture, comparaison, documentation.", securityLevel: 2 },
  { code: SALLE_REUNION, name: "Salle de réunion (future)", description: "Écrans multiples, espace réunion, appel vidéo et diffusion futurs — aucun service externe actif.", securityLevel: 1 },
  { code: SALLE_CONNECTEUR_INTERVENTION, name: "Connecteur principal d'intervention", description: "Grand connecteur préparé pour la plateforme principale — jamais connecté sans l'interrupteur du PDG.", securityLevel: 5 },
] as const;

// ───────────────────────── Ensembles de connecteurs (codes stables) ─────────────────────────
export const CONNECTEUR_A = "connecteur-a";
export const CONNECTEUR_B = "connecteur-b";
export const SHOP_WOOCOMMERCE = "shop-woocommerce";
export const SHOP_TRANSPORTEURS = "shop-transporteurs";
export const SHOP_PAIEMENT = "shop-paiement";
export const SHOP_IA_BOUTIQUE = "shop-ia-boutique";
export const SHOP_AUTRES = "shop-autres";

export const ENSEMBLES_CONNECTEURS = [CONNECTEUR_A, CONNECTEUR_B, SHOP_WOOCOMMERCE, SHOP_TRANSPORTEURS, SHOP_PAIEMENT, SHOP_IA_BOUTIQUE, SHOP_AUTRES] as const;

export interface DeclarationMoteur {
  code: string;
  nom: string;
  fonction: string;
  roomCode: string;
  connectorSet: string | null;
  etat: EtatMoteurCentre;
  manualSwitch: boolean;
}

/** Fabrique une famille de moteurs déclarés à partir d'un préfixe de code et de triplets [suffixe, nom, fonction]. */
function famille(
  prefixe: string,
  roomCode: string,
  items: ReadonlyArray<readonly [string, string, string]>,
  options: Partial<Pick<DeclarationMoteur, "connectorSet" | "etat" | "manualSwitch">> = {},
): DeclarationMoteur[] {
  return items.map(([suffixe, nom, fonction]) => ({
    code: `centre:declare.${prefixe}.${suffixe}`,
    nom,
    fonction,
    roomCode,
    connectorSet: options.connectorSet ?? null,
    etat: options.etat ?? "vide",
    manualSwitch: options.manualSwitch ?? false,
  }));
}

/** Emplacements de réserve génériques, numérotés — même principe que les lignes de réserve « À venir » (regles.ts). */
function reserves(prefixe: string, roomCode: string, n: number, options: Partial<Pick<DeclarationMoteur, "connectorSet">> = {}): DeclarationMoteur[] {
  return Array.from({ length: n }, (_, i) => ({
    code: `centre:declare.reserve.${prefixe}.${i + 1}`,
    nom: `Emplacement de réserve ${prefixe} n°${i + 1}`,
    fonction: "Emplacement vide, préparé pour une extension future — aucune fonction tant qu'il n'est pas assigné par une décision explicite.",
    roomCode,
    connectorSet: options.connectorSet ?? null,
    etat: "vide" as const,
    manualSwitch: false,
  }));
}

// ───────────────────────── Salle 1 — Travail, dialogue, contrôle (31) ─────────────────────────
const CHAT = famille("chat", SALLE_TRAVAIL, [
  ["intake", "Réception du message", "Reçoit un message du PDG et le place dans le fil de la salle Chat — jamais une action, seulement de la lecture et du dialogue."],
  ["contexte", "Contexte de conversation", "Retrouve le contexte déjà connu (mémoire du centre) pertinent à la question posée."],
  ["historique", "Historique du dialogue", "Conserve l'historique des échanges Chat, distinct du fil Travail."],
  ["suggestion", "Suggestion de pistes", "Propose des pistes ou des plans à discuter, sans jamais les exécuter depuis le Chat."],
  ["secret", "Garde des secrets", "Empêche tout secret (clé, jeton, mot de passe) de transiter par le Chat, quelle que soit la demande."],
]);
const CONTROLE = famille("controle", SALLE_TRAVAIL, [
  ["lecture-etat", "Lecture de l'état du centre", "Lit l'état mesuré du centre (moteurs, connecteurs, incidents) pour l'afficher dans l'onglet Contrôle."],
  ["validation-commande", "Validation d'une commande", "Vérifie qu'une commande demandée depuis cet onglet respecte les règles du centre avant de la transmettre."],
  ["journal", "Journal de contrôle", "Consigne chaque action demandée depuis l'onglet Contrôle, qui l'a demandée et son résultat."],
  ["permissions", "Permissions de contrôle", "Vérifie que seul le PDG (ou un accès explicitement accordé) agit depuis cet onglet."],
  ["alerte", "Alerte de contrôle", "Signale toute incohérence observée pendant une action de contrôle."],
]);
const TRAVAIL = famille("travail", SALLE_TRAVAIL, [
  ["file", "File d'attente de travail", "Place les tâches de travail en file, dans l'ordre reçu."],
  ["execution", "Exécution de la tâche", "Exécute une tâche de travail déjà validée, avec les outils actifs seulement."],
  ["resultat", "Résultat de travail", "Rapporte le résultat réel d'une tâche, sans jamais affirmer un succès non vérifié."],
  ["reprise", "Reprise après échec", "Reprend une tâche interrompue sans la dupliquer ni la relancer en boucle."],
  ["rapport", "Rapport de travail", "Produit un compte rendu honnête de ce qui a été fait, bloqué ou refusé."],
]);
const CYBERDEFENSE = famille("cyberdefense", SALLE_TRAVAIL, [
  ["perimetre", "Périmètre de défense", "Emplacement préparé pour délimiter ce que la cyberdéfense surveillerait un jour. Aucune surveillance réelle n'est armée."],
  ["detection", "Détection d'intrusion", "Emplacement préparé pour une détection d'intrusion future. Aucune détection réelle n'est active."],
  ["reponse", "Réponse à incident", "Emplacement préparé pour une réponse à incident future. Aucune réponse automatique n'existe."],
  ["isolation", "Isolation d'urgence", "Emplacement préparé pour une isolation d'urgence future. Rien n'isole quoi que ce soit aujourd'hui."],
  ["journal-menaces", "Journal des menaces", "Emplacement préparé pour un futur journal des menaces. Aucune menace n'est aujourd'hui enregistrée ici."],
  ["regles", "Règles de défense", "Emplacement préparé pour de futures règles de défense. Aucune règle n'est aujourd'hui appliquée."],
  ["alerte", "Alerte de défense", "Emplacement préparé pour une alerte de défense future. Aucune alerte réelle n'est émise par ce moteur."],
  ["rapport", "Rapport de défense", "Emplacement préparé pour un futur rapport de défense. Rien n'est aujourd'hui produit."],
], { etat: "vide" });
const CYBERATTAQUES = famille("cyberattaques", SALLE_TRAVAIL, [
  ["reconnaissance", "Reconnaissance", "Emplacement préparé. Aucune reconnaissance réelle n'est effectuée : ni outil, ni cible, ni exécution."],
  ["simulation", "Essai simulé", "Emplacement préparé pour un futur essai strictement simulé, sur périmètre autorisé seulement. Rien n'est implémenté."],
  ["rapport", "Rapport d'essai", "Emplacement préparé pour un futur rapport d'essai. Aucun essai n'a jamais eu lieu."],
  ["cible", "Registre des cibles autorisées", "Emplacement préparé. Aucune cible n'est enregistrée : une cyberattaque réelle ne sera jamais armée sans engagement écrit et autorisé."],
  ["autorisation", "Autorisation requise", "Emplacement préparé pour une future vérification d'autorisation explicite. Verrouillé : aucune autorisation ne peut encore être donnée ici."],
  ["journal", "Journal des essais", "Emplacement préparé pour un futur journal des essais. Vide aujourd'hui."],
  ["limite", "Limites imposées", "Emplacement préparé pour rappeler les limites (jamais hors périmètre autorisé, jamais sans engagement écrit). Aucune limite n'a encore à être appliquée : rien n'est actif."],
  ["arret", "Arrêt d'urgence", "Emplacement préparé pour un futur arrêt d'urgence. Sans fonction réelle tant qu'aucun essai n'existe."],
], { etat: "vide" });

// ───────────────────────── Salle 2 — Contrôle centrale (10) ─────────────────────────
const CONTROLE_CENTRALE = famille("centrale", SALLE_CONTROLE_CENTRALE, [
  ["moteurs-actifs", "Compteur des moteurs actifs", "Compte, par mesure réelle (running=true), les moteurs actuellement actifs du centre."],
  ["moteurs-arretes", "Compteur des moteurs arrêtés", "Compte les moteurs déclarés mais arrêtés ou jamais démarrés."],
  ["connecteurs-prepares", "Compteur des connecteurs préparés", "Compte les ensembles de connecteurs déclarés et leur état (préparé, non connecté)."],
  ["erreurs", "Agrégateur d'erreurs", "Rassemble les moteurs à l'état « erreur », jamais inventé."],
  ["alertes", "Agrégateur d'alertes", "Rassemble les alertes réelles levées par les autres moteurs du centre."],
  ["etat-general", "État général du centre", "Calcule un état général (normal, surveillance, alerte) à partir des mesures réelles ci-dessus, jamais par défaut."],
  ["compteur-salles", "Compteur des salles", "Compte les salles du centre et leur état d'alarme respectif."],
  ["compteur-incidents", "Compteur d'incidents", "Compte les incidents ouverts, en diagnostic et résolus."],
  ["compteur-connecteurs", "Compteur global des connecteurs", "Compte, par ensemble, le nombre de moteurs déclarés et actifs."],
  ["horodatage", "Horodatage du relevé", "Date et heure du dernier relevé réel affiché dans cette salle — jamais une valeur figée."],
]);

// ───────────────────────── Salle 3 — Surveillance externe (8), observable uniquement ─────────────────────────
const SURVEILLANCE = famille("surveillance", SALLE_SURVEILLANCE, [
  ["acces-observes", "Accès observés", "Lit le journal d'audit réel du centre (audit_log) pour compter les accès constatés — jamais une estimation."],
  ["scans-detectes", "Scans détectés", "Signale un scan seulement s'il est réellement observable dans le journal ; sinon dit « aucun scan observé »."],
  ["anomalies", "Anomalies observées", "Rapporte une anomalie seulement si elle est mesurée (ex. pic réel de tentatives refusées), jamais supposée."],
  ["requetes-rejetees", "Requêtes rejetées", "Compte les requêtes réellement refusées par la gouvernance ou l'authentification du centre."],
  ["limite-debit", "Limite de débit observée", "Rapporte si une limite de débit a été réellement atteinte, sinon le dit explicitement."],
  ["origine", "Origine observée", "Relève l'origine technique réellement journalisée d'un accès, sans jamais déduire une identité non prouvée."],
  ["pattern", "Motif suspect observé", "Signale un motif seulement si des événements réels du journal le montrent, jamais par supposition."],
  ["rapport", "Rapport de surveillance", "Produit un rapport honnête : « rien d'observable » est une réponse valide, jamais remplacée par une invention."],
], { etat: "prepare" });

// ───────────────────────── Salle 4 — Salle complète des moteurs (6, méta) ─────────────────────────
const MOTEURS_COMPLETS = famille("complets", SALLE_MOTEURS_COMPLETS, [
  ["diagnostic-global", "Diagnostic global", "Parcourt tous les moteurs déclarés et mesure leur état réel, salle par salle."],
  ["reparation-proposition", "Proposition de réparation", "Prépare une proposition de réparation pour un moteur en erreur — jamais appliquée automatiquement."],
  ["memoire-enrichissement", "Enrichissement de mémoire", "Prépare l'ajout d'un souvenir utile à la mémoire du centre pour un moteur donné."],
  ["capacite-mesure", "Mesure de capacité", "Mesure réellement (measurements) la capacité d'un moteur quand la mesure existe, sinon le dit."],
  ["extension-slot", "Emplacement d'extension", "Signale qu'un moteur peut recevoir une extension déclarée, sans jamais la créer seul."],
  ["temperature-logique", "Température logique", "Rend une température logique UNIQUEMENT si une mesure réelle existe (charge/latence) ; sinon affiche « non mesurée », jamais une valeur inventée."],
], { etat: "prepare" });

// ───────────────────────── Salle 5 — Outils de travail extensibles (30) ─────────────────────────
const outilsSlots = (famillOutil: string, nom: string): [string, string, string][] =>
  Array.from({ length: 5 }, (_, i) => [`${famillOutil}-${i + 1}`, `${nom} n°${i + 1}`, `Emplacement préparé pour un outil de ${nom.toLowerCase()} — aucun outil n'est encore branché ici.`]);
const OUTILS = [
  ...famille("outil", SALLE_OUTILS, outilsSlots("reparation", "Réparation")),
  ...famille("outil", SALLE_OUTILS, outilsSlots("audit", "Audit")),
  ...famille("outil", SALLE_OUTILS, outilsSlots("lecture", "Lecture")),
  ...famille("outil", SALLE_OUTILS, outilsSlots("comparaison", "Comparaison")),
  ...famille("outil", SALLE_OUTILS, outilsSlots("documentation", "Documentation")),
  ...famille("outil", SALLE_OUTILS, outilsSlots("futur", "Outil futur")),
];

// ───────────────────────── Salle de réunion (future) (5) ─────────────────────────
const REUNION = famille("reunion", SALLE_REUNION, [
  ["ecran-1", "Écran de réunion n°1", "Emplacement préparé pour un premier écran de réunion. Aucun service d'affichage actif."],
  ["ecran-2", "Écran de réunion n°2", "Emplacement préparé pour un second écran de réunion. Aucun service d'affichage actif."],
  ["espace", "Espace de réunion", "Emplacement préparé pour l'organisation d'une réunion future. Aucune réunion n'est aujourd'hui possible depuis ici."],
  ["appel-video", "Appel vidéo (futur)", "Emplacement préparé pour un futur appel vidéo. Aucun service externe n'est connecté."],
  ["diffusion", "Diffusion / TV (future)", "Emplacement préparé pour une future diffusion. Aucun service externe n'est connecté."],
]);

// ───────────────────────── Réserve interne générale (10) + emplacements futures plateformes ─────────────────────────
const RESERVE_INTERNE = reserves("interne", SALLE_MOTEURS_COMPLETS, 10);

export const DECLARATIONS_INTERNES: readonly DeclarationMoteur[] = [
  ...CHAT, ...CONTROLE, ...TRAVAIL, ...CYBERDEFENSE, ...CYBERATTAQUES, // Salle 1 : 31
  ...CONTROLE_CENTRALE, // Salle 2 : 10
  ...SURVEILLANCE, // Salle 3 : 8
  ...MOTEURS_COMPLETS, // Salle 4 : 6
  ...OUTILS, // Salle 5 : 30
  ...REUNION, // Salle réunion : 5
  ...RESERVE_INTERNE, // Réserve : 10
]; // total : 100

// ───────────────────────── Connecteur A — grand connecteur principal d'intervention (≥40) ─────────────────────────
const CONNECTEUR_A_OPTS = { connectorSet: CONNECTEUR_A, etat: "vide" as const };
const LECTURE_ETAT = famille("intervention.lecture", SALLE_CONNECTEUR_INTERVENTION, [
  ["pages", "Lecture des pages", "Lirait l'état déclaré des pages de la plateforme principale — non connecté aujourd'hui."],
  ["images", "Lecture des images", "Lirait l'état déclaré des images/photos de la plateforme — non connecté aujourd'hui."],
  ["produits", "Lecture des produits", "Lirait l'état déclaré du catalogue produits — non connecté aujourd'hui."],
  ["utilisateurs", "Lecture des utilisateurs", "Lirait un état agrégé (jamais de donnée personnelle) des comptes — non connecté aujourd'hui."],
  ["paiements", "Lecture des paiements", "Lirait un état agrégé des paiements — non connecté aujourd'hui."],
  ["ia", "Lecture de l'état IA", "Lirait l'état des moteurs d'intelligence de la plateforme — non connecté aujourd'hui."],
  ["moteurs", "Lecture du registre des moteurs", "Lirait le registre des moteurs de la plateforme principale — non connecté aujourd'hui."],
  ["securite", "Lecture de l'état de sécurité", "Lirait un état de sécurité déclaré — non connecté aujourd'hui."],
], CONNECTEUR_A_OPTS);
const OPTIMISATION = famille("intervention.optim", SALLE_CONNECTEUR_INTERVENTION, [
  ["images", "Optimisation d'images", "Proposerait une optimisation d'image — jamais appliquée sans le PDG, non connecté aujourd'hui."],
  ["pages", "Optimisation de pages", "Proposerait une optimisation de page — jamais appliquée sans le PDG, non connecté aujourd'hui."],
  ["cache", "Optimisation du cache", "Proposerait un réglage de cache — non connecté aujourd'hui."],
  ["base", "Optimisation de base de données", "Proposerait une optimisation de requête — non connecté aujourd'hui."],
  ["requetes", "Optimisation des requêtes", "Proposerait une optimisation d'appel réseau — non connecté aujourd'hui."],
  ["chargement", "Optimisation du chargement", "Proposerait une optimisation de temps de chargement — non connecté aujourd'hui."],
], CONNECTEUR_A_OPTS);
const DEVELOPPEMENT = famille("intervention.dev", SALLE_CONNECTEUR_INTERVENTION, [
  ["proposition", "Proposition de développement", "Préparerait une proposition de développement pour la plateforme — jamais codée ni déployée seule."],
  ["revue", "Revue de proposition", "Préparerait une revue humaine d'une proposition avant tout code réel."],
  ["test-isole", "Test isolé", "Préparerait un test en environnement isolé — non connecté aujourd'hui."],
  ["deploiement-manuel", "Déploiement manuel seulement", "Rappelle qu'aucun déploiement n'est automatique : seul un humain déploie, jamais ce moteur seul."],
  ["rollback", "Retour arrière préparé", "Préparerait un point de retour arrière avant tout changement réel — non connecté aujourd'hui."],
  ["journal-dev", "Journal de développement", "Consignerait chaque proposition de développement — non connecté aujourd'hui."],
], CONNECTEUR_A_OPTS);
const INTERVENTION_MODULES = famille("intervention.module", SALLE_CONNECTEUR_INTERVENTION, [
  ["ia", "Intervention module IA", "Emplacement préparé pour une future intervention sur un module d'IA — non connecté."],
  ["paiement", "Intervention module paiement", "Emplacement préparé pour une future intervention sur un module de paiement — non connecté."],
  ["catalogue", "Intervention module catalogue", "Emplacement préparé pour une future intervention sur le catalogue — non connecté."],
  ["utilisateurs", "Intervention module utilisateurs", "Emplacement préparé pour une future intervention sur les comptes — non connecté."],
  ["notifications", "Intervention module notifications", "Emplacement préparé pour une future intervention sur les notifications — non connecté."],
  ["securite", "Intervention module sécurité", "Emplacement préparé pour une future intervention sur la sécurité — non connecté."],
], CONNECTEUR_A_OPTS);
const AIDE_IA = famille("intervention.aide-ia", SALLE_CONNECTEUR_INTERVENTION, [
  ["contexte", "Contexte pour l'IA", "Préparerait un contexte à transmettre à l'IA de la plateforme — non connecté aujourd'hui."],
  ["suggestion", "Suggestion à l'IA", "Préparerait une suggestion pour l'IA de la plateforme — non connecté aujourd'hui."],
  ["validation", "Validation humaine requise", "Rappelle qu'une suggestion à l'IA attend toujours une validation humaine."],
  ["historique", "Historique d'aide", "Consignerait l'historique des aides proposées — non connecté aujourd'hui."],
  ["limite", "Limites de l'aide à l'IA", "Rappelle les limites de ce que ce moteur pourra un jour proposer à l'IA."],
], CONNECTEUR_A_OPTS);
const REPARATION_DIAGNOSTIC_A = famille("intervention.diag", SALLE_CONNECTEUR_INTERVENTION, [
  ["page", "Diagnostic de page", "Diagnostiquerait une page de la plateforme — non connecté aujourd'hui."],
  ["image", "Diagnostic d'image", "Diagnostiquerait une image de la plateforme — non connecté aujourd'hui."],
  ["performance", "Diagnostic de performance", "Diagnostiquerait la performance d'un module — non connecté aujourd'hui."],
  ["reparation-proposee", "Réparation proposée", "Préparerait une réparation proposée pour la plateforme — jamais appliquée seule."],
  ["reparation-validee", "Réparation validée", "Rappelle qu'une réparation réelle attend toujours la validation du PDG."],
], CONNECTEUR_A_OPTS);
const INTERRUPTEUR_A = famille("intervention.interrupteur", SALLE_CONNECTEUR_INTERVENTION, [
  ["principal", "Interrupteur principal du connecteur A", "Le seul interrupteur qui pourrait un jour armer ce connecteur — verrouillé, actionnable par le PDG seul, jamais par défaut."],
], { connectorSet: CONNECTEUR_A, etat: "vide" as const, manualSwitch: true });

export const DECLARATIONS_CONNECTEUR_A: readonly DeclarationMoteur[] = [
  ...LECTURE_ETAT, ...OPTIMISATION, ...DEVELOPPEMENT, ...INTERVENTION_MODULES, ...AIDE_IA, ...REPARATION_DIAGNOSTIC_A, ...INTERRUPTEUR_A,
  ...reserves("connecteur-a", SALLE_CONNECTEUR_INTERVENTION, 3, { connectorSet: CONNECTEUR_A }),
]; // 8+6+6+6+5+5+1+3 = 40

// ───────────────────────── Connecteur B — connecteur ordinaire plateforme-à-plateforme (≥40) ─────────────────────────
const CANAUX_B = ["catalogue", "etat", "documents", "ia-memoire", "paiement", "google"] as const;
const DECLARATIONS_CONNECTEUR_B: DeclarationMoteur[] = [];
for (const canal of CANAUX_B) {
  DECLARATIONS_CONNECTEUR_B.push(
    { code: `centre:declare.connecteur-b.${canal}.emission`, nom: `Émission — ${canal}`, fonction: `Préparerait l'émission du canal « ${canal} » vers la Boutique — le canal réel existe déjà (shop-link/contrats.ts) ; ce moteur déclaré en affiche l'état côté Connecteur B, sans le dupliquer.`, roomCode: SALLE_CONNEXIONS_EXISTANTE, connectorSet: CONNECTEUR_B, etat: "prepare", manualSwitch: false },
    { code: `centre:declare.connecteur-b.${canal}.reception`, nom: `Réception — ${canal}`, fonction: `Afficherait la réception du canal « ${canal} » en provenance de la Boutique.`, roomCode: SALLE_CONNEXIONS_EXISTANTE, connectorSet: CONNECTEUR_B, etat: "prepare", manualSwitch: false },
    { code: `centre:declare.connecteur-b.${canal}.journal`, nom: `Journal — ${canal}`, fonction: `Consignerait les échanges du canal « ${canal} » — s'appuie sur le journal déjà existant du centre, jamais un second journal.`, roomCode: SALLE_CONNEXIONS_EXISTANTE, connectorSet: CONNECTEUR_B, etat: "prepare", manualSwitch: false },
    { code: `centre:declare.connecteur-b.${canal}.accuse`, nom: `Accusé d'état — ${canal}`, fonction: `Afficherait le dernier accusé d'état observé pour le canal « ${canal} » — jamais un état inventé.`, roomCode: SALLE_CONNEXIONS_EXISTANTE, connectorSet: CONNECTEUR_B, etat: "prepare", manualSwitch: false },
  );
}
DECLARATIONS_CONNECTEUR_B.push(
  { code: "centre:declare.connecteur-b.etat-global", nom: "État global du Connecteur B", fonction: "Agrège l'état mesuré des six canaux existants pour ce connecteur ordinaire.", roomCode: SALLE_CONNEXIONS_EXISTANTE, connectorSet: CONNECTEUR_B, etat: "prepare", manualSwitch: false },
  { code: "centre:declare.connecteur-b.journal-global", nom: "Journal global du Connecteur B", fonction: "Vue consolidée du journal des six canaux.", roomCode: SALLE_CONNEXIONS_EXISTANTE, connectorSet: CONNECTEUR_B, etat: "prepare", manualSwitch: false },
  { code: "centre:declare.connecteur-b.interrupteur", nom: "Interrupteur principal du Connecteur B", fonction: "Rappel : chaque canal reste gouverné par ses propres coupures à trois éléments déjà existantes ; cet interrupteur n'ajoute aucun pouvoir nouveau.", roomCode: SALLE_CONNEXIONS_EXISTANTE, connectorSet: CONNECTEUR_B, etat: "vide", manualSwitch: true },
  ...reserves("connecteur-b", SALLE_CONNEXIONS_EXISTANTE, 13, { connectorSet: CONNECTEUR_B }),
); // 24 + 3 + 13 = 40

// ───────────────────────── Connecteurs MKAPMS Shop (structure 6 par ensemble) ─────────────────────────
const structureConnecteurShop = (set: string, libelle: string, couverture: string): DeclarationMoteur[] => [
  { code: `centre:declare.shop.${set}.moteur-centre`, nom: `Moteur côté Centre — ${libelle}`, fonction: `Représente, côté Centre, la préparation du connecteur MKAPMS Shop « ${libelle} » (${couverture}).`, roomCode: SALLE_BOUTIQUES_EXISTANTE, connectorSet: set, etat: "prepare", manualSwitch: false },
  { code: `centre:declare.shop.${set}.moteur-intermediaire`, nom: `Moteur intermédiaire — ${libelle}`, fonction: `Représente le moteur intermédiaire déclaré côté MKAPMS Shop pour « ${libelle} », sans connexion réelle active.`, roomCode: SALLE_BOUTIQUES_EXISTANTE, connectorSet: set, etat: "vide", manualSwitch: false },
  { code: `centre:declare.shop.${set}.interrupteur-local`, nom: `Interrupteur local — ${libelle}`, fonction: `Emplacement de l'interrupteur local côté MKAPMS Shop pour « ${libelle} » — désactivé tant qu'aucun vrai compte/clé/contrat n'est fourni.`, roomCode: SALLE_BOUTIQUES_EXISTANTE, connectorSet: set, etat: "vide", manualSwitch: true },
  { code: `centre:declare.shop.${set}.interrupteur-central`, nom: `Interrupteur central — ${libelle}`, fonction: `Emplacement de l'interrupteur central du Centre pour « ${libelle} » — désactivé par défaut.`, roomCode: SALLE_BOUTIQUES_EXISTANTE, connectorSet: set, etat: "vide", manualSwitch: true },
  { code: `centre:declare.shop.${set}.accuse-etat`, nom: `Accusé d'état — ${libelle}`, fonction: `Afficherait le dernier accusé d'état observé pour « ${libelle} » — jamais un état inventé tant qu'aucun accusé réel n'existe.`, roomCode: SALLE_BOUTIQUES_EXISTANTE, connectorSet: set, etat: "vide", manualSwitch: false },
  { code: `centre:declare.shop.${set}.journal`, nom: `Journal — ${libelle}`, fonction: `Vue du journal des changements d'état pour « ${libelle} » (config_history).`, roomCode: SALLE_BOUTIQUES_EXISTANTE, connectorSet: set, etat: "prepare", manualSwitch: false },
];

export const DECLARATIONS_SHOP: readonly DeclarationMoteur[] = [
  ...structureConnecteurShop(SHOP_WOOCOMMERCE, "WooCommerce", "intégration supplier-woocommerce du registre MKAPMS Shop"),
  ...structureConnecteurShop(SHOP_TRANSPORTEURS, "Transporteurs", "les onze transporteurs du registre MKAPMS Shop : postnl, dpd, dhl, dhl-express, ups, fedex, gls, chronopost, colissimo, sendcloud, cainiao"),
  ...structureConnecteurShop(SHOP_PAIEMENT, "Paiement", "intégration payment-gateway du registre MKAPMS Shop"),
  ...structureConnecteurShop(SHOP_IA_BOUTIQUE, "IA Boutique", "intégration shop-ia du registre MKAPMS Shop"),
  ...structureConnecteurShop(SHOP_AUTRES, "Autres registres", "les autres entrées déjà présentes du registre MKAPMS Shop (ex. commerce-test)"),
]; // 5 × 6 = 30

export const TOUTES_DECLARATIONS: readonly DeclarationMoteur[] = [...DECLARATIONS_INTERNES, ...DECLARATIONS_CONNECTEUR_A, ...DECLARATIONS_CONNECTEUR_B, ...DECLARATIONS_SHOP];

/** Pose les moteurs déclarés une fois : une clé déjà posée n'est jamais réécrite (onConflictDoNothing, même principe que fondation.ts). */
export async function seedMoteursDeclares(base: BaseFrontier = dbFrontier()): Promise<{ nouveaux: number; total: number }> {
  // Les sept nouvelles salles (positions 11 à 17, après les dix salles déjà posées par fondation.ts).
  await base.insert(rooms).values(NOUVELLES_SALLES.map((s, i) => ({ ...s, position: 11 + i }))).onConflictDoNothing();

  let nouveaux = 0;
  for (let k = 0; k < TOUTES_DECLARATIONS.length; k += 100) {
    const lot = TOUTES_DECLARATIONS.slice(k, k + 100).map((d) => ({
      code: d.code,
      platformCode: "frontier",
      ownerKind: "center" as const,
      ownerCode: "center",
      name: d.nom,
      function: d.fonction,
      kind: "declared" as const,
      origin: "center" as const,
      declaredOnly: true,
      running: false,
      health: "unknown" as const,
      inventoryState: d.etat,
      roomCode: d.roomCode,
      connectorSet: d.connectorSet,
      manualSwitch: d.manualSwitch,
    }));
    const inserees = await base.insert(engines).values(lot).onConflictDoNothing().returning({ code: engines.code });
    nouveaux += inserees.length;
  }
  return { nouveaux, total: TOUTES_DECLARATIONS.length };
}
