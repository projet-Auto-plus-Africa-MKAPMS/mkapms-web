/**
 * Point 123 — MKA.P-MS Media Authenticity & Deepfake Defense Engine.
 *
 * Ce moteur ne réimplémente rien de ce qui existe : il réutilise le hachage
 * perceptuel du Smart Engine, la Fabrique Intelligence pour savoir si un modèle est
 * réellement disponible, l'Event Bus pour prévenir les autres moteurs et le
 * Smart Engine pour lever les alertes. Il n'ajoute que ce qui manquait : la
 * provenance, le score motivé, les preuves conservées et la décision humaine.
 *
 * Trois refus assumés :
 *  1. jamais « vrai / faux » — un score, des raisons, des preuves ;
 *  2. un détecteur qui n'a pas pu tourner est « indisponible », pas rassurant ;
 *  3. un seul indice ne suffit pas à qualifier un risque élevé (faux positifs).
 */
import { createHash } from "node:crypto";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import sharp from "sharp";
import { db } from "../db.js";
import { chooseProvider } from "../ai-fabric/service.js";
import { emitSafe } from "../event-bus/service.js";
import {
  computePerceptualHash,
  hammingDistance,
  PHASH_SIMILARITY_THRESHOLD,
} from "../smart-engine/services/photo-perceptual.js";
import { raiseAlert } from "../smart-engine/services/alert-engine.js";
import {
  DECLARATIONS,
  DETECTEURS,
  LABEL_LABELS,
  MIN_INDICES_POUR_ELEVE,
  SEUIL_ELEVE,
  SEUIL_MOYEN,
  type Declaration,
  type DetecteurSpec,
  type Kind,
  type LabelCode,
  type Niveau,
} from "./definition.js";
import { maAnalyses, maIncidents, maLabels, maMedias } from "./schema.js";

/** Verdict d'un détecteur. « indisponible » n'est pas « aucun indice ». */
export type VerdictDetecteur = "indice" | "aucun_indice" | "indisponible";

export interface ConstatDetecteur {
  detecteur: string;
  label: string;
  verdict: VerdictDetecteur;
  poids: number;
  raison: string;
  preuve: Record<string, unknown>;
  dureeMs: number;
}

export interface RapportMedia {
  mediaId: number;
  sha256: string;
  phash: string | null;
  kind: Kind;
  score: number;
  niveau: Niveau;
  statut: string;
  motif: string;
  declaration: Declaration;
  constats: ConstatDetecteur[];
  labels: { code: LabelCode; label: string; origine: string; visible: boolean }[];
  detecteursIndisponibles: { detecteur: string; dependance: string }[];
  incidentId: number | null;
}

/* ------------------------------------------------------------------ outils */

function toBuffer(input: Buffer | string): Buffer {
  if (Buffer.isBuffer(input)) return input;
  const raw = input.startsWith("data:") ? (input.split(",")[1] ?? input) : input;
  return Buffer.from(raw, "base64");
}

function kindDepuisMime(mime: string | undefined, kind?: Kind): Kind {
  if (kind) return kind;
  const m = (mime ?? "").toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m.includes("pdf") || m.includes("word") || m.includes("officedocument")) return "document";
  return "inconnu";
}

/**
 * Générateurs d'images et de vidéos dont la trace se lit en clair dans les
 * métadonnées. Cette liste est un indice, jamais une preuve à elle seule.
 */
const SIGNATURES_GENERATEURS: { motif: RegExp; nom: string }[] = [
  { motif: /stable\s?diffusion/i, nom: "Stable Diffusion" },
  { motif: /midjourney/i, nom: "Midjourney" },
  { motif: /dall[\s·.-]?e/i, nom: "DALL·E" },
  { motif: /openai/i, nom: "OpenAI" },
  { motif: /firefly/i, nom: "Adobe Firefly" },
  { motif: /imagen|synthid/i, nom: "Google Imagen / SynthID" },
  { motif: /gemini/i, nom: "Google Gemini" },
  { motif: /flux\.1|black\s?forest/i, nom: "FLUX" },
  { motif: /runway|pika\s?labs|kling|sora/i, nom: "Générateur vidéo" },
  { motif: /leonardo\.ai|ideogram|nightcafe/i, nom: "Générateur d'images" },
];

