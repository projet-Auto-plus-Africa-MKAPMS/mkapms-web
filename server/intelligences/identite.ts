/**
 * MKA.P-MS Intelligences — identité publique centralisée (LOT IA02A).
 *
 * Une seule source pour le nom que voit un utilisateur et pour le texte
 * générique affiché quand un appel de modèle échoue. Aucune interface
 * publique ou utilisateur ne doit composer elle-même un message d'échec :
 * elle affiche ce texte, jamais le détail technique (fournisseur, modèle,
 * code HTTP, variable d'environnement), qui reste réservé aux zones internes
 * autorisées (Centre Intelligence & Coûts, journaux, Chantier de
 * développement — toutes réservées à la direction).
 */
export const NOM_PRODUIT = "MKA.P-MS Intelligence";

export const MOTIF_PUBLIC_INDISPONIBLE =
  "Le service MKA.P-MS Intelligence est temporairement indisponible. Réessayez dans un instant.";

/**
 * États produit honnêtes, sans aucun détail fournisseur.
 * `available` : au moins deux fournisseurs connectés et testés utilisables (redondance réelle).
 * `degraded` : un seul fournisseur connecté et testé utilisable (aucune redondance réelle).
 * `unavailable` : aucun fournisseur connecté et testé utilisable.
 * `maintenance` : jamais renvoyé tant qu'aucun interrupteur de maintenance réel n'existe —
 *   présent dans le type pour ne pas devoir le rajouter plus tard, jamais fabriqué aujourd'hui.
 */
export const ETATS_SERVICE_PUBLIC = ["available", "degraded", "unavailable", "maintenance"] as const;
export type EtatServicePublic = (typeof ETATS_SERVICE_PUBLIC)[number];
