/**
 * Centre Cyber-Électrique — vues pour les moteurs déclarés (migration 0005) : les sept nouvelles salles, le Connecteur A, le Connecteur B et
 * les connecteurs MKAPMS Shop. Même principe que vues.ts : rien n'est inventé, chaque chiffre vient d'une requête réelle sur la base du centre.
 * Alarme standard (vert/bleu/rouge/gris) calculée sur l'état réellement observé, jamais sur une hypothèse. Identité interne du centre : un
 * mécanisme pour qu'il enregistre son propre nom dans sa mémoire, jamais un nom imposé par le code ; ne renomme jamais MKAPMS Web ni MKAPMS Shop.
 */
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { engines, rooms } from "./base/schema.js";
import { ecrireConfig, journaliser, libelleActeur, lireConfig, type Acteur } from "./journal.js";
import { incidentsOuverts } from "./atelier.js";
import { CONNECTEUR_A, CONNECTEUR_B, ENSEMBLES_CONNECTEURS, NOUVELLES_SALLES, SALLE_SURVEILLANCE, SHOP_AUTRES, SHOP_IA_BOUTIQUE, SHOP_PAIEMENT, SHOP_TRANSPORTEURS, SHOP_WOOCOMMERCE } from "./moteurs-declares.js";

const n = (v: unknown) => Number(v ?? 0);

export type AlarmeNiveau = "vert" | "bleu" | "rouge" | "gris";
export interface Alarme {
  niveau: AlarmeNiveau;
  texte: string;
}

export interface FiltreDeclares {
  roomCode?: string;
  connectorSet?: string;
}

export async function moteursDeclaresListe(filtre: FiltreDeclares = {}) {
  const db = dbFrontier();
  const conds = [eq(engines.kind, "declared")];
  if (filtre.roomCode) conds.push(eq(engines.roomCode, filtre.roomCode));
  if (filtre.connectorSet) conds.push(eq(engines.connectorSet, filtre.connectorSet));
  return db
    .select({ code: engines.code, name: engines.name, fonction: engines.function, etat: engines.inventoryState, roomCode: engines.roomCode, connectorSet: engines.connectorSet, manualSwitch: engines.manualSwitch, enMarche: engines.running, sante: engines.health })
    .from(engines)
    .where(and(...conds))
    .orderBy(asc(engines.code));
}

/**
 * Alarme standard d'une zone (salle ou ensemble de connecteur), calculée sur l'état réellement observé :
 * rouge seulement si un moteur est en erreur/bloqué, bleu seulement si un moteur y est réellement en marche,
 * gris sinon — c'est l'état honnête par défaut d'une zone préparée mais non activée. Jamais de vert ici : un
 * moteur déclaré seul ne prouve aucun fonctionnement normal, contrairement aux moteurs internes déjà réels.
 */
export async function alarmeDeclaree(filtre: FiltreDeclares): Promise<Alarme> {
  const moteurs = await moteursDeclaresListe(filtre);
  const enErreur = moteurs.filter((m) => m.etat === "erreur" || m.etat === "bloque");
  if (enErreur.length > 0) return { niveau: "rouge", texte: `${enErreur.length} moteur(s) en erreur ou bloqué(s) — intervention nécessaire.` };
  const enMarche = moteurs.filter((m) => m.enMarche);
  if (enMarche.length > 0) return { niveau: "bleu", texte: `${enMarche.length} moteur(s) réellement en marche.` };
  return { niveau: "gris", texte: "Inactif : rien n'est connecté ni en marche ici — état normal pour une zone préparée mais non activée." };
}

