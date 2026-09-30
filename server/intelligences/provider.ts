/**
 * MKA.P-MS AI — couche d'appel réelle aux fournisseurs de modèles.
 *
 * Jusqu'ici la plateforme savait *choisir* un fournisseur (Fabrique Intelligence) mais
 * n'appelait personne : aucun moteur ne pouvait donc réellement raisonner,
 * rédiger ou proposer du code. Ce fichier est le seul endroit du code qui parle
 * à un fournisseur de modèle. Conséquence voulue : on change de fournisseur ici,
 * et nulle part ailleurs.
 *
 * Règles tenues :
 *  - le fournisseur est choisi par la Fabrique Intelligence (confidentialité, pays, coût),
 *    jamais codé en dur dans un moteur métier ;
 *  - un appel qui échoue renvoie l'erreur telle quelle, il ne fabrique pas de
 *    réponse plausible ;
 *  - chaque appel réussi est comptabilisé (jetons consommés) pour que le coût
 *    reste visible avant la facture.
 */
import { db } from "../db.js";
import { afCostEntries } from "../ai-fabric/schema.js";
import { chooseProvider, markProviderUsed, providerStates, type Confidentiality } from "../ai-fabric/service.js";
import { enregistrer as enregistrerAppel } from "./evaluation.js";
import { MOTIF_PUBLIC_INDISPONIBLE, NOM_PRODUIT, type EtatServicePublic } from "./identite.js";

