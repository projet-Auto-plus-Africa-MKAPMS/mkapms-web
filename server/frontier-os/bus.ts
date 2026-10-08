/**
 * Bus interne du centre — le transport par lequel les moteurs internes s'échangent des messages. Documenté ici, appliqué partout :
 *
 *  - un message a un identifiant, un émetteur, un destinataire (code d'un moteur interne), un type et un contenu ;
 *  - types : commande.preparer · commande.appliquer · commande.cloturer · verification.conditions · verification.sonder · verification.agreger · sante.verifier ;
 *  - le destinataire doit exister et être EN MARCHE (engines.running) : un moteur arrêté ne reçoit plus rien (issue « arrete ») ;
 *  - délai maximal par message : dépassement = « delai » (le moteur ne répond pas) ;
 *  - un gestionnaire qui lève une erreur = « erreur » ; qui refuse explicitement (RefusMoteur) = « refuse » ;
 *  - la durée de chaque message est mesurée (le moteur de mesures en tire la latence) ;
 *  - en simulation seulement, une panne peut être injectée pour l'essai (panne, muet, bloque, desaccord) : jamais en mode réel.
 *
 * Aucune API externe : tout reste dans le processus du centre et dans sa base.
 */
import { eq } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { engines, type Mode } from "./base/schema.js";

export type TypeMessage = "commande.preparer" | "commande.appliquer" | "commande.cloturer" | "verification.conditions" | "verification.sonder" | "verification.agreger" | "sante.verifier";
export type DefautMoteur = "panne" | "muet" | "bloque" | "desaccord";
export type IssueBus = "ok" | "refuse" | "erreur" | "delai" | "arrete";

export interface Message<T = unknown> {
  id: string;
  de: string;
  vers: string;
  type: TypeMessage;
  contenu: T;
}
export interface ContexteBus {
  defaut?: DefautMoteur;
  mode: Mode;
}
export interface Reponse<R = unknown> {
  ok: boolean;
  issue: IssueBus;
  contenu?: R;
  erreur?: string;
  dureeMs: number;
}

/** Un moteur qui refuse en connaissance de cause (condition non remplie) : ce n'est pas une panne. */
export class RefusMoteur extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type Gestionnaire = (m: Message, ctx: ContexteBus) => Promise<unknown>;
const registre = new Map<string, Map<TypeMessage, Gestionnaire>>();
let compteur = 0;

export function enregistrer(vers: string, type: TypeMessage, g: Gestionnaire): void {
  const m = registre.get(vers) ?? new Map<TypeMessage, Gestionnaire>();
  m.set(type, g);
  registre.set(vers, m);
}
export const gestionnairesDe = (vers: string): TypeMessage[] => [...(registre.get(vers)?.keys() ?? [])];

export interface OptionsBus {
  delaiMs?: number;
  /** Pannes à injecter (simulation seulement), par code de moteur destinataire. */
  defauts?: Readonly<Record<string, DefautMoteur | undefined>>;
  mode?: Mode;
}
export const DELAI_PAR_DEFAUT_MS = 2000;

export async function envoyer<R = unknown>(m: { de: string; vers: string; type: TypeMessage; contenu: unknown }, opts: OptionsBus = {}): Promise<Reponse<R>> {
  const debut = performance.now();
  const fin = (r: Omit<Reponse<R>, "dureeMs">): Reponse<R> => ({ ...r, dureeMs: Math.round((performance.now() - debut) * 100) / 100 });
  const mode = opts.mode ?? "simulation";
  const message: Message = { id: `m${Date.now().toString(36)}-${(compteur++).toString(36)}`, de: m.de, vers: m.vers, type: m.type, contenu: m.contenu };
  const g = registre.get(m.vers)?.get(m.type);
  if (!g) return fin({ ok: false, issue: "erreur", erreur: `Le moteur ${m.vers} ne traite pas les messages ${m.type}.` });
  const [moteur] = await dbFrontier().select({ running: engines.running, health: engines.health }).from(engines).where(eq(engines.code, m.vers)).limit(1);
  if (!moteur) return fin({ ok: false, issue: "erreur", erreur: `Moteur interne inconnu : ${m.vers}.` });
  if (!moteur.running || moteur.health === "stopped") return fin({ ok: false, issue: "arrete", erreur: `Le moteur ${m.vers} est arrêté.` });
  const defaut = mode === "simulation" ? opts.defauts?.[m.vers] : undefined;
  if (defaut === "panne") return fin({ ok: false, issue: "erreur", erreur: `Panne simulée du moteur ${m.vers}.` });
  const delai = opts.delaiMs ?? DELAI_PAR_DEFAUT_MS;
  let minuterie: NodeJS.Timeout | undefined;
  const expire = new Promise<"delai">((resolve) => {
    minuterie = setTimeout(() => resolve("delai"), delai);
  });
  try {
    const travail = defaut === "muet" ? new Promise<never>(() => undefined) : g(message, { defaut, mode });
    const r = await Promise.race([travail, expire]);
    if (r === "delai") return fin({ ok: false, issue: "delai", erreur: `Le moteur ${m.vers} n'a pas répondu en ${delai} ms.` });
    return fin({ ok: true, issue: "ok", contenu: r as R });
  } catch (e) {
    if (e instanceof RefusMoteur) return fin({ ok: false, issue: "refuse", erreur: `${e.code} : ${e.message}` });
    return fin({ ok: false, issue: "erreur", erreur: (e as Error).message });
  } finally {
    if (minuterie) clearTimeout(minuterie);
  }
}