// ───────────────────────── Salle 2 — Contrôle centrale ─────────────────────────
export async function controleCentraleVue() {
  const db = dbFrontier();
  const parEtatMarche = await db.select({ etat: engines.inventoryState, enMarche: engines.running, k: count() }).from(engines).where(eq(engines.kind, "declared")).groupBy(engines.inventoryState, engines.running);
  const moteursActifs = parEtatMarche.filter((r) => r.enMarche).reduce((s, r) => s + n(r.k), 0);
  const moteursArretes = parEtatMarche.filter((r) => !r.enMarche).reduce((s, r) => s + n(r.k), 0);
  const enErreur = parEtatMarche.filter((r) => r.etat === "erreur" || r.etat === "bloque").reduce((s, r) => s + n(r.k), 0);
  const parEnsemble = await db.select({ set: engines.connectorSet, k: count() }).from(engines).where(and(eq(engines.kind, "declared"), inArray(engines.connectorSet, [...ENSEMBLES_CONNECTEURS]))).groupBy(engines.connectorSet);
  const connecteurs = await Promise.all(ENSEMBLES_CONNECTEURS.map(async (set) => ({ set, total: n(parEnsemble.find((r) => r.set === set)?.k), alarme: await alarmeDeclaree({ connectorSet: set }) })));
  const [nbSalles] = await db.select({ k: count() }).from(rooms);
  const incidents = await incidentsOuverts(500);
  const critiques = incidents.filter((i) => i.severity === "critical").length;
  return {
    moteursActifs,
    moteursArretes,
    connecteurs,
    erreurs: enErreur,
    alertes: critiques,
    incidentsOuverts: incidents.length,
    etatGeneral: enErreur > 0 || critiques > 0 ? ("alerte" as const) : ("normal" as const),
    nbSalles: n(nbSalles?.k),
    horodatage: new Date().toISOString(),
  };
}

// ───────────────────────── Salle 3 — Surveillance externe (observable seulement) ─────────────────────────
export async function surveillanceVue() {
  const moteurs = await moteursDeclaresListe({ roomCode: SALLE_SURVEILLANCE });
  // Rien n'est jamais inventé ici : la salle affiche honnêtement « rien d'observable » tant qu'aucun mécanisme réel de collecte n'existe.
  return {
    moteurs,
    accesObserves: 0,
    scansDetectes: 0,
    anomalies: 0,
    note: "Aucun mécanisme réel de détection n'est encore branché à cette salle : chaque compteur reste à zéro par honnêteté, jamais par supposition. « Rien d'observable » est une réponse valide.",
    alarme: { niveau: "bleu" as const, texte: "Surveillance au repos : rien d'anormal n'est observable aujourd'hui." },
  };
}

// ───────────────────────── Connecteurs (A, B, MKAPMS Shop) ─────────────────────────
const LIBELLE_ENSEMBLE: Record<string, string> = {
  [CONNECTEUR_A]: "Connecteur A — grand connecteur principal d'intervention",
  [CONNECTEUR_B]: "Connecteur B — connecteur ordinaire plateforme-à-plateforme",
  [SHOP_WOOCOMMERCE]: "MKAPMS Shop — WooCommerce",
  [SHOP_TRANSPORTEURS]: "MKAPMS Shop — Transporteurs",
  [SHOP_PAIEMENT]: "MKAPMS Shop — Paiement",
  [SHOP_IA_BOUTIQUE]: "MKAPMS Shop — IA Boutique",
  [SHOP_AUTRES]: "MKAPMS Shop — Autres registres",
};

export async function connecteurVue(set: string) {
  const moteurs = await moteursDeclaresListe({ connectorSet: set });
  const total = moteurs.length;
  // Une preuve réelle de connexion n'existe aujourd'hui pour aucun moteur déclaré : le pourcentage est honnêtement 0, jamais estimé.
  const avecPreuve = moteurs.filter((m) => m.etat === "actif" || m.etat === "teste" || m.etat === "connecte").length;
  const manquants = moteurs.filter((m) => !(m.etat === "actif" || m.etat === "teste" || m.etat === "connecte")).map((m) => m.name);
  const pourcentage = total === 0 ? 0 : Math.round((avecPreuve / total) * 100);
  const alarme = await alarmeDeclaree({ connectorSet: set });
  return {
    set,
    libelle: LIBELLE_ENSEMBLE[set] ?? set,
    total,
    avecPreuve,
    pourcentage,
    manquants,
    moteurs,
    alarme,
    note: pourcentage === 0 ? "0 % honnête : aucune preuve réelle de connexion n'existe aujourd'hui, jamais une estimation." : `${pourcentage} % mesuré sur preuve réelle ; le reste (${manquants.length} moteur(s)) demeure visible comme manquant.`,
  };
}

export async function salleDeclareeVue(roomCode: string) {
  const moteurs = await moteursDeclaresListe({ roomCode });
  const alarme = roomCode === SALLE_SURVEILLANCE ? (await surveillanceVue()).alarme : await alarmeDeclaree({ roomCode });
  return { roomCode, moteurs, alarme, compteurs: { total: moteurs.length, enMarche: moteurs.filter((m) => m.enMarche).length, erreur: moteurs.filter((m) => m.etat === "erreur" || m.etat === "bloque").length } };
}