/** Une fonction que le modèle peut demander à exécuter (appel d'outils). */
export interface OutilFonction {
  type: "function";
  function: {
    name: string;
    description: string;
    /** Schéma JSON des arguments attendus. */
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
}

/** Ce que le modèle a demandé d'exécuter — l'appelant décide, jamais ce fichier. */
export interface AppelOutil {
  id: string;
  nom: string;
  /** Arguments tels que renvoyés par le fournisseur (JSON brut, non validé ici). */
  arguments: string;
}

/** Exige une réponse conforme à un schéma JSON, au lieu d'une phrase à deviner. */
export interface SortieStructuree {
  nom: string;
  schema: Record<string, unknown>;
  strict?: boolean;
}

/**
 * Un tour de conversation, tel que le fournisseur l'attend. Ce fichier ne
 * construit et n'interprète jamais le contenu métier d'un tour "tool" — il le
 * relaie tel quel. La boucle qui enchaîne les tours (server/intelligences/
 * outils/boucle.ts) est seule responsable de ce qu'elle y écrit.
 */
export interface MessageConversation {
  role: "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
}

import { lireAudio, type FichierAudio } from "./audio-input.js";

export interface MediaProduit {
  mime: "image/png" | "audio/mpeg" | "text/plain";
  base64: string;
}

export interface AppelInput {
  /** Opération média explicite, exécutée sans outils métier ni shadow. */
  media?: "image" | "voix" | "transcription";
  audio?: FichierAudio;
  isolation?: "SHOP";
  /** Capacité Fabrique Intelligence : "ia_texte" ou "ia_vision". */
  capacite: "ia_texte" | "ia_vision";
  /** Type de tâche, pour la traçabilité et le coût. */
  tache: string;
  moteur: string;
  /** Consigne de rôle : ce que le modèle est autorisé à faire. */
  systeme: string;
  /** Demande réelle. */
  message: string;
  confidentialite?: Confidentiality;
  countryCode?: string | null;
  /** Images en data URI, pour la capacité vision. */
  images?: string[];
  maxTokens?: number;
  temperature?: number;
  /**
   * Préférence PDG pour la profondeur de réflexion du modèle (bouton
   * « Intensité » côté client) — une valeur réelle de `reasoning_effort`
   * documentée chez le fournisseur (famille gpt-5.*), jamais un changement
   * de modèle : un seul modèle est configuré par fournisseur (voir
   * ENDPOINTS), il n'y a rien d'autre à « monter ». Essayée en premier,
   * avant même la valeur mise en cache par `modeleDisponible` ; si le
   * fournisseur la refuse (valeur inconnue pour ce modèle, ou incompatible
   * avec les outils), la boucle de rejeu existante juste en dessous reprend
   * la main exactement comme aujourd'hui et retombe sur une valeur réelle
   * qui fonctionne — jamais d'erreur montrée au PDG pour une préférence
   * refusée.
   */
  reasoningEffortPrefere?: string;
  /** Fonctions que le modèle peut demander d'exécuter (capacité "outils"). */
  outils?: OutilFonction[];
  /** Réponse garantie conforme à ce schéma (capacité "sortie_structuree"). */
  sortieStructuree?: SortieStructuree;
  /**
   * Tours déjà échangés (assistant + tool), pour poursuivre une conversation
   * après un appel d'outil. Quand fourni, remplace le tour utilisateur unique
   * construit à partir de `message` — `message` doit alors être vide, le
   * dernier tour utile est déjà dans `historique`.
   */
  historique?: MessageConversation[];
  /**
   * Point 147 — fournisseur imposé par le propriétaire, ou moteur candidat en
   * mode shadow. Quand il est fourni, le routage habituel n'est pas consulté.
   */
  fournisseurImpose?: string;
  /** Fournisseurs déjà essayés et écartés : évite de rejouer un échec. */
  exclure?: string[];
  /** `principal`, `repli` ou `candidat` — pour la mesure du point 148. */
  rang?: Rang;
  /** Capacité MKA.P-MS demandée (`code`, `image`, `voix`…), pour la mesure. */
  capaciteMka?: string;
}

export type Rang = "principal" | "repli" | "candidat";

export interface Tentative {
  fournisseur: string;
  rang: Rang;
  ok: boolean;
  motif: string;
  dureeMs: number;
}

export interface AppelResultat {
  media?: MediaProduit;
  ok: boolean;
  /** Texte produit par le modèle. Vide quand `ok` est faux. */
  texte: string;
  fournisseur: string | null;
  modele: string | null;
  /**
   * Motif exact quand l'appel n'a pas eu lieu ou a échoué — détail technique
   * complet (fournisseur, modèle, code HTTP, message brut) : réservé aux
   * zones internes autorisées (direction, journaux, audit). Ne jamais
   * renvoyer ce champ à une surface publique — voir `motifPublic`.
   */
  motif: string;
  /**
   * LOT IA02A — motif générique, sans aucun détail fournisseur, destiné à
   * toute surface publique ou utilisateur. Vide quand `ok` est vrai.
   */
  motifPublic: string;
  jetonsEntree: number;
  jetonsSortie: number;
  dureeMs: number;
  /**
   * Chaîne réellement parcourue : fournisseur principal, puis replis essayés.
   * Un client qui ne voit que le résultat final ne saurait pas qu'un
   * fournisseur est tombé — cette liste le dit.
   */
  tentatives: Tentative[];
  /** Outils que le modèle demande à exécuter — vide quand aucun n'a été proposé ou demandé. */
  appelsOutils: AppelOutil[];
}

/**
 * Points d'entrée par fournisseur. Aucune clé n'est écrite ici.
 *
 * modeleParDefaut n'est utilisé que dans deux cas : comme préférence lors de
 * la découverte dynamique du modèle (resoudre() interroge /v1/models et
 * garde ce nom s'il apparaît dans la liste réelle du compte), et comme repli
 * final si cette découverte échoue (réseau indisponible, clé sans droit de
 * lister les modèles). Il doit donc TOUJOURS être un identifiant de modèle
 * réel chez le fournisseur : "gpt-5.6-terra" (avant un premier correctif)
 * n'a jamais existé chez OpenAI, ce qui ne cassait rien tant que la
 * découverte réussissait, mais garantissait un appel voué à l'échec dès
 * qu'elle ratait.
 *
 * "gpt-4o-mini" (avant ce correctif) a cessé d'exister sur le compte OpenAI
 * réel de MKA.P-MS (vérifié le 2026-09-26 par un vrai appel à /v1/models) :
 * la préférence exacte ne matchait donc plus jamais, et modeleDisponible()
 * retombait sur « le premier identifiant contenant gpt/mistral/claude/llama »
 * — un tirage au sort parmi ~30 modèles réels, dont la plupart (recherche
 * web contrainte, transcription, audio, image, temps réel...) ne sont même
 * pas des modèles de conversation. C'est la cause racine, jamais corrigée
 * jusqu'ici, derrière des pannes différentes à chaque expiration du cache
 * (1h) : "gpt-5.6-sol" un jour, potentiellement "gpt-4o-search-preview" ou
 * pire le lendemain. "gpt-5.5" est vérifié réellement (appel réel, pas une
 * supposition) répondre correctement aux outils ET aux images sans aucun
 * réglage spécial (0 jeton de raisonnement, ~800ms) — voir livraison
 * provider-selection-modele-non-conversationnel-tirage-au-sort.
 */
const ENDPOINTS: Record<string, { url: string; envKey: string; modeleParDefaut: string }> = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    modeleParDefaut: "gpt-5.5",
  },
  openai_vision: {
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    modeleParDefaut: "gpt-5.5",
  },
  mistral: {
    url: "https://api.mistral.ai/v1/chat/completions",
    envKey: "MISTRAL_API_KEY",
    modeleParDefaut: "mistral-large-latest",
  },
  modele_local: {
    url: "",
    envKey: "LOCAL_LLM_URL",
    modeleParDefaut: "local",
  },
};

