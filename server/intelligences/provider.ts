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

export interface AppelInput {
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
  const replier = async (motifEchec: string, dureeEchec: number): Promise<AppelResultat> => {
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
    if (connu && connu.expire > Date.now()) {
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

    if (!reponse.ok) {
      const message = extraireMessageErreur(brut);
      return replier(
        `${providerLabel} a refusé l'appel (HTTP ${reponse.status}) : ${message}`,
        Date.now() - debut,
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
    maxTokens: 16,
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
