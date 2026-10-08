/**
 * Moteur intermédiaire Boutique (côté plateforme principale) — contrats des canaux.
 *
 * Règle d'architecture décidée par le PDG : la plateforme principale et la Boutique ne se connectent JAMAIS directement
 * entre leurs moteurs. Chaque côté a son propre moteur intermédiaire ; entre les deux il n'y a qu'un « câble » que le PDG
 * peut couper (par canal ou en entier). Ce fichier est la déclaration pure (sans base ni réseau) de ce qui peut passer :
 * pour chaque canal, le sens, les données autorisées, les données interdites, les routes de la Boutique que la plateforme
 * a le droit d'appeler et les limites. Tout ce qui n'est pas déclaré ici est refusé (liste blanche).
 *
 * Les canaux reprennent les contrats préparés côté Boutique (shop_strategy.connection_contracts : shop-documents-only,
 * shop-intelligence-isolated, shared-stripe-account, shared-google-owner) et l'accès de service déjà décrit côté
 * Boutique (docs/SHOP-SERVICE-ACCESS : jeton, portées, routes /api/service). Aucune route de la Boutique n'est inventée.
 */

export const VERSION_CONTRAT = 1;

export const CANAUX_IDS = ["catalogue", "etat", "documents", "ia-memoire", "paiement", "google"] as const;
export type CanalId = (typeof CANAUX_IDS)[number];

export type Sens = "sortant" | "entrant" | "mixte";

export interface Canal {
  id: CanalId;
  libelle: string;
  sens: Sens;
  /** Identifiant du contrat correspondant côté Boutique (null : décrit seulement dans la documentation de l'accès de service). */
  contratBoutique: string | null;
  description: string;
  donneesAutorisees: string[];
  donneesInterdites: string[];
  /** « attente_externe » : le contrat est déclaré mais le câble ne peut pas être branché tant que la condition externe n'est pas prouvée. */
  activation: "disponible" | "attente_externe";
  raisonAttente?: string;
  planCoupure: string;
  /** Taille maximale d'un message entrant (octets) et nombre maximal de messages entrants par minute. */
  tailleMax: number;
  parMinute: number;
}