export async function nouvellesSallesListe() {
  const db = dbFrontier();
  const rows = await db.select().from(rooms).where(inArray(rooms.code, NOUVELLES_SALLES.map((s) => s.code)));
  return rows.sort((a, b) => a.position - b.position);
}

// ───────────────────────── Identité interne du centre (jamais imposée, jamais fusionnée avec MKAPMS Web/Shop) ─────────────────────────
const CLE_IDENTITE = "identite-centre";
export interface IdentiteCentre {
  nomInterne: string | null;
  localisationDeclarative: string;
  definieLe: string | null;
  definiePar: string | null;
}
const IDENTITE_DEFAUT: IdentiteCentre = {
  nomInterne: null,
  localisationDeclarative: "Guinée, Kankan (déclaratif — hébergement réel non confirmé ; ne signifie pas que le centre y est physiquement hébergé).",
  definieLe: null,
  definiePar: null,
};

export async function identiteVue(): Promise<IdentiteCentre> {
  return lireConfig(CLE_IDENTITE, IDENTITE_DEFAUT);
}

/** Seul le PDG peut faire enregistrer au centre son propre nom interne — jamais un nom choisi par le code, jamais un renommage de MKAPMS Web ou MKAPMS Shop. */
export async function definirIdentiteCentre(nom: string, acteur: Acteur): Promise<IdentiteCentre> {
  const actuelle = await identiteVue();
  const nouvelle: IdentiteCentre = { ...actuelle, nomInterne: nom.trim(), definieLe: new Date().toISOString(), definiePar: libelleActeur(acteur) };
  await ecrireConfig(CLE_IDENTITE, nouvelle, acteur);
  return nouvelle;
}

const SEQUENCE_ALLUMAGE_CENTRAL = [
  { etape: "A" as const, code: "centre:declare.intervention.interrupteur.principal", label: "Connecteur A" },
  { etape: "B" as const, code: "centre:declare.connecteur-b.interrupteur", label: "Connecteur B" },
  { etape: "central" as const, code: "centre:declare.centrale.etat-general", label: "Moteur central de contrôle" },
];

/**
 * Allumage préparatoire demandé par le PDG : A puis B puis moteur central. Cela démarre seulement des moteurs déclarés
 * du Centre ; aucune ligne réelle, aucun câble, aucune coupure et aucun contact rouge n'est fermé ici.
 */
export async function allumerMoteurCentralApresAetB(acteur: Acteur, confirme: boolean) {
  if (!confirme) {
    await journaliser({ acteur, action: "declared_central_start", cible: "center", resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
    return { ok: false, detail: "Confirmation requise : l'allumage préparatoire suit l'ordre A, B, puis moteur central.", etapes: SEQUENCE_ALLUMAGE_CENTRAL.map((e) => ({ ...e, statut: "attente" as const })) };
  }
  const db = dbFrontier();
  const etapes = [];
  for (const e of SEQUENCE_ALLUMAGE_CENTRAL) {
    const [m] = await db.select().from(engines).where(eq(engines.code, e.code)).limit(1);
    if (!m || m.kind !== "declared" || m.platformCode !== "frontier") {
      await journaliser({ acteur, action: "declared_central_start", cible: "engine", cibleId: e.code, resultat: "error", erreur: "MOTEUR_ABSENT" });
      return { ok: false, detail: `${e.label} absent : allumage arrêté avant l'étape ${e.etape}.`, etapes };
    }
    await db.update(engines).set({ running: true, health: "unknown", updatedAt: new Date() }).where(eq(engines.code, e.code));
    await ecrireConfig(`allumage.${e.etape.toLowerCase()}`, { code: e.code, label: e.label, at: new Date().toISOString(), mode: "preparatoire_sans_connexion" }, acteur);
    etapes.push({ ...e, statut: "allume" as const });
  }
  await journaliser({ acteur, action: "declared_central_start", cible: "center", resultat: "ok", detail: { ordre: SEQUENCE_ALLUMAGE_CENTRAL.map((e) => e.etape), reel: false } });
  return { ok: true, detail: "Allumage préparatoire terminé : A allumé, B allumé, moteur central allumé. Aucun contact rouge fermé, aucun tunnel réel branché.", etapes };
}
