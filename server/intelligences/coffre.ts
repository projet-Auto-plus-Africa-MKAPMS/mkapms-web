/**
 * MKA.P-MS AI — Coffre de secrets du PDG.
 *
 * Un emplacement privé où le PDG dépose des identifiants (adresse + mot de
 * passe), des clés ou des fichiers (compte de service Google, trousseau de
 * signature…) que le moteur pourra UTILISER pour agir, sans jamais les voir :
 *
 *  - le contenu est chiffré (AES-256-GCM, clé dérivée par HKDF d'une clé maître
 *    propre au coffre, sel aléatoire par secret, contexte authentifié = le
 *    propriétaire) et n'est jamais stocké ni journalisé en clair ;
 *  - la valeur est en écriture seule : ni l'interface ni le modèle ne la
 *    relisent après dépôt — seul le code serveur d'un outil précis peut la
 *    déchiffrer, via `lireSecretPourOutil`, et chaque usage est journalisé ;
 *  - sans clé maître (variable COFFRE_CLE_MAITRE, 64 caractères hexadécimaux)
 *    le coffre refuse d'enregistrer quoi que ce soit : jamais un secret
 *    « temporairement » en clair, jamais une clé dérivée d'un secret de
 *    session (le remplacer détruirait le coffre).
 *
 * Cloisonnement : ce coffre appartient à la plateforme principale. La
 * Boutique (SHOP) garde ses propres secrets, sa propre mémoire et ses propres
 * permissions (décision du Fondateur du 27 septembre 2026, voir
 * server/intelligences/fondations.ts) — rien n'est partagé automatiquement.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db.js";
import { inCoffreAcces, inCoffreSecrets } from "./schema.js";

export const TYPES_SECRET = ["identifiants", "cle_api", "fichier"] as const;
export type TypeSecret = (typeof TYPES_SECRET)[number];

const MAX_SECRETS = 100;
const VERSION_CHIFFREMENT = 1;
const INFO_DERIVATION = "mkapms-coffre-v1";

export const MOTIF_INDISPONIBLE =
  "Coffre indisponible : la clé maître n'est pas configurée sur le serveur (variable COFFRE_CLE_MAITRE, 64 caractères hexadécimaux). Rien n'est enregistré tant qu'elle manque — jamais un secret en clair.";

const contenuSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("identifiants"),
      identifiant: z.string().trim().min(1).max(200),
      motDePasse: z.string().min(1).max(500),
      adresse: z.string().trim().max(300).optional(),
      note: z.string().max(500).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("cle_api"),
      valeur: z.string().trim().min(4).max(8000),
    })
    .strict(),
  z
    .object({
      type: z.literal("fichier"),
      nomFichier: z.string().trim().min(1).max(160),
      // ≈ 512 Ko une fois décodé : un trousseau ou un compte de service tient très largement.
      contenuBase64: z.string().min(4).max(700_000).regex(/^[A-Za-z0-9+/=\s]+$/),
    })
    .strict(),
]);

/** Réutilisé tel quel par la surface tRPC : un seul schéma, jamais deux définitions du même contenu. */
export const contenuSecretSchema = contenuSchema;
export type ContenuSecret = z.infer<typeof contenuSchema>;

