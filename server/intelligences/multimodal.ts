/**
 * Point 133 — multimodalité dans une même conversation.
 *
 * Le propriétaire ne doit pas trier ses pièces avant de parler : il joint une
 * capture, un vocal déjà dicté, un devis, un extrait de code, et il pose sa
 * question. Ce fichier convertit ces pièces en ce que les capacités savent
 * réellement consommer aujourd'hui.
 *
 * Règle tenue : une pièce qu'aucune capacité ne peut lire n'est pas ignorée en
 * silence. Elle est déclarée **non lue**, avec la raison et la capacité qui
 * manque. C'est ce qui empêche une réponse assurée bâtie sur un document que
 * personne n'a ouvert.
 */
import { registre, type CodeCapacite } from "./capacites.js";

export const TYPES_PIECE = [
  "texte",
  "capture",
  "image",
  "photo",
  "pdf",
  "document",
  "code",
  "audio",
  "vocal",
  "video",
] as const;

export type TypePiece = (typeof TYPES_PIECE)[number];

export interface Piece {
  type: TypePiece;
  nom?: string;
  /** Contenu déjà textuel : message dicté et transcrit, extrait de code, note. */
  texte?: string;
  /** Image en `data:` ou URL absolue, pour les capacités visuelles. */
  source?: string;
}

/** Capacité exigée par chaque type de pièce, ou `null` si le texte suffit. */
const CAPACITE_PAR_TYPE: Record<TypePiece, CodeCapacite | null> = {
  texte: null,
  code: null,
  capture: "vision",
  image: "vision",
  photo: "vision",
  pdf: "documents",
  document: "documents",
  audio: "audio",
  vocal: "transcription",
  video: "audio",
};

export interface PieceLue {
  type: TypePiece;
  nom: string;
  lue: boolean;
  capacite: CodeCapacite | null;
  motif: string;
}

export interface Normalisation {
  /** Texte à joindre au message, pièces lisibles comprises. */
  texte: string;
  /** Images transmissibles à la capacité vision/documents. */
  images: string[];
  /** Capacité principale à demander pour honorer la question. */
  capaciteConseillee: CodeCapacite;
  pieces: PieceLue[];
  /** Pièces non lues : à afficher au propriétaire, pas à masquer. */
  nonLues: PieceLue[];
}

function extension(nom: string | undefined): string {
  if (!nom) return "";
  const i = nom.lastIndexOf(".");
  return i === -1 ? "" : nom.slice(i + 1).toLowerCase();
}

/** Déduit le type d'une pièce quand l'appelant ne l'a pas déclaré. */
export function typeDePiece(nom?: string, source?: string): TypePiece {
  const ext = extension(nom);
  if (["png", "jpg", "jpeg", "webp", "gif", "heic"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "odt", "xls", "xlsx", "csv"].includes(ext)) return "document";
  if (["mp3", "wav", "m4a", "ogg"].includes(ext)) return "audio";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (["ts", "tsx", "js", "jsx", "sql", "json", "sh", "py"].includes(ext)) return "code";
  if (source?.startsWith("data:image/")) return "image";
  return "texte";
}

/**
 * Convertit les pièces jointes en entrée exploitable. Le résultat dit à la fois
 * ce qui sera réellement lu et ce qui ne le sera pas.
 */
export async function normaliser(
  question: string,
  pieces: Piece[],
): Promise<Normalisation> {
  const constate = await registre();
  const etatDe = (c: CodeCapacite) => constate.find((x) => x.code === c);

  const lues: PieceLue[] = [];
  const images: string[] = [];
  const extraits: string[] = [];
  let besoinVision = false;
  let besoinDocuments = false;

  for (const p of pieces) {
    const type = p.type ?? typeDePiece(p.nom, p.source);
    const nom = p.nom?.trim() || type;
    const capacite = CAPACITE_PAR_TYPE[type];

    if (capacite === null) {
      const texte = (p.texte ?? "").trim();
      if (!texte) {
        lues.push({
          type,
          nom,
          lue: false,
          capacite: null,
          motif: "Pièce textuelle vide : rien à lire.",
        });
        continue;
      }
      extraits.push(`— ${nom} —\n${texte.slice(0, 8000)}`);
      lues.push({ type, nom, lue: true, capacite: null, motif: "Texte joint tel quel." });
      continue;
    }

    const c = etatDe(capacite);
    if (!c || c.etat !== "disponible") {
      lues.push({
        type,
        nom,
        lue: false,
        capacite,
        motif:
          c?.motif ??
          `Capacité « ${capacite} » absente du registre : la pièce n'est pas analysée.`,
      });
      continue;
    }

    if (type === "vocal" || type === "audio" || type === "video") {
      // La transcription et l'analyse audio existent au registre mais restent
      // sans fournisseur : le dire ici évite une réponse qui ferait semblant.
      const texte = (p.texte ?? "").trim();
      if (texte) {
        extraits.push(`— ${nom} (déjà transcrit) —\n${texte.slice(0, 8000)}`);
        lues.push({
          type,
          nom,
          lue: true,
          capacite,
          motif: "Transcription fournie par l'appareil, utilisée telle quelle.",
        });
      } else {
        lues.push({
          type,
          nom,
          lue: false,
          capacite,
          motif: `Aucune transcription jointe et « ${capacite} » ne peut pas la produire ici.`,
        });
      }
      continue;
    }

    if (!p.source) {
      lues.push({
        type,
        nom,
        lue: false,
        capacite,
        motif: "Pièce visuelle sans contenu transmis.",
      });
      continue;
    }

    images.push(p.source);
    if (capacite === "documents") besoinDocuments = true;
    else besoinVision = true;
    lues.push({
      type,
      nom,
      lue: true,
      capacite,
      motif: `Transmise à la capacité « ${capacite} ».`,
    });
  }

  const capaciteConseillee: CodeCapacite = besoinDocuments
    ? "documents"
    : besoinVision
      ? "vision"
      : /\b(corrige|correctif|bug|erreur|code|fichier|composant|route|migration)\b/i.test(
            question,
          )
        ? "code"
        : "raisonnement";

  const nonLues = lues.filter((p) => !p.lue);
  const avertissement =
    nonLues.length > 0
      ? `\n\nPièces non lues (à ne pas supposer) :\n${nonLues
          .map((p) => `- ${p.nom} : ${p.motif}`)
          .join("\n")}`
      : "";

  const texte = [question.trim(), ...extraits].filter((t) => t.length > 0).join("\n\n") +
    avertissement;

  return {
    texte,
    images: images.slice(0, 4),
    capaciteConseillee,
    pieces: lues,
    nonLues,
  };
}
