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
import { IMPLEMENTATIONS } from "./outils-test.js";

export type StatutExecution = "execute" | "erreur" | "timeout" | "arguments_invalides";

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

export async function executer(outil: OutilSpec, argumentsJson: string): Promise<ResultatExecution> {
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
    return {
      statut: "erreur",
      resultat: null,
      motif: `« ${outil.name} » est déclaré au registre mais n'a aucune implémentation.`,
      dureeMs: Date.now() - debut,
    };
  }

  try {
    const resultat = await avecTimeout(
      implementation(brut.valeurs as Record<string, unknown>),
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
