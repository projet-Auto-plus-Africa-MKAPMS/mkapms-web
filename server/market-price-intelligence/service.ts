/**
 * MKA.P-MS — Comparaison de prix externe par pays (LOT IA02G, suite du
 * chantier Estimate Gateway / LOT IA02E).
 *
 * Demande de la direction : partout où la plateforme estime un prix, une
 * seconde intelligence doit pouvoir comparer ce chiffre à ce qui se vend
 * réellement à l'extérieur, publiquement, pays par pays. Ce fichier est le
 * seul endroit du code qui interroge une source publique hors plateforme
 * pour cela — changer de fournisseur de recherche ne touche que lui.
 *
 * Deux règles non négociables, comme pour l'Estimate Gateway qu'il alimente :
 * 1. Un prix externe n'est renvoyé que s'il apparaît texto dans un extrait de
 *    recherche réellement obtenu, avec son URL réelle — jamais déduit, jamais
 *    moyenné à partir d'une supposition.
 * 2. Sans clé de recherche configurée (WEB_SEARCH_API_KEY), ou sans résultat
 *    exploitable, la fonction le dit explicitement — elle n'invente jamais
 *    une source ni un montant.
 *
 * Fournisseur de recherche implémenté : Brave Search API (cataloguée dans
 * server/ai-fabric/service.ts sous "recherche_web_externe"). L'extraction
 * des prix dans les extraits est confiée au modèle de texte déjà connecté
 * (server/intelligences/provider.ts::appeler), avec une consigne stricte de
 * ne jamais halluciner un montant absent du texte fourni.
 */
import { appeler } from "../intelligences/provider.js";
import { recordCost } from "../ai-fabric/service.js";
import { getCountry } from "../country-os/index.js";
import {
  estimationIndisponible,
  nouvelleEstimationVide,
  type ResultatEstimation,
} from "../estimate-gateway/types.js";

const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

export interface ResultatRecherche {
  title: string;
  url: string;
  description: string;
}

type RechercheReponse = { ok: true; resultats: ResultatRecherche[] } | { ok: false; motif: string };

async function rechercherWeb(requete: string, fetchImpl: typeof fetch): Promise<RechercheReponse> {
  const cle = process.env.WEB_SEARCH_API_KEY?.trim();
  if (!cle) {
    return {
      ok: false,
      motif: "Variable WEB_SEARCH_API_KEY absente des variables du serveur : aucune recherche externe n'a été tentée.",
    };
  }
  try {
    const url = `${BRAVE_SEARCH_URL}?q=${encodeURIComponent(requete)}&count=8`;
    const reponse = await fetchImpl(url, {
      headers: { Accept: "application/json", "X-Subscription-Token": cle },
      signal: AbortSignal.timeout(15_000),
    });
    if (!reponse.ok) {
      return { ok: false, motif: `Recherche web externe refusée (HTTP ${reponse.status}).` };
    }
    const corps = (await reponse.json()) as {
      web?: { results?: { title?: string; url?: string; description?: string }[] };
    };
    const resultats = (corps.web?.results ?? [])
      .filter((r): r is { title: string; url: string; description?: string } => Boolean(r.title && r.url))
      .map((r) => ({ title: r.title, url: r.url, description: r.description ?? "" }));
    return { ok: true, resultats };
  } catch (e) {
    return {
      ok: false,
      motif: `Recherche web externe impossible : ${e instanceof Error ? e.message : "erreur inconnue"}.`,
    };
  }
}

export interface PrixExterneTrouve {
  montant: number;
  devise: string;
  url: string;
  titre: string;
  extrait: string;
}

interface ExtractionIA {
  aucunPrixTrouve: boolean;
  prix: { montant: number; devise: string; url: string }[];
}

type ExtractionReponse = { ok: true; prix: PrixExterneTrouve[] } | { ok: false; motif: string };

