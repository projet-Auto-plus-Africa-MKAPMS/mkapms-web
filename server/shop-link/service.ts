/**
 * Moteur intermédiaire Boutique — câble (couper / rebrancher), journal, clés publiques de la Boutique, anti-rejeu.
 *
 * Le câble est lu en base à CHAQUE passage (jamais mis en cache) : « couper » est immédiat pour toutes les instances.
 * Par défaut chaque canal est coupé (aucune ligne = coupé) ; le commutateur général est branché tant qu'il n'a pas été coupé.
 * Le journal ne garde jamais de contenu : seulement le canal, le sens, le résultat, le statut HTTP, la durée et un détail court
 * dont tout ce qui ressemble à un secret est retiré.
 */
import { createHash, createPublicKey, verify } from "node:crypto";
import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "../db.js";
import { listerSecrets, nomNormalise } from "../intelligences/coffre.js";
import { NOM_SECRET_ADRESSE_BOUTIQUE, NOM_SECRET_JETON_BOUTIQUE } from "../intelligences/boutique.js";
import { CANAUX, CANAUX_IDS, estCanal, type CanalId } from "./contrats.js";
import { shopLinkCables, shopLinkCles, shopLinkJournal, shopLinkRejeu } from "./schema.js";

export const MAITRE = "maitre" as const;
export type CibleCable = CanalId | typeof MAITRE;
export type EtatCable = "connecte" | "coupe";
export type RaisonRefus = "MAITRE_COUPE" | "CANAL_COUPE" | "ATTENTE_EXTERNE";

const masquerSecrets = (texte: string) =>
  texte.replace(/(sk-[A-Za-z0-9_-]{16,}|shopsvc_[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]*)/g, "[retiré]");

// ── Journal ────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface EntreeJournal {
  canal: CanalId | typeof MAITRE | "cles";
  sens: "sortant" | "entrant" | "systeme";
  evenement: string;
  resultat: "ok" | "refuse" | "erreur";
  statutHttp?: number | null;
  dureeMs?: number | null;
  acteur?: string;
  detail?: string;
}

let compteurPurge = 0;

/** Ne lève jamais : le journal ne doit pas faire échouer l'opération qu'il décrit. */
export async function journaliser(e: EntreeJournal): Promise<void> {
  try {
    await db.insert(shopLinkJournal).values({
      canal: e.canal,
      sens: e.sens,
      evenement: e.evenement.slice(0, 32),
      resultat: e.resultat,
      statutHttp: e.statutHttp ?? null,
      dureeMs: e.dureeMs ?? null,
      acteur: (e.acteur ?? "").slice(0, 60),
      detail: masquerSecrets(e.detail ?? "").slice(0, 300),
    });
    if (++compteurPurge % 500 === 0) await db.execute(sql`DELETE FROM shop_link_journal WHERE cree_le < now() - interval '180 days'`);
  } catch (err) {
    console.error("[shop-link] journal indisponible:", (err as Error).message);
  }
}

/** Refus d'un appelant non identifié : au plus 30 lignes par minute, pour qu'un inconnu ne puisse pas remplir le journal. Ne lève jamais. */
export async function journaliserAnonyme(e: EntreeJournal): Promise<void> {
  try {
    const [{ n }] = await db
      .select({ n: count() })
      .from(shopLinkJournal)
      .where(and(gt(shopLinkJournal.creeLe, sql`now() - interval '1 minute'`), sql`${shopLinkJournal.evenement} in ('refus_signature','refus_taille')`));
    if (Number(n) < 30) await journaliser(e);
  } catch (err) {
    console.error("[shop-link] journal indisponible:", (err as Error).message);
  }
}

export async function lireJournal(options: { canal?: string; limite?: number } = {}) {
  const limite = Math.min(500, Math.max(1, Math.trunc(options.limite ?? 100)));
  const lignes = await db
    .select()
    .from(shopLinkJournal)
    .where(options.canal ? eq(shopLinkJournal.canal, options.canal) : undefined)
    .orderBy(desc(shopLinkJournal.id))
    .limit(limite);
  return lignes;
}

// ── Câble ──────────────────────────────────────────────────────────────────────────────────────────────────────────
export interface LigneCable {
  etat: EtatCable;
  motif: string;
  modifieLe: Date | null;
  modifiePar: number | null;
}

