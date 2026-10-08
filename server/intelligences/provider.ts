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
import { modeleValide } from "./sonde-store.js";

export interface MediaProduit {
  mime: "image/png" | "audio/mpeg" | "text/plain";
  base64: string;
}

export interface AppelInput {
  /** Opération média explicite, exécutée sans outils métier ni shadow. */
  media?: "image" | "voix" | "transcription";
  audio?: FichierAudio;
  /** Consigne de transcription (vocabulaire attendu), pour `media: "transcription"` seulement. */
  promptTranscription?: string;
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

/** Plafond de relance : au-delà, un modèle à raisonnement qui boucle coûterait sans limite. */
const BUDGET_RELANCE_MAX = 32_000;
const BUDGET_RELANCE_MIN = 16_000;

/**
 * Réponse vide parce que TOUT le budget de sortie est parti en raisonnement interne (finish_reason "length", ni texte ni
 * appel d'outil) : c'est un budget trop juste, pas une panne. Renvoie le corps à rejouer UNE fois avec un budget plus
 * large (quatre fois l'ancien, entre 16 000 et 32 000 jetons), avec la même intensité de réflexion que le PDG a choisie ;
 * `null` si la réponse n'est pas dans ce cas ou si le budget est déjà au plafond. Observé en production : « 4000 jetons de
 * raisonnement sur 4000 » à la toute dernière étape d'un travail de 34 étapes (rendu final) — tout le travail précédent
 * était fait, seul le rendu échouait.
 */
export function corpsRelanceBudget(brut: string, corpsCourant: Record<string, unknown>): Record<string, unknown> | null {
  let c: { choices?: { finish_reason?: string | null; message?: { content?: string | null; tool_calls?: unknown[] } }[] };
  try {
    c = JSON.parse(brut) as typeof c;
  } catch {
    return null;
  }
  const choix = c.choices?.[0];
  const vide = (choix?.message?.content ?? "").trim().length === 0 && (choix?.message?.tool_calls?.length ?? 0) === 0;
  if (choix?.finish_reason !== "length" || !vide) return null;
  const actuel = Number(corpsCourant.max_completion_tokens) || 1200;
  const nouveau = Math.min(BUDGET_RELANCE_MAX, Math.max(actuel * 4, BUDGET_RELANCE_MIN));
  if (nouveau <= actuel) return null;
  return { ...corpsCourant, max_completion_tokens: nouveau };
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
   * alors qu'un modèle précis a bel et bien été appelé et a échoué. Absent
   * (undefined) uniquement quand l'échec précède la résolution du modèle
   * (ex. clé API absente) : là, aucun modèle n'a réellement été tenté.
   */
  const replier = async (
    motifEchec: string,
    dureeEchec: number,
    modeleTente?: string,
  ): Promise<AppelResultat> => {
    const tentative: Tentative = {
      fournisseur: providerCode ?? "inconnu",
      rang,
      ok: false,
      motif: motifEchec,
      dureeMs: dureeEchec,
    };
    await mesurer(input, tentative, 0, 0);

    const suivant = input.isolation === "SHOP" ? undefined : replis[0];
    if (!suivant) {
      return {
        ...vide,
        fournisseur: providerCode,
        modele: modeleTente ?? null,
        motif: motifEchec,
        dureeMs: Date.now() - debut,
        tentatives: [tentative],
      };
    }

    const secours = await appeler(
      {
        ...input,
        fournisseurImpose: suivant,
        exclure: [...(input.exclure ?? []), providerCode ?? ""],
        rang: "repli",
      },
      fetchImpl,
    );
    return {
      ...secours,
      motif: secours.ok
        ? `Repli sur ${suivant} après échec de ${providerLabel} : ${motifEchec}`
        : `${motifEchec} Repli ${suivant} également indisponible : ${secours.motif}`,
      motifPublic: secours.ok ? "" : MOTIF_PUBLIC_INDISPONIBLE,
      tentatives: [tentative, ...secours.tentatives],
    };
  };

  const resolu = await resoudre(providerCode, fetchImpl);
  if ("erreur" in resolu) {
    return replier(
      `${providerLabel} est routable mais l'appel est impossible : ${resolu.erreur}`,
      Date.now() - debut,
    );
  }

  if (input.media) {
    if (input.isolation === "SHOP" || !["openai", "openai_vision"].includes(providerCode)) {
      return { ...vide, motif: "Ce fournisseur ne possède pas d’adaptateur média natif dans cette plateforme.", dureeMs: Date.now() - debut };
    }
    try {
      const media = input.media === "transcription"
        ? await transcrireAudioNatif(resolu, input.audio!, fetchImpl, undefined, input.promptTranscription)
        : await produireMediaNatif(resolu, input.media, input.message, fetchImpl, input.images);
      await markProviderUsed(providerCode);
      await db.insert(afCostEntries).values({
        engine: input.moteur, taskType: input.media, providerCode,
        capability: input.capacite, units: 1, unitLabel: input.media === "image" ? "image" : input.media === "transcription" ? "transcription" : "synthèse vocale",
        costCents: 0, measured: false, countryCode: input.countryCode ?? null,
        note: "Média natif généré. Tarif non renseigné ; zéro n’est pas un coût gratuit.",
      });
      const tentative: Tentative = { fournisseur: providerCode, rang, ok: true, motif: "", dureeMs: Date.now() - debut };
      await mesurer(input, tentative, 0, 0);
      return { ...vide, ok: true, motifPublic: "", fournisseur: providerCode,
        modele: input.media === "voix" ? "tts-1" : input.media === "transcription" ? "transcription" : resolu.modele, media, tentatives: [tentative], dureeMs: tentative.dureeMs };
    } catch (e) {
      // Aucun corps fournisseur, prompt ni donnée binaire dans les journaux/erreurs : seulement un code public
      // (statut, modèle, code d'erreur) quand l'adaptateur en a produit un, pour diagnostiquer sans deviner.
      const code = e instanceof Error && /^[A-Z][A-Za-z0-9._-]{2,160}$/.test(e.message) ? ` (${e.message})` : "";
      const tentative: Tentative = { fournisseur: providerCode, rang, ok: false, motif: `Génération média refusée ou indisponible${code}.`, dureeMs: Date.now() - debut };
      await mesurer(input, tentative, 0, 0);
      return { ...vide, motif: tentative.motif, fournisseur: providerCode, modele: resolu.modele, tentatives: [tentative], dureeMs: tentative.dureeMs };
    }
  }

  const contenu: unknown = input.images?.length
    ? [
        { type: "text", text: input.message },
        ...input.images.slice(0, 4).map((url) => ({ type: "image_url", image_url: { url } })),
      ]
    : input.message;

  const corpsBase: Record<string, unknown> = {
    model: resolu.modele,
    messages: [
      { role: "system", content: input.systeme },
      ...(input.historique ?? [{ role: "user", content: contenu }]),
    ],
    max_completion_tokens: input.maxTokens ?? 1200,
    ...(input.temperature === undefined ? {} : { temperature: input.temperature }),
    ...(input.outils?.length ? { tools: input.outils, tool_choice: "auto" } : {}),
    ...(input.sortieStructuree
      ? {
          response_format: {
            type: "json_schema",
            json_schema: {
              name: input.sortieStructuree.nom,
              schema: input.sortieStructuree.schema,
              strict: input.sortieStructuree.strict ?? true,
            },
          },
        }
      : {}),
  };

  const envoyer = (corps: Record<string, unknown>) =>
    fetchImpl(resolu.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(resolu.cle ? { Authorization: `Bearer ${resolu.cle}` } : {}),
      },
      body: JSON.stringify(corps),
      signal: AbortSignal.timeout(input.isolation === "SHOP" ? 45_000 : 90_000),
    });

  const extraireMessageErreur = (brutErreur: string): string => {
    let message = brutErreur.slice(0, 400);
    try {
      const j = JSON.parse(brutErreur) as { error?: { message?: string } };
      if (j.error?.message) message = j.error.message;
    } catch {
      // corps non JSON : on garde le texte brut tronqué.
    }
    return message;
  };

  try {
    /**
     * Certains modèles de raisonnement découverts dynamiquement (ex. la
     * famille "gpt-5.*"/"gpt-6-*" — voir modeleDisponible ci-dessus, jamais
     * codée en dur ici) refusent l'appel d'outils sur /v1/chat/completions
     * tant que reasoning_effort n'a pas la bonne valeur. On ne devine jamais
     * à l'avance ni le modèle concerné ni la valeur attendue : c'est le
     * fournisseur lui-même qui le dit dans l'erreur réelle — soit
     * "...set reasoning_effort to 'none'", soit, si "none" est lui-même
     * refusé (vérifié réellement sur un modèle réel : "none" n'est pas
     * toujours accepté), "...Supported values are: 'low', 'medium'...". La
     * valeur suivante à essayer vient donc toujours du texte réel de
     * l'erreur, jamais d'une liste supposée. Borné à deux rejeux au
     * maximum : jamais une boucle, et un modèle réellement incompatible avec
     * les outils (constaté : certains le sont, quelle que soit la valeur)
     * échoue honnêtement au bout de ces deux tentatives, comme n'importe
     * quel autre échec réel. La valeur qui a fonctionné est mise en cache
     * par modèle (1h, même durée que la découverte du modèle) pour ne pas
     * rejouer ces mêmes échecs à chaque appel suivant.
     */
    const dejaEssaye = new Set<string>();
    const connu = input.outils?.length ? cacheReasoningEffort.get(resolu.modele) : undefined;
    let corpsCourant = corpsBase;
    if (input.reasoningEffortPrefere) {
      corpsCourant = { ...corpsBase, reasoning_effort: input.reasoningEffortPrefere };
      dejaEssaye.add(input.reasoningEffortPrefere);
    } else if (connu && connu.expire > Date.now()) {
      corpsCourant = { ...corpsBase, reasoning_effort: connu.valeur };
      dejaEssaye.add(connu.valeur);
    }

    let reponse = await envoyer(corpsCourant);
    let brut = await reponse.text();

    const MAX_REJEUX_REASONING_EFFORT = 2;
    for (let rejeu = 0; rejeu < MAX_REJEUX_REASONING_EFFORT && !reponse.ok && input.outils?.length; rejeu++) {
      const message = extraireMessageErreur(brut);
      if (!/reasoning_effort/i.test(message)) break;

      let prochaine: string | null = null;
      if (!dejaEssaye.has("none") && /tools?/i.test(message)) {
        prochaine = "none";
      } else {
        prochaine = valeursReasoningEffortSupportees(message).find((v) => !dejaEssaye.has(v)) ?? null;
      }
      if (!prochaine) break;

      dejaEssaye.add(prochaine);
      reponse = await envoyer({ ...corpsBase, reasoning_effort: prochaine });
      brut = await reponse.text();
    }

    if (reponse.ok && input.outils?.length && dejaEssaye.size > 0) {
      const valeurRetenue = [...dejaEssaye].pop()!;
      cacheReasoningEffort.set(resolu.modele, { valeur: valeurRetenue, expire: Date.now() + 3600 * 1000 });
    }

    // Budget de sortie épuisé par le raisonnement interne : une seule relance avec un budget plus large (voir corpsRelanceBudget).
    // Si elle échoue à son tour, on garde la première réponse et son diagnostic « arrêté par limite de jetons ».
    if (reponse.ok) {
      const relance = corpsRelanceBudget(brut, corpsCourant);
      if (relance) {
        const reponse2 = await envoyer(relance);
        const brut2 = await reponse2.text();
        if (reponse2.ok) {
          reponse = reponse2;
          brut = brut2;
        }
      }
    }

    if (!reponse.ok) {
      const message = extraireMessageErreur(brut);
      return replier(
        `${providerLabel} a refusé l'appel (HTTP ${reponse.status}) : ${message}`,
        Date.now() - debut,
        resolu.modele,
      );
    }

    const corps = JSON.parse(brut) as {
      choices?: {
        finish_reason?: string | null;
        message?: {
          content?: string | null;
          tool_calls?: { id: string; type: string; function: { name: string; arguments: string } }[];
        };
      }[];
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        completion_tokens_details?: { reasoning_tokens?: number };
      };
    };
    const choix = corps.choices?.[0];
    const message = choix?.message;
    const texte = message?.content ?? "";
    const appelsOutils: AppelOutil[] = (message?.tool_calls ?? [])
      .filter((t) => t.type === "function")
      .map((t) => ({ id: t.id, nom: t.function.name, arguments: t.function.arguments }));
    const jetonsEntree = corps.usage?.prompt_tokens ?? 0;
    const jetonsSortie = corps.usage?.completion_tokens ?? 0;

    // Un modèle qui ne fait qu'appeler un outil (aucun texte) est une réponse
    // valide, pas un échec : c'est justement le but de la capacité "outils".
    if (texte.trim().length === 0 && appelsOutils.length === 0) {
      // "length" + jetons de raisonnement proches du budget = le modèle a
      // épuisé max_completion_tokens en raisonnement interne avant d'écrire
      // une seule ligne visible — un budget trop juste, pas une vraie panne
      // fournisseur. Le dire explicitement évite de deviner à chaque
      // occurrence future.
      const raisonnement = corps.usage?.completion_tokens_details?.reasoning_tokens;
      const cause =
        choix?.finish_reason === "length"
          ? raisonnement
            ? ` (arrêté par limite de jetons : ${raisonnement} jeton(s) de raisonnement sur ${jetonsSortie} alloué(s))`
            : " (arrêté par limite de jetons avant tout contenu visible)"
          : choix?.finish_reason
            ? ` (finish_reason: ${choix.finish_reason})`
            : "";
      return replier(
        `${providerLabel} a répondu sans contenu utilisable${cause}.`,
        Date.now() - debut,
        resolu.modele,
      );
    }

    await markProviderUsed(providerCode);
    await db.insert(afCostEntries).values({
      engine: input.moteur,
      taskType: input.tache,
      providerCode,
      capability: input.capacite,
      units: Math.max(1, Math.round((jetonsEntree + jetonsSortie) / 1000)),
      unitLabel: "1000 jetons",
      costCents: 0,
      measured: false,
      countryCode: input.countryCode ?? null,
      note: `${jetonsEntree} jetons entrée, ${jetonsSortie} jetons sortie, modèle ${resolu.modele}. Coût unitaire non renseigné : le tarif du fournisseur doit être saisi pour convertir en euros.`,
    });

    const tentative: Tentative = {
      fournisseur: providerCode,
      rang,
      ok: true,
      motif: "",
      dureeMs: Date.now() - debut,
    };
    await mesurer(input, tentative, jetonsEntree, jetonsSortie);

    return {
      ok: true,
      texte,
      fournisseur: providerCode,
      modele: resolu.modele,
      motif: "",
      motifPublic: "",
      jetonsEntree,
      jetonsSortie,
      dureeMs: tentative.dureeMs,
      tentatives: [tentative],
      appelsOutils,
    };
  } catch (e) {
    return replier(
      `Appel à ${providerLabel} impossible : ${
        e instanceof Error ? e.message : "erreur inconnue"
      }`,
      Date.now() - debut,
      resolu.modele,
    );
  }
}

