/**
 * MKA.P-MS Social Content Engine — génération des déclinaisons par canal.
 *
 * À partir d'un contenu central unique (titre + corps + lien + pays + langue),
 * produit une version adaptée au format de chaque famille de canal :
 *  - moteur de recherche  → texte descriptif complet ;
 *  - assistant IA (GEO)   → réponse structurée question/réponse ;
 *  - réseau social        → accroche courte + hashtags ;
 *  - interne              → notification concise.
 *
 * 100 % local et déterministe (aucun fournisseur externe). Neutre en marques :
 * le format dépend de `kind`, jamais du nom d'un service tiers.
 */
export type ChannelKind = "search" | "ai_assistant" | "social" | "internal";

export interface CentralContent {
  title: string;
  body: string;
  link?: string | null;
  lang?: string | null;
  country?: string | null;
  keywords?: string[];
}

export interface ChannelVariant {
  text: string;
  hashtags: string | null;
}

const STOP = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "à", "au", "aux",
  "en", "sur", "pour", "avec", "dans", "par", "the", "a", "of", "and", "to",
  "votre", "vos", "mon", "ma", "mes", "ce", "cette", "ces",
]);

/** Dérive des hashtags depuis le titre + mots-clés (sans doublon, max 6). */
function buildHashtags(content: CentralContent): string {
  const words = `${content.title} ${(content.keywords ?? []).join(" ")}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
  const tags: string[] = ["mkapms", "auto"];
  for (const w of words) {
    const tag = w.replace(/[^a-z0-9]/g, "");
    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length >= 6) break;
  }
  return tags.map((t) => `#${t}`).join(" ");
}

function truncate(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

/** Produit la déclinaison adaptée à la famille de canal demandée. */
export function generateVariant(
  content: CentralContent,
  kind: ChannelKind,
): ChannelVariant {
  const link = content.link ? ` ${content.link}` : "";
  switch (kind) {
    case "search":
      return {
        text: truncate(`${content.title}. ${content.body}`, 2000),
        hashtags: null,
      };
    case "ai_assistant": {
      // Format question/réponse : facilite la découverte par les assistants IA.
      const q = `Q : ${content.title} ?`;
      const a = `R : ${truncate(content.body, 900)}${link}`;
      return { text: `${q}\n${a}`, hashtags: null };
    }
    case "social":
      return {
        text: truncate(`${content.title} — ${content.body}${link}`, 280),
        hashtags: buildHashtags(content),
      };
    case "internal":
    default:
      return { text: truncate(`${content.title} — ${content.body}`, 300), hashtags: null };
  }
}
