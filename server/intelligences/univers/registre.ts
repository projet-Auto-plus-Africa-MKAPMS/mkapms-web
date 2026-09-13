/**
 * MKA.P-MS Intelligences — Universe Registry (lecture calculée).
 *
 * Combine la déclaration manuelle (mapping.ts) avec les données déjà réelles
 * du dépôt — jamais une resaisie :
 *  - routes/procédures/tables/dépendances réelles : server/data/moteurs.ts
 *    (généré par scripts/gen-moteurs.mjs) ;
 *  - outils réellement enregistrés : server/intelligences/outils/registre.ts.
 *
 * Le statut de connexion Intelligence par univers (INTELLIGENCE_CONNECTED …
 * NO_INTELLIGENCE_INTEGRATION) est calculé à partir de preuves concrètes
 * (existence de tours de chat réels, d'outils exécutables) — jamais déclaré
 * à la main : un univers ne devient « connecté » que par du code qui le rend
 * vrai, pas par une ligne changée ici.
 */
import { MOTEURS } from "../../data/moteurs.js";
import { OUTILS, type Categorie } from "../outils/registre.js";
import { MOTEUR_VERS_UNIVERS, UNIVERS_DEFINIS, type UniversSpec } from "./mapping.js";

/**
 * Préfixes de routes masqués à l'assistant embarqué générique
 * (client/src/components/AssistantFlottant.tsx::ECRANS_DIRECTION) — dupliqué
 * ici en connaissance de cause (4 entrées, un fichier client ne s'importe pas
 * côté serveur) ; tout changement côté client doit être reporté ici.
 */
const ECRANS_DIRECTION = ["/admin", "/superadmin", "/intelligences", "/comptabilite"];

function routeMasqueeAssistantEmbarque(route: string): boolean {
  return ECRANS_DIRECTION.some((p) => route === p || route.startsWith(`${p}/`));
}

/** Univers vers lequel router chaque catégorie du Tool Registry, pour mesurer la couverture réelle. */
const CATEGORIE_OUTIL_VERS_UNIVERS: Record<Categorie, string> = {
  vehicules: "marketplace_particulier",
  paiements: "paiements_finance",
  remboursements: "paiements_finance",
  payouts: "paiements_finance",
  ledger_comptabilite: "comptabilite",
  fournisseurs: "partenaires_fournisseurs",
  pieces: "pieces_stock",
  compatibilite_pieces: "pieces_stock",
  stock: "pieces_stock",
  transport: "transport_livraison",
  livraison: "transport_livraison",
  douane: "transport_livraison",
  documents: "cartegrise_documents",
  fichiers: "plateforme_infrastructure",
  recherche: "plateforme_infrastructure",
  communication: "support_messagerie",
  notifications: "support_messagerie",
  comptes: "identite_comptes",
  roles: "identite_comptes",
  permissions: "plateforme_infrastructure",
  securite: "identite_comptes",
  administration: "plateforme_infrastructure",
  donnees: "identite_comptes",
  marketplace: "marketplace_professionnel",
  railway_deploiement: "plateforme_infrastructure",
  observabilite: "plateforme_infrastructure",
  api_externes: "plateforme_infrastructure",
  futurs_moteurs: "plateforme_infrastructure",
  test: "plateforme_infrastructure",
  projets: "intelligence_produit",
  developpement: "intelligence_produit",
  estimations: "intelligence_produit",
};

export type StatutConnexion =
  | "INTELLIGENCE_CONNECTED"
  | "PARTIALLY_CONNECTED"
  | "UI_ONLY"
  | "BACKEND_ONLY"
  | "REGISTERED_NOT_CONNECTED"
  | "NO_INTELLIGENCE_INTEGRATION";

export interface UniversConstate extends UniversSpec {
  engineIds: string[];
  routes: string[];
  procedures: string[];
  tables: string[];
  outilsActifs: string[];
  outilsEnregistresNonConnectes: string[];
  pointsDeContact: string[];
  statut: StatutConnexion;
  motifStatut: string;
}

function verifierCouvertureMoteurs(): void {
  const declares = new Set(Object.keys(MOTEUR_VERS_UNIVERS));
  const reels = new Set(MOTEURS.map((m) => m.moteur));
  const manquants = [...reels].filter((m) => !declares.has(m));
  const fantomes = [...declares].filter((m) => !reels.has(m));
  if (manquants.length > 0) {
    throw new Error(
      `Universe Registry incomplet : moteur(s) réel(s) sans univers déclaré dans mapping.ts : ${manquants.join(", ")}.`,
    );
  }
  if (fantomes.length > 0) {
    throw new Error(
      `Universe Registry périmé : mapping.ts déclare un moteur qui n'existe plus au catalogue : ${fantomes.join(", ")}.`,
    );
  }
  const idsConnus = new Set(UNIVERS_DEFINIS.map((u) => u.universeId));
  for (const [moteur, universeId] of Object.entries(MOTEUR_VERS_UNIVERS)) {
    if (!idsConnus.has(universeId)) {
      throw new Error(`Universe Registry incohérent : le moteur « ${moteur} » pointe vers un univers inconnu « ${universeId} ».`);
    }
  }
}