/**
 * Fournisseurs proposés au PDG, et où obtenir leur clé. Les noms de variables
 * viennent de `ENDPOINTS` : une seule source, sinon le catalogue affiché
 * finirait par nommer une variable que l'appel réel n'utilise plus.
 */
const OBTENTION: Record<string, { label: string; obtain: string }> = {
  openai: { label: "OpenAI (GPT)", obtain: "https://platform.openai.com/api-keys" },
  mistral: { label: "Mistral AI", obtain: "https://console.mistral.ai/api-keys/" },
  modele_local: {
    label: "Modèle local (auto-hébergé)",
    obtain: "URL d'un endpoint compatible OpenAI (Ollama, LM Studio…)",
  },
};

export interface EtatFournisseur {
  code: string;
  label: string;
  envKey: string;
  obtain: string;
  configured: boolean;
}

/**
 * Ce qui manque pour que l'Intelligence puisse répondre. Seule la présence ou
 * l'absence d'une clé est exposée, jamais sa valeur.
 */
export function etatConfiguration(): {
  operational: boolean;
  totalProviders: number;
  activeProviders: number;
  providers: EtatFournisseur[];
  guidance: string;
} {
  const providers: EtatFournisseur[] = Object.entries(OBTENTION).map(([code, meta]) => {
    const envKey = ENDPOINTS[code]?.envKey ?? "";
    return {
      code,
      label: meta.label,
      envKey,
      obtain: meta.obtain,
      configured: Boolean(envKey && process.env[envKey]?.trim()),
    };
  });
  const active = providers.filter((p) => p.configured);
  const premiere = providers[0]?.envKey ?? "";
  return {
    operational: active.length > 0,
    totalProviders: providers.length,
    activeProviders: active.length,
    providers,
    guidance:
      active.length === 0
        ? `Aucune clé n'est configurée pour MKA.P-MS AI. Ajoute au moins ${premiere} dans les variables Railway pour que l'assistant, le Centre de Commandes et les moteurs Intelligence puissent répondre.`
        : `${active.length}/${providers.length} fournisseur(s) opérationnel(s). Ajoute d'autres clés pour bénéficier du repli automatique en cas de panne.`,
  };
}

