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
/** Lecture complète autorisée par le PDG (portée catalogue.full) : les prix et adresses d'images restent, jamais un secret. */
const CLE_SECRETE = /(token|secret|sealed|credential|password)/i;
/** Retire des clés qui ne devraient jamais venir de la boutique (défense en profondeur, jamais la protection principale). */
export function nettoyer(valeur: unknown, profondeur = 0, ficheComplete = false): unknown {
  if (profondeur > 8) return null;
  const interdite = ficheComplete ? CLE_SECRETE : CLE_INTERDITE;
  if (Array.isArray(valeur)) return valeur.slice(0, 100).map((v) => nettoyer(v, profondeur + 1, ficheComplete));
  if (valeur && typeof valeur === "object") {
    return Object.fromEntries(Object.entries(valeur).filter(([k]) => !interdite.test(k)).map(([k, v]) => [k, nettoyer(v, profondeur + 1, ficheComplete)]));
  }
  if (typeof valeur === "string") return valeur.length > 12_000 ? `${valeur.slice(0, 12_000)}…` : valeur;
  return valeur;
}

/** Valeur collée dans le coffre : retire guillemets, « Bearer », espaces et caractères invisibles qui font échouer la forme attendue. */
export function nettoyerValeurSecret(brut: string): string {
  return brut
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, "")
    .trim()
    .replace(/[\s.,;:]+$/, "")
    .replace(/^["'`«»]+|["'`«»]+$/g, "")
    .replace(/^bearer\s+/i, "")
    .replace(/[\s.,;:]+$/, "") // ponctuation de fin collée avec la valeur : jamais dans un jeton (A-Z a-z 0-9 _ -) ni dans un nom de domaine
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
  if (statut === 403 && code === "SCOPE_REQUIRED") {
    const portee = typeof (corps as { scope?: unknown } | null)?.scope === "string" ? ` « ${String((corps as { scope: string }).scope).slice(0, 40)} »` : "";
    return { detail: `Ce jeton n'a pas la portée${portee} nécessaire pour cette action : le PDG doit créer un nouveau jeton avec cette portée (les portées d'un jeton ne se modifient pas après sa création).`, code };
  }
  if (statut === 409 && code === "MAIN_PHOTO_NOT_ELIGIBLE") return { detail: "Cette photo fournisseur n'est pas validée « sans marque » : elle ne peut pas devenir la photo principale. Choisir une version MKA.P-MS contrôlée (état de contrôle de marque dans la fiche complète).", code };
  if (statut === 409 && code === "MEDIA_RIGHTS_REQUIRED") return { detail: "Les droits d'image de ce fournisseur ne sont pas enregistrés dans la boutique : le PDG enregistre la preuve du fournisseur une fois (boutique → Logistique fournisseur → « Droits d'image »), elle couvre tous les produits de ce fournisseur, puis la préparation des photos peut démarrer.", code };
  if (statut === 429 && code === "STOCK_SYNC_TOO_SOON") return { detail: "Le stock de ce fournisseur vient d'être synchronisé (une synchronisation par minute) : relire la fiche complète, ou réessayer dans une minute.", code };
  if (statut === 404) return { detail: "Produit ou route introuvable dans la boutique." };
  if (statut === 429) return { detail: "La boutique limite temporairement les appels. Réessayez dans une minute." };
  if (statut === 409) return { detail: texte || "La boutique refuse : la fiche a changé entre-temps. Relisez-la puis recommencez.", code };
  if (statut === 400) {
    const issues = (corps as { issues?: { path?: unknown; message?: unknown }[] } | null)?.issues;
    const details = Array.isArray(issues)
      ? issues.slice(0, 8).map((i) => `${String(i.path ?? "").slice(0, 80)} : ${String(i.message ?? "").slice(0, 120)}`).join(" ; ")
      : "";
    const base = texte ? `La boutique a refusé la demande : ${texte}` : "La boutique a refusé la demande (champs invalides).";
    return { detail: details ? `${base} Détails : ${details}.` : base };
  }
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
  ficheComplete = false,
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
  if (!reponse.ok) {
    const sync = (json as { sync?: { status?: unknown; reason?: unknown; httpStatus?: unknown } } | null)?.sync;
    if (sync && typeof sync === "object") return { ok: false, detail: detailSynchroStock(String(sync.status ?? ""), sync.reason == null ? "" : String(sync.reason), typeof sync.httpStatus === "number" ? sync.httpStatus : undefined) };
    return { ok: false, ...messageErreur(reponse.status, json, acces.origine) };
  }
  const propre = nettoyer(json, 0, ficheComplete);
  return { ok: true, ...(propre && typeof propre === "object" && !Array.isArray(propre) ? (propre as Record<string, unknown>) : { resultat: propre }) };
}

/** Pourquoi la synchronisation du stock n'a rien rapporté, dit tel quel (jamais une disponibilité supposée). */
export function detailSynchroStock(statut: string, raison: string, httpStatus?: number): string {
  const causes: Record<string, string> = {
    NO_INTEGRATION: "ce fournisseur n'a pas d'intégration enregistrée dans le coffre de la boutique",
    INTEGRATION_UNAVAILABLE: "l'intégration du fournisseur est absente, expirée ou non enregistrée dans le coffre de la boutique",
    VAULT_UNAVAILABLE: "le coffre de la boutique n'a pas pu ouvrir l'intégration du fournisseur",
    NO_STOCK_LINK: "aucun « Lien CSV stock » n'est enregistré dans l'intégration du fournisseur (le PDG le saisit dans le coffre de la boutique)",
    FEED_UNAVAILABLE: "le lien CSV de stock n'a pas répondu ou n'est pas lisible",
    FEED_URL_INVALID: "le lien CSV de stock enregistré n'est pas une adresse https valide (adresse complète, sans identifiant ni port)",
    FEED_HTTP_FAILED: `le fournisseur a répondu une erreur${httpStatus ? ` HTTP ${httpStatus}` : ""} à l'adresse du lien CSV de stock`,
    FEED_ACCESS_DENIED: `le fournisseur refuse l'accès au lien CSV de stock${httpStatus ? ` (HTTP ${httpStatus})` : ""} : le lien est expiré ou incomplet`,
    FEED_CSV_INVALID: "le fichier reçu n'est pas un CSV lisible",
    FEED_CONTENT_REJECTED: "le fichier reçu n'est pas un CSV de stock (page web ou donnée sensible)",
    FEED_TIMEOUT: "le fournisseur n'a pas répondu à temps",
    INTEGRATION_NOT_STORED: "les intégrations du coffre de la boutique sont révoquées ou à renouveler : aucune n'est active",
    INTEGRATION_EXPIRED: "l'intégration du coffre de la boutique qui porte le lien de stock est expirée",
    AMBIGUOUS_STOCK_LINK: "plusieurs intégrations du coffre portent un lien de stock : laquelle est celle du fournisseur n'est pas déterminable (rattacher l'intégration au fournisseur)",
    MAPPING_REQUIRED: "les colonnes du flux de stock ne sont pas reconnues (il faut une colonne SKU et une colonne quantité)",
  };
  const cause = causes[raison] ?? (raison ? `motif ${raison.slice(0, 200)}` : "motif non précisé");
  return `Le stock n'a pas été synchronisé (${statut || "échec"}) : ${cause}. Aucune disponibilité n'est supposée : le stock reste inconnu tant que le flux n'est pas lu.`;
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

/**
 * Fiche COMPLÈTE d'un produit (prix fournisseur, prix saisi, offre boutique, colis, stock observé, ligne d'origine du
 * fournisseur, photos), en lecture seule. Exige la portée facultative catalogue.full du jeton ; décision du PDG du 3 octobre.
 * Un prix non confirmé arrive vide avec l'avertissement PRICE_UNCONFIRMED : ne jamais l'afficher comme confirmé.
 */
export function lireFicheCompleteBoutique(a: { origine: string; jeton: string }, produitId: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  return appeler(a, "GET", `/products/${id}/full`, undefined, f, true);
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

/** Noms de champs structurés connus de la boutique (copie de childFields) : sert seulement à corriger la casse, la boutique reste juge. */
const CHAMPS_BOUTIQUE = ["RecommendedAgeMin", "RecommendedAgeMax", "RecommendedHeightMin", "RecommendedHeightMax", "MaxChildWeight", "Seats", "SeatDimensions", "ProductLength", "ProductWidth", "ProductHeight", "ProductWeight", "BatteryVoltage", "BatteryCapacity", "MotorCount", "MotorPower", "MaxSpeed", "EstimatedRuntime", "ChargingTime", "RemoteControl", "WheelType", "SeatType", "Lights", "Bluetooth", "USB", "Audio", "ChargerIncluded", "BatteryIncluded", "SafetyWarnings", "AdultSupervision", "IndoorOutdoor"] as const;
const PAR_MINUSCULE = new Map(CHAMPS_BOUTIQUE.map((c) => [c.toLowerCase(), c as string]));

const texteChamp = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : Array.isArray(v) ? v.map(String).join(", ") : "");
const premier = (o: Record<string, unknown>, ...cles: string[]): unknown => cles.map((k) => o[k]).find((v) => v !== undefined && v !== null);
const entier = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v.replace(",", ".").trim()) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

/**
 * Accepte la fiche telle que l'IA l'écrit — clés françaises (statut, valeur, source ; longueurMm…) OU clés de la boutique
 * (status, value, sourceRef ; lengthMm…) —, met les valeurs en texte, arrondit les dimensions en entiers et corrige la casse des
 * noms de champs connus. Une erreur évidente est dite AVANT l'appel, avec le nom du champ ou du colis.
 */
export function traduireFiche(fiche: unknown): { ok: true; fields: Record<string, unknown>; packages: unknown[] } | { ok: false; detail: string } {
  const f = (fiche && typeof fiche === "object" ? fiche : {}) as { champs?: unknown; colis?: unknown };
  const fields: Record<string, unknown> = {};
  const champs = f.champs && typeof f.champs === "object" && !Array.isArray(f.champs) ? (f.champs as Record<string, unknown>) : {};
  for (const [nom, brut] of Object.entries(champs)) {
    const c = (brut && typeof brut === "object" && !Array.isArray(brut) ? brut : {}) as Record<string, unknown>;
    const statut = String(premier(c, "statut", "status") ?? "").trim().toUpperCase();
    if (!statut) return { ok: false, detail: `Le champ « ${nom} » n'a pas de statut : FIELD_AVAILABLE (valeur + source), FIELD_NOT_APPLICABLE (source), FIELD_UNVERIFIED ou FIELD_MISSING.` };
    fields[PAR_MINUSCULE.get(nom.trim().toLowerCase()) ?? nom] = {
      status: statut,
      value: texteChamp(premier(c, "valeur", "value")).trim(),
      sourceRef: texteChamp(premier(c, "source", "sourceRef")).trim(),
    };
  }
  const colis = Array.isArray(f.colis) ? f.colis : [];
  const packages: unknown[] = [];
  for (const [i, brut] of colis.entries()) {
    const c = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
    const mesures: [string, string[]][] = [["lengthMm", ["longueurMm", "lengthMm"]], ["widthMm", ["largeurMm", "widthMm"]], ["heightMm", ["hauteurMm", "heightMm"]], ["weightGrams", ["poidsGrammes", "weightGrams"]]];
    const p: Record<string, unknown> = {};
    for (const [cle, noms] of mesures) {
      const n = entier(premier(c, ...noms));
      if (n === null) return { ok: false, detail: `Colis n°${i + 1} : « ${noms[0]} » doit être un nombre positif (millimètres ou grammes). Ne pas deviner : si la mesure n'est pas documentée, ne pas déclarer ce colis.` };
      p[cle] = n;
    }
    const source = texteChamp(premier(c, "source", "sourceRef")).trim();
    if (!source) return { ok: false, detail: `Colis n°${i + 1} : la source (« source ») est obligatoire.` };
    p.sourceRef = source;
    packages.push(p);
  }
  return { ok: true, fields, packages };
}

/** Traduit la proposition vers le contrat de la boutique ; la boutique valide tout (source obligatoire par champ, pas de secret) et dit, en cas de refus, quel champ est en cause. */
export function proposerFicheBoutique(a: { origine: string; jeton: string }, produitId: unknown, fiche: FicheProposee, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  if (!Number.isInteger(fiche.revisionAttendue) || fiche.revisionAttendue < 1) return Promise.resolve({ ok: false, detail: "La révision attendue est celle lue dans la fiche (entier ≥ 1)." });
  const traduite = traduireFiche(fiche);
  if (!traduite.ok) return Promise.resolve({ ok: false, detail: traduite.detail });
  return appeler(a, "PUT", `/products/${id}/draft`, { expectedRevision: fiche.revisionAttendue, title: fiche.titre, shopDescription: fiche.descriptionBoutique, fields: traduite.fields, packages: traduite.packages }, f);
}

/** Choisit la photo principale parmi les versions prêtes du produit : la boutique refuse une photo fournisseur avec marque (jamais confirmée par l'IA). */
export function choisirPhotoPrincipaleBoutique(a: { origine: string; jeton: string }, produitId: unknown, mediaId: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  const media = verifierId(mediaId);
  if (!id || !media) return Promise.resolve({ ok: false, detail: "Identifiants invalides (UUID attendus : produit et photo, tels que renvoyés par la fiche complète)." });
  return appeler(a, "POST", `/products/${id}/media/${media}/select`, {}, f);
}

/** Demande la synchronisation du stock du fournisseur de ce produit (lien CSV du coffre de la boutique) : portée stock.sync. */
/** Aperçu fidèle de la page de vente (portée catalogue.full, lecture seule) : prix de vente, stock réel, livraison, détails, blocages de publication. */
export function lireApercuBoutique(a: { origine: string; jeton: string }, produitId: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  return appeler(a, "GET", `/products/${id}/preview`, undefined, f, true);
}

/** Relance le VRAI contrôle de marque d'une version qui n'a pas pu être contrôlée (portée photos.work). */
export function recontrolerMarquePhotoBoutique(a: { origine: string; jeton: string }, produitId: unknown, mediaId: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  const media = verifierId(mediaId);
  if (!id || !media) return Promise.resolve({ ok: false, detail: "Identifiants invalides (UUID attendus : produit et version de photo, tels que renvoyés par la fiche complète)." });
  return appeler(a, "POST", `/products/${id}/media/${media}/recheck-brand`, {}, f);
}

/**
 * AJOUTE une photo ou une vidéo déjà préparée (lien https public) à une fiche de la boutique (portée photos.work). Aucune retouche, aucun
 * traitement automatique : la boutique garde le fichier tel que reçu (photo convertie en WebP). Une vidéo doit être réelle et autorisée,
 * 10 secondes au moins, avec la référence de son autorisation ; jamais présentée comme un essai si ce n'en est pas un.
 */
export function ajouterMediaParLienBoutique(a: { origine: string; jeton: string }, produitId: unknown, m: { url: unknown; type: unknown; principale?: unknown; reelle?: unknown; droits?: unknown; libelle?: unknown }, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  const url = typeof m.url === "string" ? m.url.trim() : "";
  if (!/^https:\/\/[^\s]{4,2000}$/i.test(url)) return Promise.resolve({ ok: false, detail: "Le lien doit être une adresse https publique (sans identifiant ni secret) qui renvoie directement le fichier." });
  if (m.type !== "photo" && m.type !== "video") return Promise.resolve({ ok: false, detail: "Le type est « photo » ou « video »." });
  if (m.type === "photo") return appeler(a, "POST", `/products/${id}/photos/from-url`, { url, select: m.principale === true }, f);
  const droits = typeof m.droits === "string" ? m.droits.trim() : "";
  if (m.reelle === true && droits.length < 3) return Promise.resolve({ ok: false, detail: "Une vidéo réelle exige la référence de son autorisation (qui l'a tournée, pour qui) : jamais supposée." });
  const corps: Record<string, unknown> = { url, real: m.reelle === true, select: m.principale === true };
  if (droits) corps.rightsRef = droits.slice(0, 300);
  if (typeof m.libelle === "string" && m.libelle.trim()) corps.label = m.libelle.trim().slice(0, 160);
  return appeler(a, "POST", `/products/${id}/videos/from-url`, corps, f);
}

/** Retire une photo de la galerie d'une fiche (ou la remet) : la boutique ne supprime jamais rien, la photo principale se remplace (portée photos.work). */
export function retirerMediaGalerieBoutique(a: { origine: string; jeton: string }, produitId: unknown, mediaId: unknown, remettre: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  const media = verifierId(mediaId);
  if (!id || !media) return Promise.resolve({ ok: false, detail: "Identifiants invalides (UUID attendus : produit et photo, tels que renvoyés par la fiche complète)." });
  return appeler(a, "POST", `/products/${id}/media/${media}/${remettre === true ? "restore" : "hide"}`, {}, f);
}

/** Nombre de colis d'un produit, avec la preuve du fournisseur (portée delivery.work). Le panier en déduit seul le prix de 1, 2… colis. */
export function definirColisBoutique(a: { origine: string; jeton: string }, produitId: unknown, colis: { nombre: unknown; preuve: unknown }, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  const nombre = Number(colis.nombre);
  if (!Number.isInteger(nombre) || nombre < 1 || nombre > 100) return Promise.resolve({ ok: false, detail: "Le nombre de colis doit être un entier de 1 à 100." });
  const preuve = typeof colis.preuve === "string" ? colis.preuve.trim() : "";
  if (preuve.length < 3) return Promise.resolve({ ok: false, detail: "Indiquez la preuve du nombre de colis (fiche, message ou document du fournisseur) : jamais un nombre supposé." });
  return appeler(a, "PUT", `/products/${id}/parcels`, { parcelCount: nombre, evidenceRef: preuve.slice(0, 200) }, f);
}

/** Reprend dans la fiche les caractéristiques que le fournisseur a lui-même données, avec leur source (portée drafts.propose). Jamais d'écrasement ni d'invention ; la fiche reste « à relire ». */
export function remplirFicheDepuisFournisseurBoutique(a: { origine: string; jeton: string }, produitId: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  return appeler(a, "POST", `/products/${id}/fill-from-supplier`, {}, f);
}

/** Nombre de colis lu dans l'attribut Shipment du fournisseur (« Regular shipment » = 1, « 2x regular shipping » = 2) (portée delivery.work). Un nombre confirmé sans attribut : boutique.definirColis avec sa preuve. */
export function appliquerColisFournisseurBoutique(a: { origine: string; jeton: string }, produitId: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  return appeler(a, "POST", `/products/${id}/apply-parcels`, {}, f);
}

export interface GrilleLivraison { grille: unknown; devise?: unknown; base?: unknown; taxe: unknown; preuve: unknown; valideJusqua: unknown; apercu?: unknown }

/** Grille de tarifs de livraison du fournisseur par pays, telle que communiquée par lui (portée delivery.work). */
export function importerGrilleLivraisonBoutique(a: { origine: string; jeton: string }, produitId: unknown, g: GrilleLivraison, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  if (typeof g.grille !== "string" || !g.grille.trim()) return Promise.resolve({ ok: false, detail: "La grille est vide : une ligne par pays, « Pays ; montant » (ou « Pays ; Prix sur demande » / « Pays ; Pas de livraison »)." });
  if (g.taxe !== "EXCLUDED" && g.taxe !== "INCLUDED") return Promise.resolve({ ok: false, detail: "Précisez si les tarifs du fournisseur sont hors taxes (EXCLUDED) ou taxes comprises (INCLUDED) : jamais supposé." });
  const preuve = typeof g.preuve === "string" ? g.preuve.trim() : "";
  if (!preuve) return Promise.resolve({ ok: false, detail: "Indiquez d'où viennent ces tarifs (document ou message du fournisseur, date)." });
  if (typeof g.valideJusqua !== "string" || Number.isNaN(Date.parse(g.valideJusqua))) return Promise.resolve({ ok: false, detail: "Indiquez la date de fin de validité des tarifs (ISO 8601, avec fuseau)." });
  const corps = { grid: g.grille, currency: typeof g.devise === "string" ? g.devise : "EUR", basis: g.base === "PER_ITEM" ? "PER_ITEM" : "PER_PARCEL", taxBasis: g.taxe, evidenceRef: preuve.slice(0, 200), validUntil: new Date(g.valideJusqua).toISOString() };
  return appeler(a, "POST", `/products/${id}/shipping-grid${g.apercu === true ? "?preview=1" : ""}`, corps, f);
}

export function synchroniserStockBoutique(a: { origine: string; jeton: string }, produitId: unknown, f: Fetch = fetch): Promise<ResultatBoutique> {
  const id = verifierId(produitId);
  if (!id) return Promise.resolve({ ok: false, detail: "Identifiant de produit invalide (UUID attendu, tel que renvoyé par la liste)." });
  return appeler(a, "POST", `/products/${id}/stock-sync`, {}, f, true);
}
