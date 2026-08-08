/**
 * MKA.P-MS Account Routing Engine — règle centrale de retour à l'univers.
 *
 * Un compte revient TOUJOURS dans son univers : particulier → espace
 * particulier, garage → espace garage, vendeur → espace vendeur, loueur →
 * location, VTC/Taxi → son environnement, administration → administration,
 * direction → direction, PDG → Super Admin.
 *
 * Source unique partagée client/serveur : la même décision est prise des deux
 * côtés, pour qu'une page ne puisse pas router autrement que le serveur.
 */

export type AccountUniverse =
  | "particulier"
  | "vendeur"
  | "garage"
  | "carrosserie"
  | "location"
  | "vtc_taxi"
  | "pieces"
  | "livraison"
  | "flotte"
  | "comptabilite"
  | "administration"
  | "direction"
  | "pdg";

export interface AccountIdentity {
  role?: string | null;
  accountType?: string | null;
  proCategory?: string | null;
  staffPosition?: string | null;
}

export interface AccountRoute {
  universe: AccountUniverse;
  /** Page d'accueil du compte après connexion. */
  homePath: string;
  label: string;
  /**
   * `true` quand l'univers n'a pas encore d'espace dédié et retombe sur un
   * espace voisin. On le dit au lieu de laisser croire à un espace complet.
   */
  fallback: boolean;
}

interface RouteDef {
  universe: AccountUniverse;
  homePath: string;
  label: string;
  fallback?: boolean;
}

/**
 * Destinations par univers. Modifier une destination ici la change partout —
 * connexion, inscription, retour d'espace et redirections serveur.
 */
export const UNIVERSE_ROUTES: Record<AccountUniverse, RouteDef> = {
  particulier: { universe: "particulier", homePath: "/compte", label: "Espace particulier" },
  vendeur: { universe: "vendeur", homePath: "/espace-pro", label: "Espace vendeur" },
  garage: { universe: "garage", homePath: "/garage-plus", label: "Espace garage" },
  carrosserie: { universe: "carrosserie", homePath: "/garage-plus", label: "Espace carrosserie", fallback: true },
  location: { universe: "location", homePath: "/louer", label: "Espace location" },
  vtc_taxi: { universe: "vtc_taxi", homePath: "/espace-pro", label: "Espace VTC / Taxi", fallback: true },
  pieces: { universe: "pieces", homePath: "/pieces", label: "Espace pièces" },
  livraison: { universe: "livraison", homePath: "/livraison", label: "Espace livraison" },
  flotte: { universe: "flotte", homePath: "/entreprises/compte-flotte", label: "Espace flotte" },
  comptabilite: { universe: "comptabilite", homePath: "/comptabilite", label: "Espace comptabilité" },
  administration: { universe: "administration", homePath: "/admin", label: "Administration" },
  direction: { universe: "direction", homePath: "/admin", label: "Direction" },
  pdg: { universe: "pdg", homePath: "/superadmin", label: "Super Admin" },
};

/** Métier professionnel → univers. Aligné sur l'énum `pro_category`. */
const PRO_CATEGORY_UNIVERSE: Record<string, AccountUniverse> = {
  garage: "garage",
  carrossier: "carrosserie",
  depanneur: "garage",
  centre_ct: "garage",
  concessionnaire: "vendeur",
  marchand: "vendeur",
  revendeur: "vendeur",
  expert_auto: "vendeur",
  loueur: "location",
  convoyeur: "livraison",
  fournisseur_pieces: "pieces",
};

/**
 * Univers d'un compte. L'ordre compte : la direction prime sur le métier,
 * le métier déclaré prime sur le rôle générique.
 */
export function resolveUniverse(identity: AccountIdentity): AccountUniverse {
  const role = identity.role ?? "user";
  const position = identity.staffPosition ?? null;

  if (role === "super_admin" || position === "pdg") return "pdg";
  if (position === "directeur" || position === "adjoint") return "direction";
  if (role === "admin" || role === "employee") return "administration";

  const byCategory = identity.proCategory ? PRO_CATEGORY_UNIVERSE[identity.proCategory] : undefined;
  if (byCategory) return byCategory;

  if (role === "garage") return "garage";
  if (role === "society") return "location";
  if (role === "pro") return "vendeur";
  return "particulier";
}

export function resolveAccountRoute(identity: AccountIdentity): AccountRoute {
  const universe = resolveUniverse(identity);
  const def = UNIVERSE_ROUTES[universe];
  return { universe, homePath: def.homePath, label: def.label, fallback: !!def.fallback };
}

/** Univers professionnels : ce qui ne doit jamais apparaître chez un particulier. */
export const PROFESSIONAL_UNIVERSES: AccountUniverse[] = [
  "vendeur", "garage", "carrosserie", "location", "vtc_taxi",
  "pieces", "livraison", "flotte",
];

/** Univers internes MKA.P-MS : réservés à l'équipe. */
export const INTERNAL_UNIVERSES: AccountUniverse[] = [
  "comptabilite", "administration", "direction", "pdg",
];

export function isProfessionalUniverse(u: AccountUniverse): boolean {
  return PROFESSIONAL_UNIVERSES.includes(u);
}

export function isInternalUniverse(u: AccountUniverse): boolean {
  return INTERNAL_UNIVERSES.includes(u);
}
