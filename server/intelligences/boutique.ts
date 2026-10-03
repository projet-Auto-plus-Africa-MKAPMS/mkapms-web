/**
 * Connexion de l'IA de la plateforme principale à la Boutique (SHOP) — accès de service.
 *
 * Décision du PDG du 2 octobre 2026 : tant que l'IA de la boutique n'est pas prête, l'IA principale travaille dans
 * SHOP (photos, détails des fiches). Le sens de la connexion est unique : la plateforme principale APPELLE la boutique,
 * jamais l'inverse (la boutique reste autonome, sa propre clé, son propre gateway).
 *
 * Ce que la boutique accepte est fixé de son côté (mkapms-shop : server/service-access.mjs) : un jeton créé par le PDG
 * dans les réglages de l'assistant SHOP, avec des portées explicites (catalogue.read, photos.work, drafts.propose),
 * qui expire et se révoque. Aucun prix, TVA, stock, tarif de livraison, approbation ni publication n'est accessible.
 *
 * Contraintes de sûreté ici : adresse et jeton lus dans le Coffre secret (journalisé), adresse validée (https, sans
 * identifiants, sans IP ni nom interne), chemins FIXES (rien n'est pris de la demande du modèle), aucune redirection
 * suivie, délai borné, taille de réponse bornée, et le jeton n'est jamais renvoyé ni journalisé. Les clés qui
 * ressemblent à un prix, une adresse ou un secret sont retirées de ce qui revient (défense en profondeur).
 */
import { lireSecretPourOutil } from "./coffre.js";

/** Noms exacts attendus dans le coffre (mêmes noms que le catalogue « Connecter les outils »). */
export const NOM_SECRET_ADRESSE_BOUTIQUE = "Boutique — adresse";
export const NOM_SECRET_JETON_BOUTIQUE = "Boutique — jeton de service";

const DELAI_MS = 20_000;
const TAILLE_MAX_REPONSE = 512 * 1024;
const JETON = /^shopsvc_[A-Za-z0-9_-]{43}$/;

type Fetch = typeof fetch;

export type ResultatBoutique<T = Record<string, unknown>> = ({ ok: true } & T) | { ok: false; detail: string; code?: string };

/** Accepte une adresse https publique sans identifiants ni chemin ; renvoie son origine, sinon la raison du refus. */
export function origineBoutique(brut: string): { ok: true; origine: string } | { ok: false; detail: string } {
  let u: URL;
  try {
    u = new URL(brut.trim());
  } catch {
    return { ok: false, detail: "L'adresse de la boutique n'est pas une adresse web valide (exemple attendu : https://boutique.exemple.com)." };
  }
  if (u.protocol !== "https:") return { ok: false, detail: "L'adresse de la boutique doit commencer par https://." };
  if (u.username || u.password) return { ok: false, detail: "L'adresse de la boutique ne doit contenir ni identifiant ni mot de passe." };
  if (u.port) return { ok: false, detail: "L'adresse de la boutique ne doit pas préciser de port." };
  if (u.pathname !== "/" || u.search || u.hash) return { ok: false, detail: "L'adresse de la boutique doit être celle du site seulement (sans chemin)." };
  const h = u.hostname.toLowerCase();
  const interne = !h.includes(".") || /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(":") || h.startsWith("[") || /(^|\.)(localhost|local|internal|lan|home|corp)$/.test(h);
  if (interne) return { ok: false, detail: "L'adresse de la boutique doit être un nom de domaine public (ni IP, ni nom interne)." };
  return { ok: true, origine: u.origin };
}

const CLE_INTERDITE = /(price|prix|amount|montant|href|url|email|phone|token|secret|sealed|credential|password)/i;
/** Retire des clés qui ne devraient jamais venir de la boutique (défense en profondeur, jamais la protection principale). */
export function nettoyer(valeur: unknown, profondeur = 0): unknown {
  if (profondeur > 8) return null;
  if (Array.isArray(valeur)) return valeur.slice(0, 100).map((v) => nettoyer(v, profondeur + 1));
  if (valeur && typeof valeur === "object") {
    return Object.fromEntries(Object.entries(valeur).filter(([k]) => !CLE_INTERDITE.test(k)).map(([k, v]) => [k, nettoyer(v, profondeur + 1)]));
  }
  if (typeof valeur === "string") return valeur.length > 12_000 ? `${valeur.slice(0, 12_000)}…` : valeur;
  return valeur;
}

