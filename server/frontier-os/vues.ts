/**
 * Centre Cyber-Électrique — modèles de lecture pour la vitrine. Rien n'est inventé ici : chaque chiffre vient d'une requête sur la base du
 * centre, chaque mesure de la table des mesures, et ce qui n'est pas mesuré est dit « non mesuré ». La vitrine reflète les états CONFIRMÉS
 * (résultat observé, pas ordre demandé).
 */
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { dbFrontier } from "./base/connexion.js";
import { etatBase } from "./base/demarrage.js";
import {
  accessGrants, apiSlots, auditLog, commandReceipts, commands, companies, configHistory, cuts, engineBindings, engineCapabilities, engines, engineVersions, exchanges, groups, incidents, lines,
  measurements, memoryBlocks, platformAliases, platforms, repairs, rooms, secretRefs, subscriptions, testSessions, testSteps, type Engine, type Line,
} from "./base/schema.js";
import { chargerCoupures, coupuresLite, ligneLite, type CoupureComplete } from "./chaine.js";
import { gouvernanceArmee } from "./gouvernance.js";
import { INVENTAIRE_BOUTIQUE } from "./inventaire/boutique.generated.js";
import { INVENTAIRE_PLATEFORME } from "./inventaire/plateforme.generated.js";
import { DEFINITION_ETAT, LIBELLE_ETAT, type EtatInventaire } from "./inventaire/types.js";
import { lireCapacites, lireJauges, latenceRecente } from "./mesures.js";
import { MOTEURS_INTERNES } from "./moteurs-internes.js";
import { ACTION_REELLE_ACTIVEE, ELEMENTS_CHAINE, MODE, RESERVE_PAR_LIGNE_REELLE, decisionPassage, etatContactGroupe, etatLigne, ligneAdmissible } from "./regles.js";
import { detecterAnomalies, incidentsOuverts, verifierInvariants } from "./atelier.js";
import { VERSION_CENTRE } from "./fondation.js";
import { lacunesVue } from "./developpement.js";
import { poolFrontier, variableFournie } from "./base/connexion.js";
import { LIBELLE_SEPARATION, diagnostiquerSeparation } from "./separation.js";
import { adaptateurDe } from "./liaisons-reelles.js";
import { reelAutorise } from "./reel-etat.js";

const n = (v: unknown) => Number(v ?? 0);

/** La famille « stock propre » de la Boutique (migration 0077) est comptée à part du registre de 83 moteurs : aucun moteur n'est compté deux fois. */
export const DOMAINE_STOCK_PROPRE = "stock propre";
const estStock = sql`coalesce(${engines.details}->>'domaine', '') = ${DOMAINE_STOCK_PROPRE}`;
const pasStock = sql`coalesce(${engines.details}->>'domaine', '') <> ${DOMAINE_STOCK_PROPRE}`;

