/**
 * Commutation de l'interrupteur local de la Boutique — le point d'accroche, rien d'autre.
 *
 * Le Centre Cyber-Électrique veut pouvoir ordonner à la Boutique d'ouvrir ou de fermer SON interrupteur local d'une ligne, et savoir si la Boutique l'a fait.
 * La Boutique n'est jamais appelée (sa règle : elle n'est pas un serveur pour la plateforme) : c'est elle qui VIENT chercher les ordres, signés comme tous ses
 * messages, puis qui renvoie un accusé SIGNÉ contenant l'état qu'elle observe elle-même. Sans ce rapport signé et frais, l'état distant n'est jamais « connecté ».
 *
 * Fichier-feuille : il n'importe rien. Le centre y branche son fournisseur ; sans centre branché, aucun ordre n'existe et tout accusé est refusé.
 */
export interface OrdreCommutation {
  id: number;
  /** Identifiant de la ligne côté Boutique (la clé de l'intermédiaire, par exemple « shop-documents-only »). */
  ligne: string;
  voulu: "activate" | "deactivate";
  /** Instant limite (ISO) au-delà duquel l'ordre n'est plus valable : la Boutique l'ignore. */
  expireLe: string;
}

export interface AccuseCommutation {
  /** Numéro de l'ordre accusé, ou null pour un rapport spontané de l'état de l'interrupteur. */
  ordre: number | null;
  ligne: string;
  /** État de l'interrupteur local tel que la Boutique l'observe elle-même. */
  etat: "connected" | "disconnected";
  observeLe: string;
}

export interface BilanAccuses {
  acceptes: number;
  refuses: { ligne: string; raison: string }[];
}

export interface FournisseurCommutation {
  /** Ordres à remettre à la Boutique (ils passent « remis »). */
  ordres(): Promise<OrdreCommutation[]>;
  /** Accusés et rapports reçus, déjà authentifiés par la signature de la clé `cleId`. */
  accuses(liste: readonly AccuseCommutation[], cleId: number): Promise<BilanAccuses>;
}

let courant: FournisseurCommutation | null = null;

export function brancherCommutation(f: FournisseurCommutation | null): void {
  courant = f;
}

export async function ordresEnAttente(): Promise<{ disponible: boolean; ordres: OrdreCommutation[] }> {
  if (!courant) return { disponible: false, ordres: [] };
  return { disponible: true, ordres: await courant.ordres() };
}

export async function recevoirAccuses(liste: readonly AccuseCommutation[], cleId: number): Promise<BilanAccuses | null> {
  if (!courant) return null;
  return courant.accuses(liste, cleId);
}