export interface MetadonneesSecret {
  id: number;
  nom: string;
  service: string;
  type: string;
  apercu: string;
  taille: number;
  dernierUsageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResultatCoffre {
  ok: boolean;
  detail: string;
  id?: number;
}

/** Clé maître lue à chaque appel (jamais mise en cache dans un objet exporté ni journalisée). */
export function cleMaitre(): Buffer | null {
  const brut = (process.env.COFFRE_CLE_MAITRE ?? "").trim();
  return /^[0-9a-fA-F]{64}$/.test(brut) ? Buffer.from(brut, "hex") : null;
}

function contexteAuthentifie(ownerId: number): Buffer {
  return Buffer.from(`coffre|v${VERSION_CHIFFREMENT}|proprietaire:${ownerId}`, "utf8");
}

function cleDerivee(master: Buffer, sel: Buffer): Buffer {
  return Buffer.from(hkdfSync("sha256", master, sel, INFO_DERIVATION, 32));
}

export interface ContenuChiffre {
  sel: string;
  iv: string;
  tag: string;
  contenuChiffre: string;
}

export function chiffrer(master: Buffer, ownerId: number, clair: string): ContenuChiffre {
  const sel = randomBytes(16);
  const iv = randomBytes(12);
  const chiffreur = createCipheriv("aes-256-gcm", cleDerivee(master, sel), iv);
  chiffreur.setAAD(contexteAuthentifie(ownerId));
  const chiffre = Buffer.concat([chiffreur.update(clair, "utf8"), chiffreur.final()]);
  return {
    sel: sel.toString("base64"),
    iv: iv.toString("base64"),
    tag: chiffreur.getAuthTag().toString("base64"),
    contenuChiffre: chiffre.toString("base64"),
  };
}

/** Lève si la clé est mauvaise, si le contenu a été altéré ou s'il appartient à un autre propriétaire. */
export function dechiffrer(master: Buffer, ownerId: number, enc: ContenuChiffre): string {
  const dechiffreur = createDecipheriv(
    "aes-256-gcm",
    cleDerivee(master, Buffer.from(enc.sel, "base64")),
    Buffer.from(enc.iv, "base64"),
  );
  dechiffreur.setAAD(contexteAuthentifie(ownerId));
  dechiffreur.setAuthTag(Buffer.from(enc.tag, "base64"));
  return Buffer.concat([dechiffreur.update(Buffer.from(enc.contenuChiffre, "base64")), dechiffreur.final()]).toString("utf8");
}

function masquerIdentifiant(identifiant: string): string {
  const [local, domaine] = identifiant.split("@");
  if (domaine) return `${local.slice(0, 1)}***@${domaine}`;
  return `${identifiant.slice(0, 1)}***`;
}

function hoteDe(adresse: string): string {
  try {
    return new URL(adresse).host;
  } catch {
    return adresse.slice(0, 60);
  }
}

function tailleOctets(c: ContenuSecret): number {
  return c.type === "fichier" ? Math.floor((c.contenuBase64.replace(/\s/g, "").length * 3) / 4) : Buffer.byteLength(JSON.stringify(c), "utf8");
}

/** Aperçu volontairement pauvre : de quoi reconnaître le secret, jamais de quoi le reconstituer. */
export function apercuDe(c: ContenuSecret): string {
  switch (c.type) {
    case "identifiants":
      return `${masquerIdentifiant(c.identifiant)}${c.adresse ? ` · ${hoteDe(c.adresse)}` : ""}`;
    case "cle_api":
      return c.valeur.length >= 16 ? `•••• ${c.valeur.slice(-4)}` : "••••";
    case "fichier":
      return `${c.nomFichier} (${Math.max(1, Math.round(tailleOctets(c) / 1024))} Ko)`;
  }
}

async function journaliser(entree: {
  secretId: number | null;
  nomSecret: string;
  acteurId: number | null;
  action: "creer" | "remplacer" | "supprimer" | "utiliser";
  outil?: string;
  motif?: string;
  ok?: boolean;
}): Promise<void> {
  try {
    await db.insert(inCoffreAcces).values({
      secretId: entree.secretId,
      nomSecret: entree.nomSecret.slice(0, 120),
      acteurId: entree.acteurId,
      action: entree.action,
      outil: (entree.outil ?? "").slice(0, 96),
      motif: (entree.motif ?? "").slice(0, 600),
      ok: entree.ok ?? true,
    });
  } catch {
    // Le journal ne doit jamais faire échouer l'opération elle-même, ni révéler une valeur.
  }
}

function raisonInvalide(erreur: z.ZodError): string {
  const champs = [...new Set(erreur.issues.map((i) => i.path.join(".") || "contenu"))];
  return `Contenu invalide (champ${champs.length > 1 ? "s" : ""} : ${champs.join(", ")}).`;
}

export async function etatCoffre(ownerId: number): Promise<{ disponible: boolean; motif: string; total: number }> {
  const [ligne] = await db.select({ n: count() }).from(inCoffreSecrets).where(eq(inCoffreSecrets.ownerId, ownerId));
  const disponible = cleMaitre() !== null;
  return { disponible, motif: disponible ? "" : MOTIF_INDISPONIBLE, total: Number(ligne?.n ?? 0) };
}

export async function listerSecrets(ownerId: number): Promise<MetadonneesSecret[]> {
  return db
    .select({
      id: inCoffreSecrets.id,
      nom: inCoffreSecrets.nom,
      service: inCoffreSecrets.service,
      type: inCoffreSecrets.type,
      apercu: inCoffreSecrets.apercu,
      taille: inCoffreSecrets.taille,
      dernierUsageAt: inCoffreSecrets.dernierUsageAt,
      createdAt: inCoffreSecrets.createdAt,
      updatedAt: inCoffreSecrets.updatedAt,
    })
    .from(inCoffreSecrets)
    .where(eq(inCoffreSecrets.ownerId, ownerId))
    .orderBy(desc(inCoffreSecrets.updatedAt));
}

export async function ajouterSecret(input: {
  ownerId: number;
  nom: string;
  service?: string;
  contenu: unknown;
}): Promise<ResultatCoffre> {
  const master = cleMaitre();
  if (!master) return { ok: false, detail: MOTIF_INDISPONIBLE };

  const nom = input.nom.trim();
  if (nom.length < 2 || nom.length > 120) return { ok: false, detail: "Le nom doit faire entre 2 et 120 caractères." };
  const analyse = contenuSchema.safeParse(input.contenu);
  if (!analyse.success) return { ok: false, detail: raisonInvalide(analyse.error) };
  const contenu = analyse.data;

  const [ligne] = await db.select({ n: count() }).from(inCoffreSecrets).where(eq(inCoffreSecrets.ownerId, input.ownerId));
  if (Number(ligne?.n ?? 0) >= MAX_SECRETS) {
    return { ok: false, detail: `Le coffre est plein (${MAX_SECRETS} secrets maximum) : supprimez-en un avant d'en ajouter.` };
  }
  const [doublon] = await db
    .select({ id: inCoffreSecrets.id })
    .from(inCoffreSecrets)
    .where(and(eq(inCoffreSecrets.ownerId, input.ownerId), eq(inCoffreSecrets.nom, nom)))
    .limit(1);
  if (doublon) return { ok: false, detail: "Un secret porte déjà ce nom : choisissez-en un autre, ou remplacez celui-ci." };

  const enc = chiffrer(master, input.ownerId, JSON.stringify(contenu));
  const [cree] = await db
    .insert(inCoffreSecrets)
    .values({
      ownerId: input.ownerId,
      nom,
      service: (input.service ?? "").trim().slice(0, 120),
      type: contenu.type,
      apercu: apercuDe(contenu),
      taille: tailleOctets(contenu),
      version: VERSION_CHIFFREMENT,
      ...enc,
    })
    .returning({ id: inCoffreSecrets.id });

  await journaliser({ secretId: cree.id, nomSecret: nom, acteurId: input.ownerId, action: "creer" });
  return {
    ok: true,
    id: cree.id,
    detail: "Secret enregistré, chiffré. Sa valeur ne pourra plus être relue depuis l'interface : remplacez-la ou supprimez-la pour la changer.",
  };
}

export async function remplacerSecret(input: { ownerId: number; id: number; contenu: unknown }): Promise<ResultatCoffre> {
  const master = cleMaitre();
  if (!master) return { ok: false, detail: MOTIF_INDISPONIBLE };
  const analyse = contenuSchema.safeParse(input.contenu);
  if (!analyse.success) return { ok: false, detail: raisonInvalide(analyse.error) };
  const contenu = analyse.data;

  const [existant] = await db
    .select({ id: inCoffreSecrets.id, nom: inCoffreSecrets.nom, type: inCoffreSecrets.type })
    .from(inCoffreSecrets)
    .where(and(eq(inCoffreSecrets.id, input.id), eq(inCoffreSecrets.ownerId, input.ownerId)))
    .limit(1);
  if (!existant) return { ok: false, detail: "Secret introuvable." };
  if (existant.type !== contenu.type) {
    return { ok: false, detail: "Le type d'un secret ne change pas : supprimez-le et créez-en un nouveau." };
  }

  const enc = chiffrer(master, input.ownerId, JSON.stringify(contenu));
  await db
    .update(inCoffreSecrets)
    .set({ apercu: apercuDe(contenu), taille: tailleOctets(contenu), version: VERSION_CHIFFREMENT, ...enc, updatedAt: new Date() })
    .where(eq(inCoffreSecrets.id, existant.id));

  await journaliser({ secretId: existant.id, nomSecret: existant.nom, acteurId: input.ownerId, action: "remplacer" });
  return { ok: true, id: existant.id, detail: "Secret remplacé. L'ancienne valeur n'existe plus." };
}

export async function supprimerSecret(input: { ownerId: number; id: number }): Promise<ResultatCoffre> {
  const [supprime] = await db
    .delete(inCoffreSecrets)
    .where(and(eq(inCoffreSecrets.id, input.id), eq(inCoffreSecrets.ownerId, input.ownerId)))
    .returning({ id: inCoffreSecrets.id, nom: inCoffreSecrets.nom });
  if (!supprime) return { ok: false, detail: "Secret introuvable." };
  await journaliser({ secretId: supprime.id, nomSecret: supprime.nom, acteurId: input.ownerId, action: "supprimer" });
  return { ok: true, detail: "Secret supprimé définitivement." };
}

/**
 * Seul point du code qui déchiffre. Réservé au code serveur d'un outil précis :
 * jamais exposé par tRPC, jamais renvoyé au modèle. Chaque usage — réussi ou
 * refusé — est journalisé avec l'outil et le motif.
 */
export async function lireSecretPourOutil(input: {
  ownerId: number;
  nom: string;
  outil: string;
  motif: string;
}): Promise<{ ok: true; contenu: ContenuSecret } | { ok: false; detail: string }> {
  const motif = input.motif.trim();
  const refuser = async (detail: string, secretId: number | null = null) => {
    await journaliser({ secretId, nomSecret: input.nom, acteurId: input.ownerId, action: "utiliser", outil: input.outil, motif, ok: false });
    return { ok: false as const, detail };
  };

  if (motif.length < 3) return refuser("Un motif d'usage est obligatoire : il reste au journal.");
  const master = cleMaitre();
  if (!master) return refuser(MOTIF_INDISPONIBLE);

  const [ligne] = await db
    .select()
    .from(inCoffreSecrets)
    .where(and(eq(inCoffreSecrets.ownerId, input.ownerId), eq(inCoffreSecrets.nom, input.nom)))
    .limit(1);
  if (!ligne) return refuser(`Aucun secret nommé « ${input.nom.slice(0, 120)} » dans le coffre.`);

  let contenu: ContenuSecret;
  try {
    const clair = dechiffrer(master, input.ownerId, ligne);
    const analyse = contenuSchema.safeParse(JSON.parse(clair));
    if (!analyse.success) return refuser("Le contenu du secret est illisible.", ligne.id);
    contenu = analyse.data;
  } catch {
    // Mauvaise clé maître (changée depuis le dépôt) ou contenu altéré : jamais de détail technique.
    return refuser("Le secret n'a pas pu être déchiffré (clé maître différente de celle du dépôt, ou contenu altéré).", ligne.id);
  }

  await db.update(inCoffreSecrets).set({ dernierUsageAt: new Date() }).where(eq(inCoffreSecrets.id, ligne.id));
  await journaliser({ secretId: ligne.id, nomSecret: ligne.nom, acteurId: input.ownerId, action: "utiliser", outil: input.outil, motif });
  return { ok: true, contenu };
}

export interface EntreeJournalCoffre {
  id: number;
  nomSecret: string;
  action: string;
  outil: string;
  motif: string;
  ok: boolean;
  createdAt: Date;
}

export async function journalCoffre(ownerId: number, limite = 50): Promise<EntreeJournalCoffre[]> {
  return db
    .select({
      id: inCoffreAcces.id,
      nomSecret: inCoffreAcces.nomSecret,
      action: inCoffreAcces.action,
      outil: inCoffreAcces.outil,
      motif: inCoffreAcces.motif,
      ok: inCoffreAcces.ok,
      createdAt: inCoffreAcces.createdAt,
    })
    .from(inCoffreAcces)
    .where(eq(inCoffreAcces.acteurId, ownerId))
    .orderBy(desc(inCoffreAcces.createdAt))
    .limit(Math.min(Math.max(limite, 1), 200));
}