export interface EtatServiceIntelligencePublic {
  etat: EtatServicePublic;
  nom: string;
}

/**
 * LOT IA02A — état public, sans aucun détail fournisseur : ni label, ni
 * variable d'environnement, ni URL. Calculé uniquement à partir de
 * fournisseurs réellement `CONNECTED_AND_TESTED` (jamais un candidat
 * simplement configuré mais non câblé) — c'est la seule fonction que les
 * surfaces publiques ou utilisateur ont le droit d'appeler pour connaître la
 * disponibilité du service.
 */
export async function etatServicePublic(): Promise<EtatServiceIntelligencePublic> {
  const etats = await providerStates();
  const utilisables = etats.filter(
    (s) =>
      (s.capability === "ia_texte" || s.capability === "ia_vision") &&
      s.wireStatus === "CONNECTED_AND_TESTED" &&
      (s.status === "actif" || s.status === "configure"),
  );
  const etat: EtatServicePublic =
    utilisables.length === 0 ? "unavailable" : utilisables.length === 1 ? "degraded" : "available";
  return { etat, nom: NOM_PRODUIT };
}

/** Contrôle de bout en bout : la clé configurée répond-elle vraiment ? */
export async function verifierAcces(): Promise<{
  status: "up" | "degraded" | "down";
  message: string;
  fournisseur: string | null;
  modele: string | null;
}> {
  const r = await appeler({
    capacite: "ia_texte",
    tache: "verification_acces",
    moteur: "intelligences",
    systeme: "Réponds exactement le mot OK, sans ponctuation.",
    message: "Test d'accès MKA.P-MS AI.",
    // 16 jetons a été vérifié réellement insuffisant : un modèle de raisonnement
    // découvert dynamiquement (ex. gpt-5.5, compte réel, 2026-09-26) consomme
    // déjà 10 à 18 jetons de raisonnement internes avant même d'écrire « OK »,
    // ce qui fait échouer l'appel avec un vrai HTTP 400 OpenAI (« Could not
    // finish the message because max_tokens... ») — ce test de bout en bout
    // signalait alors un accès « dégradé » alors que le fournisseur répond
    // normalement aux vraies conversations (budgets 900-4000 ailleurs dans ce
    // fichier). 64 jetons est vérifié réellement suffisant (marge ~3x sur le
    // maximum observé) sans changer ce que ce contrôle mesure.
    maxTokens: 64,
  });

  if (r.ok) {
    return {
      status: "up",
      message: `Fournisseur ${r.fournisseur} joignable, modèle ${r.modele} (${r.dureeMs} ms).`,
      fournisseur: r.fournisseur,
      modele: r.modele,
    };
  }
  return {
    status: r.fournisseur ? "degraded" : "down",
    message: r.motif,
    fournisseur: r.fournisseur,
    modele: r.modele,
  };
}