const SIGNATURES_RETOUCHE: { motif: RegExp; nom: string }[] = [
  { motif: /photoshop/i, nom: "Adobe Photoshop" },
  { motif: /lightroom/i, nom: "Adobe Lightroom" },
  { motif: /gimp/i, nom: "GIMP" },
  { motif: /facetune|snapseed|picsart|remini/i, nom: "Retouche mobile" },
];

/** Marqueurs de conteneur C2PA/JUMBF présents dans l'octet du fichier. */
function contientManifesteC2pa(buf: Buffer): boolean {
  const tete = buf.subarray(0, Math.min(buf.length, 512 * 1024)).toString("latin1");
  return tete.includes("jumb") && (tete.includes("c2pa") || tete.includes("urn:uuid:c2pa"));
}

/* ------------------------------------------------------- détecteurs locaux */

async function detecteurEmpreinte(sha256: string): Promise<ConstatDetecteur> {
  const t0 = Date.now();
  const [deja] = await db
    .select({ id: maMedias.id, contexte: maMedias.contexte, createdAt: maMedias.createdAt })
    .from(maMedias)
    .where(eq(maMedias.sha256, sha256))
    .orderBy(maMedias.id)
    .limit(1);

  return {
    detecteur: "empreinte",
    label: "Empreinte cryptographique",
    verdict: "aucun_indice",
    poids: 0,
    raison: deja
      ? `Fichier identique déjà enregistré (média #${deja.id}, contexte ${deja.contexte}). L'empreinte permettra de comparer toute copie future.`
      : "Empreinte enregistrée : toute copie modifiée pourra être comparée à cet original.",
    preuve: { sha256, dejaConnu: Boolean(deja), premierMediaId: deja?.id ?? null },
    dureeMs: Date.now() - t0,
  };
}

async function detecteurReutilisation(
  phash: string | null,
  contexte: string,
  contexteId: number | null,
): Promise<ConstatDetecteur> {
  const t0 = Date.now();
  const base = {
    detecteur: "reutilisation",
    label: "Réutilisation de média",
    dureeMs: 0,
  };

  if (!phash) {
    return {
      ...base,
      verdict: "indisponible",
      poids: 0,
      raison:
        "Empreinte perceptuelle non calculable sur ce média : la réutilisation n'a pas été contrôlée.",
      preuve: {},
      dureeMs: Date.now() - t0,
    };
  }

  const candidats = await db
    .select({
      id: maMedias.id,
      phash: maMedias.phash,
      contexte: maMedias.contexte,
      contexteId: maMedias.contexteId,
      ownerId: maMedias.ownerId,
    })
    .from(maMedias)
    .where(sql`${maMedias.phash} is not null`)
    .orderBy(desc(maMedias.id))
    .limit(5000);

  const proches = candidats
    .filter((c) => {
      if (!c.phash) return false;
      if (c.contexte === contexte && c.contexteId === contexteId) return false;
      return hammingDistance(phash, c.phash) <= PHASH_SIMILARITY_THRESHOLD;
    })
    .slice(0, 10)
    .map((c) => ({
      mediaId: c.id,
      contexte: c.contexte,
      contexteId: c.contexteId,
      distance: hammingDistance(phash, c.phash as string),
    }));

  if (proches.length === 0) {
    return {
      ...base,
      verdict: "aucun_indice",
      poids: 0,
      raison: "Aucun média visuellement identique déjà déposé sur la plateforme.",
      preuve: { comparaisons: candidats.length },
      dureeMs: Date.now() - t0,
    };
  }

  return {
    ...base,
    verdict: "indice",
    poids: 35,
    raison: `Média visuellement identique à ${proches.length} média(x) déjà déposé(s) dans un autre contexte : réutilisation ou substitution possible.`,
    preuve: { correspondances: proches },
    dureeMs: Date.now() - t0,
  };
}