export async function accueil() {
  const db = dbFrontier();
  const [jauges, armee, sep] = await Promise.all([lireJauges(), gouvernanceArmee(), mesureSeparation(false)]);
  const moteursParEtat = await db.select({ plateforme: engines.platformCode, etat: engines.inventoryState, k: count() }).from(engines).where(and(eq(engines.origin, "inventory"), eq(engines.kind, "real"), pasStock)).groupBy(engines.platformCode, engines.inventoryState);
  const internes = await db.select({ running: engines.running, health: engines.health, k: count() }).from(engines).where(and(eq(engines.platformCode, "frontier"), inArray(engines.kind, ["command", "verification", "transport", "monitor"]))).groupBy(engines.running, engines.health);
  const reelles = await db.select().from(lines).where(eq(lines.kind, "real"));
  const coup = await chargerCoupures(reelles.map((l) => l.id));
  const etats = reelles.map((l) => etatLigne(coupuresLite(coup.get(l.id) ?? [])));
  const [reserves] = await db.select({ k: count() }).from(lines).where(eq(lines.kind, "reserve"));
  const [inc] = await db.select({ k: count() }).from(incidents).where(inArray(incidents.status, ["open", "diagnosed", "repairing"]));
  const [incCrit] = await db.select({ k: count() }).from(incidents).where(and(eq(incidents.severity, "critical"), inArray(incidents.status, ["open", "diagnosed", "repairing"])));
  const cmd = await db.select({ statut: commands.status, k: count() }).from(commands).where(sql`${commands.createdAt} > now() - interval '24 hours' AND ${commands.parentId} IS NULL`).groupBy(commands.status);
  const [suivis] = await db.select({ k: count() }).from(exchanges).where(eq(exchanges.state, "tracked"));
  const [sess] = await db.select({ k: count() }).from(testSessions).where(eq(testSessions.status, "passed"));
  const dernieres = await db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(8);
  const alias = await db.select().from(platformAliases).orderBy(asc(platformAliases.name));
  const plats = await db.select().from(platforms).orderBy(asc(platforms.code));
  const eng = new Map<string, Record<string, number>>();
  for (const r of moteursParEtat) eng.set(r.plateforme, { ...(eng.get(r.plateforme) ?? {}), [r.etat ?? "inconnu"]: n(r.k) });
  return {
    mode: MODE,
    actionReelle: ACTION_REELLE_ACTIVEE,
    version: VERSION_CENTRE,
    base: { ...etatBase(), separee: sep.separeeMateriellement, separation: { niveau: sep.niveau, libelle: LIBELLE_SEPARATION[sep.niveau], detail: sep.detail }, schema: "frontier", migrationsAppliquees: etatBase().migrations?.appliquees.length ?? 0, migrationsConnues: (etatBase().migrations?.appliquees.length ?? 0) + (etatBase().migrations?.dejaAppliquees.length ?? 0) },
    gouvernanceArmee: armee,
    jauges,
    moteursInventories: Object.fromEntries([...eng].map(([p, m]) => [p, m])),
    moteursInternes: { total: internes.reduce((s, r) => s + n(r.k), 0), enMarche: internes.filter((r) => r.running).reduce((s, r) => s + n(r.k), 0), enPanne: internes.filter((r) => r.health === "down").reduce((s, r) => s + n(r.k), 0), arretes: internes.filter((r) => !r.running).reduce((s, r) => s + n(r.k), 0) },
    lignes: {
      reelles: reelles.length, reserves: n(reserves?.k), valides: reelles.filter((l) => l.validity === "valid").length,
      connectees: etats.filter((e) => e === "connected").length, partielles: etats.filter((e) => e === "partial").length, enErreur: etats.filter((e) => e === "failed").length, enTransition: etats.filter((e) => e === "transition").length,
    },
    incidentsOuverts: n(inc?.k),
    incidentsCritiques: n(incCrit?.k),
    commandes24h: Object.fromEntries(cmd.map((c) => [c.statut, n(c.k)])),
    echangesSuivis: n(suivis?.k),
    sessionsReussies: n(sess?.k),
    plateformes: plats.map((p) => ({ code: p.code, name: p.name, kind: p.kind, status: p.status, identityStatus: p.identityStatus, identityNote: p.identityNote, exactNames: p.exactNames, repository: p.repository })),
    alias: alias.map((a) => ({ name: a.name, plateforme: a.platformCode, statut: a.status, preuve: a.evidence, note: a.note })),
    derniereActivite: dernieres.map((a) => ({ id: a.id, at: a.at, action: a.action, cible: `${a.targetKind}${a.targetId ? ` ${a.targetId}` : ""}`, resultat: a.result, erreur: a.error })),
  };
}

// ───────────────────────── Lignes ─────────────────────────
async function moteursParCode(codes: string[]) {
  if (codes.length === 0) return new Map<string, Engine>();
  return new Map((await dbFrontier().select().from(engines).where(inArray(engines.code, codes))).map((m) => [m.code, m]));
}

