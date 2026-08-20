/**
 * Points 127-129 — routage interne des capacités.
 *
 * Un moteur métier ne choisit jamais un fournisseur : il demande une
 * **capacité** (« raisonnement », « vision », « traduction »…). Ce fichier est
 * le seul chemin autorisé. Il fait, dans cet ordre :
 *
 *   1. la capacité existe-t-elle au registre ?          (sinon : refus nommé)
 *   2. l'appelant a-t-il la permission exigée ?          (sinon : refus nommé)
 *   3. le niveau d'autonomie du domaine l'autorise-t-il ? (point 132)
 *   4. la confidentialité demandée est-elle acceptable ? (sinon : refus nommé)
 *   5. la capacité est-elle constatée exécutable ?       (sinon : motif exact)
 *   6. appel réel via la couche fournisseur unique.
 *
 * Règle tenue : un refus est un refus écrit, jamais une réponse plausible
 * fabriquée pour sauver l'apparence. Le repli propriétaire, quand il existe,
 * est nommé dans le motif afin que l'appelant sache quoi faire.
 */
import { appeler, type AppelResultat } from "./provider.js";
import {
  registre,
  spec,
  type CodeCapacite,
  type Permission,
  PERMISSIONS,
} from "./capacites.js";
import { autorise } from "./autonomie.js";
import type { Confidentiality } from "../ai-fabric/service.js";

/**
 * Permissions accordées par rôle (point 146). Le PDG possède tout ; les autres
 * rôles ne reçoivent que ce que leur métier justifie. Un rôle inconnu n'a rien.
 */
const PERMISSIONS_PAR_ROLE: Record<string, Permission[]> = {
  super_admin: [...PERMISSIONS],
  admin: ["READ", "ANALYZE", "PROPOSE", "TEST"],
  employee: ["READ", "ANALYZE"],
  garage: ["READ", "ANALYZE"],
  pro: ["READ", "ANALYZE"],
  society: ["READ", "ANALYZE"],
  user: ["READ"],
};

export function permissionsDuRole(role: string | null | undefined): Permission[] {
  if (!role) return [];
  return PERMISSIONS_PAR_ROLE[role] ?? [];
}

/**
 * Curseur d'autonomie qui gouverne chaque capacité (point 132). Le rôle dit ce
 * qu'une personne peut demander ; le curseur dit ce que la plateforme s'autorise
 * à faire elle-même. Les deux doivent être ouverts.
 */
const DOMAINE_AUTONOMIE: Partial<Record<CodeCapacite, string>> = {
  code: "code",
  image: "contenu",
  traduction: "contenu",
  documents: "contenu",
  outils: "moteurs",
  automatisation: "moteurs",
};

/** Ordre de gravité des niveaux de confidentialité, du plus ouvert au plus fermé. */
const NIVEAUX: Confidentiality[] = ["publique", "personnelle", "confidentielle"];

export interface DemandeCapacite {
  capacite: CodeCapacite;
  /** Moteur MKA appelant : tracé, et refusé s'il ne se nomme pas. */
  moteur: string;
  /** Ce que l'appelant veut obtenir, en clair. */
  message: string;
  /** Consigne de rôle envoyée au modèle. */
  systeme: string;
  /** Rôle de l'utilisateur à l'origine de la demande. */
  role: string | null;
  confidentialite?: Confidentiality;
  countryCode?: string | null;
  images?: string[];
  maxTokens?: number;
  /** Domaine du curseur d'autonomie, quand l'appelant en connaît un plus précis. */
  domaineAutonomie?: string;
}

export interface ResultatCapacite extends AppelResultat {
  capacite: CodeCapacite;
  /** Repli propriétaire à utiliser quand l'appel n'a pas eu lieu. */
  repli: string;
}

function refus(
  capacite: CodeCapacite,
  motif: string,
  repli: string,
): ResultatCapacite {
  return {
    capacite,
    ok: false,
    texte: "",
    fournisseur: null,
    modele: null,
    motif,
    repli,
    jetonsEntree: 0,
    jetonsSortie: 0,
    dureeMs: 0,
  };
}

/**
 * Unique porte d'entrée des capacités. Aucun moteur métier n'a le droit
 * d'appeler `provider.appeler` directement : `scripts/check-providers.mjs`
 * échoue le build si cela réapparaît.
 */
export async function router(demande: DemandeCapacite): Promise<ResultatCapacite> {
  const s = spec(demande.capacite);

  if (!demande.moteur.trim()) {
    return refus(
      demande.capacite,
      "Appel anonyme refusé : le moteur appelant doit se nommer pour être tracé.",
      s.repliInterne,
    );
  }

  const accordees = permissionsDuRole(demande.role);
  if (!accordees.includes(s.permission)) {
    return refus(
      demande.capacite,
      `Permission ${s.permission} exigée pour « ${s.libelle} » : le rôle « ${demande.role ?? "aucun"} » ne l'a pas.`,
      s.repliInterne,
    );
  }

  const domaine =
    demande.domaineAutonomie ?? DOMAINE_AUTONOMIE[demande.capacite] ?? "global";
  const curseur = await autorise(domaine, s.permission);
  if (!curseur.autorise) {
    return refus(demande.capacite, curseur.motif, s.repliInterne);
  }

  const demandee = demande.confidentialite ?? "publique";
  if (NIVEAUX.indexOf(demandee) > NIVEAUX.indexOf(s.confidentialiteMax)) {
    return refus(
      demande.capacite,
      `Données ${demandee} refusées pour « ${s.libelle} » : cette capacité ne dépasse pas le niveau ${s.confidentialiteMax}.`,
      s.repliInterne,
    );
  }

  const constate = (await registre()).find((c) => c.code === demande.capacite);
  if (!constate || constate.etat !== "disponible") {
    return refus(
      demande.capacite,
      constate?.motif ?? "Capacité non constatée disponible.",
      s.repliInterne,
    );
  }

  if (!s.capaciteFabrique) {
    return refus(
      demande.capacite,
      `« ${s.libelle} » est propriétaire : elle s'obtient auprès des moteurs ${s.moteurs.join(", ")}, pas d'un fournisseur de modèle.`,
      s.repliInterne,
    );
  }

  const r = await appeler({
    capacite: s.capaciteFabrique,
    tache: demande.capacite,
    moteur: demande.moteur,
    systeme: demande.systeme,
    message: demande.message,
    confidentialite: demandee,
    countryCode: demande.countryCode ?? null,
    images: demande.images,
    maxTokens: demande.maxTokens,
  });

  return { ...r, capacite: demande.capacite, repli: s.repliInterne };
}