async function detecteurMetadonnees(buf: Buffer, kind: Kind): Promise<ConstatDetecteur> {
  const t0 = Date.now();
  const base = { detecteur: "metadonnees", label: "Métadonnées et outil de création" };

  const texte = buf.subarray(0, Math.min(buf.length, 512 * 1024)).toString("latin1");
  const generateur = SIGNATURES_GENERATEURS.find((s) => s.motif.test(texte));
  const retouche = SIGNATURES_RETOUCHE.find((s) => s.motif.test(texte));

  if (generateur) {
    return {
      ...base,
      verdict: "indice",
      poids: 30,
      raison: `Le fichier porte la trace d'un générateur d'images ou de vidéos : ${generateur.nom}.`,
      preuve: { generateur: generateur.nom },
      dureeMs: Date.now() - t0,
    };
  }

  if (kind !== "image") {
    return {
      ...base,
      verdict: retouche ? "indice" : "aucun_indice",
      poids: retouche ? 10 : 0,
      raison: retouche
        ? `Le fichier porte la trace d'un outil de retouche : ${retouche.nom}.`
        : "Aucune trace de générateur ni d'outil de retouche dans les métadonnées lisibles.",
      preuve: { retouche: retouche?.nom ?? null },
      dureeMs: Date.now() - t0,
    };
  }

  try {
    const meta = await sharp(buf).metadata();
    const aExif = Boolean(meta.exif);
    const aIcc = Boolean(meta.icc);
    const aXmp = Boolean(meta.xmp);

    if (!aExif && !aXmp && !aIcc) {
      return {
        ...base,
        verdict: "indice",
        poids: 15,
        raison:
          "Aucune métadonnée d'appareil : le média a été réencodé, exporté par un outil, ou nettoyé. Ce n'est pas une preuve de falsification, seulement une absence de provenance.",
        preuve: { exif: false, xmp: false, icc: false, format: meta.format ?? null },
        dureeMs: Date.now() - t0,
      };
    }

    return {
      ...base,
      verdict: retouche ? "indice" : "aucun_indice",
      poids: retouche ? 10 : -5,
      raison: retouche
        ? `Métadonnées présentes, mais elles mentionnent un outil de retouche : ${retouche.nom}.`
        : "Métadonnées d'appareil présentes et cohérentes avec une prise de vue réelle.",
      preuve: { exif: aExif, xmp: aXmp, icc: aIcc, retouche: retouche?.nom ?? null },
      dureeMs: Date.now() - t0,
    };
  } catch (e) {
    return {
      ...base,
      verdict: "indisponible",
      poids: 0,
      raison: `Métadonnées illisibles : ${e instanceof Error ? e.message : "erreur inconnue"}.`,
      preuve: {},
      dureeMs: Date.now() - t0,
    };
  }
}

async function detecteurCoherence(
  buf: Buffer,
  kind: Kind,
  mime: string | null,
): Promise<ConstatDetecteur> {
  const t0 = Date.now();
  const base = { detecteur: "coherence_technique", label: "Cohérence technique du fichier" };

  if (buf.length === 0) {
    return {
      ...base,
      verdict: "indice",
      poids: 25,
      raison: "Fichier vide : rien n'a réellement été reçu.",
      preuve: { bytes: 0 },
      dureeMs: Date.now() - t0,
    };
  }

  if (kind !== "image") {
    return {
      ...base,
      verdict: "aucun_indice",
      poids: 0,
      raison: `Contrôle de cohérence limité au décodage pour un média de type ${kind} : taille ${buf.length} octets.`,
      preuve: { bytes: buf.length },
      dureeMs: Date.now() - t0,
    };
  }

  try {
    const meta = await sharp(buf).metadata();
    const anomalies: string[] = [];
    if (!meta.width || !meta.height) anomalies.push("dimensions illisibles");
    if (meta.width && meta.height && (meta.width < 32 || meta.height < 32)) {
      anomalies.push(`image minuscule (${meta.width}×${meta.height})`);
    }
    if (mime && meta.format && !mime.toLowerCase().includes(meta.format.toLowerCase())) {
      anomalies.push(`format annoncé « ${mime} » différent du contenu réel « ${meta.format} »`);
    }

    if (anomalies.length > 0) {
      return {
        ...base,
        verdict: "indice",
        poids: Math.min(25, 10 * anomalies.length),
        raison: `Incohérences techniques : ${anomalies.join(" ; ")}.`,
        preuve: { anomalies, format: meta.format ?? null, width: meta.width, height: meta.height },
        dureeMs: Date.now() - t0,
      };
    }

    return {
      ...base,
      verdict: "aucun_indice",
      poids: 0,
      raison: `Fichier décodé sans incohérence : ${meta.format ?? "format inconnu"} ${meta.width}×${meta.height}.`,
      preuve: { format: meta.format ?? null, width: meta.width, height: meta.height },
      dureeMs: Date.now() - t0,
    };
  } catch (e) {
    return {
      ...base,
      verdict: "indice",
      poids: 20,
      raison: `Le fichier ne se décode pas comme l'image annoncée : ${
        e instanceof Error ? e.message : "erreur inconnue"
      }.`,
      preuve: {},
      dureeMs: Date.now() - t0,
    };
  }
}