export async function lignesVue(groupe?: string) {
  const db = dbFrontier();
  const rows = await db.select().from(lines).where(groupe ? eq(lines.groupCode, groupe) : undefined).orderBy(asc(lines.groupCode), asc(lines.position));
  const reelles = rows.filter((l) => l.kind === "real");
  const coup = await chargerCoupures(reelles.map((l) => l.id));
  const codes = new Set<string>();
  for (const l of reelles) for (const e of ELEMENTS_CHAINE) if (l[e.cle]) codes.add(l[e.cle]!);
  const moteurs = await moteursParCode([...codes]);
  const liaisons = codes.size ? await db.select().from(engineBindings).where(inArray(engineBindings.targetCode, [...codes])) : [];
  const parCible = new Map(liaisons.map((b) => [b.targetCode, b]));
  const ech = reelles.length ? await db.select({ ligne: exchanges.lineId, etat: exchanges.state, k: count() }).from(exchanges).where(inArray(exchanges.lineId, reelles.map((l) => l.id))).groupBy(exchanges.lineId, exchanges.state) : [];
  const reelOk = await reelAutorise();
  return rows.map((l) => {
    if (l.kind === "reserve") return { id: l.id, groupe: l.groupCode, position: l.position, kind: "reserve" as const, label: l.label, enabled: false, locked: false, validity: "invalid" as const, invalidReasons: [] as string[], canal: null, intermediaire: null, chaine: [], coupures: [], etat: "unknown" as const, passage: { autorise: false, raison: "LIGNE_VIDE" as const }, admissible: { ok: false, raison: "VIDE" as const, detail: "Ligne de réserve : vide." }, echanges: {} as Record<string, number> };
    const c = coup.get(l.id) ?? [];
    const lite = coupuresLite(c);
    return {
      id: l.id, groupe: l.groupCode, position: l.position, kind: "real" as const, label: l.label, enabled: l.enabled, locked: l.locked, validity: l.validity, invalidReasons: l.invalidReasons,
      canal: l.channel, intermediaire: l.intermediaryRef,
      chaine: ELEMENTS_CHAINE.map((el) => {
        const code = l[el.cle];
        const m = code ? moteurs.get(code) : undefined;
        const b = code ? parCible.get(code) : undefined;
        return { rang: el.rang, cle: el.cle, libelle: el.libelle, code, nom: m?.name ?? null, plateforme: m?.platformCode ?? null, kind: m?.kind ?? null, etat: m?.inventoryState ?? null, preuve: m?.evidenceLevel ?? null, declareSeulement: m?.declaredOnly ?? null, enMarche: m?.running ?? null, sante: m?.health ?? null, paire: b ? { commande: b.commandEngine, verification: b.verificationEngine } : null };
      }),
      coupures: c.map((x: CoupureComplete) => ({ id: x.id, side: x.side, element: x.elementCode, requested: x.requested, observed: x.observed, progress: x.progress, mode: x.mode, error: x.error, lastCheckedAt: x.lastCheckedAt, lastProof: x.lastProof, porteOuverte: x.porteOuverte, lastCommandId: x.lastCommandId })),
      etat: etatLigne(lite),
      passage: decisionPassage(ligneLite(l), lite, { reelAutorise: reelOk }),
      admissible: ligneAdmissible(ligneLite(l), lite),
      // Ce que chaque coupure commande VRAIMENT : sa nature (réel / simulé), la liaison qui l'actionne et pourquoi elle serait indisponible.
      natures: c.map((x: CoupureComplete) => {
        const a = adaptateurDe(x, l);
        return { coupureId: x.id, side: x.side, reelle: x.mode === "real", liaison: a.nom, libelle: a.libelle, disponible: a.disponible, raison: a.raison ?? null };
      }),
      echanges: Object.fromEntries(ech.filter((e) => e.ligne === l.id).map((e) => [e.etat, n(e.k)])),
    };
  });
}