export async function lireCables(): Promise<{ maitre: LigneCable; canaux: Record<CanalId, LigneCable> }> {
  const lignes = await db.select().from(shopLinkCables);
  const parCanal = new Map(lignes.map((l) => [l.canal, l]));
  const ligne = (id: string, defaut: EtatCable): LigneCable => {
    const l = parCanal.get(id);
    return l
      ? { etat: l.etat === "connecte" ? "connecte" : "coupe", motif: l.motif, modifieLe: l.modifieLe, modifiePar: l.modifiePar }
      : { etat: defaut, motif: "", modifieLe: null, modifiePar: null };
  };
  const canaux = Object.fromEntries(CANAUX_IDS.map((id) => [id, ligne(id, "coupe")])) as Record<CanalId, LigneCable>;
  return { maitre: ligne(MAITRE, "connecte"), canaux };
}

export interface Passage {
  passe: boolean;
  raison?: RaisonRefus;
}

/** Pur : décide à partir de l'état lu. Un canal en attente externe ne passe jamais, quoi que dise la base. */
export function decider(cables: { maitre: LigneCable; canaux: Record<CanalId, LigneCable> }, canal: CanalId): Passage {
  if (CANAUX[canal].activation === "attente_externe") return { passe: false, raison: "ATTENTE_EXTERNE" };
  if (cables.maitre.etat !== "connecte") return { passe: false, raison: "MAITRE_COUPE" };
  if (cables.canaux[canal].etat !== "connecte") return { passe: false, raison: "CANAL_COUPE" };
  return { passe: true };
}

export async function etatEffectif(canal: CanalId): Promise<Passage> {
  return decider(await lireCables(), canal);
}

export const messageCoupure = (raison: RaisonRefus | undefined): string =>
  raison === "MAITRE_COUPE"
    ? "Le câble Boutique est coupé en entier (commutateur général) : rien ne passe entre la plateforme et la Boutique."
    : raison === "ATTENTE_EXTERNE"
      ? "Ce canal attend une activation externe côté Boutique : il ne peut pas être branché."
      : "Ce canal du câble Boutique est coupé : le PDG peut le rebrancher dans l'écran « Câble Boutique ».";

export interface ResultatReglage {
  ok: boolean;
  code?: "MOTIF_REQUIS" | "ATTENTE_EXTERNE" | "PREREQUIS" | "CANAL_INCONNU";
  detail: string;
}

/** Clés de la Boutique actives : nécessaires pour tout canal par lequel la Boutique nous écrit. */
export async function clesActives() {
  return db.select().from(shopLinkCles).where(eq(shopLinkCles.etat, "active")).orderBy(desc(shopLinkCles.id));
}

/** Ce qui manque encore avant de pouvoir brancher un canal (liste vide : rien ne manque). */
export async function prerequis(canal: CanalId, ownerId: number): Promise<string[]> {
  const manques: string[] = [];
  const c = CANAUX[canal];
  if (c.activation === "attente_externe") return [c.raisonAttente ?? "Activation externe requise."];
  if (c.sens !== "sortant" && (await clesActives()).length === 0) manques.push("Aucune clé publique de la Boutique n'est enregistrée (la Boutique doit signer ses messages).");
  if (canal === "catalogue") {
    const noms = new Set((await listerSecrets(ownerId)).map((s) => nomNormalise(s.nom)));
    if (!noms.has(nomNormalise(NOM_SECRET_ADRESSE_BOUTIQUE))) manques.push(`Le Coffre ne contient pas « ${NOM_SECRET_ADRESSE_BOUTIQUE} ».`);
    if (!noms.has(nomNormalise(NOM_SECRET_JETON_BOUTIQUE))) manques.push(`Le Coffre ne contient pas « ${NOM_SECRET_JETON_BOUTIQUE} ».`);
  }
  return manques;
}

