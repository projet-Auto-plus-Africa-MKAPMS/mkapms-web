/**
 * MKA.P-MS GOOGLE PRODUCT ENGINE — connecteur Merchant Center (points 94-97).
 *
 * Honnête par construction : `credentialsFromEnv()` ne renvoie des
 * identifiants que s'ils sont réellement présents dans l'environnement
 * (`GOOGLE_MERCHANT_ACCOUNT_ID` + `GOOGLE_MERCHANT_CREDENTIALS`, un JSON de
 * compte de service Google). Sans eux, `service.ts` (`merchantState()`)
 * n'appelle jamais ce module — aucune tentative réseau, aucune approbation
 * inventée. Avec eux, ce module soumet chaque fiche éligible et relève son
 * vrai statut au lieu de le supposer : un échec réseau, une authentification
 * refusée ou un rejet de Google ne font jamais retomber sur « approuvé ».
 *
 * `google-auth-library` (déjà une dépendance du dépôt — server/auth.ts,
 * connexion Google) sert ici à signer un jeton JWT de compte de service :
 * pas de nouvelle dépendance pour un seul appel REST au Content API v2.1.
 */
import { JWT } from "google-auth-library";

const CONTENT_API_BASE = "https://shoppingcontent.googleapis.com/content/v2.1";
const SCOPE = "https://www.googleapis.com/auth/content";

export interface MerchantCredentials {
  merchantId: string;
  serviceAccount: { client_email: string; private_key: string };
}

/** Identifiants réels depuis l'environnement — jamais une valeur par défaut. */
export function credentialsFromEnv(): MerchantCredentials | null {
  const merchantId = process.env.GOOGLE_MERCHANT_ACCOUNT_ID;
  const brut = process.env.GOOGLE_MERCHANT_CREDENTIALS;
  if (!merchantId || !brut) return null;
  try {
    const serviceAccount = JSON.parse(brut) as { client_email?: string; private_key?: string };
    if (!serviceAccount.client_email || !serviceAccount.private_key) return null;
    return {
      merchantId,
      serviceAccount: { client_email: serviceAccount.client_email, private_key: serviceAccount.private_key },
    };
  } catch {
    return null;
  }
}

let clientMemo: { cle: string; client: JWT } | null = null;

/** Jeton d'accès réel obtenu auprès de Google — jamais un jeton simulé. */
export async function obtenirJetonAcces(credentials: MerchantCredentials): Promise<string> {
  const cle = credentials.serviceAccount.client_email;
  if (!clientMemo || clientMemo.cle !== cle) {
    clientMemo = {
      cle,
      client: new JWT({
        email: credentials.serviceAccount.client_email,
        key: credentials.serviceAccount.private_key,
        scopes: [SCOPE],
      }),
    };
  }
  const { token } = await clientMemo.client.getAccessToken();
  if (!token) throw new Error("Google n'a renvoyé aucun jeton d'accès.");
  return token;
}

export interface FicheMerchant {
  offerId: string;
  titre: string;
  description: string;
  url: string;
  imageUrl: string | null;
  prix: string | null;
  devise: string;
  disponibilite: "en_stock" | "sur_commande" | "indisponible";
  etat: string;
  marque: string | null;
  gtin: string | null;
  mpn: string | null;
  pays: string;
  langue: string;
}

const DISPONIBILITE_CONTENT_API: Record<string, string> = {
  en_stock: "in stock",
  sur_commande: "backorder",
  indisponible: "out of stock",
};

/** parts_condition (server/schema.ts) → énumération condition du Content API. */
const CONDITION_CONTENT_API: Record<string, string> = {
  neuf: "new",
  reconditionne: "refurbished",
  echange_standard: "refurbished",
  occasion: "used",
};

/** Construction pure du corps de requête Content API — testable sans réseau. */
export function construireRessourceProduit(fiche: FicheMerchant): Record<string, unknown> {
  const ressource: Record<string, unknown> = {
    offerId: fiche.offerId,
    title: fiche.titre,
    description: fiche.description,
    link: fiche.url,
    contentLanguage: fiche.langue,
    targetCountry: fiche.pays,
    channel: "online",
    availability: DISPONIBILITE_CONTENT_API[fiche.disponibilite] ?? "out of stock",
    condition: CONDITION_CONTENT_API[fiche.etat] ?? "used",
  };
  if (fiche.imageUrl) ressource.imageLink = fiche.imageUrl;
  if (fiche.prix) ressource.price = { value: fiche.prix, currency: fiche.devise };
  if (fiche.marque) ressource.brand = fiche.marque;
  if (fiche.gtin) ressource.gtin = fiche.gtin;
  if (fiche.mpn) ressource.mpn = fiche.mpn;
  return ressource;
}

/** Identifiant Content API d'un produit déjà soumis (REST_ID officiel). */
export function idProduitContentApi(fiche: Pick<FicheMerchant, "offerId" | "langue" | "pays">): string {
  return `online:${fiche.langue}:${fiche.pays}:${fiche.offerId}`;
}