export async function groupesVue() {
  const db = dbFrontier();
  const gs = await db.select().from(groups).orderBy(asc(groups.position));
  const plats = new Map((await db.select().from(platforms)).map((p) => [p.code, p]));
  const toutes = await db.select().from(lines);
  const reelles = toutes.filter((l) => l.kind === "real");
  const coup = await chargerCoupures(reelles.map((l) => l.id));
  return gs.map((g) => {
    const lg = toutes.filter((l) => l.groupCode === g.code);
    const r = lg.filter((l) => l.kind === "real");
    // Le grand contact rouge ne commande que les lignes validées : c'est leur contact central qu'il résume.
    const centres = r.filter((l) => l.validity === "valid").flatMap((l) => (coup.get(l.id) ?? []).filter((c) => c.side === "center")).map((c) => coupuresLite([c])[0]!);
    const etats = r.map((l) => etatLigne(coupuresLite(coup.get(l.id) ?? [])));
    const p = g.platformCode ? plats.get(g.platformCode) : undefined;
    return {
      code: g.code, name: g.name, position: g.position, isFuture: g.isFuture, contactLocked: g.contactLocked,
      plateforme: p ? { code: p.code, name: p.name, status: p.status, identityStatus: p.identityStatus } : null,
      reelles: r.length, reserves: lg.filter((l) => l.kind === "reserve").length, reservesAttendues: Math.max(r.length > 0 ? r.length * RESERVE_PAR_LIGNE_REELLE : 5, 0),
      valides: r.filter((l) => l.validity === "valid").length,
      connectees: etats.filter((e) => e === "connected").length, enErreur: etats.filter((e) => e === "failed").length,
      contact: etatContactGroupe(centres),
    };
  });
}

// ───────────────────────── Moteurs ─────────────────────────
export async function moteursListe(filtre: { plateforme?: string; kind?: string; etat?: string; q?: string; declareSeulement?: boolean; limite?: number } = {}) {
  const db = dbFrontier();
  const conds = [];
  if (filtre.plateforme) conds.push(eq(engines.platformCode, filtre.plateforme));
  if (filtre.kind) conds.push(eq(engines.kind, filtre.kind as Engine["kind"]));
  if (filtre.etat) conds.push(eq(engines.inventoryState, filtre.etat as never));
  if (filtre.declareSeulement !== undefined) conds.push(eq(engines.declaredOnly, filtre.declareSeulement));
  if (filtre.q) conds.push(or(ilike(engines.name, `%${filtre.q}%`), ilike(engines.code, `%${filtre.q}%`), ilike(engines.function, `%${filtre.q}%`)));
  const rows = await db
    .select({ code: engines.code, name: engines.name, plateforme: engines.platformCode, kind: engines.kind, origin: engines.origin, etat: engines.inventoryState, preuve: engines.evidenceLevel, declareSeulement: engines.declaredOnly, enMarche: engines.running, sante: engines.health, version: engines.version, intermediaire: engines.plannedIntermediary, fonction: engines.function })
    .from(engines)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(engines.platformCode), asc(engines.kind), asc(engines.code))
    .limit(Math.min(1000, filtre.limite ?? 300));
  return rows;
}

export async function moteurDetail(code: string) {
  const db = dbFrontier();
  const [m] = await db.select().from(engines).where(eq(engines.code, code)).limit(1);
  if (!m) return null;
  const versions = await db.select().from(engineVersions).where(eq(engineVersions.engineCode, code)).orderBy(desc(engineVersions.id)).limit(20);
  const capacites = await lireCapacites(code);
  const commeCible = await db.select().from(engineBindings).where(eq(engineBindings.targetCode, code));
  const commeMoteur = await db.select({ targetKind: engineBindings.targetKind, targetCode: engineBindings.targetCode, role: sql<string>`CASE WHEN ${engineBindings.commandEngine} = ${code} THEN 'commande' ELSE 'vérification' END` }).from(engineBindings).where(or(eq(engineBindings.commandEngine, code), eq(engineBindings.verificationEngine, code))).limit(40);
  const nbLiaisons = await db.select({ k: count() }).from(engineBindings).where(or(eq(engineBindings.commandEngine, code), eq(engineBindings.verificationEngine, code)));
  const lignes = await db.select({ id: lines.id, label: lines.label, groupe: lines.groupCode }).from(lines).where(or(eq(lines.remoteRealEngine, code), eq(lines.remoteSwitch, code), eq(lines.remoteIntermediary, code), eq(lines.centerContact, code), eq(lines.mainIntermediary, code), eq(lines.mainSwitch, code), eq(lines.mainRealEngine, code)));
  const recus = await db.select().from(commandReceipts).where(eq(commandReceipts.engineCode, code)).orderBy(desc(commandReceipts.id)).limit(15);
  const latence = await latenceRecente(code);
  const interne = MOTEURS_INTERNES.find((x) => x.code === code);
  return {
    moteur: m,
    versions,
    capacites,
    liaisonsCommeCible: commeCible.map((b) => ({ commande: b.commandEngine, verification: b.verificationEngine, cible: `${b.targetKind} ${b.targetCode}` })),
    liaisonsCommeMoteur: { total: n(nbLiaisons[0]?.k), exemples: commeMoteur },
    lignes,
    recus,
    latence,
    definitionEtat: m.inventoryState ? DEFINITION_ETAT[m.inventoryState as EtatInventaire] : null,
    libelleEtat: m.inventoryState ? LIBELLE_ETAT[m.inventoryState as EtatInventaire] : null,
    specInterne: interne ? { entrees: interne.entrees, sorties: interne.sorties, arret: interne.arret } : null,
  };
}