export const CANAUX: Record<CanalId, Canal> = {
  catalogue: {
    id: "catalogue",
    libelle: "Catalogue — l'IA de la plateforme travaille dans la Boutique",
    sens: "sortant",
    contratBoutique: "service-access",
    description:
      "La plateforme appelle les routes /api/service de la Boutique avec le jeton de service que le PDG a créé et déposé dans le Coffre. " +
      "Lecture des fiches, préparation des photos, propositions de brouillon. Jamais de prix, de TVA, de stock, de livraison, d'approbation ni de publication.",
    donneesAutorisees: ["fiches produit", "médias", "colis", "brouillons proposés (à relire)"],
    donneesInterdites: ["modification de prix ou de TVA", "publication", "clients et commandes", "coffre et secrets", "équipe et paramètres"],
    activation: "disponible",
    planCoupure: "Couper le canal : plus aucun appel ne part vers la Boutique, le jeton n'est même plus lu dans le Coffre.",
    tailleMax: 0,
    parMinute: 0,
  },
  etat: {
    id: "etat",
    libelle: "État technique de la Boutique (agrégé)",
    sens: "entrant",
    contratBoutique: "shop-intelligence-isolated",
    description: "La Boutique envoie un état technique agrégé de ses moteurs. Aucune mémoire, aucune conversation, aucune donnée client.",
    donneesAutorisees: ["état des moteurs", "alertes (nombre)", "compteurs", "santé"],
    donneesInterdites: ["mémoire de l'IA de la Boutique", "contenu des conversations", "données clients", "mémoire de l'IA principale"],
    activation: "disponible",
    planCoupure: "Couper le canal : l'état reçu n'est plus mis à jour, le dernier état reste affiché avec sa date.",
    tailleMax: 32_768,
    parMinute: 12,
  },
  documents: {
    id: "documents",
    libelle: "Références de documents de la Boutique",
    sens: "entrant",
    contratBoutique: "shop-documents-only",
    description: "La Boutique transmet des RÉFÉRENCES de documents (numéro, statut, total, commande). Le document reste dans la Boutique.",
    donneesAutorisees: ["référence du document", "statut", "totaux", "référence de commande"],
    donneesInterdites: ["pièces d'identité", "données privées des clients", "contenu des contrats fournisseurs"],
    activation: "disponible",
    planCoupure: "Couper le canal : plus aucune référence n'est acceptée ; les archives restent dans la Boutique.",
    tailleMax: 65_536,
    parMinute: 30,
  },
  "ia-memoire": {
    id: "ia-memoire",
    libelle: "Échange de mémoire entre les deux IA (boîte de validation)",
    sens: "mixte",
    contratBoutique: null,
    description:
      "Les deux IA ne se parlent pas directement : chaque élément passe par la boîte d'échange du moteur intermédiaire et ne devient une connaissance qu'après validation du PDG. " +
      "Entrant : la Boutique dépose une proposition (procédure, connaissance, erreur et solution). Sortant : le PDG approuve un élément, la Boutique vient le chercher.",
    donneesAutorisees: ["procédures", "connaissances d'entreprise validables", "erreurs et solutions"],
    donneesInterdites: ["clés et secrets", "données personnelles (e-mail, téléphone, IBAN)", "contenu de conversations", "prix d'achat fournisseurs"],
    activation: "disponible",
    planCoupure: "Couper le canal : plus aucun élément n'entre ni ne sort ; la boîte garde son contenu, rien n'est effacé.",
    tailleMax: 32_768,
    parMinute: 20,
  },
  paiement: {
    id: "paiement",
    libelle: "Compte de paiement commun (Stripe)",
    sens: "mixte",
    contratBoutique: "shared-stripe-account",
    description: "Contrat déclaré côté Boutique (BLOCKED_EXTERNAL) : clé Stripe et webhook de la Boutique requis. Les moteurs de paiement restent séparés.",
    donneesAutorisees: ["statut d'intention de paiement", "montant", "devise", "référence de commande"],
    donneesInterdites: ["marge fournisseur", "documents clients", "commandes de la plateforme principale"],
    activation: "attente_externe",
    raisonAttente: "En attente de la clé Stripe et du webhook de la Boutique (activation externe, côté Boutique). Aucune connexion n'est possible avant.",
    planCoupure: "Créer un compte Stripe boutique séparé puis réconcilier par références de commande.",
    tailleMax: 0,
    parMinute: 0,
  },
  google: {
    id: "google",
    libelle: "Propriétaire Google commun",
    sens: "mixte",
    contratBoutique: "shared-google-owner",
    description: "Contrat déclaré côté Boutique (BLOCKED_EXTERNAL) : propriétés Google de la Boutique séparées et accès du coffre de la Boutique requis.",
    donneesAutorisees: ["identifiant de propriété", "identifiant de campagne", "état du flux marchand", "métriques de recherche"],
    donneesInterdites: ["mémoire de campagnes de la plateforme principale", "données privées des clients de la Boutique"],
    activation: "attente_externe",
    raisonAttente: "En attente des propriétés Google de la Boutique et de son propre compte Google (activation externe, côté Boutique). Aucune connexion n'est possible avant.",
    planCoupure: "Exporter les propriétés de la Boutique et les reconnecter à son propre compte Google.",
    tailleMax: 0,
    parMinute: 0,
  },
};

export const estCanal = (valeur: unknown): valeur is CanalId => typeof valeur === "string" && (CANAUX_IDS as readonly string[]).includes(valeur);

// ── Routes de la Boutique que la plateforme peut appeler (canal « catalogue ») ───────────────────────────────────────
const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

