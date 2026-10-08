/**
 * Boîte d'échange entre les deux IA (canal « ia-memoire »).
 *
 * Les deux IA ne se parlent jamais directement : chaque élément est déposé ici, reste « en attente » et ne devient une
 * connaissance qu'après la décision explicite du PDG (jamais automatique). Rien n'est effacé : un élément refusé reste visible.
 *   • Entrant (Boutique → plateforme) : déposé par la Boutique (message signé). Approuvé → proposé dans la base de connaissances
 *     de la plateforme avec le statut « proposé » (le PDG la confirme ensuite dans l'écran habituel de la connaissance).
 *   • Sortant (plateforme → Boutique) : créé par le PDG (ou copié d'une connaissance confirmée non réservée au PDG), approuvé par lui,
 *     puis récupéré par la Boutique qui accuse réception. La plateforme n'appelle pas la Boutique : elle ne fait qu'exposer sa boîte.
 */
import { createHash } from "node:crypto";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db.js";
import { ecrire, type CategorieConnaissance } from "../intelligences/connaissance.js";
import { inConnaissance } from "../intelligences/schema.js";
import { inspecter } from "./contrats.js";
import { journaliser } from "./service.js";
import { shopLinkIaBoite } from "./schema.js";

export const TYPES_ECHANGE = ["procedure", "connaissance", "erreur_solution"] as const;
export type TypeEchange = (typeof TYPES_ECHANGE)[number];

export interface ElementEchange {
  type: TypeEchange;
  titre: string;
  contenu: string;
  source: string;
}

export const empreinteElement = (e: Pick<ElementEchange, "type" | "titre" | "contenu">): string =>
  createHash("sha256").update(`${e.type}\n${e.titre.trim()}\n${e.contenu.trim()}`).digest("hex");

const CATEGORIE_PAR_TYPE: Record<TypeEchange, CategorieConnaissance> = {
  procedure: "procedures",
  connaissance: "documentation_interne",
  erreur_solution: "support",
};

const TYPE_PAR_CATEGORIE = (categorie: string): TypeEchange => (categorie === "procedures" ? "procedure" : categorie === "support" ? "erreur_solution" : "connaissance");

/** Refuse tout l'envoi si un seul élément contient un secret ou une donnée personnelle (rien n'est déposé à moitié). */
export function verifierElements(elements: ElementEchange[]): { ok: true } | { ok: false; indice: number; raison: string; chemin: string } {
  for (const [i, e] of elements.entries()) {
    const v = inspecter(e, { personnelles: true }, `elements[${i}]`);
    if (!v.ok) return { ok: false, indice: i, raison: v.raison ?? "DONNEE_INTERDITE", chemin: v.chemin ?? "" };
  }
  return { ok: true };
}

export async function deposerEntrant(input: { elements: ElementEchange[]; cleId: number }): Promise<{ deposes: number; doublons: number }> {
  let deposes = 0;
  for (const e of input.elements) {
    const lignes = await db
      .insert(shopLinkIaBoite)
      .values({ sens: "entrant", type: e.type, titre: e.titre.trim(), contenu: e.contenu.trim(), source: e.source.trim(), empreinte: empreinteElement(e), cleId: input.cleId })
      .onConflictDoNothing()
      .returning({ id: shopLinkIaBoite.id });
    deposes += lignes.length;
  }
  return { deposes, doublons: input.elements.length - deposes };
}

export async function creerSortant(input: ElementEchange & { acteur: number }): Promise<{ ok: boolean; detail: string; id?: number }> {
  const e: ElementEchange = { type: input.type, titre: input.titre.trim(), contenu: input.contenu.trim(), source: input.source.trim() };
  if (e.titre.length < 3 || e.contenu.length < 10) return { ok: false, detail: "Le titre (3 caractères au moins) et le contenu (10 caractères au moins) sont obligatoires." };
  const verdict = verifierElements([e]);
  if (!verdict.ok) return { ok: false, detail: `Refusé : ce texte contient ${verdict.raison === "DONNEE_PERSONNELLE" ? "une donnée personnelle (e-mail, téléphone, IBAN)" : "une clé ou un secret"}. Retirez-le puis recommencez.` };
  const lignes = await db
    .insert(shopLinkIaBoite)
    .values({ sens: "sortant", type: e.type, titre: e.titre.slice(0, 160), contenu: e.contenu.slice(0, 4000), source: e.source.slice(0, 120), empreinte: empreinteElement(e), creePar: input.acteur })
    .onConflictDoNothing()
    .returning({ id: shopLinkIaBoite.id });
  if (!lignes.length) return { ok: false, detail: "Cet élément existe déjà dans la boîte d'échange." };
  await journaliser({ canal: "ia-memoire", sens: "systeme", evenement: "sortant_cree", resultat: "ok", acteur: `pdg:${input.acteur}`, detail: e.titre.slice(0, 120) });
  return { ok: true, detail: "Élément mis en attente de votre approbation.", id: lignes[0].id };
}