export interface ResultatModeration {
  /** false quand l'appel n'a pas eu lieu (clé absente, panne réseau, HTTP en échec) — jamais confondu avec "contenu sain". */
  disponible: boolean;
  /** Vrai uniquement si OpenAI a réellement classé ce texte comme signalé. Toujours false quand disponible=false. */
  signale: boolean;
  /** Catégories réellement retournées par OpenAI (ex. "harassment", "sexual") — jamais une liste supposée. */
  categories: string[];
  /** Motif de l'échec, vide quand disponible=true. */
  motif: string;
}

/**
 * Moderation API OpenAI (/v1/moderations) — classification de contenu réelle,
 * jamais un mot-clé interdit codé en dur. Endpoint gratuit chez OpenAI, sans
 * routage Fabrique Intelligence (pas de choix de fournisseur ni de coût à
 * arbitrer ici) : provider.ts reste néanmoins le seul fichier à connaître
 * OPENAI_API_KEY, conformément à scripts/check-providers.mjs — un moteur
 * métier (ex. server/reputation-engine/fraud.ts) importe cette fonction, il
 * ne parle jamais lui-même au fournisseur.
 *
 * Absence de clé, panne réseau ou réponse illisible → disponible=false,
 * signale=false : jamais un contenu "silencieusement approuvé" par défaut
 * pris pour une vraie vérification. L'appelant décide quoi faire d'une
 * modération indisponible (aujourd'hui : ne pas bloquer, cohérent avec le
 * reste de reputation-engine/fraud.ts où rien n'est supprimé sans preuve).
 */