/* ----------------------------------------- détecteurs à dépendance externe */

/**
 * Détecteur de provenance signée. La lecture du conteneur est faite ici (elle
 * est locale et honnête : « un manifeste est présent »), mais la
 * **vérification cryptographique** exige la bibliothèque C2PA et le magasin de
 * certificats du point 124 : sans elle, le détecteur ne conclut pas.
 */
function detecteurProvenance(buf: Buffer, spec: DetecteurSpec): ConstatDetecteur {
  const t0 = Date.now();
  const present = contientManifesteC2pa(buf);
  return {
    detecteur: spec.code,
    label: spec.label,
    verdict: "indisponible",
    poids: 0,
    raison: present
      ? `Un manifeste de provenance est présent dans le fichier, mais sa signature n'est pas vérifiée : ${spec.dependance}`
      : `Aucun manifeste de provenance détecté dans le fichier. Vérification impossible : ${spec.dependance}`,
    preuve: { manifestePresent: present },
    dureeMs: Date.now() - t0,
  };
}

/**
 * Détecteurs qui exigent un modèle. On ne simule pas : on demande à la Fabrique Intelligence
 * si un fournisseur est réellement routable, et on nomme l'accès manquant.
 */
async function detecteurModele(
  spec: DetecteurSpec,
  countryCode: string | null,
): Promise<ConstatDetecteur> {
  const t0 = Date.now();
  const decision = await chooseProvider({
    capability: spec.capacite ?? "ia_vision",
    taskType: `media_authenticity.${spec.code}`,
    engine: "media_authenticity",
    countryCode,
    // Un média déposé par un utilisateur est une donnée personnelle.
    confidentiality: "personnelle",
  });

  if (decision.verdict !== "route") {
    return {
      detecteur: spec.code,
      label: spec.label,
      verdict: "indisponible",
      poids: 0,
      raison: `${decision.reason} Accès manquant : ${spec.dependance ?? "fournisseur de modèle"}.`,
      preuve: { verdict: decision.verdict, candidats: decision.candidates },
      dureeMs: Date.now() - t0,
    };
  }

  // Un fournisseur est routable : l'appel réel appartient au point 130. Tant
  // qu'il n'est pas construit, on l'écrit — on ne rend pas un faux constat.
  return {
    detecteur: spec.code,
    label: spec.label,
    verdict: "indisponible",
    poids: 0,
    raison: `Fournisseur disponible (${decision.providerLabel}), détecteur spécialisé pas encore branché (point 130). Aucun constat n'est inventé.`,
    preuve: { fournisseur: decision.providerCode },
    dureeMs: Date.now() - t0,
  };
}

/* ----------------------------------------------------------------- analyse */

export interface AnalyseInput {
  /** Contenu du média : Buffer, base64 ou data URI. */
  contenu: Buffer | string;
  kind?: Kind;
  mime?: string;
  contexte: string;
  contexteId?: number | null;
  ownerId?: number | null;
  countryCode?: string | null;
  declaration?: Declaration;
}

