/**
 * Panier de pièces de l'atelier — catalogue partagé et panier persistant.
 *
 * Le panier vit dans le navigateur du garage jusqu'à la commande : c'est
 * l'envoi de la demande (devis.create) qui le fait entrer dans la plateforme.
 */

export interface PieceCatalogue {
  ref: string;
  marque: string;
  label: string;
  prix: number;
  montagePrix: number;
  stock: number;
  compat: string;
}

export const CATALOGUE_PIECES: PieceCatalogue[] = [
  { ref: "BOS-0986494", marque: "Bosch", label: "Plaquettes frein avant", prix: 55, montagePrix: 30, stock: 12, compat: "3008/5008/308" },
  { ref: "BOS-0986495", marque: "Bosch", label: "Plaquettes frein arrière", prix: 48, montagePrix: 30, stock: 9, compat: "3008/5008/308" },
  { ref: "VAL-830700", marque: "Valeo", label: "Disques de frein avant", prix: 85, montagePrix: 45, stock: 0, compat: "308/3008" },
  { ref: "MIC-P4-225", marque: "Michelin", label: "Pneu Primacy 4 225/45 R18", prix: 120, montagePrix: 20, stock: 8, compat: "Universel" },
  { ref: "TOT-5W30-5L", marque: "Total", label: "Huile Quartz 5W30 5L", prix: 45, montagePrix: 25, stock: 15, compat: "Universel" },
  { ref: "MAH-FH-308", marque: "Mahle", label: "Filtre habitacle charbon actif", prix: 25, montagePrix: 15, stock: 3, compat: "308/3008/5008" },
];

export function pieceParRef(ref: string): PieceCatalogue | undefined {
  return CATALOGUE_PIECES.find((p) => p.ref === ref);
}

export interface LignePanier {
  ref: string;
  montage: boolean;
  quantite: number;
}

const CLE = "mkapms_panier_pieces";

export function lirePanier(): LignePanier[] {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return [];
    const donnees: unknown = JSON.parse(brut);
    if (!Array.isArray(donnees)) return [];
    return donnees.flatMap((l): LignePanier[] => {
      if (typeof l !== "object" || l === null) return [];
      const ligne = l as Record<string, unknown>;
      if (typeof ligne.ref !== "string" || !pieceParRef(ligne.ref)) return [];
      return [
        {
          ref: ligne.ref,
          montage: ligne.montage === true,
          quantite: typeof ligne.quantite === "number" && ligne.quantite > 0 ? ligne.quantite : 1,
        },
      ];
    });
  } catch {
    return [];
  }
}

function ecrire(lignes: LignePanier[]) {
  localStorage.setItem(CLE, JSON.stringify(lignes));
}

export function ajouterAuPanier(ref: string, montage: boolean): LignePanier[] {
  if (!pieceParRef(ref)) return lirePanier();
  const lignes = lirePanier();
  const existante = lignes.find((l) => l.ref === ref && l.montage === montage);
  if (existante) existante.quantite += 1;
  else lignes.push({ ref, montage, quantite: 1 });
  ecrire(lignes);
  return lignes;
}

export function retirerDuPanier(ref: string, montage: boolean): LignePanier[] {
  const lignes = lirePanier().filter((l) => !(l.ref === ref && l.montage === montage));
  ecrire(lignes);
  return lignes;
}

export function viderPanier(): LignePanier[] {
  ecrire([]);
  return [];
}

export function totauxPanier(lignes: LignePanier[]) {
  let pieces = 0;
  let montage = 0;
  for (const ligne of lignes) {
    const piece = pieceParRef(ligne.ref);
    if (!piece) continue;
    pieces += piece.prix * ligne.quantite;
    if (ligne.montage) montage += piece.montagePrix * ligne.quantite;
  }
  return { pieces, montage, total: pieces + montage };
}
