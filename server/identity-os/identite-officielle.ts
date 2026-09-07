/**
 * Identité publique de la plateforme.
 *
 * Tout ce que le public voit d'un compte de direction (PDG, administration)
 * passe par ces valeurs : la marque et le numéro officiel de la société.
 * Le prénom, le nom, l'adresse e-mail ou le numéro personnel de la direction
 * ne sortent jamais d'Identity OS vers un écran public.
 */
export const IDENTITE_OFFICIELLE = {
  nom: "MKA.P-MS",
  telephone: "+33 7 62 44 51 42",
  email: "mka.garageauto@gmail.com",
} as const;

/** Rôles dont l'identité personnelle est masquée au public. */
export const ROLES_DIRECTION = new Set(["admin", "super_admin"]);

export function estDirection(role: string | null | undefined): boolean {
  return role != null && ROLES_DIRECTION.has(role);
}

/** Nom affichable au public pour un compte : marque pour la direction, sinon société ou nom. */
export function nomPublic(
  u: { role?: string | null; companyName?: string | null; name?: string | null },
  repli = "Vendeur",
): string {
  if (estDirection(u.role)) return IDENTITE_OFFICIELLE.nom;
  return u.companyName || u.name || repli;
}
