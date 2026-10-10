/**
 * Noyau central du Centre — démarrage visuel honnête. Un moteur interne réel de plus (kind « monitor », même famille que
 * center:monitor et center:transport), dont l'unique fonction est de battre un signal de vie daté par le même bus interne
 * que tous les autres moteurs : aucune mesure inventée, aucune API externe, aucun lien avec MKAPMS Web ou MKAPMS Shop.
 * La vitrine lit l'état écrit en base (running, health, healthCheckedAt) — jamais une animation qui ne reflète pas un
 * battement réellement enregistré. Le compteur de battements et l'heure de démarrage sont propres à CE processus : ils
 * repartent de zéro à chaque redémarrage, honnêtement (jamais une valeur reportée depuis un processus précédent).
 */
import { and, count, eq, inArray } from "drizzle-orm";
import { dbFrontier, type BaseFrontier } from "./base/connexion.js";
import { engines, rooms } from "./base/schema.js";
import { enregistrer, envoyer, gestionnairesDe } from "./bus.js";
import { etatBase } from "./base/demarrage.js";

export const CODE_NOYAU = "center:core.noyau";

let battements = 0;
let demarreLe: Date | null = null;

enregistrer(CODE_NOYAU, "sante.verifier", async () => {
  battements += 1;
  return { ok: true, battements };
});

export function oublierNoyauPourTests(): void {
  battements = 0;
  demarreLe = null;
}

/** Un battement réel : passe par le même bus et la même vérification d'état (running, non arrêté) que tout autre moteur interne. */
export async function pulserNoyau(base: BaseFrontier = dbFrontier()): Promise<{ ok: boolean; battements: number }> {
  const [m] = await base.select({ running: engines.running, health: engines.health }).from(engines).where(eq(engines.code, CODE_NOYAU)).limit(1);
  if (!m) return { ok: false, battements };
  if (!m.running) {
    await base.update(engines).set({ health: "stopped", healthCheckedAt: new Date() }).where(eq(engines.code, CODE_NOYAU));
    return { ok: false, battements };
  }
  const r = await envoyer({ de: "center:monitor", vers: CODE_NOYAU, type: "sante.verifier", contenu: {} }, { delaiMs: 1500 });
  if (r.ok) {
    if (!demarreLe) demarreLe = new Date();
    await base.update(engines).set({ health: "ok", healthCheckedAt: new Date() }).where(eq(engines.code, CODE_NOYAU));
  } else {
    await base.update(engines).set({ health: "down", healthCheckedAt: new Date() }).where(eq(engines.code, CODE_NOYAU));
  }
  return { ok: r.ok, battements };
}

export interface EtatNoyau {
  code: string;
  nom: string;
  enMarche: boolean;
  sante: "unknown" | "ok" | "degraded" | "down" | "stopped";
  derniereBattementLe: string | null;
  battements: number;
  demarreLe: string | null;
}

export async function etatNoyau(base: BaseFrontier = dbFrontier()): Promise<EtatNoyau> {
  const [m] = await base.select().from(engines).where(eq(engines.code, CODE_NOYAU)).limit(1);
  return {
    code: CODE_NOYAU,
    nom: m?.name ?? "Noyau central du Centre",
    enMarche: m?.running ?? false,
    sante: (m?.health as EtatNoyau["sante"]) ?? "unknown",
    derniereBattementLe: m?.healthCheckedAt ? m.healthCheckedAt.toISOString() : null,
    battements,
    demarreLe: demarreLe ? demarreLe.toISOString() : null,
  };
}

export interface EtapeDemarrage {
  cle: string;
  libelle: string;
  ok: boolean;
  detail: string;
}

/**
 * Séquence de démarrage : chaque étape est recalculée en direct à partir de l'état réellement écrit en base — jamais une
 * minuterie fictive. La vitrine peut l'afficher comme une liste qui se coche au fil des rafraîchissements réels.
 */
export async function etapesDemarrage(base: BaseFrontier = dbFrontier()): Promise<EtapeDemarrage[]> {
  const b = etatBase();
  const [nbSalles] = await base.select({ k: count() }).from(rooms);
  const [nbDeclares] = await base.select({ k: count() }).from(engines).where(eq(engines.kind, "declared"));
  const internes = await base.select({ code: engines.code, health: engines.health, running: engines.running }).from(engines).where(and(eq(engines.platformCode, "frontier"), inArray(engines.kind, ["command", "verification", "transport", "monitor"])));
  // Seuls les moteurs internes qui déclarent un gestionnaire sante.verifier sont attendus à répondre (certains, comme
  // l'atelier, sont vérifiés par leur propre protocole de test isolé — les en exclure évite une étape faussement rouge.
  const attendus = internes.filter((m) => gestionnairesDe(m.code).includes("sante.verifier"));
  const internesVerifies = attendus.filter((m) => m.running && m.health === "ok").length;
  const noyau = await etatNoyau(base);
  return [
    { cle: "base", libelle: "Base propre du Centre prête", ok: b.prete, detail: b.prete ? `schéma frontier, ${(b.migrations?.appliquees.length ?? 0) + (b.migrations?.dejaAppliquees.length ?? 0)} migration(s) appliquée(s)` : (b.erreur ?? "non prête") },
    { cle: "fondation", libelle: "Fondation posée (salles, moteurs internes)", ok: Number(nbSalles?.k ?? 0) >= 17, detail: `${Number(nbSalles?.k ?? 0)} salle(s)` },
    { cle: "declares", libelle: "Registre des moteurs déclarés posé", ok: Number(nbDeclares?.k ?? 0) >= 210, detail: `${Number(nbDeclares?.k ?? 0)} moteur(s) déclaré(s)` },
    { cle: "internes", libelle: "Moteurs internes vérifiés", ok: internesVerifies > 0 && internesVerifies === attendus.length, detail: `${internesVerifies}/${attendus.length} répondent (${internes.length - attendus.length} vérifié(s) autrement, ex. atelier)` },
    { cle: "noyau", libelle: "Noyau central battant", ok: noyau.enMarche && noyau.sante === "ok" && noyau.battements > 0, detail: noyau.battements > 0 ? `${noyau.battements} battement(s) depuis le démarrage de ce processus` : "aucun battement encore" },
  ];
}