/**
 * Analyse un média, enregistre le constat et prévient les autres moteurs.
 * Ne jette jamais sur un média illisible : un média non analysable est
 * enregistré comme tel.
 */
export async function analyser(input: AnalyseInput): Promise<RapportMedia> {
  const buf = toBuffer(input.contenu);
  const kind = kindDepuisMime(input.mime, input.kind);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const declaration: Declaration = (DECLARATIONS as readonly string[]).includes(
    input.declaration ?? "",
  )
    ? (input.declaration as Declaration)
    : "non_declare";
  const contexteId = input.contexteId ?? null;
  const phash = kind === "image" ? await computePerceptualHash(buf) : null;

  const applicables = DETECTEURS.filter((d) => d.kinds.includes(kind));
  const constats: ConstatDetecteur[] = [];

  for (const spec of applicables) {
    if (spec.code === "empreinte") {
      constats.push(await detecteurEmpreinte(sha256));
    } else if (spec.code === "reutilisation") {
      constats.push(await detecteurReutilisation(phash, input.contexte, contexteId));
    } else if (spec.code === "metadonnees") {
      constats.push(await detecteurMetadonnees(buf, kind));
    } else if (spec.code === "coherence_technique") {
      constats.push(await detecteurCoherence(buf, kind, input.mime ?? null));
    } else if (spec.nature === "standard") {
      constats.push(detecteurProvenance(buf, spec));
    } else {
      constats.push(await detecteurModele(spec, input.countryCode ?? null));
    }
  }

  // Déclaration de l'auteur : elle compte comme un signal, dans les deux sens.
  if (declaration === "genere_ia") {
    constats.push({
      detecteur: "declaration",
      label: "Déclaration de l'auteur",
      verdict: "indice",
      poids: 0,
      raison:
        "L'auteur déclare un contenu généré par Intelligence : l'étiquette est posée sans qu'aucune détection soit nécessaire.",
      preuve: { declaration },
      dureeMs: 0,
    });
  }

  const indices = constats.filter((c) => c.verdict === "indice" && c.poids > 0);
  const indisponibles = constats.filter((c) => c.verdict === "indisponible");
  const brut = constats.reduce((s, c) => s + (c.verdict === "indice" ? c.poids : c.poids < 0 ? c.poids : 0), 0);
  let score = Math.max(0, Math.min(100, brut));
  let niveau: Niveau;
  let motif: string;

  const decisifs = applicables.filter((d) => d.nature !== "local").length;
  const tousDecisifsAbsents =
    decisifs > 0 && indisponibles.length >= decisifs && indices.length === 0;

  if (tousDecisifsAbsents) {
    niveau = "indetermine";
    motif = `Aucun détecteur décisif n'a pu s'exécuter (${indisponibles.length} indisponible(s)) : l'authenticité de ce média n'est pas établie. « Non analysé » n'est pas « authentique ».`;
  } else if (score >= SEUIL_ELEVE && indices.length >= MIN_INDICES_POUR_ELEVE) {
    niveau = "eleve";
    motif = `${indices.length} indices indépendants concordent : ${indices
      .map((i) => i.label)
      .join(", ")}.`;
  } else if (score >= SEUIL_ELEVE) {
    // Règle anti-faux-positif : un seul détecteur ne condamne pas un média.
    niveau = "moyen";
    score = SEUIL_ELEVE - 1;
    motif = `Un seul indice (${indices[0]?.label ?? "inconnu"}) : le risque est ramené à moyen faute de seconde preuve indépendante.`;
  } else if (score >= SEUIL_MOYEN) {
    niveau = "moyen";
    motif = `Indice(s) relevé(s) : ${indices.map((i) => i.label).join(", ") || "aucun"}.`;
  } else {
    niveau = "faible";
    motif =
      indisponibles.length > 0
        ? `Aucun indice sur les détecteurs disponibles ; ${indisponibles.length} détecteur(s) n'ont pas pu s'exécuter.`
        : "Aucun indice de manipulation sur les détecteurs disponibles.";
  }

  const statut = niveau === "eleve" ? "quarantaine" : "analyse";

  const [media] = await db
    .insert(maMedias)
    .values({
      sha256,
      phash,
      kind,
      mime: input.mime ?? null,
      bytes: buf.length,
      contexte: input.contexte,
      contexteId,
      ownerId: input.ownerId ?? null,
      countryCode: input.countryCode ?? null,
      declaration,
      provenance: {
        manifesteC2paPresent: contientManifesteC2pa(buf),
        detecteursIndisponibles: indisponibles.map((i) => i.detecteur),
      },
      statut,
      score,
      niveau,
      motif,
      analyseAt: new Date(),
    })
    .returning();

  if (constats.length > 0) {
    await db.insert(maAnalyses).values(
      constats.map((c) => ({
        mediaId: media.id,
        detecteur: c.detecteur,
        verdict: c.verdict,
        poids: c.poids,
        raison: c.raison,
        preuve: c.preuve,
        dureeMs: c.dureeMs,
      })),
    );
  }

  // Étiquettes (point 127) : la déclaration d'abord, le constat ensuite.
  const labels: { code: LabelCode; origine: string; visible: boolean; motif: string }[] = [];
  if (declaration === "genere_ia") {
    labels.push({
      code: "ia_declaree",
      origine: "declaration",
      visible: true,
      motif: "Déclaré par l'auteur au dépôt.",
    });
  } else if (declaration === "modifie") {
    labels.push({
      code: "modifie",
      origine: "declaration",
      visible: true,
      motif: "Déclaré modifié par l'auteur.",
    });
  }
  const generateur = constats.find(
    (c) => c.detecteur === "metadonnees" && c.verdict === "indice" && "generateur" in c.preuve,
  );
  if (generateur && declaration !== "genere_ia") {
    labels.push({
      code: "ia_detectee",
      origine: "detection",
      visible: true,
      motif: generateur.raison,
    });
  }
  if (constats.some((c) => c.detecteur === "reutilisation" && c.verdict === "indice")) {
    labels.push({
      code: "reutilisation_suspectee",
      origine: "detection",
      visible: false,
      motif: "Média identique déjà déposé dans un autre contexte.",
    });
  }
  if (indisponibles.some((c) => c.detecteur === "provenance_c2pa")) {
    labels.push({
      code: "provenance_absente",
      origine: "detection",
      visible: false,
      motif: "Provenance non vérifiable en l'état.",
    });
  }
  if (labels.length > 0) {
    await db.insert(maLabels).values(labels.map((l) => ({ mediaId: media.id, ...l })));
  }

  // Incident + alerte seulement quand c'est justifié.
  let incidentId: number | null = null;
  if (niveau === "eleve") {
    const [incident] = await db
      .insert(maIncidents)
      .values({
        mediaId: media.id,
        type: "risque_media",
        gravite: "haute",
        statut: "ouvert",
        resume: motif,
        preuves: indices.map((i) => ({ detecteur: i.detecteur, raison: i.raison, preuve: i.preuve })),
      })
      .returning();
    incidentId = incident.id;

    await raiseAlert({
      category: "media_authenticite",
      title: `Média à risque élevé (${kind}) — ${input.contexte}`,
      description: motif,
      level: "important",
      targetType: "ma_media",
      targetId: media.id,
      signature: `media_authenticite:${sha256}`,
    });
  }

  await emitSafe({
    source: "media_authenticity",
    type: "media.analyse",
    payload: {
      mediaId: media.id,
      niveau,
      score,
      contexte: input.contexte,
    },
  });

  return {
    mediaId: media.id,
    sha256,
    phash,
    kind,
    score,
    niveau,
    statut,
    motif,
    declaration,
    constats,
    labels: labels.map((l) => ({
      code: l.code,
      label: LABEL_LABELS[l.code],
      origine: l.origine,
      visible: l.visible,
    })),
    detecteursIndisponibles: indisponibles.map((i) => ({
      detecteur: i.detecteur,
      dependance:
        DETECTEURS.find((d) => d.code === i.detecteur)?.dependance ?? "dépendance non nommée",
    })),
    incidentId,
  };
}

