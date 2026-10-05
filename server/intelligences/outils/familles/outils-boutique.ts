/**
 * MKA.P-MS AI — implémentations réelles des outils Boutique (server/intelligences/outils/familles/boutique.ts).
 * L'adresse et le jeton sont lus dans le coffre par le code serveur, avec un motif journalisé, et ne quittent jamais
 * cette fonction (server/intelligences/boutique.ts).
 */
import type { ImplementationOutil } from "../outils-test.js";
import {
  accesBoutique,
  choisirPhotoPrincipaleBoutique,
  ajouterMediaParLienBoutique,
  retirerMediaGalerieBoutique,
  capacitesBoutique,
  lancerPhotosBoutique,
  listerProduitsBoutique,
  lireFicheCompleteBoutique,
  lireProduitBoutique,
  proposerFicheBoutique,
  synchroniserStockBoutique,
  definirColisBoutique,
  remplirFicheDepuisFournisseurBoutique,
  appliquerColisFournisseurBoutique,
  lireApercuBoutique,
  recontrolerMarquePhotoBoutique,
  importerGrilleLivraisonBoutique,
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
  "boutique.lireFicheComplete": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.lireFicheComplete", "Lire la fiche complète (prix, colis, stock, photos) d'un produit de la boutique, demandé par le PDG");
    return a.ok ? lireFicheCompleteBoutique(a, args.produitId) : { ok: false, detail: a.detail };
  },
  "boutique.choisirPhotoPrincipale": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.choisirPhotoPrincipale", "Choisir la photo principale d'une fiche de la boutique, demandé par le PDG");
    return a.ok ? choisirPhotoPrincipaleBoutique(a, args.produitId, args.mediaId) : { ok: false, detail: a.detail };
  },
  "boutique.synchroniserStock": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.synchroniserStock", "Synchroniser le stock du fournisseur d'un produit de la boutique, demandé par le PDG");
    return a.ok ? synchroniserStockBoutique(a, args.produitId) : { ok: false, detail: a.detail };
  },
  "boutique.lireApercu": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.lireApercu", "Lire l'aperçu (page de vente) d'un produit de la boutique, demandé par le PDG");
    return a.ok ? lireApercuBoutique(a, args.produitId) : { ok: false, detail: a.detail };
  },
  "boutique.recontrolerMarquePhoto": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.recontrolerMarquePhoto", "Relancer le contrôle de marque d'une photo d'un produit de la boutique, demandé par le PDG");
    return a.ok ? recontrolerMarquePhotoBoutique(a, args.produitId, args.mediaId) : { ok: false, detail: a.detail };
  },
  "boutique.definirColis": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.definirColis", "Enregistrer le nombre de colis d'un produit de la boutique, demandé par le PDG");
    return a.ok ? definirColisBoutique(a, args.produitId, { nombre: args.nombre, preuve: args.preuve }) : { ok: false, detail: a.detail };
  },
  "boutique.remplirFicheDepuisFournisseur": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.remplirFicheDepuisFournisseur", "Reprendre dans une fiche de la boutique les caractéristiques données par le fournisseur, demandé par le PDG");
    return a.ok ? remplirFicheDepuisFournisseurBoutique(a, args.produitId) : { ok: false, detail: a.detail };
  },
  "boutique.appliquerColisFournisseur": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.appliquerColisFournisseur", "Appliquer le nombre de colis indiqué par le fournisseur à un produit de la boutique, demandé par le PDG");
    return a.ok ? appliquerColisFournisseurBoutique(a, args.produitId) : { ok: false, detail: a.detail };
  },
  "boutique.importerGrilleLivraison": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.importerGrilleLivraison", "Enregistrer la grille de livraison du fournisseur d'un produit de la boutique, demandé par le PDG");
    return a.ok ? importerGrilleLivraisonBoutique(a, args.produitId, { grille: args.grille, devise: args.devise, base: args.base, taxe: args.taxe, preuve: args.preuve, valideJusqua: args.valideJusqua, apercu: args.apercu }) : { ok: false, detail: a.detail };
  },
  "boutique.ajouterMediaParLien": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.ajouterMediaParLien", "Ajouter une photo ou une vidéo (lien) à une fiche de la boutique, demandé par le PDG");
    return a.ok ? ajouterMediaParLienBoutique(a, args.produitId, { url: args.url, type: args.type, principale: args.principale, reelle: args.reelle, droits: args.droits, libelle: args.libelle }) : { ok: false, detail: a.detail };
  },
  "boutique.retirerMediaGalerie": async (args, contexte) => {
    const a = await accesBoutique(compteAppelant(contexte), "boutique.retirerMediaGalerie", "Retirer (ou remettre) une photo de la galerie d'une fiche de la boutique, demandé par le PDG");
    return a.ok ? retirerMediaGalerieBoutique(a, args.produitId, args.mediaId, args.remettre) : { ok: false, detail: a.detail };
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