interface ChoixModele {
  url: string;
  cle: string;
  modele: string;
}

/**
 * Résout l'adresse, la clé et le modèle. Le modèle n'est pas figé : on interroge
 * le fournisseur pour prendre un modèle réellement disponible sur ce compte,
 * plutôt que d'échouer sur un nom de modèle périmé.
 */
async function resoudre(
  providerCode: string,
  fetchImpl: typeof fetch,
): Promise<ChoixModele | { erreur: string }> {
  const spec = ENDPOINTS[providerCode];
  if (!spec) {
    return { erreur: `Fournisseur « ${providerCode} » sans point d'entrée d'appel connu.` };
  }

  const brut = process.env[spec.envKey];
  if (!brut || brut.trim().length === 0) {
    return { erreur: `Variable ${spec.envKey} absente de l'environnement du serveur.` };
  }
  const cle = brut.trim();

  if (providerCode === "modele_local") {
    return { url: `${cle.replace(/\/$/, "")}/v1/chat/completions`, cle: "", modele: spec.modeleParDefaut };
  }

  const modele = await modeleDisponible(providerCode, spec, cle, fetchImpl);
  return { url: spec.url, cle, modele };
}

const cacheModele = new Map<string, { modele: string; expire: number }>();

/**
 * Catégories de modèles réellement vérifiées (appel direct à /v1/models puis
 * à /v1/chat/completions sur le compte OpenAI réel, le 2026-09-26) comme
 * n'étant PAS des modèles de conversation générale, même quand leur nom
 * contient « gpt » : recherche web contrainte, transcription, temps réel,
 * audio, image/vidéo, synthèse vocale, embeddings, modération, complétion
 * héritée. Sans cette exclusion, « le premier identifiant contenant
 * gpt/mistral/claude/llama » retombait au hasard sur l'un de ces modèles
 * selon l'ordre — non garanti stable — renvoyé par /v1/models : c'est la
 * cause racine derrière des pannes différentes à chaque expiration du cache
 * (1h), jamais un vrai choix de modèle. Liste non exhaustive par construction
 * (un compte réel peut proposer un nom jamais vu ici) : elle réduit le risque
 * sans prétendre l'éliminer, cohérent avec le reste de ce fichier qui ne
 * masque jamais un échec réel derrière une supposition.
 */
const MOTIFS_MODELE_NON_CONVERSATIONNEL =
  /search-preview|search-api|transcribe|realtime|embedding|moderation|^gpt-audio|^gpt-image|^chatgpt-image|^sora-|^tts-|^whisper-|^babbage-|^davinci-/i;

async function modeleDisponible(
  providerCode: string,
  spec: { url: string; modeleParDefaut: string },
  cle: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  const enCache = cacheModele.get(providerCode);
  if (enCache && enCache.expire > Date.now()) return enCache.modele;

  const base = spec.url.replace(/\/chat\/completions$/, "/models");
  try {
    const reponse = await fetchImpl(base, { headers: { Authorization: `Bearer ${cle}` } });
    if (reponse.ok) {
      const corps = (await reponse.json()) as { data?: { id?: string }[] };
      const ids = (corps.data ?? []).map((m) => m.id ?? "").filter(Boolean);
      const eligibles = ids.filter((id) => !MOTIFS_MODELE_NON_CONVERSATIONNEL.test(id));
      const choisi =
        eligibles.find((id) => id === spec.modeleParDefaut) ??
        eligibles.find((id) => /gpt|mistral|claude|llama/i.test(id)) ??
        eligibles[0] ??
        ids[0];
      if (choisi) {
        cacheModele.set(providerCode, { modele: choisi, expire: Date.now() + 3600 * 1000 });
        return choisi;
      }
    }
  } catch {
    // Liste des modèles indisponible : on tente le modèle par défaut, et
    // l'erreur réelle remontera de l'appel lui-même.
  }
  return spec.modeleParDefaut;
}