/** Analyse sans jamais interrompre le parcours de l'utilisateur. */
export async function analyserSafe(input: AnalyseInput): Promise<void> {
  try {
    await analyser(input);
  } catch (e) {
    console.error("[media-authenticity]", (e as Error).message);
  }
}

/* -------------------------------------------------------------- lecture PDG */

export interface EtatDetecteur {
  code: string;
  label: string;
  cherche: string;
  nature: DetecteurSpec["nature"];
  operationnel: boolean;
  dependance: string | null;
  passages: number;
  indices: number;
}

export interface EtatMoteur {
  checkedAt: string;
  medias: number;
  parNiveau: Record<string, number>;
  parStatut: Record<string, number>;
  quarantaine: number;
  incidentsOuverts: number;
  detecteurs: EtatDetecteur[];
  couverture: { operationnels: number; total: number; manquants: string[] };
  derniers: {
    id: number;
    kind: string;
    contexte: string;
    contexteId: number | null;
    niveau: string;
    score: number;
    statut: string;
    motif: string;
    createdAt: string;
  }[];
}

export async function etat(): Promise<EtatMoteur> {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(maMedias);

  const niveaux = await db
    .select({ niveau: maMedias.niveau, n: sql<number>`count(*)::int` })
    .from(maMedias)
    .groupBy(maMedias.niveau);

  const statuts = await db
    .select({ statut: maMedias.statut, n: sql<number>`count(*)::int` })
    .from(maMedias)
    .groupBy(maMedias.statut);

  const parDetecteur = await db
    .select({
      detecteur: maAnalyses.detecteur,
      passages: sql<number>`count(*)::int`,
      indices: sql<number>`sum(case when ${maAnalyses.verdict} = 'indice' then 1 else 0 end)::int`,
      utiles: sql<number>`sum(case when ${maAnalyses.verdict} <> 'indisponible' then 1 else 0 end)::int`,
    })
    .from(maAnalyses)
    .groupBy(maAnalyses.detecteur);

  const [{ incidents }] = await db
    .select({ incidents: sql<number>`count(*)::int` })
    .from(maIncidents)
    .where(eq(maIncidents.statut, "ouvert"));

  const derniers = await db
    .select({
      id: maMedias.id,
      kind: maMedias.kind,
      contexte: maMedias.contexte,
      contexteId: maMedias.contexteId,
      niveau: maMedias.niveau,
      score: maMedias.score,
      statut: maMedias.statut,
      motif: maMedias.motif,
      createdAt: maMedias.createdAt,
    })
    .from(maMedias)
    .orderBy(desc(maMedias.id))
    .limit(30);

  const detecteurs: EtatDetecteur[] = DETECTEURS.map((d) => {
    const stat = parDetecteur.find((p) => p.detecteur === d.code);
    return {
      code: d.code,
      label: d.label,
      cherche: d.cherche,
      nature: d.nature,
      operationnel: d.nature === "local",
      dependance: d.dependance ?? null,
      passages: stat?.passages ?? 0,
      indices: stat?.indices ?? 0,
    };
  });

  const operationnels = detecteurs.filter((d) => d.operationnel).length;

  return {
    checkedAt: new Date().toISOString(),
    medias: total,
    parNiveau: Object.fromEntries(niveaux.map((n) => [n.niveau, n.n])),
    parStatut: Object.fromEntries(statuts.map((s) => [s.statut, s.n])),
    quarantaine: statuts.find((s) => s.statut === "quarantaine")?.n ?? 0,
    incidentsOuverts: incidents,
    detecteurs,
    couverture: {
      operationnels,
      total: detecteurs.length,
      manquants: detecteurs.filter((d) => !d.operationnel).map((d) => d.label),
    },
    derniers: derniers.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
  };
}