// ───────────────────────── Salles ─────────────────────────
export async function sallesListe() {
  return dbFrontier().select().from(rooms).orderBy(asc(rooms.position));
}

export async function salleBoutique(plateforme: string) {
  const db = dbFrontier();
  const [p] = await db.select().from(platforms).where(eq(platforms.code, plateforme)).limit(1);
  if (!p) return null;
  const parEtat = await db.select({ etat: engines.inventoryState, kind: engines.kind, k: count() }).from(engines).where(and(eq(engines.platformCode, plateforme), eq(engines.origin, "inventory"), pasStock)).groupBy(engines.inventoryState, engines.kind);
  const [declares] = await db.select({ k: count() }).from(engines).where(and(eq(engines.platformCode, plateforme), eq(engines.origin, "inventory"), eq(engines.declaredOnly, true), eq(engines.kind, "real"), pasStock));
  const inter = await db.select().from(engines).where(and(eq(engines.platformCode, plateforme), eq(engines.kind, "intermediary"), pasStock)).orderBy(asc(engines.code));
  const stockMoteurs = plateforme === "shop" ? await db.select().from(engines).where(and(eq(engines.platformCode, plateforme), eq(engines.origin, "inventory"), estStock)).orderBy(asc(engines.code)) : [];
  const groupeCode = plateforme === "shop" ? "boutique" : plateforme;
  const lg = await lignesVue(groupeCode);
  const inv = plateforme === "shop" ? INVENTAIRE_BOUTIQUE : plateforme === "main" ? INVENTAIRE_PLATEFORME : null;
  return {
    plateforme: p,
    moteursParEtat: parEtat.map((r) => ({ etat: r.etat, kind: r.kind, k: n(r.k) })),
    declaresSeulement: n(declares?.k),
    intermediaires: inter.map((m) => ({ code: m.code, name: m.name, etat: m.inventoryState, preuve: m.evidenceLevel, fonction: m.function, manques: (m.details as { manques?: string[] }).manques ?? [], aVerifier: (m.details as { aVerifier?: string[] }).aVerifier ?? [] })),
    lignes: lg,
    stock: plateforme === "shop"
      ? {
          moteurs: stockMoteurs.map((m) => ({ code: m.code, name: m.name, kind: m.kind, etat: m.inventoryState, preuve: m.evidenceLevel, fonction: m.function, manques: (m.details as { manques?: string[] }).manques ?? [], aVerifier: (m.details as { aVerifier?: string[] }).aVerifier ?? [], doublons: (m.details as { doublons?: string[] }).doublons ?? [] })),
          modeles: INVENTAIRE_BOUTIQUE.stock.modeles,
          canaux: INVENTAIRE_BOUTIQUE.stock.canaux,
          comptePropre: INVENTAIRE_BOUTIQUE.stock.comptePropre,
          desactiveParLaBase: INVENTAIRE_BOUTIQUE.stock.desactiveParLaBase,
          controlesDoublons: INVENTAIRE_BOUTIQUE.stock.controlesDoublons,
          migration: INVENTAIRE_BOUTIQUE.stock.migration,
        }
      : null,
    inventaire: inv ? { commit: inv.source.commit, dateCommit: inv.source.dateCommit, genereLe: inv.source.genereLe, depot: inv.source.depot } : null,
    audit: plateforme === "shop" ? { exigences: INVENTAIRE_BOUTIQUE.auditExigences.total, criteres: INVENTAIRE_BOUTIQUE.auditExigences.criteres, planComplet: INVENTAIRE_BOUTIQUE.auditExigences.planCompletDansLeDepot, exigencesSansMoteur: INVENTAIRE_BOUTIQUE.exigencesSansMoteur } : null,
  };
}

