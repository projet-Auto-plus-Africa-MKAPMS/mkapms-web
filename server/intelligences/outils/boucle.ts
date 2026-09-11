/**
 * MKA.P-MS Intelligence — boucle d'exécution des outils.
 *
 * La seule porte d'entrée qui enchaîne un appel modèle avec des outils.
 * Chaque outil demandé traverse toujours, dans cet ordre :
 *
 *   registre (existe ?) → politique (autorisé ?) → executeur (exécute,
 *   valide, chronomètre) → audit (journalise) → retour au modèle.
 *
 * Aucune ligne métier n'est ici : registre.ts dit ce qui existe,
 * politique.ts décide qui peut, executeur.ts exécute, audit.ts journalise.
 * Cette boucle les enchaîne, elle ne fait le travail d'aucun des quatre.
 *
 * Passe par server/intelligences/routeur.ts pour parler au fournisseur —
 * jamais provider.ts directement — comme tout le reste du moteur.
 */
import { router } from "../routeur.js";
import type { MessageConversation, SortieStructuree } from "../provider.js";
import type { Confidentiality } from "../../ai-fabric/service.js";
import { listerActifs, trouver, versOutilFonction } from "./registre.js";
import { evaluer, type GetCountryFn, type VerifierPermission } from "./politique.js";
import { executer } from "./executeur.js";
import { journaliser } from "./audit.js";
import { getCountry } from "../../country-os/index.js";

/** Injectables uniquement pour les tests — la production utilise toujours les vraies couches. */
export type RouterFn = typeof router;
export type JournaliserFn = typeof journaliser;

/** Prévention des boucles infinies (point non négociable de la demande). */
const MAX_ITERATIONS_DEFAUT = 5;

export interface AppelOutilTrace {
  toolId: string;
  verdictPolitique: string;
  statutExecution: string | null;
  motif: string;
  dureeMs: number;
}

export interface ResultatBoucle {
  ok: boolean;
  texteFinal: string;
  motif: string;
  iterations: number;
  appelsOutils: AppelOutilTrace[];
  limiteAtteinte: boolean;
}

export interface EntreeBoucle {
  moteur: string;
  role: string | null;
  systeme: string;
  message: string;
  /** tool_id autorisés à être proposés au modèle pour cet appel — filtre en amont de la politique. */
  outilsProposes: string[];
  confidentialite?: Confidentiality;
  countryCode?: string | null;
  maxTokens?: number;
  sortieStructuree?: SortieStructuree;
  maxIterations?: number;
}

export async function executerAvecOutils(
  input: EntreeBoucle,
  routerImpl: RouterFn = router,
  verifierPermission?: VerifierPermission,
  journaliserImpl: JournaliserFn = journaliser,
  getCountryImpl: GetCountryFn = getCountry,
): Promise<ResultatBoucle> {
  const maxIterations = input.maxIterations ?? MAX_ITERATIONS_DEFAUT;
  const actifs = new Set(listerActifs().map((o) => o.toolId));
  const outils = input.outilsProposes
    .filter((id) => actifs.has(id))
    .map((id) => trouver(id))
    .filter((o): o is NonNullable<typeof o> => o !== null)
    .map(versOutilFonction);

  const historique: MessageConversation[] = [{ role: "user", content: input.message }];
  const trace: AppelOutilTrace[] = [];

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    const res = await routerImpl({
      capacite: "raisonnement",
      moteur: input.moteur,
      role: input.role,
      systeme: input.systeme,
      message: input.message,
      historique,
      outils: outils.length > 0 ? outils : undefined,
      sortieStructuree: input.sortieStructuree,
      confidentialite: input.confidentialite,
      countryCode: input.countryCode,
      maxTokens: input.maxTokens,
    });

    if (!res.ok && res.appelsOutils.length === 0) {
      return { ok: false, texteFinal: "", motif: res.motif, iterations: iteration, appelsOutils: trace, limiteAtteinte: false };
    }

    historique.push({
      role: "assistant",
      content: res.texte || null,
      ...(res.appelsOutils.length > 0
        ? {
            tool_calls: res.appelsOutils.map((a) => ({
              id: a.id,
              type: "function" as const,
              function: { name: a.nom, arguments: a.arguments },
            })),
          }
        : {}),
    });

    if (res.appelsOutils.length === 0) {
      return { ok: true, texteFinal: res.texte, motif: "", iterations: iteration, appelsOutils: trace, limiteAtteinte: false };
    }

    for (const appel of res.appelsOutils) {
      const debut = Date.now();
      const outil = trouver(appel.nom);

      if (!outil) {
        const motif = `Outil inconnu : « ${appel.nom} ».`;
        trace.push({ toolId: appel.nom, verdictPolitique: "refuse", statutExecution: null, motif, dureeMs: Date.now() - debut });
        await journaliserImpl({
          toolId: appel.nom,
          moteur: input.moteur,
          role: input.role,
          verdictPolitique: "refuse",
          statutExecution: null,
          motif,
          arguments: appel.arguments,
          resultat: null,
          dureeMs: Date.now() - debut,
          auditCategory: null,
        });
        historique.push({ role: "tool", tool_call_id: appel.id, content: JSON.stringify({ erreur: motif }) });
        continue;
      }

      const politique = await evaluer(
        outil,
        { role: input.role, moteur: input.moteur, countryCode: input.countryCode },
        verifierPermission,
        getCountryImpl,
      );

      if (politique.verdict !== "autorise") {
        trace.push({
          toolId: outil.toolId,
          verdictPolitique: politique.verdict,
          statutExecution: null,
          motif: politique.motif,
          dureeMs: Date.now() - debut,
        });
        await journaliserImpl({
          toolId: outil.toolId,
          moteur: input.moteur,
          role: input.role,
          verdictPolitique: politique.verdict,
          statutExecution: null,
          motif: politique.motif,
          arguments: appel.arguments,
          resultat: null,
          dureeMs: Date.now() - debut,
          auditCategory: outil.auditCategory,
        });
        historique.push({ role: "tool", tool_call_id: appel.id, content: JSON.stringify({ erreur: politique.motif }) });
        continue;
      }

      const execution = await executer(outil, appel.arguments);
      trace.push({
        toolId: outil.toolId,
        verdictPolitique: politique.verdict,
        statutExecution: execution.statut,
        motif: execution.motif,
        dureeMs: execution.dureeMs,
      });
      await journaliserImpl({
        toolId: outil.toolId,
        moteur: input.moteur,
        role: input.role,
        verdictPolitique: politique.verdict,
        statutExecution: execution.statut,
        motif: execution.motif,
        arguments: appel.arguments,
        resultat: execution.resultat,
        dureeMs: execution.dureeMs,
        auditCategory: outil.auditCategory,
      });
      historique.push({
        role: "tool",
        tool_call_id: appel.id,
        content:
          execution.statut === "execute"
            ? JSON.stringify(execution.resultat ?? null)
            : JSON.stringify({ erreur: execution.motif }),
      });
    }
  }

  return {
    ok: false,
    texteFinal: "",
    motif: `Limite de ${maxIterations} itération(s) atteinte sans réponse finale — arrêt pour éviter une boucle sans fin.`,
    iterations: maxIterations,
    appelsOutils: trace,
    limiteAtteinte: true,
  };
}