/** Détail complet d'un média : constats, preuves, étiquettes. */
export async function detail(mediaId: number) {
  const [media] = await db.select().from(maMedias).where(eq(maMedias.id, mediaId)).limit(1);
  if (!media) return null;

  const constats = await db
    .select()
    .from(maAnalyses)
    .where(eq(maAnalyses.mediaId, mediaId))
    .orderBy(maAnalyses.id);

  const labels = await db.select().from(maLabels).where(eq(maLabels.mediaId, mediaId));
  const incidents = await db
    .select()
    .from(maIncidents)
    .where(eq(maIncidents.mediaId, mediaId))
    .orderBy(desc(maIncidents.id));

  return {
    media: {
      ...media,
      createdAt: media.createdAt.toISOString(),
      analyseAt: media.analyseAt ? media.analyseAt.toISOString() : null,
    },
    constats: constats.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    labels: labels.map((l) => ({
      ...l,
      label: LABEL_LABELS[l.code as LabelCode] ?? l.code,
      createdAt: l.createdAt.toISOString(),
    })),
    incidents: incidents.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      decideAt: i.decideAt ? i.decideAt.toISOString() : null,
    })),
  };
}

export async function incidents(statut?: string, limit = 50) {
  const rows = await db
    .select()
    .from(maIncidents)
    .where(statut ? eq(maIncidents.statut, statut) : sql`true`)
    .orderBy(desc(maIncidents.id))
    .limit(limit);

  return rows.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    decideAt: i.decideAt ? i.decideAt.toISOString() : null,
  }));
}

