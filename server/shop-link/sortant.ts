/**
 * Passerelle SORTANTE du moteur intermédiaire Boutique : tout appel de la plateforme vers la Boutique passe ici.
 *
 * Elle ne remplace pas le client existant (server/intelligences/boutique.ts, qui reste intact) : elle lui fournit son
 * `fetch` (le client accepte un transport injecté). Ainsi chaque appel est :
 *   1. refusé AVANT toute lecture du Coffre quand le câble est coupé ;
 *   2. limité aux routes déclarées dans le contrat (liste blanche, voir contrats.ts) et à l'origine lue dans le Coffre ;
 *   3. refusé si le corps envoyé contient une clé ou une valeur qui ressemble à un secret ;
 *   4. journalisé (canal, résultat, statut HTTP, durée — jamais le contenu).
 * Si le domaine de la Boutique change (futur nom de domaine), seule l'adresse du Coffre change : rien n'est figé ici.
 */
import { accesBoutique, type ResultatBoutique } from "../intelligences/boutique.js";
import { inspecter, routeAutorisee } from "./contrats.js";
import { etatEffectif, journaliser, messageCoupure } from "./service.js";

type Fetch = typeof fetch;
export interface Acces {
  origine: string;
  jeton: string;
}

export interface OptionsSortant {
  ownerId: number;
  /** Nom de l'outil ou de l'écran qui appelle (journalisé avec le motif dans le Coffre). */
  outil: string;
  motif: string;
  /** Transport réseau (par défaut le fetch global) : injectable pour les tests. */
  transport?: Fetch;
  /** Lecture de l'adresse et du jeton (par défaut : le Coffre). */
  obtenirAcces?: (ownerId: number, outil: string, motif: string) => Promise<{ ok: true; origine: string; jeton: string } | { ok: false; detail: string }>;
}

interface Observation {
  statut?: number;
  refus?: { code: "ORIGINE_INCONNUE" | "ROUTE_HORS_CONTRAT" | "DONNEE_INTERDITE"; detail: string };
}

class RefusContrat extends Error {
  constructor(public code: NonNullable<Observation["refus"]>["code"], message: string) {
    super(message);
  }
}

/** Transport gardé : vérifie origine, route et corps avant d'appeler le réseau. */
export function fetchGarde(acces: Acces, observation: Observation, transport: Fetch = fetch): Fetch {
  return (async (entree: Parameters<Fetch>[0], init?: Parameters<Fetch>[1]) => {
    const url = new URL(typeof entree === "string" ? entree : entree instanceof URL ? entree.href : (entree as Request).url);
    const methode = (init?.method ?? "GET").toUpperCase();
    try {
      if (url.origin !== acces.origine) throw new RefusContrat("ORIGINE_INCONNUE", "Adresse hors contrat : seule l'adresse enregistrée dans le Coffre est autorisée.");
      const prefixe = "/api/service";
      if (!url.pathname.startsWith(`${prefixe}/`) || !routeAutorisee(methode, url.pathname.slice(prefixe.length))) {
        throw new RefusContrat("ROUTE_HORS_CONTRAT", `Route hors contrat : ${methode} ${url.pathname.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F-]{27}/g, ":id").slice(0, 120)}.`);
      }
      if (typeof init?.body === "string" && init.body) {
        let corps: unknown = null;
        try {
          corps = JSON.parse(init.body);
        } catch {
          throw new RefusContrat("DONNEE_INTERDITE", "Corps illisible : seul du JSON est autorisé.");
        }
        const verdict = inspecter(corps);
        if (!verdict.ok) throw new RefusContrat("DONNEE_INTERDITE", `Donnée interdite par le contrat (${verdict.raison} en ${verdict.chemin}).`);
      }
    } catch (e) {
      if (e instanceof RefusContrat) {
        observation.refus = { code: e.code, detail: e.message };
      }
      throw e;
    }
    const reponse = await transport(url, { ...init, redirect: "error" });
    observation.statut = reponse.status;
    return reponse;
  }) as Fetch;
}

/**
 * Exécute `travail` (une fonction du client existant, par exemple `lireProduitBoutique`) à travers le câble.
 * Câble coupé : aucune lecture du Coffre, aucun appel réseau, réponse explicite `CABLE_COUPE`.
 */
export async function viaCable(options: OptionsSortant, travail: (acces: Acces, f: Fetch) => Promise<ResultatBoutique>): Promise<ResultatBoutique> {
  const debut = Date.now();
  const acteur = `${options.outil}:${options.ownerId}`;
  const passage = await etatEffectif("catalogue");
  if (!passage.passe) {
    await journaliser({ canal: "catalogue", sens: "sortant", evenement: "refus_cable", resultat: "refuse", acteur, detail: passage.raison });
    return { ok: false, code: "CABLE_COUPE", detail: messageCoupure(passage.raison) };
  }
  const acces = await (options.obtenirAcces ?? accesBoutique)(options.ownerId, options.outil, options.motif);
  if (!acces.ok) {
    await journaliser({ canal: "catalogue", sens: "sortant", evenement: "acces_refuse", resultat: "refuse", acteur, dureeMs: Date.now() - debut, detail: acces.detail.slice(0, 200) });
    return { ok: false, code: "ACCES_BOUTIQUE", detail: acces.detail };
  }
  const observation: Observation = {};
  let resultat: ResultatBoutique = { ok: false, detail: "" };
  let exception: Error | null = null;
  try {
    resultat = await travail({ origine: acces.origine, jeton: acces.jeton }, fetchGarde({ origine: acces.origine, jeton: acces.jeton }, observation, options.transport));
  } catch (e) {
    exception = e as Error;
  }
  if (exception && !observation.refus) {
    await journaliser({ canal: "catalogue", sens: "sortant", evenement: "appel_sortant", resultat: "erreur", dureeMs: Date.now() - debut, acteur, detail: exception.message });
    return { ok: false, code: "ERREUR_PASSERELLE", detail: "La passerelle Boutique a rencontré une erreur avant l'appel." };
  }
  if (observation.refus) {
    await journaliser({ canal: "catalogue", sens: "sortant", evenement: "refus_contrat", resultat: "refuse", dureeMs: Date.now() - debut, acteur, detail: `${observation.refus.code} : ${observation.refus.detail}` });
    return { ok: false, code: "CONTRAT_REFUSE", detail: `Refusé par le moteur intermédiaire : ${observation.refus.detail}` };
  }
  await journaliser({
    canal: "catalogue",
    sens: "sortant",
    evenement: "appel_sortant",
    resultat: resultat.ok ? "ok" : "erreur",
    statutHttp: observation.statut ?? null,
    dureeMs: Date.now() - debut,
    acteur,
    detail: resultat.ok ? "" : (resultat.code ?? "").slice(0, 80),
  });
  return resultat;
}
