/**
 * Point 140 — observabilité 24 h / 24 sur les quatorze domaines nommés.
 *
 * Ce fichier ne crée pas un second moteur de surveillance : il compose ce qui
 * existe déjà (santé plateforme du Smart Engine, registre des moteurs,
 * planificateur, visibilité, base) et comble les domaines qui n'étaient
 * surveillés par personne : base de données, moteurs, tâches planifiées,
 * audience, applications, infrastructure.
 *
 * Deux règles tenues ici :
 *  • un domaine qu'on ne sait pas mesurer est « inconnu » avec son motif, jamais
 *    vert — un vert inventé est pire que pas de surveillance ;
 *  • « un client ne doit pas être le premier détecteur » se vérifie : on compte
 *    les réclamations clientes arrivées AVANT toute alerte interne sur la même
 *    période. C'est ce chiffre, et non le nombre d'alertes, qui dit si la
 *    surveillance sert à quelque chose.
 */
import { desc, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { supportTickets } from "../schema.js";
import { smartAlerts } from "../smart-engine/schema.js";
import { getPlatformHealth } from "../smart-engine/services/platform-health.js";
import { getStats } from "../engine-registry/service.js";
import { healthStatus as santeJobs } from "../scheduler-os/index.js";
import { healthStatus as santeAudience } from "../visibility-os/index.js";
import { healthStatus as santeNotifications } from "../notification-os/index.js";
import { emitSafe } from "../event-bus/service.js";

export type Niveau = "vert" | "orange" | "rouge" | "inconnu";

export interface DomaineSurveille {
  code: string;
  libelle: string;
  niveau: Niveau;
  /** Chiffre réellement relevé, ou null quand rien n'a pu être mesuré. */
  mesure: number | null;
  unite: string;
  constat: string;
  source: string;
}

/** Les quatorze domaines du point 140, dans l'ordre de la liste. */
export const DOMAINES = [
  "frontend",
  "backend",
  "bases",
  "moteurs",
  "api",
  "jobs",
  "paiements",
  "redirections",
  "notifications",
  "seo",
  "audience",
  "applications",
  "infrastructure",
  "performances",
] as const;

export type CodeDomaine = (typeof DOMAINES)[number];

const NIVEAU_DEPUIS_COULEUR: Record<string, Niveau> = {
  green: "vert",
  yellow: "orange",
  red: "rouge",
};

function inconnu(code: string, libelle: string, motif: string, source: string): DomaineSurveille {
  return { code, libelle, niveau: "inconnu", mesure: null, unite: "", constat: motif, source };
}

/** Relève les quatorze domaines. Aucun domaine n'est omis, même illisible. */
export async function surveiller(): Promise<{
  releveLe: string;
  pire: Niveau;
  domaines: DomaineSurveille[];
  detectionTardive: { reclamations: number; motif: string };
}> {
  const domaines: DomaineSurveille[] = [];

  // ── Domaines déjà couverts par la santé plateforme ───────────────────────
  const parCle = new Map<string, { level: string; headline: string; detail: string; label: string }>();
  let santeLue = true;
  try {
    const sante = await getPlatformHealth();
    for (const c of sante.categories) {
      parCle.set(c.key, { level: c.level, headline: c.headline, detail: c.detail, label: c.label });
    }
  } catch {
    santeLue = false;
  }

  function depuisSante(
    code: string,
    libelle: string,
    cles: string[],
    source: string,
  ): DomaineSurveille {
    if (!santeLue) {
      return inconnu(code, libelle, "Santé plateforme illisible : rien n'a pu être relevé.", source);
    }
    const lues = cles.map((k) => parCle.get(k)).filter((c): c is NonNullable<typeof c> => !!c);
    if (lues.length === 0) {
      return inconnu(code, libelle, `Aucune mesure publiée pour ${cles.join(", ")}.`, source);
    }
    const pire = lues.reduce(
      (acc, c) =>
        c.level === "red" ? "red" : c.level === "yellow" && acc !== "red" ? "yellow" : acc,
      "green",
    );
    return {
      code,
      libelle,
      niveau: NIVEAU_DEPUIS_COULEUR[pire] ?? "inconnu",
      mesure: lues.filter((c) => c.level !== "green").length,
      unite: "catégorie(s) en défaut",
      constat: lues.map((c) => `${c.label} : ${c.headline}`).join(" · "),
      source,
    };
  }

  domaines.push(
    depuisSante("frontend", "Frontend (écrans, boutons, images)", ["boutons", "images"], "smart-engine/platform-health"),
  );
  domaines.push(
    depuisSante("backend", "Backend (erreurs serveur, modules)", ["erreurs", "modules"], "smart-engine/platform-health"),
  );

  // ── Base de données : mesurée pour de vrai, latence comprise ─────────────
  const t0 = Date.now();
  try {
    await db.execute(sql`select 1`);
    const ms = Date.now() - t0;
    domaines.push({
      code: "bases",
      libelle: "Bases de données",
      niveau: ms > 1500 ? "orange" : "vert",
      mesure: ms,
      unite: "ms",
      constat:
        ms > 1500
          ? `La base répond en ${ms} ms : au-delà d'une seconde et demie, les écrans deviennent lents pour le visiteur.`
          : `La base répond en ${ms} ms.`,
      source: "requête réelle",
    });
  } catch (e) {
    domaines.push({
      code: "bases",
      libelle: "Bases de données",
      niveau: "rouge",
      mesure: null,
      unite: "",
      constat: `La base ne répond pas : ${(e as Error).message}`,
      source: "requête réelle",
    });
  }

  // ── Moteurs : lus dans le registre central, jamais dans une liste tenue à la main ──
  try {
    const s = await getStats();
    const total = Number(s.totalEngines ?? 0);
    const degrades = Number(s.degradedEngines ?? 0);
    const hs = Number(s.downEngines ?? 0);
    domaines.push({
      code: "moteurs",
      libelle: "Moteurs",
      niveau: hs > 0 ? "rouge" : degrades > 0 ? "orange" : total === 0 ? "inconnu" : "vert",
      mesure: degrades + hs,
      unite: `moteur(s) en défaut sur ${total}`,
      constat:
        total === 0
          ? "Registre vide : aucun moteur n'est déclaré, donc aucun n'est surveillé."
          : `${hs} hors service, ${degrades} dégradé(s) sur ${total} moteurs déclarés.`,
      source: "engine-registry",
    });
  } catch (e) {
    domaines.push(
      inconnu("moteurs", "Moteurs", `Registre central illisible : ${(e as Error).message}`, "engine-registry"),
    );
  }

  domaines.push(depuisSante("api", "API connectées", ["apis"], "smart-engine/platform-health"));

  // ── Tâches planifiées ────────────────────────────────────────────────────
  try {
    const h = await santeJobs();
    const enRetard = Number(h.metrics.overdue ?? 0);
    const echouees = Number(h.metrics.failed ?? 0);
    domaines.push({
      code: "jobs",
      libelle: "Tâches planifiées",
      niveau: echouees > 0 ? "rouge" : enRetard > 50 ? "orange" : "vert",
      mesure: echouees + enRetard,
      unite: "tâche(s) en défaut",
      constat: `${echouees} tâche(s) en échec, ${enRetard} en retard, ${Number(h.metrics.pending ?? 0)} en attente.`,
      source: "scheduler-os",
    });
  } catch (e) {
    domaines.push(
      inconnu("jobs", "Tâches planifiées", `Planificateur illisible : ${(e as Error).message}`, "scheduler-os"),
    );
  }

  domaines.push(depuisSante("paiements", "Paiements", ["paiements"], "smart-engine/platform-health"));
  domaines.push(
    depuisSante("redirections", "Redirections & parcours", ["redirections"], "smart-engine/platform-health"),
  );

  // ── Notifications : santé plateforme ET moteur de notification ───────────
  const notifSante = depuisSante(
    "notifications",
    "Notifications",
    ["notifications", "messages"],
    "smart-engine/platform-health",
  );
  try {
    const h = await santeNotifications();
    if (h.status !== "ok" && notifSante.niveau !== "rouge") {
      notifSante.niveau = "orange";
      notifSante.constat += ` · Moteur de notification : ${h.status}.`;
    }
  } catch {
    notifSante.constat += " · Moteur de notification illisible.";
  }
  domaines.push(notifSante);

  domaines.push(depuisSante("seo", "Visibilité SEO", ["seo"], "smart-engine/platform-health"));

  // ── Audience ─────────────────────────────────────────────────────────────
  try {
    const h = await santeAudience();
    const canaux = Number(h.metrics.channels ?? 0);
    domaines.push({
      code: "audience",
      libelle: "Audience & croissance",
      niveau: h.status === "down" ? "rouge" : canaux === 0 ? "orange" : "vert",
      mesure: canaux,
      unite: "canal(aux) déclaré(s)",
      constat:
        canaux === 0
          ? "Aucun canal d'audience déclaré : la croissance n'est mesurée nulle part."
          : `${canaux} canaux d'audience suivis.`,
      source: "visibility-os",
    });
  } catch (e) {
    domaines.push(
      inconnu("audience", "Audience & croissance", `Moteur d'audience illisible : ${(e as Error).message}`, "visibility-os"),
    );
  }

  // ── Applications : dit franchement qu'aucune remontée n'existe ───────────
  domaines.push(
    inconnu(
      "applications",
      "Applications (grand public, PRO, COMMAND)",
      "Non mesuré : les trois applications Android n'envoient encore aucune remontée d'exécution. Tant qu'elles ne rapportent rien, leur état ne peut pas être affirmé.",
      "aucune télémétrie applicative",
    ),
  );

  // ── Infrastructure : le processus lui-même ──────────────────────────────
  const memoire = process.memoryUsage();
  const utiliseMo = Math.round(memoire.heapUsed / (1024 * 1024));
  const limiteMo = Math.round(memoire.heapTotal / (1024 * 1024));
  const partMemoire = limiteMo > 0 ? Math.round((utiliseMo / limiteMo) * 100) : 0;
  domaines.push({
    code: "infrastructure",
    libelle: "Infrastructure (processus, mémoire, disponibilité)",
    niveau: partMemoire > 92 ? "orange" : "vert",
    mesure: partMemoire,
    unite: "% de mémoire occupée",
    constat: `Processus en ligne depuis ${Math.round(process.uptime() / 60)} min, ${utiliseMo} Mo utilisés sur ${limiteMo} Mo alloués.`,
    source: "processus serveur",
  });

  domaines.push(
    depuisSante("performances", "Performances", ["temps_reponse"], "smart-engine/platform-health"),
  );

  // Exhaustivité : un domaine de la liste absent du relevé serait un angle mort
  // silencieux. Il est donc ajouté comme non mesuré, avec son motif.
  const releves = new Set(domaines.map((d) => d.code));
  for (const code of DOMAINES) {
    if (!releves.has(code)) {
      domaines.push(
        inconnu(code, code, "Domaine attendu par le point 140 mais absent du relevé.", "relevé incomplet"),
      );
    }
  }

  const ordre: Record<Niveau, number> = { rouge: 0, orange: 1, inconnu: 2, vert: 3 };
  const pire = domaines.reduce<Niveau>(
    (acc, d) => (ordre[d.niveau] < ordre[acc] ? d.niveau : acc),
    "vert",
  );

  // Le relevé ne reste pas dans un écran : chaque domaine rouge devient un
  // événement du bus existant, que le Système Intelligent transforme en alerte.
  // C'est ce qui permet de voir la panne avant le premier client.
  for (const d of domaines.filter((x) => x.niveau === "rouge")) {
    await emitSafe({
      source: "monitoring",
      type: "moteur.degrade",
      payload: { moteur: `domaine:${d.code}`, etat: "hors_service", constat: d.constat, source: d.source },
    });
  }

  return {
    releveLe: new Date().toISOString(),
    pire,
    domaines,
    detectionTardive: await detectionTardive(),
  };
}

/**
 * « Un client ne doit pas être le premier détecteur d'une panne évidente. »
 *
 * On compte les réclamations clientes des sept derniers jours arrivées alors
 * qu'aucune alerte interne n'était encore ouverte. Chacune est une panne que la
 * surveillance a manquée.
 */
export async function detectionTardive(): Promise<{ reclamations: number; motif: string }> {
  const depuis = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  try {
    const tickets = await db
      .select({ id: supportTickets.id, quand: supportTickets.createdAt, priorite: supportTickets.priority })
      .from(supportTickets)
      .where(gte(supportTickets.createdAt, depuis))
      .orderBy(desc(supportTickets.createdAt))
      .limit(500);
    if (tickets.length === 0) {
      return { reclamations: 0, motif: "Aucune réclamation cliente sur sept jours." };
    }
    const alertes = await db
      .select({ quand: smartAlerts.createdAt })
      .from(smartAlerts)
      .where(gte(smartAlerts.createdAt, depuis))
      .limit(1000);
    let manquees = 0;
    for (const t of tickets) {
      if (t.priorite !== "critique" && t.priorite !== "elevee") continue;
      // Une alerte ouverte dans les six heures précédant la réclamation prouve
      // que la plateforme avait vu le défaut avant le client.
      const vueAvant = alertes.some((a) => {
        if (!a.quand) return false;
        const ecart = t.quand.getTime() - a.quand.getTime();
        return ecart >= 0 && ecart <= 6 * 3600 * 1000;
      });
      if (!vueAvant) manquees += 1;
    }
    return {
      reclamations: manquees,
      motif:
        manquees === 0
          ? "Aucune réclamation grave n'a précédé une alerte interne."
          : `${manquees} réclamation(s) grave(s) sont arrivées avant toute alerte interne : sur ces cas, le client a détecté la panne avant la plateforme.`,
    };
  } catch (e) {
    return { reclamations: 0, motif: `Non mesuré : ${(e as Error).message}` };
  }
}

/** Domaines en défaut, pour le tableau de direction et les alertes. */
export async function defauts(): Promise<DomaineSurveille[]> {
  const r = await surveiller();
  return r.domaines.filter((d) => d.niveau === "rouge" || d.niveau === "orange");
}

/** Domaines jamais mesurés : la liste de ce qui reste à instrumenter. */
export async function nonMesures(): Promise<DomaineSurveille[]> {
  const r = await surveiller();
  return r.domaines.filter((d) => d.niveau === "inconnu");
}

/** Statuts ouverts du support, utilisés pour la file de réclamations. */
export const STATUTS_OUVERTS = ["ouvert", "en_cours"] as const;

/** Nombre de réclamations ouvertes, pour recouper une panne avec le terrain. */
export async function reclamationsOuvertes(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(inArray(supportTickets.status, [...STATUTS_OUVERTS]));
  return Number(row?.n ?? 0);
}