/**
 * Décision humaine sur un incident. Le moteur ne débloque ni ne bloque
 * définitivement un média tout seul : c'est la règle des garde-fous.
 */
export async function decider(input: {
  incidentId: number;
  decision: "autoriser" | "etiqueter" | "bloquer";
  motif: string;
  decidePar?: number;
}) {
  const [incident] = await db
    .select()
    .from(maIncidents)
    .where(eq(maIncidents.id, input.incidentId))
    .limit(1);
  if (!incident) throw new Error(`Incident ${input.incidentId} inconnu.`);

  await db
    .update(maIncidents)
    .set({
      statut: "tranche",
      decision: input.decision,
      decisionMotif: input.motif,
      decidePar: input.decidePar ?? null,
      decideAt: new Date(),
    })
    .where(eq(maIncidents.id, input.incidentId));

  if (incident.mediaId) {
    const statut =
      input.decision === "bloquer" ? "bloque" : input.decision === "autoriser" ? "publie" : "analyse";
    await db.update(maMedias).set({ statut }).where(eq(maMedias.id, incident.mediaId));

    if (input.decision === "etiqueter") {
      await db.insert(maLabels).values({
        mediaId: incident.mediaId,
        code: "ia_detectee",
        origine: "pdg",
        visible: true,
        motif: input.motif,
      });
    }

    await emitSafe({
      source: "media_authenticity",
      type: "media.decision",
      payload: {
        mediaId: incident.mediaId,
        decision: input.decision,
      },
    });
  }

  return { ok: true, decision: input.decision };
}

/** Santé du moteur pour le registre central et le contrôle continu. */
export async function health(): Promise<{ status: "up" | "degraded" | "down"; message: string }> {
  try {
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(maMedias);
    const [{ recents }] = await db
      .select({ recents: sql<number>`count(*)::int` })
      .from(maMedias)
      .where(gte(maMedias.createdAt, new Date(Date.now() - 7 * 24 * 3600 * 1000)));
    const [{ ouverts }] = await db
      .select({ ouverts: sql<number>`count(*)::int` })
      .from(maIncidents)
      .where(and(eq(maIncidents.statut, "ouvert"), eq(maIncidents.gravite, "haute")));

    const local = DETECTEURS.filter((d) => d.nature === "local").length;
    const manquants = DETECTEURS.length - local;

    if (ouverts > 0) {
      return {
        status: "degraded",
        message: `${ouverts} incident(s) média à gravité haute en attente de décision.`,
      };
    }
    return {
      status: "up",
      message: `${total} média(s) enregistré(s), ${recents} sur 7 jours. ${local}/${DETECTEURS.length} détecteurs opérationnels ; ${manquants} en attente de dépendance externe.`,
    };
  } catch (e) {
    return {
      status: "down",
      message: `Moteur d'authenticité média injoignable : ${
        e instanceof Error ? e.message : "erreur inconnue"
      }`,
    };
  }
}
