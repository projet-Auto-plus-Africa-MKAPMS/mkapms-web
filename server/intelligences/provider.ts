/**
 * MKA.P-MS Intelligences — couche d'appel réelle aux fournisseurs de modèles.
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
import { chooseProvider, markProviderUsed, type Confidentiality } from "../ai-fabric/service.js";
import { enregistrer as enregistrerAppel } from "./evaluation.js";

export interface AppelInput {
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
  /** Motif exact quand l'appel n'a pas eu lieu ou a échoué. */
  motif: string;
  jetonsEntree: number;
  jetonsSortie: number;
  dureeMs: number;
  /**
   * Chaîne réellement parcourue : fournisseur principal, puis replis essayés.
   * Un client qui ne voit que le résultat final ne saurait pas qu'un
   * fournisseur est tombé — cette liste le dit.
   */
  tentatives: Tentative[];
}

/** Points d'entrée par fournisseur. Aucune clé n'est écrite ici. */
const ENDPOINTS: Record<string, { url: string; envKey: string; modeleParDefaut: string }> = {
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    modeleParDefaut: "gpt-5.6-terra",
  },
  openai_vision: {
    url: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    modeleParDefaut: "gpt-5.6-terra",
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
async function resoudre(providerCode: string): Promise<ChoixModele | { erreur: string }> {
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

  const modele = await modeleDisponible(providerCode, spec, cle);
  return { url: spec.url, cle, modele };
}

const cacheModele = new Map<string, { modele: string; expire: number }>();

async function modeleDisponible(
  providerCode: string,
  spec: { url: string; modeleParDefaut: string },
  cle: string,
): Promise<string> {
  const enCache = cacheModele.get(providerCode);
  if (enCache && enCache.expire > Date.now()) return enCache.modele;

  const base = spec.url.replace(/\/chat\/completions$/, "/models");
  try {
    const reponse = await fetch(base, { headers: { Authorization: `Bearer ${cle}` } });
    if (reponse.ok) {
      const corps = (await reponse.json()) as { data?: { id?: string }[] };
      const ids = (corps.data ?? []).map((m) => m.id ?? "").filter(Boolean);
      const choisi =
        ids.find((id) => id === spec.modeleParDefaut) ??
        ids.find((id) => /gpt|mistral|claude|llama/i.test(id)) ??
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
      motif: tentative.motif,
    });
  } catch {
    // La mesure ne doit jamais faire échouer l'appel qu'elle observe.
  }
}

/**
 * Appelle réellement un modèle. Ne jette pas : l'échec est une donnée, il doit
 * pouvoir s'afficher.
 */
export async function appeler(input: AppelInput): Promise<AppelResultat> {
  const debut = Date.now();
  const vide: AppelResultat = {
    ok: false,
    texte: "",
    fournisseur: null,
    modele: null,
    motif: "",
    jetonsEntree: 0,
    jetonsSortie: 0,
    dureeMs: 0,
    tentatives: [],
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

    const suivant = replis[0];
    if (!suivant) {
      return {
        ...vide,
        fournisseur: providerCode,
        motif: motifEchec,
        dureeMs: Date.now() - debut,
        tentatives: [tentative],
      };
    }

    const secours = await appeler({
      ...input,
      fournisseurImpose: suivant,
      exclure: [...(input.exclure ?? []), providerCode ?? ""],
      rang: "repli",
    });
    return {
      ...secours,
      motif: secours.ok
        ? `Repli sur ${suivant} après échec de ${providerLabel} : ${motifEchec}`
        : `${motifEchec} Repli ${suivant} également indisponible : ${secours.motif}`,
      tentatives: [tentative, ...secours.tentatives],
    };
  };

  const resolu = await resoudre(providerCode);
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

  try {
    const reponse = await fetch(resolu.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(resolu.cle ? { Authorization: `Bearer ${resolu.cle}` } : {}),
      },
      body: JSON.stringify({
        model: resolu.modele,
        messages: [
          { role: "system", content: input.systeme },
          { role: "user", content: contenu },
        ],
        max_completion_tokens: input.maxTokens ?? 1200,
        ...(input.temperature === undefined ? {} : { temperature: input.temperature }),
      }),
      signal: AbortSignal.timeout(90_000),
    });

    const brut = await reponse.text();
    if (!reponse.ok) {
      let message = brut.slice(0, 400);
      try {
        const j = JSON.parse(brut) as { error?: { message?: string } };
        if (j.error?.message) message = j.error.message;
      } catch {
        // corps non JSON : on garde le texte brut tronqué.
      }
      return replier(
        `${providerLabel} a refusé l'appel (HTTP ${reponse.status}) : ${message}`,
        Date.now() - debut,
      );
    }

    const corps = JSON.parse(brut) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const texte = corps.choices?.[0]?.message?.content ?? "";
    const jetonsEntree = corps.usage?.prompt_tokens ?? 0;
    const jetonsSortie = corps.usage?.completion_tokens ?? 0;

    if (texte.trim().length === 0) {
      return replier(
        `${providerLabel} a répondu sans contenu utilisable.`,
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
      jetonsEntree,
      jetonsSortie,
      dureeMs: tentative.dureeMs,
      tentatives: [tentative],
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
    message: "Test d'accès MKA.P-MS Intelligences.",
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
