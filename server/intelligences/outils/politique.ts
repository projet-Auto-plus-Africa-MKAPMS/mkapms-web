/**
 * MKA.P-MS Intelligence — Permission / Policy Engine des outils.
 *
 * Décide QUI peut utiliser un outil qui existe (registre.ts). Ne connaît rien
 * à l'exécution réelle (executeur.ts) : il rend un verdict et un motif, jamais
 * un résultat.
 *
 * Règle non négociable, jamais contournée ici : un outil à risque HIGH ou
 * CRITICAL, ou marqué requiresHumanApproval, n'est JAMAIS exécuté par ce lot —
 * aucun mécanisme d'approbation humaine en boucle n'existe encore
 * (server/intelligences/orchestrateur.ts a un système d'autorisation par
 * étape, mais rien qui couvre un appel d'outil unique en plein milieu d'une
 * conversation). Tant que ce mécanisme n'existe pas, le refus honnête vaut
 * mieux qu'une fausse validation.
 *
 * Mondial par conception : la vérification pays consulte le Country Engine
 * réel (server/country-os/index.ts), jamais un pays codé en dur. Un outil
 * sans `allowedCountries` déclaré (`null`) est ouvert à tout pays ouvert au
 * Country Engine ; `blockedCountries` reste toujours prioritaire.
 */
import { verifier } from "../permissions.js";
import { getCountry } from "../../country-os/index.js";
import type { OutilSpec } from "./registre.js";

/**
 * Injectable uniquement pour les tests (aucun accès base de données dans cet
 * environnement de travail) : la production utilise toujours `getCountry` de
 * country-os/index.ts, jamais un autre chemin.
 */
export type GetCountryFn = typeof getCountry;

export type VerdictPolitique = "autorise" | "refuse" | "attente_approbation_humaine";

export interface EvaluationPolitique {
  verdict: VerdictPolitique;
  motif: string;
}

export interface ContextePolitique {
  role: string | null;
  /** Moteur MKA.P-MS pour le compte duquel l'appel est fait — tracé, jamais anonyme. */
  moteur: string;
  /** Pays de l'opération (ISO 3166-1 alpha-2), quand il est connu — jamais supposé "FR" par défaut. */
  countryCode?: string | null;
}

/**
 * Injectable uniquement pour les tests (aucun accès base de données dans cet
 * environnement de travail) : la production utilise toujours `verifier` de
 * permissions.js, jamais un autre chemin.
 */
export type VerifierPermission = typeof verifier;

export async function evaluer(
  outil: OutilSpec,
  contexte: ContextePolitique,
  verifierPermission: VerifierPermission = verifier,
  getCountryImpl: GetCountryFn = getCountry,
): Promise<EvaluationPolitique> {
  if (!outil.enabled) {
    return {
      verdict: "refuse",
      motif:
        outil.implementationStatus === "REGISTERED_NOT_IMPLEMENTED"
          ? `« ${outil.name} » est enregistré au Tool Registry mais pas encore implémenté.`
          : `« ${outil.name} » est désactivé au registre.`,
    };
  }

  if (!contexte.moteur.trim()) {
    return { verdict: "refuse", motif: "Appel anonyme refusé : le moteur appelant doit se nommer pour être tracé." };
  }

  if (!outil.allowedRoles.includes(contexte.role ?? "")) {
    return {
      verdict: "refuse",
      motif: `Rôle « ${contexte.role ?? "aucun"} » non autorisé pour « ${outil.name} » (rôles admis : ${outil.allowedRoles.join(", ")}).`,
    };
  }

  const pays = contexte.countryCode?.toUpperCase().trim() || null;
  if (pays && outil.blockedCountries.includes(pays)) {
    return { verdict: "refuse", motif: `« ${outil.name} » est bloqué pour le pays ${pays} par une règle explicite.` };
  }
  if (pays && outil.allowedCountries && !outil.allowedCountries.includes(pays)) {
    return {
      verdict: "refuse",
      motif: `« ${outil.name} » n'est autorisé que pour : ${outil.allowedCountries.join(", ")} (pays demandé : ${pays}).`,
    };
  }
  if (pays) {
    const paysOuvert = await getCountryImpl(pays);
    if (!paysOuvert || !paysOuvert.active) {
      return {
        verdict: "refuse",
        motif: `Pays ${pays} non ouvert au Country Engine : aucune règle applicable, exécution refusée par prudence.`,
      };
    }
  }

  for (const permission of outil.requiredPermissions) {
    const droit = await verifierPermission({ role: contexte.role, moteur: contexte.moteur, permission });
    if (!droit.autorise) {
      return {
        verdict: "refuse",
        motif: `Permission « ${permission} » manquante pour « ${outil.name} » : ${droit.motif}`,
      };
    }
  }

  // Politique explicite par niveau de risque (point non négociable, voir
  // l'en-tête du fichier) : ni le rôle ni la permission ne suffisent au-delà
  // de MEDIUM sans validation humaine, et cette validation n'existe pas encore.
  if (outil.riskLevel === "HIGH" || outil.riskLevel === "CRITICAL") {
    return {
      verdict: "refuse",
      motif: `« ${outil.name} » est de risque ${outil.riskLevel} : aucune politique explicite ne l'autorise encore, quel que soit le rôle.`,
    };
  }

  if (outil.requiresHumanApproval) {
    return {
      verdict: "attente_approbation_humaine",
      motif: `« ${outil.name} » exige une validation humaine avant exécution — mécanisme d'approbation pas encore construit, l'outil n'est donc jamais exécuté par ce lot.`,
    };
  }

  return { verdict: "autorise", motif: `« ${outil.name} » autorisé pour le rôle « ${contexte.role} ».` };
}