export interface StatutMerchant {
  approuve: boolean;
  visible: boolean;
  /**
   * "approuve" : destination Shopping confirmée par Google.
   * "rejete" : Google a explicitement signalé un problème bloquant.
   * "en_attente" : soumis, aucun verdict définitif pour l'instant (normal
   *   juste après une soumission — Google n'indexe pas instantanément).
   * "echec_technique" : authentification, réseau ou API injoignable — jamais
   *   confondu avec un vrai rejet Google, pour ne pas alarmer le PDG à tort.
   */
  etat: "approuve" | "rejete" | "en_attente" | "echec_technique";
  motif: string;
}

/**
 * Lecture pure d'une réponse `productstatuses` réelle. Jamais approuvé ni
 * visible sans preuve explicite dans la réponse — le silence ou l'absence de
 * destination approuvée vaut « en attente », jamais « oui » par défaut.
 */
export function interpreterStatut(reponse: unknown): StatutMerchant {
  const r = reponse as {
    destinationStatuses?: { destination: string; approvedCountries?: string[]; disapprovedCountries?: string[] }[];
    itemLevelIssues?: { severity: string; description: string }[];
  } | null;
  if (!r) return { approuve: false, visible: false, etat: "echec_technique", motif: "Réponse Merchant Center illisible." };

  const problemesBloquants = (r.itemLevelIssues ?? []).filter((i) => i.severity === "error");
  if (problemesBloquants.length > 0) {
    return {
      approuve: false,
      visible: false,
      etat: "rejete",
      motif: `Rejeté par Google Merchant Center : ${problemesBloquants.map((i) => i.description).join(" ; ")}`,
    };
  }

  const destinationShopping = (r.destinationStatuses ?? []).find(
    (d) => d.destination === "Shopping" || d.destination === "SurfacesAcrossGoogle",
  );
  const approuve = (destinationShopping?.approvedCountries?.length ?? 0) > 0;
  return {
    approuve,
    visible: approuve,
    etat: approuve ? "approuve" : "en_attente",
    motif: approuve
      ? `Approuvé par Google Merchant Center pour : ${destinationShopping?.approvedCountries?.join(", ")}.`
      : "Soumis à Google Merchant Center, en attente de revue (aucune approbation confirmée pour l'instant).",
  };
}

/** Signature minimale de `fetch`, pour injection dans les tests — sans dépendance à `undici`. */
export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/**
 * Soumet une fiche puis relève son vrai statut. Un échec réseau, une
 * authentification refusée ou un rejet de Google ne font jamais retomber sur
 * « approuvé » : le motif réel est toujours conservé pour l'écran PDG.
 */
export async function synchroniserFiche(
  credentials: MerchantCredentials,
  fiche: FicheMerchant,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  obtenirJetonAccesImpl: (c: MerchantCredentials) => Promise<string> = obtenirJetonAcces,
): Promise<StatutMerchant> {
  let jeton: string;
  try {
    jeton = await obtenirJetonAccesImpl(credentials);
  } catch (e) {
    return {
      approuve: false,
      visible: false,
      etat: "echec_technique",
      motif: `Authentification Merchant Center échouée : ${e instanceof Error ? e.message : "erreur inconnue"}.`,
    };
  }

  const entetes = { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" };

  try {
    const soumission = await fetchImpl(`${CONTENT_API_BASE}/${credentials.merchantId}/products`, {
      method: "POST",
      headers: entetes,
      body: JSON.stringify(construireRessourceProduit(fiche)),
    });
    if (!soumission.ok) {
      const detail = await soumission.json().catch(() => null);
      return {
        approuve: false,
        visible: false,
        etat: "rejete",
        motif: `Google Merchant Center a refusé la soumission (HTTP ${soumission.status}) : ${JSON.stringify(detail)}`,
      };
    }
  } catch (e) {
    return {
      approuve: false,
      visible: false,
      etat: "echec_technique",
      motif: `Soumission Merchant Center injoignable : ${e instanceof Error ? e.message : "erreur réseau"}.`,
    };
  }

  try {
    const statut = await fetchImpl(
      `${CONTENT_API_BASE}/${credentials.merchantId}/productstatuses/${encodeURIComponent(idProduitContentApi(fiche))}`,
      { method: "GET", headers: entetes },
    );
    if (!statut.ok) {
      // 404 juste après une soumission est normal : Google n'a pas encore
      // indexé la fiche — ce n'est pas un échec technique, contrairement à
      // un 401/403/5xx qui signale un vrai problème d'accès.
      return {
        approuve: false,
        visible: false,
        etat: statut.status === 404 ? "en_attente" : "echec_technique",
        motif:
          statut.status === 404
            ? "Fiche soumise, pas encore indexée par Google (normal juste après un premier envoi)."
            : `Statut Merchant Center illisible (HTTP ${statut.status}).`,
      };
    }
    return interpreterStatut(await statut.json());
  } catch (e) {
    return {
      approuve: false,
      visible: false,
      etat: "echec_technique",
      motif: `Lecture du statut Merchant Center injoignable : ${e instanceof Error ? e.message : "erreur réseau"}.`,
    };
  }
}