/** Modèle → valeur de reasoning_effort prouvée nécessaire pour que les outils fonctionnent. */
const cacheReasoningEffort = new Map<string, { valeur: string; expire: number }>();

/**
 * Extrait la liste réelle des valeurs acceptées quand le fournisseur répond
 * « Unsupported value: 'reasoning_effort' does not support 'none' with this
 * model. Supported values are: 'low', 'medium', 'high', and 'xhigh'. » —
 * jamais une liste supposée, uniquement ce que l'erreur énonce elle-même.
 */
function valeursReasoningEffortSupportees(message: string): string[] {
  const m = message.match(/[Ss]upported values are:?\s*(.+)/);
  if (!m) return [];
  return Array.from(m[1].matchAll(/'([a-z]+)'/gi)).map((mm) => mm[1]);
}

/**
 * Point 148 — chaque tentative réelle est mesurée, réussie comme échouée. Une
 * mesure manquante deviendrait plus tard un « fournisseur fiable » sans preuve.
 */
async function mesurer(
  input: AppelInput,
  tentative: Tentative,
  jetonsEntree: number,
  jetonsSortie: number,
): Promise<void> {
  try {
    await enregistrerAppel({
      capacite: input.capaciteMka ?? input.capacite,
      tache: input.tache,
      moteur: input.moteur,
      fournisseur: tentative.fournisseur,
      rang: tentative.rang,
      ok: tentative.ok,
      dureeMs: tentative.dureeMs,
      jetonsEntree,
      jetonsSortie,
      motif: input.isolation === "SHOP" ? (tentative.ok ? "" : "SHOP_PROVIDER_UNAVAILABLE") : tentative.motif,
    });
  } catch {
    // La mesure ne doit jamais faire échouer l'appel qu'elle observe.
  }
}

/**
 * Appelle réellement un modèle. Ne jette pas : l'échec est une donnée, il doit
 * pouvoir s'afficher.
 */
export async function appeler(input: AppelInput, fetchImpl: typeof fetch = fetch): Promise<AppelResultat> {
  const debut = Date.now();
  const vide: AppelResultat = {
    ok: false,
    texte: "",
    fournisseur: null,
    modele: null,
    motif: "",
    motifPublic: MOTIF_PUBLIC_INDISPONIBLE,
    jetonsEntree: 0,
    jetonsSortie: 0,
    dureeMs: 0,
    tentatives: [],
    appelsOutils: [],
  };

  const rang: Rang = input.rang ?? "principal";
  let providerCode = input.fournisseurImpose ?? null;
  let providerLabel = providerCode;
  let replis: string[] = [];

  if (!providerCode) {
    const decision = await chooseProvider({
      capability: input.capacite,
      taskType: input.tache,
      engine: input.moteur,
      countryCode: input.countryCode ?? null,
      confidentiality: input.confidentialite ?? "interne",
    });

    if (decision.verdict !== "route" || !decision.providerCode) {
      return { ...vide, motif: decision.reason, dureeMs: Date.now() - debut };
    }
    providerCode = decision.providerCode;
    providerLabel = decision.providerLabel ?? decision.providerCode;
    replis = decision.candidates.filter(
      (c) => c !== decision.providerCode && !(input.exclure ?? []).includes(c),
    );
  }

  /**
   * Point 147 — un fournisseur qui tombe ne fait pas tomber la tâche : on
   * essaie le suivant, à condition qu'il soit lui aussi habilité (la liste des
   * replis vient du routage, qui a déjà filtré confidentialité et pays).
   *
   * LOT IA02A — `motifPublic` reste TOUJOURS le même message générique, quel
   * que soit le nombre de replis essayés : le détail (qui a été essayé,
   * pourquoi) reste dans `motif`, jamais dans `motifPublic`.
   */
  /**
   * `modeleTente` : quand `resoudre()` a réussi avant l'échec (l'appel HTTP
   * lui-même a échoué, ou la réponse était inutilisable), le nom réel du
   * modèle interrogé est déjà connu et doit apparaître dans le résultat —
   * sinon les journaux internes (PDG, audit) affichent « OPENAI / NULL »
   * alors qu'un modèle précis a bel et bien 