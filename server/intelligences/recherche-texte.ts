/**
 * LOT IA02F — construction partagée d'une requête `to_tsquery` PostgreSQL.
 *
 * `plainto_tsquery` combine tous les mots par ET logique : une question en
 * langage naturel ("quel est le montant du devis de réparation ?") échoue
 * dès qu'un seul mot de la question est absent du document, même quand le
 * document contient clairement la réponse. Ce module construit une requête
 * en OU logique (chaque mot significatif, préfixe inclus) — le classement
 * par pertinence (`ts_rank`) reste réel, seule la présence d'AU MOINS un mot
 * devient suffisante pour être candidat, comme tout moteur de recherche.
 */
export function versTsQuery(query: string): string {
  const mots = query.match(/[\p{L}\p{N}]{2,}/gu) ?? [];
  if (mots.length === 0) return "";
  return mots.map((m) => `${m}:*`).join(" | ");
}
