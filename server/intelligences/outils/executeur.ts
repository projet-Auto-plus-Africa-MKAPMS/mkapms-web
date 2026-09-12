/**
 * MKA.P-MS Intelligence — Tool Executor.
 *
 * Exécute réellement un outil déjà autorisé par la politique (politique.ts).
 * Ne décide jamais qui a le droit — reçoit un feu vert et l'exécute, sous
 * trois garde-fous non négociables : arguments conformes au schéma, temps
 * limité au timeout déclaré, erreur de l'outil rattrapée et rapportée telle
 * quelle (jamais un résultat plausible inventé à la place).
 */
import type { OutilSpec } from "./registre.js";
import { validerArguments } from "./validation.js";
import { IMPLEMENTATIONS } from "./implementations.js";
import type { ContexteExecution } from "./outils-test.js";

export type StatutExecution = "execute" | "erreur" | "timeout" | "arguments_invalides" | "non_implemente";

export interface ResultatExecution {
  statut: StatutExecution;
  resultat: unknown;
  motif: string;
  dureeMs: number;
}

function argumentsBruts(arguments_: string): { ok: true; valeurs: unknown } | { ok: false; motif: string } {
  try {
    return { ok: true, valeurs: JSON.parse(arguments_ || "{}") };
  } catch (e) {
    return { ok: false, motif: `Arguments non JSON : ${e instanceof Error ? e.message : "erreur inconnue"}` };
  }
}

async function avecTimeout<T>(promesse: Promise<T>, timeoutMs: number): Promise<T> {
  let minuteur: NodeJS.Timeout;
  const limite = new Promise<never>((_, reject) => {
    minuteur = setTimeout(() => reject(new Error(`Délai dépassé (${timeoutMs} ms).`)), timeoutMs);
  });
  try {
    return await Promise.race([promesse, limite]);
  } finally {
    clearTimeout(minuteur!);
  }
}

export async function executer(
  outil: OutilSpec,
  argumentsJson: string,
  contexte?: ContexteExecution,
): Promise<ResultatExecution> {
  const debut = Date.now();

  const brut = argumentsBruts(argumentsJson);
  if (!brut.ok) {
    return { statut: "arguments_invalides", resultat: null, motif: brut.motif, dureeMs: Date.now() - debut };
  }

  const validation = validerArguments(outil.schemaInput, brut.valeurs);
  if (!validation.valide) {
    return {
      statut: "arguments_invalides",
      resultat: null,
      motif: `Arguments invalides pour « ${outil.name} » : ${validation.erreurs.join(" ")}`,
      dureeMs: Date.now() - debut,
    };
  }

  const implementation = IMPLEMENTATIONS[outil.toolId];
  if (!implementation) {
    // Statut distinct de "erreur" : REGISTERED_NOT_IMPLEMENTED est un état
    // du registre assumé (la fiche existe, le code n'est pas encore écrit),
    // pas un bug — sauf si le registre le déclare pourtant IMPLEMENTED, ce
    // que le motif dit explicitement pour distinguer les deux cas.
    const attendu = outil.implementationStatus !== "REGISTERED_NOT_IMPLEMENTED";
    return {
      statut: "non_implemente",
      resultat: null,
      motif: attendu
        ? `« ${outil.name} » est déclaré « ${outil.implementationStatus} » au registre mais n'a aucune implémentation : incohérence à corriger.`
        : `« ${outil.name} » est enregistré (REGISTERED_NOT_IMPLEMENTED) mais pas encore câblé.`,
      dureeMs: Date.now() - debut,
    };
  }

  try {
    const resultat = await avecTimeout(
      implementation(brut.valeurs as Record<string, unknown>, contexte),
      outil.timeoutMs,
    );
    return { statut: "execute", resultat, motif: "", dureeMs: Date.now() - debut };
  } catch (e) {
    const message = e instanceof Error ? e.message : "erreur inconnue";
    const estTimeout = message.includes("Délai dépassé");
    return {
      statut: estTimeout ? "timeout" : "erreur",
      resultat: null,
      motif: `« ${outil.name} » a échoué : ${message}`,
      dureeMs: Date.now() - debut,
    };
  }
}