/** N'accepte un prix que si son URL correspond à un résultat réellement obtenu — le modèle ne peut pas faire apparaître une source qui n'existe pas. */
async function extrairePrixDesExtraits(
  resultats: ResultatRecherche[],
  vehicule: string,
  paysLabel: string,
  countryCode: string | null,
  fetchImpl: typeof fetch,
): Promise<ExtractionReponse> {
  const extraitsTexte = resultats
    .map((r, i) => `[${i}] ${r.title} — ${r.url}\n${r.description}`)
    .join("\n\n");

  const reponse = await appeler(
    {
      capacite: "ia_texte",
      tache: "comparaison_prix_externe",
      moteur: "market-price-intelligence",
      confidentialite: "publique",
      countryCode,
      systeme:
        "Tu extrais des prix de véhicules à partir d'extraits de recherche web publics. Règle absolue : ne renvoie QUE " +
        "des montants qui apparaissent littéralement dans le texte fourni, avec leur devise telle qu'écrite et l'URL " +
        "exacte de l'extrait dont ils proviennent. N'invente, n'estime ni ne déduis jamais un prix absent du texte. " +
        "Si aucun extrait ne contient de prix exploitable, renvoie aucunPrixTrouve=true et une liste vide.",
      message: `Véhicule recherché : ${vehicule}. Marché : ${paysLabel}.\n\nExtraits de recherche :\n${extraitsTexte}`,
      sortieStructuree: {
        nom: "prix_externes_extraits",
        schema: {
          type: "object",
          properties: {
            aucunPrixTrouve: { type: "boolean" },
            prix: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  montant: { type: "number" },
                  devise: { type: "string" },
                  url: { type: "string" },
                },
                required: ["montant", "devise", "url"],
              },
            },
          },
          required: ["aucunPrixTrouve", "prix"],
        },
        strict: true,
      },
      maxTokens: 800,
    },
    fetchImpl,
  );

  if (!reponse.ok) {
    return { ok: false, motif: reponse.motif };
  }

  let extraction: ExtractionIA;
  try {
    extraction = JSON.parse(reponse.texte) as ExtractionIA;
  } catch {
    return { ok: false, motif: "Réponse d'extraction non conforme au format attendu (JSON invalide)." };
  }

  if (extraction.aucunPrixTrouve || !Array.isArray(extraction.prix)) {
    return { ok: true, prix: [] };
  }

  const source = new Map(resultats.map((r) => [r.url, r] as const));
  const prix: PrixExterneTrouve[] = extraction.prix
    .filter((p) => source.has(p.url) && Number.isFinite(p.montant) && p.montant > 0 && typeof p.devise === "string")
    .map((p) => {
      const r = source.get(p.url)!;
      return { montant: p.montant, devise: p.devise.toUpperCase(), url: p.url, titre: r.title, extrait: r.description };
    });

  return { ok: true, prix };
}

/**
 * Compare le prix d'un véhicule à ce qui se vend publiquement à l'extérieur,
 * pays par pays. Ne remplace jamais l'estimation interne (VO Engine) : elle
 * la met en regard d'une source publique, avec ses propres sources visibles.
 */