/** Couper est toujours permis ; brancher exige un motif, une activation possible et les prérequis. */
export async function regler(cible: CibleCable, etat: EtatCable, options: { motif: string; acteur: number }): Promise<ResultatReglage> {
  const motif = options.motif.trim();
  if (cible !== MAITRE && !estCanal(cible)) return { ok: false, code: "CANAL_INCONNU", detail: "Canal inconnu." };
  if (motif.length < 3) return { ok: false, code: "MOTIF_REQUIS", detail: "Indiquez un motif (trois caractères au moins) : chaque changement du câble est tracé." };
  if (etat === "connecte" && cible !== MAITRE) {
    const canal = cible as CanalId;
    if (CANAUX[canal].activation === "attente_externe") return { ok: false, code: "ATTENTE_EXTERNE", detail: CANAUX[canal].raisonAttente ?? "Activation externe requise." };
    const manques = await prerequis(canal, options.acteur);
    if (manques.length) return { ok: false, code: "PREREQUIS", detail: `Branchement impossible pour l'instant : ${manques.join(" ")}` };
  }
  await db
    .insert(shopLinkCables)
    .values({ canal: cible, etat, motif: motif.slice(0, 240), modifiePar: options.acteur, modifieLe: new Date() })
    .onConflictDoUpdate({ target: shopLinkCables.canal, set: { etat, motif: motif.slice(0, 240), modifiePar: options.acteur, modifieLe: new Date() } });
  await journaliser({ canal: cible, sens: "systeme", evenement: "cable", resultat: "ok", acteur: `pdg:${options.acteur}`, detail: `${cible} → ${etat} : ${motif}` });
  return { ok: true, detail: etat === "coupe" ? "Câble coupé." : "Câble branché." };
}

/** Coupe d'un coup le commutateur général ET chaque canal (rebrancher le général ne rebranche pas les canaux). */
export async function toutCouper(options: { motif: string; acteur: number }): Promise<ResultatReglage> {
  const premier = await regler(MAITRE, "coupe", options);
  if (!premier.ok) return premier;
  for (const id of CANAUX_IDS) await regler(id, "coupe", options);
  return { ok: true, detail: "Tout est coupé : commutateur général et canaux." };
}

// ── Clés publiques de la Boutique (Ed25519) ────────────────────────────────────────────────────────────────────────
const MAX_CLES_ACTIVES = 5;

export function lireClePublique(brut: string): { ok: true; der: Buffer; empreinte: string } | { ok: false; detail: string } {
  const texte = brut.trim();
  if (!/^[A-Za-z0-9_-]{40,200}$/.test(texte)) return { ok: false, detail: "La clé publique doit être l'export publique de la Boutique (DER SPKI en base64url, sans espaces)." };
  try {
    const der = Buffer.from(texte, "base64url");
    const cle = createPublicKey({ key: der, format: "der", type: "spki" });
    if (cle.asymmetricKeyType !== "ed25519") return { ok: false, detail: "La clé publique doit être de type Ed25519." };
    return { ok: true, der, empreinte: createHash("sha256").update(der).digest("hex") };
  } catch {
    return { ok: false, detail: "Cette clé publique n'est pas lisible (format DER SPKI attendu)." };
  }
}

export async function enregistrerCle(input: { libelle: string; clePublique: string; acteur: number }): Promise<{ ok: boolean; detail: string; id?: number; empreinte?: string }> {
  const libelle = input.libelle.trim().slice(0, 80);
  if (libelle.length < 2) return { ok: false, detail: "Donnez un nom à la clé (par exemple « Boutique — production »)." };
  const lue = lireClePublique(input.clePublique);
  if (!lue.ok) return { ok: false, detail: lue.detail };
  if ((await clesActives()).length >= MAX_CLES_ACTIVES) return { ok: false, detail: `${MAX_CLES_ACTIVES} clés actives au maximum : révoquez-en une d'abord.` };
  const [existante] = await db.select().from(shopLinkCles).where(eq(shopLinkCles.empreinte, lue.empreinte)).limit(1);
  if (existante) return { ok: false, detail: existante.etat === "active" ? "Cette clé est déjà enregistrée." : "Cette clé a été révoquée : une clé révoquée ne se réactive pas, générez-en une nouvelle côté Boutique." };
  const [ligne] = await db.insert(shopLinkCles).values({ libelle, clePublique: input.clePublique.trim(), empreinte: lue.empreinte, creePar: input.acteur }).returning({ id: shopLinkCles.id });
  await journaliser({ canal: "cles", sens: "systeme", evenement: "cle_enregistree", resultat: "ok", acteur: `pdg:${input.acteur}`, detail: `${libelle} (${lue.empreinte.slice(0, 16)})` });
  return { ok: true, detail: "Clé enregistrée.", id: ligne.id, empreinte: lue.empreinte };
}

export async function revoquerCle(input: { id: number; acteur: number }): Promise<{ ok: boolean; detail: string }> {
  const [ligne] = await db
    .update(shopLinkCles)
    .set({ etat: "revoquee", revoqueeLe: new Date() })
    .where(and(eq(shopLinkCles.id, input.id), eq(shopLinkCles.etat, "active")))
    .returning({ empreinte: shopLinkCles.empreinte });
  if (!ligne) return { ok: false, detail: "Clé introuvable ou déjà révoquée." };
  await journaliser({ canal: "cles", sens: "systeme", evenement: "cle_revoquee", resultat: "ok", acteur: `pdg:${input.acteur}`, detail: ligne.empreinte.slice(0, 16) });
  return { ok: true, detail: "Clé révoquée : les messages signés avec elle sont refusés immédiatement." };
}

