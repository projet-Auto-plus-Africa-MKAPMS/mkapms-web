/**
 * Santé et arrêt des moteurs internes. La santé est MESURÉE : chaque moteur reçoit un message « sante.verifier » par le bus et répond (ou
 * non) dans un délai ; sa latence est enregistrée. Un moteur qui ne répond pas est « en panne », un moteur arrêté est « arrêté ».
 * Arrêter un moteur est une décision du PDG (confirmation) qui bloque ensuite toute commande qui en dépend.
 */
import { and, count, eq, inArray } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { engines, exchanges } from "./base/schema.js";
import { enregistrer, envoyer } from "./bus.js";
import { brancherMoteursDeCommande } from "./moteurs-commande.js";
import { brancherMoteursDeVerification } from "./moteurs-verification.js";
import { revaliderLignes } from "./fondation.js";
import { ecrireConfig, journaliser, ouvrirIncident, type Acteur } from "./journal.js";
import { echantillonnerCentre, enregistrerMesure } from "./mesures.js";

brancherMoteursDeCommande();
brancherMoteursDeVerification();
enregistrer("center:transport", "sante.verifier", async () => {
  const [q] = await dbFrontier().select({ n: count() }).from(exchanges).where(eq(exchanges.state, "queued"));
  return { ok: true, file: Number(q?.n ?? 0) };
});
enregistrer("center:monitor", "sante.verifier", async () => ({ ok: true, ...(await echantillonnerCentre()) }));

/** Clé de configuration d'un moteur : le code contient « : », la clé n'accepte que lettres, chiffres, point, tiret et souligné. */
const cleMoteur = (code: string) => `moteur.${code.replace(/[^a-z0-9_.-]/gi, "_").toLowerCase()}.running`;

export interface SanteMoteur {
  moteur: string;
  nom: string;
  sante: "ok" | "down" | "stopped";
  dureeMs: number;
  detail: string;
}

/** Interroge chaque moteur interne : met à jour sa santé, mesure sa latence, ouvre un incident pour un moteur en panne. */
export async function verifierSanteMoteurs(acteur: Acteur = { type: "system" }, delaiMs = 1500): Promise<SanteMoteur[]> {
  const db = dbFrontier();
  const internes = await db.select().from(engines).where(and(eq(engines.platformCode, "frontier"), inArray(engines.kind, ["command", "verification", "transport", "monitor"])));
  const out: SanteMoteur[] = [];
  for (const m of internes) {
    if (!m.running) {
      await db.update(engines).set({ health: "stopped", healthCheckedAt: new Date() }).where(eq(engines.code, m.code));
      out.push({ moteur: m.code, nom: m.name, sante: "stopped", dureeMs: 0, detail: "arrêté" });
      continue;
    }
    const r = await envoyer({ de: "center:monitor", vers: m.code, type: "sante.verifier", contenu: {} }, { delaiMs });
    if (r.ok) {
      await db.update(engines).set({ health: "ok", healthCheckedAt: new Date() }).where(eq(engines.code, m.code));
      await enregistrerMesure({ kind: "engine", code: m.code }, "latency_ms", r.dureeMs, "ms", "sante.verifier");
      out.push({ moteur: m.code, nom: m.name, sante: "ok", dureeMs: r.dureeMs, detail: "répond" });
    } else {
      await db.update(engines).set({ health: "down", healthCheckedAt: new Date() }).where(eq(engines.code, m.code));
      await ouvrirIncident({ severite: "warning", kind: "moteur_en_panne", resume: `Le moteur ${m.code} ne répond pas à la vérification de santé (${r.issue}).`, moteur: m.code, detail: { issue: r.issue, erreur: r.erreur ?? null } });
      out.push({ moteur: m.code, nom: m.name, sante: "down", dureeMs: r.dureeMs, detail: r.erreur ?? r.issue });
    }
  }
  await journaliser({ acteur, action: "health_sweep", cible: "center", resultat: out.every((x) => x.sante === "ok") ? "ok" : "error", detail: { ok: out.filter((x) => x.sante === "ok").length, total: out.length } });
  await revaliderLignes();
  return out;
}

export async function arreterMoteur(code: string, acteur: Acteur, confirme: boolean): Promise<{ ok: boolean; detail: string }> {
  const db = dbFrontier();
  const [m] = await db.select().from(engines).where(eq(engines.code, code)).limit(1);
  if (!m || m.platformCode !== "frontier" || !["command", "verification", "transport", "monitor"].includes(m.kind)) return { ok: false, detail: "Seuls les moteurs internes du centre peuvent être arrêtés ici." };
  if (!confirme) {
    await journaliser({ acteur, action: "engine_stop", cible: "engine", cibleId: code, resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
    return { ok: false, detail: "Arrêter un moteur interne est une action critique : confirmation requise." };
  }
  await db.update(engines).set({ running: false, health: "stopped", updatedAt: new Date() }).where(eq(engines.code, code));
  await ecrireConfig(cleMoteur(code), false, acteur);
  await revaliderLignes();
  await journaliser({ acteur, action: "engine_stop", cible: "engine", cibleId: code, resultat: "ok" });
  return { ok: true, detail: `Moteur ${code} arrêté : toute commande qui en dépend est désormais bloquée (les coupures, elles, restent possibles).` };
}

export async function demarrerMoteur(code: string, acteur: Acteur, confirme: boolean): Promise<{ ok: boolean; detail: string }> {
  const db = dbFrontier();
  const [m] = await db.select().from(engines).where(eq(engines.code, code)).limit(1);
  if (!m || m.platformCode !== "frontier") return { ok: false, detail: "Moteur interne inconnu." };
  if (!confirme) {
    await journaliser({ acteur, action: "engine_start", cible: "engine", cibleId: code, resultat: "refused", erreur: "CONFIRMATION_REQUISE" });
    return { ok: false, detail: "Démarrer un moteur interne est une action critique : confirmation requise." };
  }
  await db.update(engines).set({ running: true, health: "unknown", updatedAt: new Date() }).where(eq(engines.code, code));
  await ecrireConfig(cleMoteur(code), true, acteur);
  await journaliser({ acteur, action: "engine_start", cible: "engine", cibleId: code, resultat: "ok" });
  const sante = (await verifierSanteMoteurs(acteur)).find((s) => s.moteur === code);
  return { ok: sante?.sante === "ok", detail: sante?.sante === "ok" ? `Moteur ${code} démarré et en bonne santé.` : `Moteur ${code} démarré mais sans réponse à la vérification.` };
}