/** Cartographie complète, calculée — jamais mise en cache : elle doit toujours refléter le code réel. */
export function registre(): UniversConstate[] {
  verifierCouvertureMoteurs();

  return UNIVERS_DEFINIS.map((spec) => {
    const engineIds = Object.entries(MOTEUR_VERS_UNIVERS)
      .filter(([, u]) => u === spec.universeId)
      .map(([moteur]) => moteur);
    const moteursReels = MOTEURS.filter((m) => engineIds.includes(m.moteur));

    const routes = [...new Set(moteursReels.flatMap((m) => m.routes))].sort();
    const procedures = [...new Set(moteursReels.flatMap((m) => m.procedures))].sort();
    const tables = [...new Set(moteursReels.flatMap((m) => m.tables))].sort();

    const outilsDeLUnivers = OUTILS.filter((o) => CATEGORIE_OUTIL_VERS_UNIVERS[o.category] === spec.universeId);
    const outilsActifs = outilsDeLUnivers.filter((o) => o.enabled && o.implementationStatus !== "REGISTERED_NOT_IMPLEMENTED").map((o) => o.toolId);
    const outilsEnregistresNonConnectes = outilsDeLUnivers.filter((o) => o.implementationStatus === "REGISTERED_NOT_IMPLEMENTED").map((o) => o.toolId);

    const aUneRouteVisibleAssistantEmbarque = routes.some((r) => !routeMasqueeAssistantEmbarque(r));
    const aAccesDirection = spec.rolesAutorises.includes("super_admin") || spec.rolesAutorises.includes("admin");

    const pointsDeContact: string[] = [];
    if (aUneRouteVisibleAssistantEmbarque) {
      pointsDeContact.push(
        "assistant_embarque_generique (AssistantFlottant.tsx — présent sur ces écrans, mais générique : ne connaît pas cet univers, aucun outil dédié)",
      );
    }
    if (aAccesDirection) {
      pointsDeContact.push(
        "centre_intelligence_direction_generique (CentreIntelligences.tsx, côté PDG — n'injecte aujourd'hui aucune donnée propre à cet univers, seulement santé des moteurs/alertes/avancement/code)",
      );
    }
    if (outilsActifs.length > 0) pointsDeContact.push(`tool_registry_actif (${outilsActifs.length} outil(s) exécutable(s))`);
    if (outilsEnregistresNonConnectes.length > 0) {
      pointsDeContact.push(`tool_registry_enregistre_non_implemente (${outilsEnregistresNonConnectes.length} fiche(s), aucun code d'exécution)`);
    }

    let statut: StatutConnexion;
    let motifStatut: string;
    if (outilsActifs.length > 0 && pointsDeContact.some((p) => p.startsWith("assistant_embarque") || p.startsWith("centre_intelligence"))) {
      statut = "PARTIALLY_CONNECTED";
      motifStatut =
        "Des outils réels existent ET un point de conversation existe, mais aucun Context Engine ne relie encore l'un à l'autre pour cet univers précis (le modèle ne sait pas qu'il est dans cet univers) — jamais déclaré pleinement connecté tant que ce lien n'est pas prouvé.";
    } else if (outilsActifs.length > 0) {
      statut = "BACKEND_ONLY";
      motifStatut = "Des outils réels existent au Tool Registry mais aucune surface de conversation ne les propose pour cet univers.";
    } else if (outilsEnregistresNonConnectes.length > 0) {
      statut = "REGISTERED_NOT_CONNECTED";
      motifStatut = "Des fiches existent au Tool Registry pour ce domaine, sans aucune implémentation réelle derrière.";
    } else if (pointsDeContact.length > 0) {
      statut = "UI_ONLY";
      motifStatut = "Une conversation générique est joignable (assistant embarqué et/ou Centre Intelligence direction), sans aucun outil dédié à cet univers.";
    } else {
      statut = "NO_INTELLIGENCE_INTEGRATION";
      motifStatut = spec.conversationnel
        ? "Aucun point de contact Intelligence réel trouvé pour cet univers à ce jour."
        : "Univers non conversationnel par conception (infrastructure technique ou droit contractuel isolé) — pas un manque à corriger.";
    }

    return {
      ...spec,
      engineIds: engineIds.sort(),
      routes,
      procedures,
      tables,
      outilsActifs,
      outilsEnregistresNonConnectes,
      pointsDeContact,
      statut,
      motifStatut,
    };
  });
}

export function univers(universeId: string): UniversConstate | null {
  return registre().find((u) => u.universeId === universeId) ?? null;
}

export function universDeRoute(route: string): UniversConstate | null {
  return registre().find((u) => u.routes.some((r) => route === r || route.startsWith(`${r}/`))) ?? null;
}

export function universDuMoteur(moteur: string): UniversConstate | null {
  const universeId = MOTEUR_VERS_UNIVERS[moteur];
  return universeId ? univers(universeId) : null;
}