export async function listerCles() {
  return db
    .select({ id: shopLinkCles.id, libelle: shopLinkCles.libelle, empreinte: shopLinkCles.empreinte, etat: shopLinkCles.etat, creeLe: shopLinkCles.creeLe, revoqueeLe: shopLinkCles.revoqueeLe })
    .from(shopLinkCles)
    .orderBy(desc(shopLinkCles.id));
}

// ── Signature des messages entrants ────────────────────────────────────────────────────────────────────────────────
export const FENETRE_HORLOGE_MS = 90_000;

export const hashCorps = (methode: string, corps: unknown): string =>
  createHash("sha256").update(methode.toUpperCase() === "GET" ? "" : JSON.stringify(corps ?? {})).digest("hex");

/** Message signé par la Boutique : version, méthode, chemin (sans requête), horodatage (ms), nonce, empreinte du corps. */
export const messageSigne = (methode: string, chemin: string, temps: string, nonce: string, empreinteCorps: string): Buffer =>
  Buffer.from(["SHOP-LINK-1", methode.toUpperCase(), chemin, temps, nonce, empreinteCorps].join("\n"));

export interface EnteteSignature {
  temps?: unknown;
  nonce?: unknown;
  signature?: unknown;
  cle?: unknown;
}

/** Pur. Renvoie l'index de la clé qui valide la signature, ou -1. */
export function verifierSignature(input: {
  methode: string;
  chemin: string;
  corps: unknown;
  entetes: EnteteSignature;
  cles: { id: number; clePublique: string; empreinte: string }[];
  maintenant?: number;
}): { ok: true; cleId: number; nonce: string } | { ok: false } {
  const { temps, nonce, signature, cle } = input.entetes;
  const maintenant = input.maintenant ?? Date.now();
  if (typeof temps !== "string" || !/^\d{13}$/.test(temps) || Math.abs(maintenant - Number(temps)) > FENETRE_HORLOGE_MS) return { ok: false };
  if (typeof nonce !== "string" || !/^[a-f0-9]{32}$/.test(nonce)) return { ok: false };
  if (typeof signature !== "string" || !/^[A-Za-z0-9_-]{86}$/.test(signature)) return { ok: false };
  const message = messageSigne(input.methode, input.chemin, temps, nonce, hashCorps(input.methode, input.corps));
  const candidates = typeof cle === "string" && /^[a-f0-9]{16,64}$/.test(cle) ? input.cles.filter((c) => c.empreinte.startsWith(cle)) : input.cles;
  for (const c of candidates) {
    try {
      const publique = createPublicKey({ key: Buffer.from(c.clePublique, "base64url"), format: "der", type: "spki" });
      if (publique.asymmetricKeyType === "ed25519" && verify(null, message, publique, Buffer.from(signature, "base64url"))) return { ok: true, cleId: c.id, nonce };
    } catch {
      /* clé illisible : on passe à la suivante */
    }
  }
  return { ok: false };
}

export async function authentifier(input: { methode: string; chemin: string; corps: unknown; entetes: EnteteSignature }) {
  const cles = (await clesActives()).map((c) => ({ id: c.id, clePublique: c.clePublique, empreinte: c.empreinte }));
  return verifierSignature({ ...input, cles });
}

/** Anti-rejeu (un nonce ne sert qu'une fois) et plafond de messages par minute pour une clé de quota (canal ou « maitre »). */
export async function reserverMessage(cleQuota: string, nonce: string, parMinute: number): Promise<"OK" | "REJEU" | "QUOTA"> {
  await db.execute(sql`DELETE FROM shop_link_rejeu WHERE cree_le < now() - interval '10 minutes'`);
  const inseres = await db.insert(shopLinkRejeu).values({ nonce, canal: cleQuota }).onConflictDoNothing().returning({ nonce: shopLinkRejeu.nonce });
  if (!inseres.length) return "REJEU";
  const [{ n }] = await db
    .select({ n: count() })
    .from(shopLinkRejeu)
    .where(and(eq(shopLinkRejeu.canal, cleQuota), gt(shopLinkRejeu.creeLe, sql`now() - interval '1 minute'`)));
  return Number(n) > parMinute ? "QUOTA" : "OK";
}