export async function modererTexte(
  texte: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResultatModeration> {
  const vide: ResultatModeration = { disponible: false, signale: false, categories: [], motif: "" };
  const cle = process.env.OPENAI_API_KEY?.trim();
  if (!cle) {
    return { ...vide, motif: "OPENAI_API_KEY absente : modération réellement indisponible, jamais un texte supposé sain." };
  }
  try {
    const reponse = await fetchImpl("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cle}` },
      body: JSON.stringify({ model: "omni-moderation-latest", input: texte }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!reponse.ok) {
      const brut = await reponse.text();
      return { ...vide, motif: `OpenAI a refusé l'appel de modération (HTTP ${reponse.status}) : ${brut.slice(0, 200)}` };
    }
    const corps = (await reponse.json()) as {
      results?: { flagged?: boolean; categories?: Record<string, boolean> }[];
    };
    const resultat = corps.results?.[0];
    if (!resultat) {
      return { ...vide, motif: "Réponse de modération illisible (aucun résultat renvoyé)." };
    }
    const categories = Object.entries(resultat.categories ?? {})
      .filter(([, signalee]) => signalee === true)
      .map(([categorie]) => categorie);
    return { disponible: true, signale: resultat.flagged === true, categories, motif: "" };
  } catch (e) {
    return { ...vide, motif: `Appel de modération impossible : ${e instanceof Error ? e.message : "erreur inconnue"}` };
  }
}

export interface ResultatRechercheWeb {
  disponible: boolean;
  reponse: string;
  sources: { titre: string; url: string }[];
  motif: string;
}

/**
 * Recherche web native OpenAI (/v1/responses, tools=[{type:"web_search"}]) —
 * réutilise OPENAI_API_KEY déjà configurée pour le texte, aucune clé
 * supplémentaire. Distincte de recherche.webSearch (Brave, WEB_SEARCH_API_KEY
 * absente sur ce serveur) : alternative vérifiée accessible sur le compte de
 * production (appel réel, 2026-09-26) qui sert la conversation, pas
 * l'estimation de prix (server/market-price-intelligence/service.ts, non
 * dupliquée ici).
 *
 * Comme market-price-intelligence : jamais une source inventée — seules les
 * URLs réellement annotées par le fournisseur dans sa réponse (`url_citation`)
 * sont retenues. `tool_choice` force l'appel de l'outil : un texte qui
 * demande explicitement cette fonction attend une vraie recherche, pas un
 * souvenir du modèle présenté comme à jour.
 */
export async function rechercherWebNatif(
  requete: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResultatRechercheWeb> {
  const vide: ResultatRechercheWeb = { disponible: false, reponse: "", sources: [], motif: "" };
  const q = requete.trim();
  if (!q) return { ...vide, motif: "Requête de recherche vide." };
  const cle = process.env.OPENAI_API_KEY?.trim();
  if (!cle) {
    return { ...vide, motif: "OPENAI_API_KEY absente : recherche web réellement indisponible, jamais une réponse supposée à jour." };
  }
  try {
    const reponse = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cle}` },
      body: JSON.stringify({
        model: "gpt-5.5",
        input: q,
        tools: [{ type: "web_search" }],
        tool_choice: { type: "web_search" },
        max_output_tokens: 1200,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!reponse.ok) {
      const brut = await reponse.text();
      return { ...vide, motif: `OpenAI a refusé la recherche web (HTTP ${reponse.status}) : ${brut.slice(0, 200)}` };
    }
    const corps = (await reponse.json()) as {
      status?: string;
      output?: {
        type?: string;
        content?: { type?: string; text?: string; annotations?: { type?: string; url?: string; title?: string }[] }[];
      }[];
    };
    if (corps.status !== "completed") {
      return { ...vide, motif: `Recherche web incomplète (statut fournisseur : ${corps.status ?? "inconnu"}).` };
    }
    const message = corps.output?.find((o) => o.type === "message");
    const bloc = message?.content?.find((c) => c.type === "output_text");
    const texte = bloc?.text?.trim();
    if (!texte) {
      return { ...vide, motif: "Recherche web : aucune réponse textuelle renvoyée par le fournisseur." };
    }
    const sources = (bloc?.annotations ?? [])
      .filter((a): a is { type: string; url: string; title?: string } => a.type === "url_citation" && typeof a.url === "string")
      .map((a) => ({ titre: (a.title ?? a.url).slice(0, 200), url: a.url }))
      .slice(0, 8);
    return { disponible: true, reponse: texte.slice(0, 4000), sources, motif: "" };
  } catch (e) {
    return { ...vide, motif: `Appel de recherche web impossible : ${e instanceof Error ? e.message : "erreur inconnue"}` };
  }
}

/** Adaptateur borné, appelé exclusivement après les contrôles du routeur. Export pour test injecté. */
export async function produireMediaNatif(
  resolu: { cle: string; modele: string }, operation: "image" | "voix", texte: string,
  fetchImpl: typeof fetch = fetch, images: string[] = [],
): Promise<MediaProduit> {
  if (!resolu.cle || !texte.trim() || texte.length > 4000) throw new Error("MEDIA_INPUT_INVALID");
  const image = operation === "image";
  const response = await fetchImpl(image ? "https://api.openai.com/v1/responses" : "https://api.openai.com/v1/audio/speech", {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(150_000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resolu.cle}` },
    body: JSON.stringify(image ? {
      model: resolu.modele, store: false,
      instructions: "Créer un nouveau visuel produit premium à partir des références autorisées, avec composition, décor, éclairage et rendu originaux. Préserver l'identité réelle du produit sans recopier le décor fournisseur. Ne jamais inventer logo, certification, performance, accessoire ou caractéristique. Aucune preuve de test. Respecter les droits des contenus et la politique commerciale halal MKA.P-MS. Aucune publication automatique.",
      input: images.length ? [{ role: "user", content: [
        { type: "input_text", text: texte },
        ...images.slice(0, 4).map((image_url) => ({ type: "input_image", image_url })),
      ] }] : texte,
      tools: [{ type: "image_generation", size: "1024x1024", quality: "high", output_format: "png" }],
      tool_choice: { type: "image_generation" }, max_output_tokens: 1200,
    } : { model: "tts-1", input: texte, voice: "alloy", response_format: "mp3" }),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error("MEDIA_PROVIDER_UNAVAILABLE"); }
  if (!response.body) throw new Error("MEDIA_EMPTY");
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 12 * 1024 * 1024) { await reader.cancel(); throw new Error("MEDIA_TOO_LARGE"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = Buffer.concat(chunks);
  if (image) {
    const parsed = JSON.parse(bytes.toString("utf8"));
    const outputs = parsed.output?.filter((x: {type?: string}) => x.type === "image_generation_call");
    if (parsed.status !== "completed" || outputs?.length !== 1 || outputs[0].status !== "completed") throw new Error("MEDIA_INCOMPLETE");
    const encoded = outputs[0].result;
    if (typeof encoded !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error("MEDIA_INVALID");
    const png = Buffer.from(encoded, "base64");
    if (png.length < 32 || png.length > 8 * 1024 * 1024 || png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("MEDIA_INVALID");
    return { mime: "image/png", base64: png.toString("base64") };
  }
  if (bytes.length < 16 || !(bytes.subarray(0,3).toString() === "ID3" || (bytes[0] === 255 && (bytes[1] & 224) === 224))) throw new Error("MEDIA_INVALID");
  return { mime: "audio/mpeg", base64: bytes.toString("base64") };
}

/** Modèles de transcription de fichier, par ordre de préférence. Le modèle déjà prouvé par la sonde passe en premier. */
export const MODELES_TRANSCRIPTION_FICHIER = ["whisper-1", "gpt-4o-mini-transcribe", "gpt-4o-transcribe"] as const;

/** Code public d'une erreur du fournisseur (type/code seulement) : jamais le message brut, qui peut citer un fragment de clé. */
export function codePublicErreur(corps: string): { type: string; code: string } {
  try {
    const e = JSON.parse(corps) as { error?: { code?: unknown; type?: unknown } };
    const net = (v: unknown) => String(v ?? "").replace(/[^A-Za-z0-9._-]/g, "").slice(0, 60);
    return { type: net(e.error?.type), code: net(e.error?.code) };
  } catch {
    return { type: "", code: "" };
  }
}

/**
 * Transcription d'un fichier audio, bornée. Le modèle n'est plus figé : on essaie le modèle déjà prouvé par la
 * sonde, puis la liste fermée, et on s'arrête dès qu'un modèle répond. Un refus (400/403/404) passe au suivant ;
 * l'erreur finale nomme le statut, le modèle et le code public — jamais la clé, l'audio ni le corps brut.
 */
export async function transcrireAudioNatif(resolu:{cle:string}, input:FichierAudio, fetchImpl:typeof fetch=fetch, modelePrefere?:string, prompt?:string):Promise<MediaProduit>{
 const bytes=lireAudio(input);if(!resolu.cle)throw Error('AUDIO_CREDENTIAL_REQUIRED');
 const mime={mp3:'audio/mpeg',wav:'audio/wav',webm:'audio/webm',mp4:'audio/mp4'}[input.format];
 const modeles=[...new Set([modelePrefere,await modeleValide('transcription'),...MODELES_TRANSCRIPTION_FICHIER].filter((m):m is string=>!!m&&/^[A-Za-z0-9._-]{1,80}$/.test(m)))];
 let derniere='AUDIO_PROVIDER_UNAVAILABLE';
 for(const modele of modeles){
  const form=new FormData();form.append('model',modele);form.append('response_format','json');
  form.append('file',new Blob([new Uint8Array(bytes)],{type:mime}),`recording.${input.format}`);
  if(prompt?.trim())form.append('prompt',prompt.trim().slice(0,1_000));
  const response=await fetchImpl('https://api.openai.com/v1/audio/transcriptions',{method:'POST',redirect:'error',signal:AbortSignal.timeout(150_000),headers:{Authorization:`Bearer ${resolu.cle}`},body:form});
  if(!response.ok){
   const err=codePublicErreur((await response.text()).slice(0,4000));
   derniere=`AUDIO_PROVIDER_${response.status}_${modele}_${err.code||err.type||'unknown'}`;
   if([400,403,404].includes(response.status))continue;
   throw Error(derniere);
  }
  if(!response.body)throw Error('AUDIO_EMPTY');
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>256*1024){await reader.cancel();throw Error('AUDIO_RESULT_TOO_LARGE');}chunks.push(value);}}finally{reader.releaseLock();}
  const parsed=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(typeof parsed.text!=='string'||!parsed.text.trim()||parsed.text.length>60000)throw Error('AUDIO_EMPTY');
  return {mime:'text/plain',base64:Buffer.from(parsed.text.trim(),'utf8').toString('base64')};
 }
 throw Error(derniere);
}

/** Modèle d'empreintes par défaut et dimensions conservées (réduction native du fournisseur : moins de stockage, qualité très proche). */
export const MODELE_EMPREINTES_DEFAUT = "text-embedding-3-large";
export const DIMENSIONS_EMPREINTES = 1024;

export type ResultatEmpreintes =
  | { ok: true; modele: string; dimensions: number; vecteurs: number[][] }
  | { ok: false; motif: string };

/**
 * Empreintes sémantiques (embeddings) de textes. Passerelle unique : aucun autre fichier ne parle au fournisseur
 * pour cela. Le modèle déjà prouvé par la sonde passe en premier ; un refus (400/403/404) passe au suivant. Aucun
 * texte, aucune clé et aucun message brut du fournisseur dans l'erreur : statut, modèle et code public seulement.
 * Ne jette pas : l'échec est une donnée (la recherche retombe alors sur le texte).
 */
export async function creerEmpreintes(textes: string[], fetchImpl: typeof fetch = fetch): Promise<ResultatEmpreintes> {
  const cle = process.env.OPENAI_API_KEY?.trim();
  if (!cle) return { ok: false, motif: "Clé du fournisseur absente du serveur : empreintes réellement indisponibles." };
  const entrees = textes.map((t) => t.replace(/\s+/g, " ").trim().slice(0, 8000));
  if (entrees.length === 0 || entrees.length > 96 || entrees.some((t) => t.length === 0)) {
    return { ok: false, motif: "Textes d'entrée invalides (1 à 96 textes non vides)." };
  }
  const modeles = [...new Set([await modeleValide("empreintes_semantiques"), MODELE_EMPREINTES_DEFAUT].filter((m): m is string => !!m && /^[A-Za-z0-9._-]{1,60}$/.test(m)))];
  let dernier = "EMBEDDINGS_PROVIDER_UNAVAILABLE";
  for (const modele of modeles) {
    try {
      const r = await fetchImpl("https://api.openai.com/v1/embeddings", {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(60_000),
        headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: modele, input: entrees, dimensions: DIMENSIONS_EMPREINTES }),
      });
      const corps = await r.text();
      if (!r.ok) {
        const e = codePublicErreur(corps.slice(0, 4000));
        dernier = `EMBEDDINGS_PROVIDER_${r.status}_${modele}_${e.code || e.type || "unknown"}`;
        if ([400, 403, 404].includes(r.status)) continue;
        break;
      }
      const donnees = (JSON.parse(corps) as { data?: { index?: number; embedding?: number[] }[] }).data ?? [];
      const vecteurs = [...donnees].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).map((d) => d.embedding);
      if (vecteurs.length !== entrees.length || vecteurs.some((v) => !Array.isArray(v) || v.length !== DIMENSIONS_EMPREINTES)) {
        return { ok: false, motif: `EMBEDDINGS_INVALID_${modele}` };
      }
      return { ok: true, modele, dimensions: DIMENSIONS_EMPREINTES, vecteurs: vecteurs as number[][] };
    } catch {
      dernier = `EMBEDDINGS_NETWORK_${modele}`;
      break;
    }
  }
  return { ok: false, motif: dernier };
}