/**
 * Liste blanche exacte des routes /api/service que le client de la plateforme (server/intelligences/boutique.ts) appelle
 * aujourd'hui. Les routes de prix de vente, de publication et de modification de TVA/stock/livraison existent côté
 * Boutique pour d'autres portées : elles n'y figurent PAS volontairement (refus par défaut).
 */
export const ROUTES_CATALOGUE: { methode: "GET" | "POST" | "PUT"; chemin: RegExp }[] = [
  { methode: "GET", chemin: /^\/capabilities$/ },
  { methode: "GET", chemin: /^\/products$/ },
  { methode: "GET", chemin: new RegExp(`^/products/${UUID}$`) },
  { methode: "GET", chemin: new RegExp(`^/products/${UUID}/(full|preview|videos)$`) },
  { methode: "GET", chemin: new RegExp(`^/products/${UUID}/media/${UUID}/check-preview$`) },
  { methode: "POST", chemin: new RegExp(`^/products/${UUID}/(photos|photos/from-url|videos/from-url|stock-sync|fill-from-supplier|apply-parcels|shipping-grid|media/retire-supplier-versions)$`) },
  { methode: "POST", chemin: new RegExp(`^/products/${UUID}/media/${UUID}/(select|recheck-brand|hide|restore|choose-main|brand-analysis)$`) },
  { methode: "PUT", chemin: new RegExp(`^/products/${UUID}/(draft|parcels)$`) },
];

export function routeAutorisee(methode: string, chemin: string): boolean {
  const m = methode.toUpperCase();
  return ROUTES_CATALOGUE.some((r) => r.methode === m && r.chemin.test(chemin));
}

// ── Filtre de contenu (défense en profondeur : refuse, ne modifie jamais en silence) ────────────────────────────────
const CLE_SECRETE = /(secret|password|mot_?de_?passe|token|jeton|credential|sealed|api_?key|private_?key|cvv|card_?number)/i;
const VALEUR_SECRETE = /(sk-[A-Za-z0-9_-]{16,}|shopsvc_[A-Za-z0-9_-]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.)/;
const DONNEE_PERSONNELLE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]{2,}|\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b|(?:\+|00)\d[\d\s().-]{8,}\d)/;

export interface Inspection {
  ok: boolean;
  /** Chemin de la donnée refusée (jamais sa valeur). */
  chemin?: string;
  raison?: "CLE_SECRETE" | "VALEUR_SECRETE" | "DONNEE_PERSONNELLE" | "TROP_PROFOND";
}

/** Parcourt une valeur JSON et refuse toute clé ou valeur qui ressemble à un secret (et, si demandé, à une donnée personnelle). */
export function inspecter(valeur: unknown, options: { personnelles?: boolean } = {}, chemin = "$", profondeur = 0): Inspection {
  if (profondeur > 10) return { ok: false, chemin, raison: "TROP_PROFOND" };
  if (typeof valeur === "string") {
    if (VALEUR_SECRETE.test(valeur)) return { ok: false, chemin, raison: "VALEUR_SECRETE" };
    if (options.personnelles && DONNEE_PERSONNELLE.test(valeur)) return { ok: false, chemin, raison: "DONNEE_PERSONNELLE" };
    return { ok: true };
  }
  if (Array.isArray(valeur)) {
    for (const [i, v] of valeur.entries()) {
      const r = inspecter(v, options, `${chemin}[${i}]`, profondeur + 1);
      if (!r.ok) return r;
    }
    return { ok: true };
  }
  if (valeur && typeof valeur === "object") {
    for (const [cle, v] of Object.entries(valeur)) {
      if (CLE_SECRETE.test(cle)) return { ok: false, chemin: `${chemin}.${cle}`, raison: "CLE_SECRETE" };
      const r = inspecter(v, options, `${chemin}.${cle}`, profondeur + 1);
      if (!r.ok) return r;
    }
  }
  return { ok: true };
}
