/**
 * LOT IA02F, point 8 — extraction réelle de texte par type de fichier.
 *
 * Chaque extracteur renvoie soit un texte réel, soit une erreur explicite —
 * jamais un texte vide présenté comme un succès. L'OCR est explicitement
 * hors périmètre de ce lot (point 8 : "prévoir OCR uniquement quand
 * nécessaire") : une image ne reçoit qu'une extraction de métadonnées
 * (dimensions non lues ici, laissé à server/media-os pour cet usage), son
 * `contenuTexte` reste vide et le pipeline le déclare tel quel, jamais
 * "prêt pour le RAG" sur la base d'un texte qui n'existe pas.
 */
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import ExcelJS from "exceljs";

export interface ResultatExtraction {
  ok: boolean;
  texte: string;
  nbPages: number | null;
  erreur: string;
}

const TYPES_SANS_OCR = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);

export const TYPES_SUPPORTES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/json",
  "image/jpeg",
  "image/png",
  "image/webp",
];

async function extrairePdf(buffer: Buffer): Promise<ResultatExtraction> {
  const parser = new PDFParse({ data: buffer });
  try {
    const r = await parser.getText();
    if (!r.text.trim()) {
      return { ok: false, texte: "", nbPages: r.total, erreur: "PDF sans texte extractible (probablement scanné) — l'OCR n'est pas encore connecté (voir point 8)." };
    }
    return { ok: true, texte: r.text, nbPages: r.total, erreur: "" };
  } finally {
    await parser.destroy();
  }
}

async function extraireDocx(buffer: Buffer): Promise<ResultatExtraction> {
  const r = await mammoth.extractRawText({ buffer });
  if (!r.value.trim()) return { ok: false, texte: "", nbPages: null, erreur: "DOCX sans texte extractible." };
  return { ok: true, texte: r.value, nbPages: null, erreur: "" };
}

async function extraireXlsx(buffer: Buffer): Promise<ResultatExtraction> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const blocs: string[] = [];
  workbook.eachSheet((feuille) => {
    const lignes: string[] = [`# Feuille : ${feuille.name}`];
    feuille.eachRow((ligne) => {
      const valeurs = (ligne.values as unknown[]).slice(1).map((v) => (v === null || v === undefined ? "" : String(v)));
      lignes.push(valeurs.join(" | "));
    });
    blocs.push(lignes.join("\n"));
  });
  const texte = blocs.join("\n\n");
  if (!texte.trim()) return { ok: false, texte: "", nbPages: null, erreur: "Classeur sans donnée exploitable." };
  return { ok: true, texte, nbPages: workbook.worksheets.length, erreur: "" };
}

function extraireTexteBrut(buffer: Buffer): ResultatExtraction {
  const texte = buffer.toString("utf8");
  if (!texte.trim()) return { ok: false, texte: "", nbPages: null, erreur: "Fichier texte vide." };
  return { ok: true, texte, nbPages: null, erreur: "" };
}

function extraireJson(buffer: Buffer): ResultatExtraction {
  const brut = buffer.toString("utf8");
  try {
    const objet = JSON.parse(brut);
    return { ok: true, texte: JSON.stringify(objet, null, 2), nbPages: null, erreur: "" };
  } catch (e) {
    return { ok: false, texte: "", nbPages: null, erreur: `JSON invalide : ${e instanceof Error ? e.message : "erreur inconnue"}.` };
  }
}

/**
 * Extrait le texte d'un fichier selon son type MIME. Ne devine jamais un
 * type non supporté : renvoie une erreur nommée plutôt qu'un texte fabriqué.
 */
export async function extraire(buffer: Buffer, typeMime: string): Promise<ResultatExtraction> {
  try {
    if (typeMime === "application/pdf") return await extrairePdf(buffer);
    if (typeMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return await extraireDocx(buffer);
    if (typeMime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return await extraireXlsx(buffer);
    if (typeMime === "application/json") return extraireJson(buffer);
    if (typeMime === "text/plain" || typeMime === "text/csv") return extraireTexteBrut(buffer);
    if (TYPES_SANS_OCR.has(typeMime)) {
      return { ok: false, texte: "", nbPages: null, erreur: "Image déposée : aucune extraction de texte (OCR non connecté dans ce lot, voir point 8)." };
    }
    return { ok: false, texte: "", nbPages: null, erreur: `Type de fichier non supporté pour l'extraction : ${typeMime || "inconnu"}.` };
  } catch (e) {
    return { ok: false, texte: "", nbPages: null, erreur: `Échec d'extraction : ${e instanceof Error ? e.message : "erreur inconnue"}.` };
  }
}

/** Découpage en morceaux (chunking) — par paragraphes regroupés, jamais un seul bloc géant envoyé tel quel au retrieval. */
export function decouper(texte: string, tailleMax = 1200): string[] {
  const paragraphes = texte.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const morceaux: string[] = [];
  let courant = "";
  for (const p of paragraphes) {
    if ((courant + "\n\n" + p).length > tailleMax && courant) {
      morceaux.push(courant);
      courant = p;
    } else {
      courant = courant ? `${courant}\n\n${p}` : p;
    }
  }
  if (courant) morceaux.push(courant);
  // Un texte sans double saut de ligne (CSV, JSON compact) reste un seul paragraphe : le découper par taille brute.
  if (morceaux.length === 0 && texte.trim()) {
    for (let i = 0; i < texte.length; i += tailleMax) morceaux.push(texte.slice(i, i + tailleMax));
  }
  return morceaux;
}