export type ModeSessionVocale = "dictee" | "conversation";

/** Voix proposées par l'API temps réel (cedar et marin sont propres à cette API). */
export const VOIX_TEMPS_REEL = ["marin", "cedar", "ash", "echo", "verse", "ballad", "alloy", "coral", "sage", "shimmer"] as const;
export type VoixTempsReel = (typeof VOIX_TEMPS_REEL)[number];

const PHRASE_APERCU = "Bonjour, je suis AL-HUDHUD·M, l'intelligence de MKA.P-MS. Voici ma voix : dis-moi si elle te convient.";
const MODELES_APERCU = ["gpt-4o-mini-tts", "tts-1"] as const;
// tts-1 ne connaît que les voix historiques ; marin, cedar, ash, ballad, coral, sage, verse exigent gpt-4o-mini-tts.
const VOIX_TTS1 = new Set(["alloy", "echo", "shimmer"]);

/**
 * Court exemple parlé d'une voix (MP3), pour choisir sans tâtonner. Même clé serveur que le micro ;
 * l'audio n'est ni stocké ni journalisé. Renvoie un code public (jamais le corps de la réponse) si le service refuse.
 */
export async function creerApercuVoix(voix: string, fetchImpl: typeof fetch = fetch): Promise<{ mime: "audio/mpeg"; base64: string; modele: string }> {
  if (!(VOIX_TEMPS_REEL as readonly string[]).includes(voix)) throw new Error("VOICE_PREVIEW_INVALID");
  const cle = process.env.OPENAI_API_KEY?.trim();
  if (!cle) throw new Error("VOICE_PREVIEW_CREDENTIAL_REQUIRED");
  let derniere = "VOICE_PREVIEW_UNAVAILABLE";
  for (const modele of MODELES_APERCU) {
    if (modele === "tts-1" && !VOIX_TTS1.has(voix)) continue;
    const response = await fetchImpl("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modele,
        voice: voix,
        input: PHRASE_APERCU,
        response_format: "mp3",
        ...(modele === "gpt-4o-mini-tts" ? { instructions: "Parle en français, naturellement, d'un ton posé et chaleureux." } : {}),
      }),
    });
    if (response.ok) {
      const octets = Buffer.from(await response.arrayBuffer());
      if (octets.length < 200 || octets.length > 1_000_000) throw new Error("VOICE_PREVIEW_INVALID_OUTPUT");
      return { mime: "audio/mpeg", base64: octets.toString("base64"), modele };
    }
    let code = "unknown";
    try {
      const erreur = JSON.parse(await response.text()) as { error?: { code?: unknown; type?: unknown } };
      code = String(erreur.error?.code ?? erreur.error?.type ?? "unknown").replace(/[^A-Za-z0-9._-]/g, "").slice(0, 60) || "unknown";
    } catch { /* corps non JSON : jamais recopié */ }
    derniere = `VOICE_PREVIEW_${response.status}_${modele}_${code}`;
    if (![400, 403, 404].includes(response.status)) break;
  }
  throw new Error(derniere);
}