export async function inventaireResume() {
  const compte = (l: readonly { etat: string }[]) => Object.fromEntries(["incomplet", "prepare", "installe", "teste", "connecte", "a_verifier"].map((e) => [e, l.filter((x) => x.etat === e).length]));
  return {
    definitions: DEFINITION_ETAT,
    libelles: LIBELLE_ETAT,
    boutique: { source: INVENTAIRE_BOUTIQUE.source, stockPropre: { moteurs: INVENTAIRE_BOUTIQUE.stock.moteurs.length, intermediaires: INVENTAIRE_BOUTIQUE.stock.intermediaires.length, modeles: INVENTAIRE_BOUTIQUE.stock.modeles.length, canaux: INVENTAIRE_BOUTIQUE.stock.canaux.length, desactiveParLaBase: INVENTAIRE_BOUTIQUE.stock.desactiveParLaBase, etats: compte([...INVENTAIRE_BOUTIQUE.stock.moteurs, ...INVENTAIRE_BOUTIQUE.stock.intermediaires]) }, total: INVENTAIRE_BOUTIQUE.moteurs.length, parEtat: compte(INVENTAIRE_BOUTIQUE.moteurs), declaresSeulement: INVENTAIRE_BOUTIQUE.moteurs.filter((m) => m.declareSeulement).length, intermediaires: INVENTAIRE_BOUTIQUE.intermediaires.map((i) => ({ id: i.id, nom: i.nom, etat: i.etat, manques: i.manques, aVerifier: i.aVerifier })), contrats: INVENTAIRE_BOUTIQUE.contrats },
    plateforme: { source: INVENTAIRE_PLATEFORME.source, total: INVENTAIRE_PLATEFORME.moteurs.length, parEtat: compte(INVENTAIRE_PLATEFORME.moteurs), declaresSeulement: INVENTAIRE_PLATEFORME.moteurs.filter((m) => m.declareSeulement).length, canaux: INVENTAIRE_PLATEFORME.intermediaires.map((i) => ({ id: i.id, nom: i.nom, etat: i.etat, manques: i.manques })) },
    audit: INVENTAIRE_BOUTIQUE.auditExigences,
  };
}

// ───────────────────────── Sécurité, atelier, audit, mémoire, accès, futures ─────────────────────────
/** Les voies qui relient la plateforme à la Boutique, et celles que la gouvernance du centre couvre — dit sans détour. */
export const VOIES_EXISTANTES = [
  { voie: "Outils de l'IA de la plateforme → Boutique (accès de service /api/service)", fichier: "server/intelligences/boutique.ts (appeler)", canal: "catalogue", type: "echange", gouvernee: true, note: "Le portier du centre est consulté à chaque appel (sans effet tant que la gouvernance n'est pas armée)." },
  { voie: "Moteur intermédiaire shop_link — canal catalogue (sortant)", fichier: "server/shop-link/sortant.ts (viaCable)", canal: "catalogue", type: "echange", gouvernee: true, note: "Câble d'abord, centre ensuite : le centre ne peut que restreindre." },
  { voie: "Moteur intermédiaire shop_link — canaux entrants (état, documents, ia-mémoire, câble)", fichier: "server/shop-link/entrant.ts", canal: "état · documents · ia-mémoire", type: "echange", gouvernee: true, note: "ia-mémoire n'a pas de ligne dans le centre : armée, la gouvernance la ferme." },
  { voie: "API de connaissance isolée de la Boutique (/api/v1/intelligences/shop/knowledge)", fichier: "server/intelligences/api-v1.ts → shop-knowledge.ts", canal: "connaissance", type: "echange", gouvernee: true, note: "Échange de DONNÉES de la Boutique vers la plateforme, hors des six lignes préparées. Désormais consultée par le portier (sans effet tant que la gouvernance n'est pas armée). Armée, elle est REFUSÉE : aucune ligne du centre ne la couvre. Pour la garder ouverte, il faudra créer une ligne (décision du PDG)." },
  { voie: "API d'analyse isolée de la Boutique (/api/v1/shop/analyse)", fichier: "server/intelligences/api-v1.ts → shop-analysis.ts", canal: "analyse", type: "echange", gouvernee: true, note: "Échange de DONNÉES : la Boutique envoie des données à analyser, la plateforme répond. Désormais consultée par le portier (sans effet tant que la gouvernance n'est pas armée). Armée, elle est REFUSÉE faute de ligne dans le centre (décision du PDG pour en créer une)." },
  { voie: "Bouton « Boutique » (lien du navigateur vers l'adresse publique)", fichier: "server/intelligences/index.ts (adresse publique)", canal: "—", type: "navigation", gouvernee: false, note: "NAVIGATION, pas un échange de données : le navigateur de la personne ouvre le site de la Boutique, aucune donnée ne passe entre les moteurs. Il n'a donc ni ligne, ni coupure, ni portier, et n'est pas compté parmi les voies de données." },
] as const;

