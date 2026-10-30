/**
 * Choix manuel de modèle — réglage partagé entre les écrans direction
 * AL-HUDHUD·M (CentreIntelligences.tsx, Conversation.tsx), même principe que
 * lib/intensite.ts : un seul réglage, pas deux implémentations.
 *
 * "auto" (par défaut, aucune configuration requise pour démarrer) laisse le
 * serveur choisir — comportement actuel, inchangé. Un choix explicite est
 * toujours respecté tel quel : le serveur ne bascule jamais silencieusement
 * vers un autre modèle (voir server/intelligences/provider.ts,
 * MODELES_SELECTIONNABLES) ; la seule exception honnête est un modèle choisi
 * mais réellement indisponible sur le compte au moment de l'appel — c'est
 * pourquoi le modèle réellement utilisé est toujours réaffiché après coup
 * (voir `modeleReponseDiffere`), jamais supposé identique au choix.
 *
 * Les libellés viennent du serveur (trpc.intelligences.modelesDisponibles) et
 * ne sont jamais l'identifiant technique réel ni un nom de fournisseur —
 * l'écran ne les invente ni ne les complète jamais ici.
 */
export const CLE_MODELE_STOCKAGE = "mkapms_modele_ia";
export const MODELE_AUTO = "auto";

export function modeleValide(valeur: string | null, idsConnus: string[]): string {
  return valeur && (valeur === MODELE_AUTO || idsConnus.includes(valeur)) ? valeur : MODELE_AUTO;
}

/**
 * Nom affichable pour un identifiant technique de modèle (jamais l'identifiant
 * brut à l'écran) : résout contre la liste réelle reçue du serveur, et renvoie
 * un libellé générique neutre — jamais l'identifiant lui-même — pour tout
 * modèle hors de cette liste (ex. un repli fournisseur rare).
 */
export function libelleModele(idBrut: string | null, modeles: { id: string; label: string }[]): string {
  const trouve = idBrut ? modeles.find((m) => m.id === idBrut) : undefined;
  return trouve?.label ?? "Autre modèle vérifié";
}

/**
 * Vrai si le modèle réellement utilisé pour une réponse diffère du choix
 * explicite envoyé — jamais caché : l'écran doit le dire, pas le masquer.
 * Compare les identifiants techniques (jamais affichés), pas les libellés.
 */
export function modeleReponseDiffere(choixEnvoye: string | undefined, idReponse: string | null): boolean {
  if (!choixEnvoye || choixEnvoye === MODELE_AUTO) return false;
  if (!idReponse) return false;
  return idReponse !== choixEnvoye;
}