/** Valeur collée dans le coffre : retire guillemets, « Bearer », espaces et caractères invisibles qui font échouer la forme attendue. */
export function nettoyerValeurSecret(brut: string): string {
  return brut
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, "")
    .trim()
    .replace(/^["'`«»]+|["'`«»]+$/g, "")
    .replace(/^bearer\s+/i, "")
    .trim();
}

function messageErreur(statut: number, corps: unknown, origine = ""): { detail: string; code?: string } {
  const code = typeof (corps as { code?: unknown } | null)?.code === "string" ? String((corps as { code: string }).code) : undefined;
  const texte = typeof (corps as { error?: unknown } | null)?.error === "string" ? String((corps as { error: string }).error).slice(0, 240) : "";
  if (statut === 401) {
    const hote = origine ? ` (${origine.replace(/^https:\/\//, "")})` : "";
    const cause = texte ? ` Réponse de la boutique : « ${texte} ».` : "";
    return { detail: `La boutique${hote} refuse le jeton (invalide, expiré ou révoqué).${cause} Le PDG peut en créer un autre dans la boutique : réglages de l'assistant SHOP → « Accès de l'IA de la plateforme principale ».`, code };
  }
  if (statut === 403 && code === "TOOLS_DISABLED") return { detail: "Les outils de l'IA sont désactivés dans la boutique (réglage du Fondateur).", code };
  if (statut === 403 && code === "SCOPE_REQUIRED") return { detail: "Ce jeton n'a pas la portée nécessaire pour cette action : le PDG doit en créer un avec la portée voulue.", code };
  if (statut === 409 && code === "MEDIA_RIGHTS_REQUIRED") return { detail: "Les droits d'image de ce fournisseur ne sont pas enregistrés dans la boutique : le PDG doit les renseigner avant tout travail sur les photos.", code };
  if (statut === 404) return { detail: "Produit ou route introuvable dans la boutique." };
  if (statut === 429) return { detail: "La boutique limite temporairement les appels. Réessayez dans une minute." };
  if (statut === 409) return { detail: texte || "La boutique refuse : la fiche a changé entre-temps. Relisez-la puis recommencez.", code };
  if (statut === 400) return { detail: texte ? `La boutique a refusé la demande : ${texte}` : "La boutique a refusé la demande (champs invalides)." };
  return { detail: `La boutique a répondu avec une erreur (${statut}).` };
}

/** Lit l'adresse et le jeton dans le coffre (journalisé, avec motif). */
export async function accesBoutique(ownerId: number, outil: string, motif: string): Promise<{ ok: true; origine: string; jeton: string } | { ok: false; detail: string }> {
  const adresse = await lireSecretPourOutil({ ownerId, nom: NOM_SECRET_ADRESSE_BOUTIQUE, outil, motif });
  if (!adresse.ok) return { ok: false, detail: `${adresse.detail} Déposez l'adresse sous le nom « ${NOM_SECRET_ADRESSE_BOUTIQUE} » (Coffre secret → Connecter les outils → Boutique).` };
  if (adresse.contenu.type !== "cle_api") return { ok: false, detail: `Le secret « ${NOM_SECRET_ADRESSE_BOUTIQUE} » doit être de type « Clé ou jeton » (il est de type « ${adresse.contenu.type} »).` };
  const origine = origineBoutique(nettoyerValeurSecret(adresse.contenu.valeur));
  if (!origine.ok) return { ok: false, detail: origine.detail };
  const jeton = await lireSecretPourOutil({ ownerId, nom: NOM_SECRET_JETON_BOUTIQUE, outil, motif });
  if (!jeton.ok) return { ok: false, detail: `${jeton.detail} Le PDG crée le jeton dans la boutique (réglages de l'assistant SHOP) puis le dépose sous « ${NOM_SECRET_JETON_BOUTIQUE} ».` };
  if (jeton.contenu.type !== "cle_api") return { ok: false, detail: `Le secret « ${NOM_SECRET_JETON_BOUTIQUE} » doit être de type « Clé ou jeton » (il est de type « ${jeton.contenu.type} »).` };
  const valeurJeton = nettoyerValeurSecret(jeton.contenu.valeur);
  if (!JETON.test(valeurJeton)) return { ok: false, detail: `Le secret « ${NOM_SECRET_JETON_BOUTIQUE} » n'a pas la forme d'un jeton de service de la boutique (shopsvc_ suivi de 43 caractères) : recréez-le dans la boutique et recollez-le en entier.` };
  return { ok: true, origine: origine.origine, jeton: valeurJeton };
}

async function appeler(
  acces: { origine: string; jeton: string },
  methode: "GET" | "POST" | "PUT",
  chemin: string,
  corps: unknown,
  fetchImpl: Fetch,
): Promise<ResultatBoutique> {
  let reponse: Response;
  try {
    reponse = await fetchImpl(`${acces.origine}/api/service${chemin}`, {
      method: methode,
      redirect: "error",
      signal: AbortSignal.timeout(DELAI_MS),
      headers: {
        Authorization: `Bearer ${acces.jeton}`,
        Accept: "application/json",
        "User-Agent": "mkapms-ai",
        ...(corps === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(corps === undefined ? {} : { body: JSON.stringify(corps) }),
    });
  } catch (e) {
    const trace = `${e instanceof Error ? e.message : ""} ${(e as { cause?: { message?: string } } | null)?.cause?.message ?? ""} ${e instanceof Error ? e.name : ""}`.toLowerCase();
    if (trace.includes("redirect")) {
      return { ok: false, detail: "La boutique redirige cette adresse vers un autre site (par exemple avec ou sans « www ») et la plateforme ne suit jamais une redirection : enregistrez dans « Boutique — adresse » l'adresse finale exacte du site." };
    }
    if (trace.includes("timeout") || trace.includes("abort")) return { ok: false, detail: "La boutique n'a pas répondu dans le délai (20 secondes)." };
    return { ok: false, detail: "La boutique n'a pas répondu (réseau ou nom de domaine introuvable) : vérifiez l'adresse enregistrée dans « Boutique — adresse »." };
  }
  let texte = "";
  try {
    texte = await reponse.text();
  } catch {
    return { ok: false, detail: "La réponse de la boutique n'a pas pu être lue." };
  }
  if (texte.length > TAILLE_MAX_REPONSE) return { ok: false, detail: "La réponse de la boutique est trop volumineuse : affinez la demande." };
  let json: unknown = null;
  try {
    json = texte ? JSON.parse(texte) : null;
  } catch {
    if ([401, 403, 404, 405].includes(reponse.status)) {
      return { ok: false, detail: `La boutique a répondu ${reponse.status} sans le format attendu : l'accès de service (/api/service) n'est probablement pas actif sur ce site (boutique non redéployée avec l'accès de service, ou adresse d'un autre site). Tant que cette route n'est pas reconnue, le jeton n'est pas en cause.` };
    }
    return { ok: false, detail: `La boutique a répondu dans un format inattendu (${reponse.status}).` };
  }
  if (!reponse.ok) return { ok: false, ...messageErreur(reponse.status, json, acces.origine) };
  const propre = nettoyer(json);
  return { ok: true, ...(propre && typeof propre === "object" && !Array.isArray(propre) ? (propre as Record<string, unknown>) : { resultat: propre }) };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ETATS = ["DRAFT", "REVIEW_REQUIRED", "APPROVED", "REJECTED", "NEEDS_CORRECTION"] as const;

export const capacitesBoutique = (a: { origine: string; jeton: string }, f: Fetch = fetch) => appeler(a, "GET", "/capabilities", undefined, f);

export function listerProduitsBoutique(a: { origine: string; jeton: string }, q: { etat?: string; limite?: number; decalage?: number }, f: Fetch = fetch): Promise<ResultatBoutique> {
  if (q.etat !== undefined && !(ETATS as readonly string[]).includes(q.etat)) return Promise.resolve({ ok: false, detail: `État inconnu. États possibles : ${ETATS.join(", ")}.` });
  const p = new URLSearchParams();
  if (q.etat) p.set("state", q.etat);
  p.set("limit", String(Math.min(100, Math.max(1, Math.trunc(q.limite ?? 25)))));
  p.set("offset", String(Math.min(100_000, Math.max(0, Math.trunc(q.decalage ?? 0)))));
  return appeler(a, "GET", `/products?${p.toString()}`, undefined, f);
}

const verifierId = (id: unknown): string | null => (typeof id === "string" && UUID.test(id) ? id : null);

export function lireProduitBoutique(a: { origine: string; jeton: string }, produitId: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  return appeler(a, "GET", `/products/${id}`, undefined, f);
}

export function lancerPhotosBoutique(a: { origine: string; jeton: string }, produitId: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  return appeler(a, "POST", `/products/${id}/photos`, {}, f);
}

export interface FicheProposee {
  revisionAttendue: number;
  titre: string;
  descriptionBoutique: string;
  champs: Record<string, { statut: string; valeur?: string; source?: string }>;
  colis: { longueurMm: number; largeurMm: number; hauteurMm: number; poidsGrammes: number; source: string }[];
}

/** Traduit la proposition vers le contrat de la boutique ; la boutique valide tout (source obligatoire par champ, pas de secret). */
export function proposerFicheBoutique(a: { origine: string; jeton: string }, produitId: unknown, fiche: FicheProposee, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  if (!Number.isInteger(fiche.revisionAttendue) || fiche.revisionAttendue < 1) return Promise.resolve({ ok: false, detail: "La révision attendue est celle lue dans la fiche (entier ≥ 1)." });
  const fields = Object.fromEntries(
    Object.entries(fiche.champs ?? {}).map(([nom, c]) => [nom, { status: c.statut, value: c.valeur ?? "", sourceRef: c.source ?? "" }]),
  );
  const packages = (fiche.colis ?? []).map((c) => ({ lengthMm: c.longueurMm, widthMm: c.largeurMm, heightMm: c.hauteurMm, weightGrams: c.poidsGrammes, sourceRef: c.source }));
  return appeler(a, "PUT", `/products/${id}/draft`, { expectedRevision: fiche.revisionAttendue, title: fiche.titre, shopDescription: fiche.descriptionBoutique, fields, packages }, f);
}