/** Pool de la plateforme, utilisé en LECTURE SEULE pour une unique mesure (instance de démarrage) : jamais une écriture, jamais une donnée. */
async function poolPlateforme() {
  try {
    return (await import("../db.js")).pool;
  } catch {
    return null;
  }
}

let memoSeparation: { le: number; d: Awaited<ReturnType<typeof diagnostiquerSeparation>> } | null = null;
/** Mesure (mémorisée 60 s sauf demande contraire : l'accueil se rafraîchit souvent, la mesure coûte deux requêtes). */
async function mesureSeparation(forcer: boolean) {
  if (!forcer && memoSeparation && Date.now() - memoSeparation.le < 60_000) return memoSeparation.d;
  const d = await diagnostiquerSeparation(poolFrontier(), await poolPlateforme(), variableFournie());
  memoSeparation = { le: Date.now(), d };
  return d;
}
export const oublierSeparationPourTests = () => {
  memoSeparation = null;
};

/** Niveau de séparation de la base du centre, MESURÉ, avec la dernière sauvegarde consignée au journal. */
export async function separationVue() {
  const db = dbFrontier();
  const d = await mesureSeparation(true);
  const [derniere] = await db.select().from(auditLog).where(and(eq(auditLog.action, "backup"), eq(auditLog.result, "ok"))).orderBy(desc(auditLog.id)).limit(1);
  const detail = (derniere?.detail ?? {}) as { tables?: number; lignes?: number; sha256?: string };
  return {
    ...d,
    libelle: LIBELLE_SEPARATION[d.niveau],
    derniereSauvegarde: derniere ? { le: derniere.at.toISOString(), tables: detail.tables ?? null, lignes: detail.lignes ?? null, empreinte: detail.sha256 ? detail.sha256.slice(0, 16) : null } : null,
    outils: ["npx tsx scripts/centre-sauvegarde.ts sauvegarder", "npx tsx scripts/centre-sauvegarde.ts verifier --dossier <dossier>", "npx tsx scripts/centre-sauvegarde.ts restaurer --dossier <dossier> --cible <url> --confirme", "npx tsx scripts/centre-sauvegarde.ts comparer --source <url> --cible <url>"],
  };
}

export async function securiteVue() {
  const db = dbFrontier();
  return {
    separation: await separationVue(),
    mode: MODE,
    actionReelle: ACTION_REELLE_ACTIVEE,
    gouvernanceArmee: await gouvernanceArmee(),
    base: { ...etatBase(), schema: "frontier" },
    secrets: (await db.select().from(secretRefs).orderBy(asc(secretRefs.name))).map((s) => ({ name: s.name, store: s.store, ref: s.ref, purpose: s.purpose, status: s.status, proprietaire: `${s.ownerKind}:${s.ownerCode}` })),
    moteursInternes: (await db.select().from(engines).where(eq(engines.platformCode, "frontier")).orderBy(asc(engines.code))).filter((m) => ["command", "verification", "transport", "monitor"].includes(m.kind)).map((m) => ({ code: m.code, nom: m.name, kind: m.kind, fonction: m.function, entrees: m.inputs, sorties: m.outputs, arret: m.stopMechanism, enMarche: m.running, sante: m.health, verifieLe: m.healthCheckedAt })),
    acces: await db.select().from(accessGrants).orderBy(asc(accessGrants.id)),
    api: await db.select().from(apiSlots).orderBy(asc(apiSlots.code)),
    voies: VOIES_EXISTANTES,
  };
}