/**
 * Un SDP (RFC 4566) est une suite de lignes qui se terminent TOUTES par CRLF, la dernière comprise.
 * `trim()` supprimait ce dernier saut de ligne : un analyseur SDP strict (Pion, utilisé par les
 * serveurs WebRTC) refuse alors l'offre en bloc (« EOF »), ce qui se voyait côté OpenAI comme
 * `400 invalid_offer`. On valide sur le texte nettoyé mais on transmet toujours un SDP complet.
 */
export function normaliserSdp(texte: string): string {
  return `${texte.trim().split(/\r\n|\r|\n/).join("\r\n")}\r\n`;
}

/** Langue de réponse imposée à la conversation vocale lorsque l'utilisateur l'a choisie dans ses réglages. */
const LANGUES_REPONSE_VOCALE: Record<string, string> = {
  fr: "en français de France, avec une prononciation native et naturelle",
  en: "en anglais, avec une prononciation native et naturelle",
  ar: "en arabe, avec une prononciation native et naturelle",
  es: "en espagnol, avec une prononciation native et naturelle",
  pt: "en portugais, avec une prononciation native et naturelle",
  de: "en allemand, avec une prononciation native et naturelle",
  it: "en italien, avec une prononciation native et naturelle",
  nl: "en néerlandais, avec une prononciation native et naturelle",
  tr: "en turc, avec une prononciation native et naturelle",
};

/** Longueur maximale du vocabulaire ajouté à la consigne de transcription. */
export const VOCABULAIRE_MAX_CARACTERES = 700;
/**
 * Longueur maximale du texte d'aide à la transcription envoyé à OpenAI (session vocale temps réel). Le fournisseur refuse
 * (400 « string_above_max_length ») un texte de plus de 1 024 caractères : on reste à 1 000, vocabulaire de la mémoire compris,
 * pour que l'ouverture de la conversation vocale ne dépende jamais de la taille de la mémoire du locuteur.
 */
export const TRANSCRIPTION_PROMPT_MAX_CARACTERES = 1000;

/**
 * Consigne donnée au modèle de transcription : marques, formules arabes courantes et, quand il y en a, les mots
 * propres au locuteur tirés de sa mémoire, à écrire tels quels. Bornée : un vocabulaire trop long dégrade la transcription.
 */