export async function comparerPrixExterne(
  input: { marque: string; modele: string; annee?: number | null; countryCode?: string | null },
  traceId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({
    estimateType: "vehicle.marketValue.externalComparison",
    engineId: "market-price-intelligence",
    traceId,
    country: input.countryCode ?? null,
    parameters: { marque: input.marque, modele: input.modele, annee: input.annee ?? null },
  });

  const pays = input.countryCode ? await getCountry(input.countryCode) : null;
  const paysLabel = pays?.nameFr ?? input.countryCode ?? "marché non précisé";
  const vehicule = `${input.marque} ${input.modele}${input.annee ? ` ${input.annee}` : ""}`;

  const recherche = await rechercherWeb(`${vehicule} prix occasion ${paysLabel}`, fetchImpl);
  if (!recherche.ok) {
    return estimationIndisponible(base, [recherche.motif]);
  }
  if (recherche.resultats.length === 0) {
    return estimationIndisponible(base, ["Aucun résultat public trouvé pour ce véhicule sur ce marché."]);
  }

  await recordCost({
    engine: "market-price-intelligence",
    taskType: "comparaison_prix_externe",
    capability: "recherche_web",
    providerCode: "recherche_web_externe",
    units: recherche.resultats.length,
    unitLabel: "résultat de recherche",
    note: `Recherche « ${vehicule} » sur ${paysLabel} : ${recherche.resultats.length} résultat(s).`,
    countryCode: input.countryCode ?? null,
  });

  const extraction = await extrairePrixDesExtraits(recherche.resultats, vehicule, paysLabel, input.countryCode ?? null, fetchImpl);

  if (!extraction.ok) {
    // La recherche a fonctionné mais l'extraction automatique a échoué : les
    // sources réelles restent utiles même sans prix extrait automatiquement.
    return {
      ...base,
      status: "ok",
      quality: "REFERENCE_RANGE",
      amount: null,
      currency: null,
      minAmount: null,
      maxAmount: null,
      confidence: "faible",
      sourceIds: [],
      assumptions: [],
      missingData: [`Extraction automatique des prix indisponible : ${extraction.motif}`],
      warnings: ["Résultats de recherche fournis sans extraction de prix automatique."],
      isLiveQuote: false,
      isBinding: false,
      validUntil: null,
      externalSources: recherche.resultats.slice(0, 5).map((r) => ({ title: r.title, url: r.url })),
    };
  }

  if (extraction.prix.length === 0) {
    return {
      ...estimationIndisponible(base, ["Aucun prix explicite trouvé dans les résultats publics pour ce véhicule sur ce marché."]),
      externalSources: recherche.resultats.slice(0, 5).map((r) => ({ title: r.title, url: r.url })),
    };
  }

  const montants = extraction.prix.map((p) => p.montant);
  const devise = extraction.prix[0].devise;
  const memeDevise = extraction.prix.every((p) => p.devise === devise);

  return {
    ...base,
    status: "ok",
    quality: "REFERENCE_RANGE",
    amount: memeDevise ? Math.round(montants.reduce((s, m) => s + m, 0) / montants.length) : null,
    currency: memeDevise ? devise : null,
    minAmount: memeDevise ? Math.min(...montants) : null,
    maxAmount: memeDevise ? Math.max(...montants) : null,
    confidence: extraction.prix.length >= 3 ? "moyenne" : "faible",
    sourceIds: [],
    assumptions: [
      "Prix relevés tels qu'affichés publiquement sur des sites tiers — non vérifiés par MKA.P-MS, non engageants.",
      ...(memeDevise ? [] : ["Devises différentes selon la source : fourchette non calculée, voir les sources."]),
    ],
    missingData: [],
    warnings: [],
    isLiveQuote: false,
    isBinding: false,
    validUntil: null,
    externalSources: extraction.prix.map((p) => ({ title: p.titre, url: p.url })),
  };
}

export interface MarketPriceIntelligenceHealth {
  health: "ok" | "degraded" | "down";
  configured: boolean;
  details: string[];
}

/** État honnête de la capacité : configurée seulement si la clé de recherche est présente. */
export function marketPriceIntelligenceHealth(): MarketPriceIntelligenceHealth {
  const configured = Boolean(process.env.WEB_SEARCH_API_KEY?.trim());
  return {
    health: configured ? "ok" : "degraded",
    configured,
    details: configured
      ? ["WEB_SEARCH_API_KEY configurée : la comparaison de prix externe peut réellement interroger Brave Search."]
      : ["WEB_SEARCH_API_KEY absente : la comparaison de prix externe répond UNAVAILABLE, jamais un prix inventé."],
  };
}