export async function atelierVue() {
  const db = dbFrontier();
  const reparations = await db.select().from(repairs).orderBy(desc(repairs.id)).limit(60);
  const [anomalies, invariants, ouverts, lacunes] = await Promise.all([detecterAnomalies(), verifierInvariants(), incidentsOuverts(100), lacunesVue()]);
  return { reparations, anomalies, invariants, incidentsOuverts: ouverts, lacunes };
}

export async function incidentsVue(limite = 100) {
  return dbFrontier().select().from(incidents).orderBy(desc(incidents.id)).limit(Math.min(500, limite));
}

export async function auditVue(limite = 100, resultat?: "ok" | "refused" | "error") {
  return dbFrontier().select().from(auditLog).where(resultat ? eq(auditLog.result, resultat) : undefined).orderBy(desc(auditLog.id)).limit(Math.min(500, limite));
}

export async function commandesVue(limite = 60) {
  const db = dbFrontier();
  const cs = await db.select().from(commands).where(sql`${commands.parentId} IS NULL`).orderBy(desc(commands.id)).limit(Math.min(300, limite));
  return cs;
}

export async function commandeDetail(id: number) {
  const db = dbFrontier();
  const [c] = await db.select().from(commands).where(eq(commands.id, id)).limit(1);
  if (!c) return null;
  const recus = await db.select().from(commandReceipts).where(eq(commandReceipts.commandId, id)).orderBy(asc(commandReceipts.id));
  const enfants = await db.select().from(commands).where(eq(commands.parentId, id)).orderBy(asc(commands.id));
  return { commande: c, recus, enfants };
}

export async function sessionsVue(limite = 30) {
  const db = dbFrontier();
  const ss = await db.select().from(testSessions).orderBy(desc(testSessions.id)).limit(limite);
  const ids = ss.map((s) => s.id);
  const steps = ids.length ? await db.select().from(testSteps).where(inArray(testSteps.sessionId, ids)).orderBy(asc(testSteps.sessionId), asc(testSteps.ord)) : [];
  return ss.map((s) => ({ ...s, etapes: steps.filter((x) => x.sessionId === s.id) }));
}

export async function memoireVue() {
  const db = dbFrontier();
  return {
    blocs: await db.select().from(memoryBlocks).orderBy(desc(memoryBlocks.importance), desc(memoryBlocks.id)).limit(100),
    historique: await db.select().from(configHistory).orderBy(desc(configHistory.id)).limit(60),
  };
}

export async function employesVue() {
  const db = dbFrontier();
  return { acces: await db.select().from(accessGrants).orderBy(asc(accessGrants.id)), note: "Aujourd'hui seul le PDG (rôle super_admin de la plateforme) accède au centre. Les accès employés sont préparés, jamais accordés." };
}

export async function futuresVue() {
  const db = dbFrontier();
  return {
    groupes: (await groupesVue()).filter((g) => g.isFuture),
    entreprises: await db.select().from(companies).orderBy(asc(companies.code)),
    plateformes: (await db.select().from(platforms).orderBy(asc(platforms.code))).filter((p) => ["future", "to_verify"].includes(p.status)),
    souscriptions: await db.select().from(subscriptions),
    api: await db.select().from(apiSlots).orderBy(asc(apiSlots.code)),
  };
}

export async function echangesVue(ligneId?: number, limite = 60) {
  return dbFrontier().select().from(exchanges).where(ligneId ? eq(exchanges.lineId, ligneId) : undefined).orderBy(desc(exchanges.id)).limit(Math.min(200, limite));
}

export async function mesuresVue() {
  const db = dbFrontier();
  const recentes = await db.select().from(measurements).orderBy(desc(measurements.id)).limit(60);
  const capacites = await db.select().from(engineCapabilities).orderBy(asc(engineCapabilities.engineCode), asc(engineCapabilities.metric));
  const latences = await latenceRecente(null, 300);
  return { jauges: await lireJauges(), recentes, capacites, latences };
}

export type { Line };