export function consigneTranscription(langue: string | undefined, vocabulaire: readonly string[] = []): string {
  const base = !langue || langue === "fr"
    ? "AL-HUDHUD·M, MKA.P-MS. Ponctuation naturelle et transcription fidèle. Le locuteur parle français et emploie parfois des formules arabes courantes, à écrire en lettres latines sans les traduire : salam alaikum, assalamou alaykoum, wa alaykoum salam, bismillah, inchallah, machallah, hamdoulilah, barakallahou fik, jazakallah khayran."
    : "AL-HUDHUD·M, MKA.P-MS. Ponctuation naturelle et transcription fidèle, dans la langue parlée, sans traduire ni reformuler.";
  const retenus: string[] = [];
  const introduction = `${base} Mots et expressions du locuteur, à écrire exactement ainsi quand ils sont prononcés : `;
  // Le budget du vocabulaire est le plus petit de deux plafonds : celui du vocabulaire seul, et ce qui reste sous la limite du fournisseur.
  const budget = Math.min(VOCABULAIRE_MAX_CARACTERES, TRANSCRIPTION_PROMPT_MAX_CARACTERES - introduction.length - 1);
  let longueur = 0;
  for (const brut of vocabulaire) {
    const terme = brut.replace(/[\u0000-\u001f"]/g, " ").replace(/\s+/g, " ").trim();
    if (!terme || retenus.includes(terme)) continue;
    if (longueur + terme.length + 2 > budget) break;
    retenus.push(terme);
    longueur += terme.length + 2;
  }
  return retenus.length ? `${introduction}${retenus.join(", ")}.` : base;
}

/**
 * Ouvre une session OpenAI Realtime WebRTC sans jamais transmettre la clé au
 * navigateur. L'offre SDP vient du téléphone, la réponse SDP seulement lui
 * est rendue. L'audio circule ensuite directement dans la connexion chiffrée
 * WebRTC ; il n'est ni stocké ni recopié dans les journaux de la plateforme.
 */
export async function creerAppelVocalTempsReel(
  sdp: string,
  mode: ModeSessionVocale,
  options: { langue?: string; voix?: string; reductionBruit?: "near_field" | "far_field"; safetyId?: string; modeleTranscription?: string; vocabulaire?: readonly string[] } = {},
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const nettoye = sdp.trim();
  if (nettoye.length < 64 || nettoye.length > 100_000 || !nettoye.startsWith("v=0")) {
    throw new Error("REALTIME_SDP_INVALID");
  }
  const offre = normaliserSdp(nettoye);
  const cle = process.env.OPENAI_API_KEY?.trim();
  if (!cle) throw new Error("REALTIME_CREDENTIAL_REQUIRED");

  const langue = options.langue?.split("-")[0]?.toLowerCase();
  const consigneLangue = langue && LANGUES_REPONSE_VOCALE[langue]
    ? ` Langue choisie par l'utilisateur : réponds toujours ${LANGUES_REPONSE_VOCALE[langue]}, sauf s'il te demande explicitement d'en changer.`
    : "";
  const promptTranscription = consigneTranscription(langue, options.vocabulaire);
  const voixAutorisee = new Set<string>(VOIX_TEMPS_REEL);
  const voix = voixAutorisee.has(options.voix ?? "") ? options.voix! : "marin";
  // Modèle qui a déjà transcrit pour ce navigateur (mémorisé côté client) : la session démarre avec lui, au lieu de perdre les
  // premières phrases sur un modèle que le projet n'autorise pas. Liste fermée : jamais un nom libre venu du navigateur.
  const MODELES_TRANSCRIPTION = ["gpt-4o-mini-transcribe", "gpt-4o-transcribe", "whisper-1"];
  const modeleTranscription = MODELES_TRANSCRIPTION.includes(options.modeleTranscription ?? "")
    ? options.modeleTranscription!
    : /^[A-Za-z0-9._-]{1,60}$/.test(process.env.OPENAI_REALTIME_TRANSCRIPTION_MODEL?.trim() ?? "")
      ? process.env.OPENAI_REALTIME_TRANSCRIPTION_MODEL!.trim()
      : ((await modeleValide("transcription_temps_reel")) ?? "gpt-4o-mini-transcribe");
  const reductionBruit = options.reductionBruit === "far_field" ? "far_field" : "near_field";
  // `gpt-realtime` est l'alias GA le plus largement ouvert. Une installation
  // peut épingler une version plus récente, mais on revient automatiquement à
  // l'alias stable si cette version n'est pas autorisée pour son projet API.
  const configure = process.env.OPENAI_REALTIME_MODEL?.trim();
  const modeles = [...new Set([
    configure && /^[A-Za-z0-9._-]{1,80}$/.test(configure) ? configure : null,
    "gpt-realtime",
  ].filter((modele): modele is string => !!modele))];
  let derniereErreur = "REALTIME_PROVIDER_UNAVAILABLE";

  for (const modele of modeles) {
    const session = {
      type: "realtime",
      model: modele,
      output_modalities: ["audio"],
      instructions: mode === "conversation"
        ? "Tu es AL-HUDHUD·M, l'intelligence privée créée par MKA.P-MS. Réponds naturellement à l'oral, dans la langue de l'utilisateur, avec des tours courts et utiles. Si l'utilisateur te salue en arabe (« salam alaikum », « assalamou alaykoum »), réponds « wa alaykoum salam » puis continue ; comprends les expressions arabes courantes dites en conversation (inchallah, hamdoulilah, bismillah, barakallahou fik). N'affirme jamais avoir exécuté une action externe que cette session vocale n'a pas réellement exécutée. Respecte la confidentialité, la sécurité et la politique commerciale halal MKA.P-MS." + consigneLangue
        : "Transcris fidèlement la parole de l'utilisateur. Ne réponds pas et ne reformule pas.",
      audio: {
        input: {
          noise_reduction: { type: reductionBruit },
          transcription: {
            model: modeleTranscription,
            ...(langue && /^[a-z]{2,3}$/.test(langue) ? { language: langue } : {}),
            prompt: promptTranscription,
          },
          turn_detection: mode === "conversation"
            ? { type: "semantic_vad", eagerness: "medium", create_response: true, interrupt_response: true }
            : { type: "server_vad", threshold: 0.45, prefix_padding_ms: 500, silence_duration_ms: 800, create_response: false, interrupt_response: false },
        },
        output: { voice: voix },
      },
    };

    const form = new FormData();
    form.set("sdp", offre);
    form.set("session", JSON.stringify(session));
    const response = await fetchImpl("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
      headers: {
        Authorization: `Bearer ${cle}`,
        ...(options.safetyId ? { "OpenAI-Safety-Identifier": options.safetyId } : {}),
      },
      body: form,
    });
    const corps = (await response.text()).trim();
    if (response.ok) {
      if (corps.length < 64 || corps.length > 100_000 || !corps.startsWith("v=0")) {
        throw new Error("REALTIME_ANSWER_INVALID");
      }
      // Réponse rendue au navigateur avec ses fins de ligne complètes (CRLF final compris).
      return normaliserSdp(corps);
    }

    // Aucun secret n'est journalisé : seulement le statut, le modèle demandé
    // et le code d'erreur public renvoyé par l'API.
    let code = "unknown";
    try {
      const erreur = JSON.parse(corps) as { error?: { code?: unknown; type?: unknown; param?: unknown } };
      code = String(erreur.error?.code ?? erreur.error?.type ?? "unknown").replace(/[^A-Za-z0-9._-]/g, "").slice(0, 80) || "unknown";
      // Le champ refusé par le fournisseur (ex. « session.audio.input.transcription.prompt ») : sans lui, une erreur de longueur ne dit pas laquelle.
      const champ = typeof erreur.error?.param === "string" ? erreur.error.param.replace(/[^A-Za-z0-9._-]/g, "").slice(0, 80) : "";
      if (champ) code = `${code}@${champ}`;
    } catch {
      // Une réponse non JSON ne doit jamais être recopiée dans les journaux.
    }
    derniereErreur = `REALTIME_PROVIDER_${response.status}_${modele}_${code}`;
    if (![400, 403, 404].includes(response.status)) break;
  }

  throw new Error(derniereErreur);
}