/** Copie une connaissance CONFIRMÉE et non réservée au PDG vers la boîte sortante (jamais l'inverse, jamais en masse). */
export async function creerSortantDepuisConnaissance(input: { connaissanceId: number; acteur: number }): Promise<{ ok: boolean; detail: string; id?: number }> {
  const [k] = await db.select().from(inConnaissance).where(eq(inConnaissance.id, input.connaissanceId)).limit(1);
  if (!k) return { ok: false, detail: "Connaissance introuvable." };
  if (k.statut !== "confirme") return { ok: false, detail: "Seule une connaissance confirmée peut être proposée à la Boutique." };
  if (k.visibilite !== "interne") return { ok: false, detail: "Cette connaissance est réservée au PDG : elle ne part pas vers la Boutique par cette voie." };
  return creerSortant({ type: TYPE_PAR_CATEGORIE(k.categorie), titre: k.titre.slice(0, 160), contenu: k.contenu.slice(0, 4000), source: `plateforme:connaissance#${k.id}`, acteur: input.acteur });
}

export async function listerBoite(options: { sens?: "entrant" | "sortant"; etat?: string; limite?: number } = {}) {
  const conditions = [options.sens ? eq(shopLinkIaBoite.sens, options.sens) : undefined, options.etat ? eq(shopLinkIaBoite.etat, options.etat) : undefined].filter(Boolean) as ReturnType<typeof eq>[];
  return db
    .select()
    .from(shopLinkIaBoite)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(shopLinkIaBoite.id))
    .limit(Math.min(200, Math.max(1, Math.trunc(options.limite ?? 100))));
}

export async function decider(input: { id: number; approuver: boolean; acteur: number }): Promise<{ ok: boolean; detail: string }> {
  const [e] = await db.select().from(shopLinkIaBoite).where(eq(shopLinkIaBoite.id, input.id)).limit(1);
  if (!e) return { ok: false, detail: "Élément introuvable." };
  if (e.etat !== "en_attente") return { ok: false, detail: "Cet élément a déjà été traité." };
  const maintenant = new Date();
  if (!input.approuver) {
    await db.update(shopLinkIaBoite).set({ etat: "rejete", decidePar: input.acteur, decideLe: maintenant }).where(and(eq(shopLinkIaBoite.id, input.id), eq(shopLinkIaBoite.etat, "en_attente")));
    await journaliser({ canal: "ia-memoire", sens: "systeme", evenement: "rejete", resultat: "ok", acteur: `pdg:${input.acteur}`, detail: `${e.sens} #${e.id}` });
    return { ok: true, detail: "Élément refusé (conservé dans la boîte, rien n'est effacé)." };
  }
  if (e.sens === "sortant") {
    await db.update(shopLinkIaBoite).set({ etat: "approuve", decidePar: input.acteur, decideLe: maintenant }).where(and(eq(shopLinkIaBoite.id, input.id), eq(shopLinkIaBoite.etat, "en_attente")));
    await journaliser({ canal: "ia-memoire", sens: "systeme", evenement: "approuve", resultat: "ok", acteur: `pdg:${input.acteur}`, detail: `sortant #${e.id}` });
    return { ok: true, detail: "Approuvé : la Boutique pourra le récupérer tant que le canal est branché." };
  }
  // Entrant : réservé d'abord (concurrence), puis proposé dans la base de connaissances, jamais confirmé automatiquement.
  const [reserve] = await db
    .update(shopLinkIaBoite)
    .set({ etat: "approuve", decidePar: input.acteur, decideLe: maintenant })
    .where(and(eq(shopLinkIaBoite.id, input.id), eq(shopLinkIaBoite.etat, "en_attente")))
    .returning({ id: shopLinkIaBoite.id });
  if (!reserve) return { ok: false, detail: "Cet élément vient d'être traité par quelqu'un d'autre." };
  const connaissance = await ecrire({
    categorie: CATEGORIE_PAR_TYPE[e.type as TypeEchange] ?? "documentation_interne",
    titre: e.titre,
    contenu: e.contenu,
    source: `boutique:echange#${e.id}${e.source ? ` · ${e.source}` : ""}`,
    auteur: "MKA.P-MS AI — échange Boutique",
    statut: "propose",
    actorId: input.acteur,
  });
  await db.update(shopLinkIaBoite).set({ etat: "integre", connaissanceId: connaissance.id }).where(eq(shopLinkIaBoite.id, input.id));
  await journaliser({ canal: "ia-memoire", sens: "systeme", evenement: "approuve", resultat: "ok", acteur: `pdg:${input.acteur}`, detail: `entrant #${e.id} → connaissance #${connaissance.id} (proposée)` });
  return { ok: true, detail: "Approuvé : proposé dans la base de connaissances (à confirmer dans l'écran de la connaissance)." };
}

/** Éléments sortants approuvés que la Boutique n'a pas encore récupérés. */
export async function sortantsAPrendre(limite = 20) {
  return db
    .select({ id: shopLinkIaBoite.id, type: shopLinkIaBoite.type, titre: shopLinkIaBoite.titre, contenu: shopLinkIaBoite.contenu, source: shopLinkIaBoite.source, approuveLe: shopLinkIaBoite.decideLe })
    .from(shopLinkIaBoite)
    .where(and(eq(shopLinkIaBoite.sens, "sortant"), eq(shopLinkIaBoite.etat, "approuve")))
    .orderBy(asc(shopLinkIaBoite.id))
    .limit(Math.min(50, Math.max(1, limite)));
}

export async function accuserReception(ids: number[]): Promise<number> {
  if (!ids.length) return 0;
  const lignes = await db
    .update(shopLinkIaBoite)
    .set({ etat: "transmis", transmisLe: new Date() })
    .where(and(inArray(shopLinkIaBoite.id, ids), eq(shopLinkIaBoite.sens, "sortant"), eq(shopLinkIaBoite.etat, "approuve")))
    .returning({ id: shopLinkIaBoite.id });
  return lignes.length;
}
