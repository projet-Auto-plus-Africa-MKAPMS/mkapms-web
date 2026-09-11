/**
 * MKA.P-MS Intelligence — niveaux d'accès de l'application dédiée.
 *
 * Six niveaux, du plus ouvert au plus large : ce que chaque module expose
 * dépendra de ce niveau et, plus tard, de l'abonnement — jamais d'un simple
 * « PDG ou tout le monde ». Socle uniquement : ce fichier calcule le niveau,
 * il ne décide pas encore ce que chaque module en fait (les modules ne sont
 * pas construits).
 *
 * S'appuie sur les rôles déjà existants (server/schema.ts, userRoleEnum) et
 * sur la Plateforme développeur déjà existante (server/intelligences/
 * developpeur.ts) — aucun rôle parallèle créé.
 */

export type NiveauIntelligence =
  | "public"
  | "professionnel"
  | "developpeur"
  | "equipe_interne"
  | "direction"
  | "pdg";

export const NIVEAUX_INTELLIGENCE: { niveau: NiveauIntelligence; label: string }[] = [
  { niveau: "public", label: "Utilisateur public / client" },
  { niveau: "professionnel", label: "Professionnel" },
  { niveau: "developpeur", label: "Développeur (clé Plateforme développeur)" },
  { niveau: "equipe_interne", label: "Équipe interne" },
  { niveau: "direction", label: "Direction" },
  { niveau: "pdg", label: "PDG / Super Admin" },
];

/**
 * Calcule le niveau à partir du rôle de session (userRoleEnum) et d'une clé
 * développeur active éventuelle. Le rôle "pro"/"garage"/"society" du compte
 * n'empêche pas d'être aussi développeur : la clé prime quand elle est
 * présente, car elle porte ses propres permissions et sa propre portée.
 */
export function niveauDepuis(input: {
  role: string | null | undefined;
  aUneCleDeveloppeurActive?: boolean;
}): NiveauIntelligence {
  if (input.aUneCleDeveloppeurActive) return "developpeur";
  switch (input.role) {
    case "super_admin":
      return "pdg";
    case "admin":
      return "direction";
    case "employee":
      return "equipe_interne";
    case "pro":
    case "garage":
    case "society":
      return "professionnel";
    default:
      return "public";
  }
}
