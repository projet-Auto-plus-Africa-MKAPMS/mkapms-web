/**
 * MKA.P-MS AI — implémentations réelles des outils Boutique (server/intelligences/outils/familles/boutique.ts).
 * L'adresse et le jeton sont lus dans le coffre par le code serveur, avec un motif journalisé, et ne quittent jamais
 * cette fonction (server/intelligences/boutique.ts).
 */
import type { ImplementationOutil } from "../outils-test.js";
import {
  accesBoutique,
  capacitesBoutique,
  lancerPhotosBoutique,
  listerProduitsBoutique,
  lireProduitBoutique,
  proposerFicheBoutique,
  type FicheProposee,
} from "../../boutique.js";

function compteAppelant(contexte: { actorId?: number | null } | undefined): number {
  if (typeof contexte?.actorId !== "number") {
    throw new Error("Compte appelant inconnu : le coffre n'est lisible que pour le compte qui l'a rempli.");
  }
  return contexte.actorId;
}

const nombre = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "boutique.capacites": async (_args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.capacites", "Connaître les portées du jeton de la boutique, demandé par le PDG");
    return a.ok ? capacitesBoutique(a) : { ok: false, detail: a.detail };
  },
  "boutique.listerProduits": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.listerProduits", "Lister les fiches produit de la boutique, demandé par le PDG");
    if (!a.ok) return { ok: false, detail: a.detail, rows: [] };
    return listerProduitsBoutique(a, { etat: typeof args.etat === "string" ? args.etat : undefined, limite: nombre(args.limite), decalage: nombre(args.decalage) });
  },
  "boutique.lireProduit": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.lireProduit", "Lire une fiche produit de la boutique, demandé par le PDG");
    return a.ok ? lireProduitBoutique(a, args.produitId) : { ok: false, detail: a.detail };
  },
  "boutique.lancerPhotos": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.lancerPhotos", "Lancer la préparation des photos d'une fiche de la boutique, demandé par le PDG");
    return a.ok ? lancerPhotosBoutique(a, args.produitId) : { ok: false, detail: a.detail };
  },
  "boutique.proposerFiche": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.proposerFiche", "Proposer le brouillon d'une fiche de la boutique, demandé par le PDG");
    if (!a.ok) return { ok: false, detail: a.detail };
    const fiche: FicheProposee = {
      revisionAttendue: Number(args.revisionAttendue),
      titre: String(args.titre ?? ""),
      descriptionBoutique: String(args.descriptionBoutique ?? ""),
      champs: (args.champs && typeof args.champs === "object" && !Array.isArray(args.champs) ? args.champs : {}) as FicheProposee["champs"],
      colis: (Array.isArray(args.colis) ? args.colis : []) as FicheProposee["colis"],
    };
    return proposerFicheBoutique(a, args.produitId, fiche);
  },
};
