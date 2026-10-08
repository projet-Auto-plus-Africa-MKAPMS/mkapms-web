/**
 * Centre Cyber-Électrique MKA.P-MS / Frontier OS — fondation, miroirs, lecture, actions, diagnostic et atelier.
 *
 * Tout est moteur. Ce module ne branche RIEN de réel : les actions travaillent en SIMULATION (rules.ts : MODE, ACTION_REELLE_ACTIVEE) ;
 * l'état réel d'un canal n'est que LU depuis le câble du moteur intermédiaire Boutique (shop-link), qui reste seul maître de la réalité.
 * Chaque action, acceptée ou refusée, est journalisée ; la mémoire du système reçoit les faits importants (jamais un secret).
 */
import { and, count, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../db.js";
import { ENGINE_CATALOG } from "../engine-registry/catalog.js";
import { engineRegistry } from "../engine-registry/schema.js";
import { CANAUX, CANAUX_IDS, inspecter } from "../shop-link/contrats.js";
import { decider as deciderPassage, lireCables } from "../shop-link/service.js";
import {
  foAuditLogs, foButtons, foConnectionLines, foControlGroups, foEnginePairs, foEngines, foMemoryBlocks, foPlatforms, foPointages, foRepairWorkshop, foSecurityZones, foSwitches,
  type FoButton, type FoEngine, type FoLine, type FoPair, type FoPointage, type FoSwitch,
} from "./schema.js";
import { INTERMEDIAIRES_BOUTIQUE, RESERVE_DE_DEPART, RESERVE_PAR_LIGNE_REELLE, SHOP_ENGINES, SHOP_SNAPSHOT } from "./shop-inventory.js";
import {
  ACTION_REELLE_ACTIVEE, COULEUR_POINTAGE_MAITRE, MODE, estExterne, etatCourantLigne, etatDepuisCable, etatDepuisRegistre, etatLigne, etatReelDepuisCable, jauges, moteurInterneUtilisable, reserveCible, validerLigne, validerPaire,
  type Comptes, type EngineLite, type EngineStatus, type EtatReel, type LineStatus,
} from "./rules.js";

type Db = typeof db;

/** Tronque un texte pour qu'il tienne dans une colonne varchar(n) même si la base compte en octets (encodage SQL_ASCII) : jamais plus de n octets UTF-8. */
export function tronquer(texte: string, max: number): string {
  if (Buffer.byteLength(texte, "utf8") <= max) return texte;
  let sortie = "";
  for (const c of texte) {
    if (Buffer.byteLength(sortie + c, "utf8") > max) break;
    sortie += c;
  }
  return sortie;
}

export interface Acteur {
  type: "pdg" | "system" | "engine";
  id?: number;
}
export const SYSTEME: Acteur = { type: "system" };

// ── Journal et mémoire ──────────────────────────────────────────────────────────────────────────────────────────────
export interface EntreeAudit {
  acteur: Acteur;
  action: string;
  cible: string;
  cibleId?: number | null;
  avant?: Record<string, unknown> | null;
  apres?: Record<string, unknown> | null;
  resultat: "ok" | "refused" | "error";
  erreur?: string;
}

/** Tout est journalisé : activation, désactivation, test, erreur, réparation, tentative bloquée. Ne lève jamais. */
export async function journaliser(e: EntreeAudit, base: Db = db): Promise<void> {
  try {
    await base.insert(foAuditLogs).values({
      actorType: e.acteur.type,
      actorId: e.acteur.id ?? null,
      action: tronquer(e.action, 48),
      targetType: tronquer(e.cible, 16),
      targetId: e.cibleId ?? null,
      beforeState: e.avant ?? null,
      afterState: e.apres ?? null,
      result: e.resultat,
      errorMessage: e.erreur ? tronquer(e.erreur, 300) : null,
    });
  } catch (err) {
    console.error("[frontier-os] journal indisponible:", (err as Error).message);
  }
}

/** Tout peut écrire dans la mémoire — sauf un secret : un résumé qui en contient un est refusé. */
export async function ecrireMemoire(m: { proprietaire: "platform" | "engine" | "switch" | "button" | "security" | "repair" | "line" | "system"; proprietaireId?: number | null; type: string; resume: string; importance?: number; securite?: number }, base: Db = db): Promise<boolean> {
  if (!inspecter({ resume: m.resume }).ok) return false;
  try {
    await base.insert(foMemoryBlocks).values({
      ownerType: m.proprietaire,
      ownerId: m.proprietaireId ?? null,
      memoryType: tronquer(m.type, 32),
      contentSummary: tronquer(m.resume, 500),
      importanceLevel: Math.min(5, Math.max(1, m.importance ?? 1)),
      securityLevel: Math.min(5, Math.max(0, m.securite ?? 1)),
    });
    return true;
  } catch (err) {
    console.error("[frontier-os] mémoire indisponible:", (err as Error).message);
    return false;
  }
}

// ── Données de départ ───────────────────────────────────────────────────────────────────────────────────────────────
const PLATEFORMES = [
  { code: "main", name: "Plateforme Principale", slug: "plateforme-principale", type: "main", status: "active", securityLevel: 5, isInternal: true, isFuture: false },
  { code: "shop", name: "MKA.P-MS Shop / Boutique", slug: "mkapms-shop-boutique", type: "shop", status: "inactive", securityLevel: 4, isInternal: true, isFuture: false },
  { code: "map", name: "Map", slug: "map", type: "map", status: "future", securityLevel: 3, isInternal: true, isFuture: true },
  { code: "ia-al-houdoud", name: "IA Al-Houdoud M.", slug: "ia-al-houdoud-m", type: "ai", status: "future", securityLevel: 5, isInternal: true, isFuture: true },
  { code: "bijoux", name: "Boutique Bijoux (future)", slug: "boutique-bijoux", type: "jewelry_shop", status: "future", securityLevel: 3, isInternal: true, isFuture: true },
  { code: "future-01", name: "Future Plateforme 01", slug: "future-plateforme-01", type: "future", status: "future", securityLevel: 2, isInternal: true, isFuture: true },
  { code: "future-02", name: "Future Plateforme 02", slug: "future-plateforme-02", type: "future", status: "future", securityLevel: 2, isInternal: true, isFuture: true },
  { code: "future-03", name: "Future Plateforme 03", slug: "future-plateforme-03", type: "future", status: "future", securityLevel: 2, isInternal: true, isFuture: true },
  { code: "externes", name: "Plateformes externes clientes (plus tard)", slug: "plateformes-externes-clientes", type: "external", status: "future", securityLevel: 5, isInternal: false, isFuture: true },
] as const;

const GROUPES = [
  { code: "boutique", name: "Groupe Boutique", left: "shop", status: "inactive" },
  { code: "map", name: "Groupe Map", left: "map", status: "future" },
  { code: "ia", name: "Groupe IA Al-Houdoud M.", left: "ia-al-houdoud", status: "future" },
  { code: "bijoux", name: "Groupe Bijoux — future Boutique", left: "bijoux", status: "future" },
  { code: "future-01", name: "Groupe Future Plateforme 01", left: "future-01", status: "future" },
  { code: "future-02", name: "Groupe Future Plateforme 02", left: "future-02", status: "future" },
  { code: "future-03", name: "Groupe Future Plateforme 03", left: "future-03", status: "future" },
  { code: "externes", name: "Groupe Plateformes externes clientes", left: "externes", status: "future" },
] as const;

const ZONES = [
  { code: "accueil", name: "Accueil", zoneType: "entry", status: "active", dangerLevel: 1, description: "Entrée du centre : état général par jauges." },
  { code: "tableau-general", name: "Tableau de bord général", zoneType: "dashboard", status: "active", dangerLevel: 1, description: "Vue d'ensemble des groupes, lignes et moteurs." },
  { code: "salle-principale", name: "Salle Plateforme Principale", zoneType: "room", status: "active", dangerLevel: 2, description: "Tous les moteurs de la plateforme principale." },
  { code: "salle-boutique", name: "Salle Boutique", zoneType: "room", status: "active", dangerLevel: 2, description: "Tous les moteurs de la Boutique et ses moteurs intermédiaires." },
  { code: "salle-activation", name: "Salle d'Activation", zoneType: "activation", status: "active", dangerLevel: 5, description: "La grande centrale : lignes, interrupteurs, pointages, Activer tout / Désactiver tout. Simulation seulement." },
  { code: "salle-cyber", name: "Salle Cyber Sécurité", zoneType: "security", status: "active", dangerLevel: 4, description: "Alertes, tentatives bloquées, accès, permissions, clés, connexions suspectes (espace préparé)." },
  { code: "atelier-reparation", name: "Atelier de Réparation", zoneType: "workshop", status: "active", dangerLevel: 4, description: "Diagnostic, réparation, correction, rollback, intervention moteur." },
  { code: "salle-memoire", name: "Salle Mémoire", zoneType: "memory", status: "active", dangerLevel: 2, description: "Mémoire du système : tout peut y écrire, aucun secret n'y entre." },
  { code: "salle-audit", name: "Salle Audit / Logs", zoneType: "audit", status: "active", dangerLevel: 2, description: "Journal complet : actions, refus, erreurs." },
  { code: "salle-futures", name: "Salle Futures Plateformes", zoneType: "future", status: "future", dangerLevel: 1, description: "Map, IA Al-Houdoud M., boutique bijoux, futures plateformes, plateformes externes clientes." },
] as const;

/** Moteurs internes de contrôle (plateforme principale) : ce sont eux qui forment les paires et qui pilotent boutons et interrupteurs. */
const MOTEURS_INTERNES = [
  { code: "fo:security", name: "Moteur de sécurité cyber", type: "security_engine", role: "Surveille les accès, les refus et les connexions suspectes ; second moteur de chaque paire de contrôle." },
  { code: "fo:audit", name: "Moteur d'audit", type: "audit_engine", role: "Journalise chaque action, refus et erreur ; second moteur des paires de secours." },
  { code: "fo:memory", name: "Moteur de mémoire", type: "memory_engine", role: "Écrit la mémoire du système (faits, tests, réparations) sans secret." },
  { code: "fo:repair", name: "Moteur de réparation", type: "repair_engine", role: "Diagnostique et propose des réparations réversibles ; atelier interne." },
  { code: "fo:pointage-master", name: "Moteur du pointage maître", type: "pointage_engine", role: "Pilote le grand pointage rouge central de chaque ligne." },
  { code: "fo:switch-controller", name: "Moteur des interrupteurs", type: "switch_engine", role: "Pilote les interrupteurs ON/OFF de chaque ligne." },
  { code: "fo:button-controller", name: "Moteur des boutons", type: "button_engine", role: "Pilote les boutons du centre ; aucun bouton critique ne fonctionne avec un seul moteur." },
  { code: "fo:connection-bus", name: "Moteur des lignes de connexion", type: "connection_engine", role: "Porte les lignes électriques/logiques entre les plateformes." },
] as const;

const BOUTONS = [
  { code: "all_on", name: "Activer tout", type: "all_on", danger: 5, p: "fo:button-controller", s: "fo:switch-controller" },
  { code: "all_off", name: "Désactiver tout", type: "all_off", danger: 4, p: "fo:button-controller", s: "fo:switch-controller" },
  { code: "line_on", name: "Activer ligne", type: "line_on", danger: 3, p: "fo:button-controller", s: "fo:switch-controller" },
  { code: "line_off", name: "Désactiver ligne", type: "line_off", danger: 2, p: "fo:button-controller", s: "fo:switch-controller" },
  { code: "test_current", name: "Tester courant", type: "test_current", danger: 2, p: "fo:button-controller", s: "fo:audit" },
  { code: "lock", name: "Verrouiller", type: "lock", danger: 3, p: "fo:button-controller", s: "fo:security" },
  { code: "unlock", name: "Déverrouiller", type: "unlock", danger: 4, p: "fo:button-controller", s: "fo:security" },
  { code: "diagnostic", name: "Lancer diagnostic", type: "diagnostic", danger: 1, p: "fo:button-controller", s: "fo:repair" },
  { code: "repair", name: "Réparer", type: "repair", danger: 4, p: "fo:repair", s: "fo:audit" },
  { code: "pointage_toggle", name: "Pointage central (contact / coupure)", type: "pointage_toggle", danger: 4, p: "fo:pointage-master", s: "fo:security" },
] as const;

const CODE_PAR_DEFAUT = { primaire: "fo:security", secondaire: "fo:audit" } as const;

// ── Fondation (idempotente) ─────────────────────────────────────────────────────────────────────────────────────────
export interface RapportFondation {
  plateformes: number;
  groupes: number;
  moteurs: number;
  paires: number;
  boutons: number;
  zones: number;
  lignesReelles: number;
  lignesFutures: number;
  cree: boolean;
}

type NouveauMoteur = typeof foEngines.$inferInsert;

async function moteur(tx: Db, platformes: Map<string, number>, plateforme: string, m: Omit<NouveauMoteur, "platformId">): Promise<number> {
  const propre = { ...m, name: tronquer(m.name, 200), role: tronquer(m.role ?? "", 400), sourceRef: tronquer(m.sourceRef ?? "", 160) };
  const [r] = await tx
    .insert(foEngines)
    .values({ ...propre, platformId: platformes.get(plateforme)! })
    .onConflictDoUpdate({ target: foEngines.code, set: { name: propre.name, role: propre.role, engineType: m.engineType, updatedAt: new Date() } })
    .returning({ id: foEngines.id });
  return r.id;
}

/** Crée tout ce qui manque (jamais de doublon, jamais d'écrasement d'un état décidé) et rend le rapport. */
export async function assurerFondation(acteur: Acteur = SYSTEME): Promise<RapportFondation> {
  const avant = await compterTout(db);
  await db.transaction(async (t) => {
    const tx = t as unknown as Db;
    // 1. Plateformes
    const plateformes = new Map<string, number>();
    for (const p of PLATEFORMES) {
      const [r] = await tx.insert(foPlatforms).values(p).onConflictDoUpdate({ target: foPlatforms.code, set: { name: p.name, updatedAt: new Date() } }).returning({ id: foPlatforms.id });
      plateformes.set(p.code, r.id);
    }
    // 2. Groupes de contrôle
    const groupes = new Map<string, number>();
    for (const g of GROUPES) {
      const [r] = await tx
        .insert(foControlGroups)
        .values({ code: g.code, name: g.name, leftPlatformId: plateformes.get(g.left)!, rightPlatformId: plateformes.get("main")!, status: g.status })
        .onConflictDoUpdate({ target: foControlGroups.code, set: { name: g.name } })
        .returning({ id: foControlGroups.id });
      groupes.set(g.code, r.id);
    }
    // 3. Zones
    for (const z of ZONES) await tx.insert(foSecurityZones).values({ ...z, accessLevel: "pdg" }).onConflictDoNothing();
    // 4. Moteurs internes de contrôle
    const internes = new Map<string, number>();
    for (const m of MOTEURS_INTERNES) {
      internes.set(m.code, await moteur(tx, plateformes, "main", { code: m.code, name: m.name, engineType: m.type, role: m.role, status: "active", securityLevel: 5, stateSource: "frontier", autonomousMode: false, repairMode: m.type === "repair_engine" }));
    }
    // 5. Moteurs réels de la plateforme principale (catalogue central ; l'état est ensuite lu dans le registre)
    const principaux = new Map<string, number>();
    for (const e of ENGINE_CATALOG) {
      principaux.set(e.name, await moteur(tx, plateformes, "main", { code: `main:${e.name}`, name: e.label, engineType: "real_platform_engine", role: e.description.slice(0, 400), status: etatDepuisRegistre(e.state, null), stateSource: "registry", sourceRef: e.name, securityLevel: 3 }));
    }
    // 6. Moteurs de la Boutique (photo datée : état non observé) + moteurs déclarés seulement par un contrat
    const boutique = new Map<string, number>();
    const src = `mkapms-shop@${SHOP_SNAPSHOT.commit.slice(0, 7)}`;
    for (const [id, label, domaine, niveau] of SHOP_ENGINES) {
      boutique.set(id, await moteur(tx, plateformes, "shop", { code: `shop:${id}`, name: label, engineType: "real_platform_engine", role: `Domaine ${domaine} · niveau ${niveau}`, status: "inactive", stateSource: "inventory", sourceRef: `${src}:${id}`, securityLevel: 3 }));
    }
    for (const i of INTERMEDIAIRES_BOUTIQUE) {
      if (!boutique.has(i.moteurBoutique)) {
        boutique.set(i.moteurBoutique, await moteur(tx, plateformes, "shop", { code: `shop:${i.moteurBoutique}`, name: `${i.moteurBoutique} (déclaré par le contrat, absent du registre)`, engineType: "real_platform_engine", role: "Moteur nommé par le contrat de connexion de la Boutique ; le registre des 83 moteurs ne le contient pas.", status: "inactive", stateSource: "inventory", sourceRef: `${src}:${i.id}`, securityLevel: 3 }));
      }
    }
    // 7. Moteurs intermédiaires : côté Boutique (les six préparés) et côté plateforme (un par canal du câble)
    const intermediairesBoutique = new Map<string, number>();
    for (const i of INTERMEDIAIRES_BOUTIQUE) {
      intermediairesBoutique.set(i.id, await moteur(tx, plateformes, "shop", { code: `shop:intermediary:${i.id}`, name: `Intermédiaire Boutique — ${i.libelle}`, engineType: "intermediary_engine", role: i.preuve, status: i.etatDeclare === "BLOCKED_EXTERNAL" ? "locked" : "inactive", isIntermediary: true, stateSource: "inventory", sourceRef: `${src}:${i.id}`, securityLevel: 4 }));
    }
    const intermediairesPlateforme = new Map<string, number>();
    for (const canal of CANAUX_IDS) {
      intermediairesPlateforme.set(canal, await moteur(tx, plateformes, "main", { code: `main:shop-link:${canal}`, name: `Intermédiaire plateforme — ${CANAUX[canal].libelle}`, engineType: "intermediary_engine", role: CANAUX[canal].description.slice(0, 400), status: canal === "paiement" || canal === "google" ? "locked" : "inactive", isIntermediary: true, stateSource: "cable", sourceRef: `shop-link:${canal}`, securityLevel: 5 }));
    }
    // 8. Boutons : chacun est un moteur et en a deux autres pour le contrôler
    for (const b of BOUTONS) {
      const eid = await moteur(tx, plateformes, "main", { code: `fo:button:${b.code}`, name: `Bouton — ${b.name}`, engineType: "button_engine", role: `Bouton du centre (danger ${b.danger}/5).`, status: "active", securityLevel: 5, stateSource: "frontier" });
      await tx
        .insert(foButtons)
        .values({ code: b.code, name: b.name, buttonType: b.type, engineId: eid, primaryEngineId: internes.get(b.p)!, secondaryEngineId: internes.get(b.s)!, dangerLevel: b.danger, requiresConfirmation: b.danger >= 3 })
        .onConflictDoNothing();
    }
    // 9. Lignes du groupe Boutique : une ligne réelle par moteur intermédiaire préparé côté Boutique
    const groupeBoutique = groupes.get("boutique")!;
    let position = 0;
    for (const i of INTERMEDIAIRES_BOUTIQUE) {
      position += 1;
      const code = `line:boutique:${i.id}`;
      const [existe] = await tx.select({ id: foConnectionLines.id }).from(foConnectionLines).where(eq(foConnectionLines.code, code)).limit(1);
      if (existe) continue;
      const droiteIntermediaire = i.canalPlateforme ? intermediairesPlateforme.get(i.canalPlateforme)! : null;
      await creerLigne(tx, plateformes, internes, {
        code, groupId: groupeBoutique, position, gauche: plateformes.get("shop")!, droite: plateformes.get("main")!, label: i.libelle, realChannel: i.canalPlateforme, contractRef: i.id, future: false,
        gaucheReel: boutique.get(i.moteurBoutique)!, gaucheInter: intermediairesBoutique.get(i.id)!, droiteInter: droiteIntermediaire, droiteReel: principaux.get(i.moteurPlateforme) ?? null,
      });
    }
    // 10. Paires de contrôle : tout moteur externe est surveillé par DEUX moteurs internes
    const lignes = await tx.select().from(foConnectionLines).where(eq(foConnectionLines.groupId, groupeBoutique));
    const platformeIntermediaireDeLigne = new Map<number, number>();
    for (const l of lignes) {
      if (l.rightIntermediaryEngineId) {
        if (l.leftRealEngineId) platformeIntermediaireDeLigne.set(l.leftRealEngineId, l.rightIntermediaryEngineId);
        if (l.leftIntermediaryEngineId) platformeIntermediaireDeLigne.set(l.leftIntermediaryEngineId, l.rightIntermediaryEngineId);
      }
    }
    const externes = await tx.select({ id: foEngines.id }).from(foEngines).where(and(eq(foEngines.platformId, plateformes.get("shop")!), eq(foEngines.isFuturePlaceholder, false)));
    for (const e of externes) {
      // Sur une ligne : l'intermédiaire de la plateforme qui lui fait face + le moteur de sécurité. Sinon : sécurité + audit.
      const intermediaire = platformeIntermediaireDeLigne.get(e.id);
      const primaire = intermediaire ?? internes.get(CODE_PAR_DEFAUT.primaire)!;
      const secondaire = intermediaire ? internes.get(CODE_PAR_DEFAUT.primaire)! : internes.get(CODE_PAR_DEFAUT.secondaire)!;
      await tx.insert(foEnginePairs).values({ externalEngineId: e.id, internalEnginePrimaryId: primaire, internalEngineSecondaryId: secondaire, controlMode: "mixte" }).onConflictDoNothing();
    }
    // 11. Réserve de lignes futures vides, groupe par groupe
    await completerReserves(tx, plateformes, internes, acteur);
  });
  await rafraichirMiroirs();
  const apres = await compterTout(db);
  const cree = JSON.stringify(avant) !== JSON.stringify(apres);
  if (cree) {
    await journaliser({ acteur, action: "fondation", cible: "system", avant: avant as unknown as Record<string, unknown>, apres: apres as unknown as Record<string, unknown>, resultat: "ok" });
    await ecrireMemoire({ proprietaire: "system", type: "fondation", resume: `Fondation du centre : ${apres.lignesReelles} ligne(s) réelle(s), ${apres.lignesFutures} ligne(s) future(s), ${apres.moteurs} moteur(s), ${apres.paires} paire(s) de contrôle. Mode ${MODE}.`, importance: 4, securite: 2 });
  }
  return { ...apres, cree };
}

interface SpecLigne {
  code: string;
  groupId: number;
  position: number;
  gauche: number;
  droite: number;
  label: string;
  realChannel: string | null;
  contractRef: string | null;
  future: boolean;
  gaucheReel?: number | null;
  gaucheInter?: number | null;
  droiteInter?: number | null;
  droiteReel?: number | null;
}

/** Une ligne = la ligne, ses deux interrupteurs et son pointage, chacun étant un moteur. Une ligne future est vide : tout est réservé, éteint, désactivé. */
async function creerLigne(tx: Db, plateformes: Map<string, number>, internes: Map<string, number>, s: SpecLigne): Promise<number> {
  const platEngine = async (suffixe: string, nom: string, engineType: string, role: string) =>
    moteur(tx, plateformes, "main", { code: `${s.code}:${suffixe}`, name: nom, engineType, role, status: s.future ? "future" : "inactive", isRealEngine: !s.future, isFuturePlaceholder: s.future, stateSource: s.future ? "placeholder" : "frontier", securityLevel: 4 });
  const moteurLigne = await platEngine("engine", `Ligne — ${s.label}`, "connection_engine", "Ligne électrique/logique entre deux plateformes.");
  const moteurGauche = await platEngine("switch-left", `Interrupteur gauche — ${s.label}`, "switch_engine", "Interrupteur côté gauche de la ligne.");
  const moteurDroit = await platEngine("switch-right", `Interrupteur droit — ${s.label}`, "switch_engine", "Interrupteur côté droit de la ligne.");
  const moteurPointage = await platEngine("pointage", `Pointage central — ${s.label}`, "pointage_engine", "Grand contact rouge central : grande coupure ou grande alimentation de la ligne.");
  const [ligne] = await tx
    .insert(foConnectionLines)
    .values({
      code: s.code, groupId: s.groupId, position: s.position, leftPlatformId: s.gauche, rightPlatformId: s.droite, engineId: moteurLigne, label: s.label, realChannel: s.realChannel, contractRef: s.contractRef,
      leftRealEngineId: s.future ? null : s.gaucheReel ?? null, leftIntermediaryEngineId: s.future ? null : s.gaucheInter ?? null, rightIntermediaryEngineId: s.future ? null : s.droiteInter ?? null, rightRealEngineId: s.future ? null : s.droiteReel ?? null,
      status: s.future ? "future" : "off", currentStatus: s.future ? "future" : "off", isActive: false, isFuturePlaceholder: s.future,
    })
    .returning({ id: foConnectionLines.id });
  const [pointage] = await tx
    .insert(foPointages)
    .values({ code: `${s.code}:pointage`, name: `Pointage central — ${s.label}`, connectionLineId: ligne.id, engineId: moteurPointage, status: "separated", colorState: s.future ? "blue" : COULEUR_POINTAGE_MAITRE, isMasterPointage: true })
    .returning({ id: foPointages.id });
  await tx.update(foConnectionLines).set({ centralPointageId: pointage.id }).where(eq(foConnectionLines.id, ligne.id));
  const interrupteur = (cote: "left" | "right", eid: number, secondaire: string) =>
    tx.insert(foSwitches).values({
      code: `${s.code}:switch-${cote}`, name: `Interrupteur ${cote === "left" ? "gauche" : "droit"} — ${s.label}`, switchType: cote === "left" ? "line_left" : "line_right", status: "OFF", engineId: eid, connectionLineId: ligne.id,
      primaryEngineId: s.future ? null : internes.get("fo:switch-controller")!, secondaryEngineId: s.future ? null : internes.get(secondaire)!, manualEnabled: !s.future, automaticEnabled: false, dangerLevel: 3, isFuturePlaceholder: s.future,
    });
  await interrupteur("left", moteurGauche, "fo:security");
  await interrupteur("right", moteurDroit, "fo:audit");
  return ligne.id;
}

/** Règle du PDG : cinq lignes futures vides par ligne réelle ; un groupe sans ligne réelle garde sa réserve de départ. */
async function completerReserves(tx: Db, plateformes: Map<string, number>, internes: Map<string, number>, _acteur: Acteur): Promise<void> {
  const groupes = await tx.select().from(foControlGroups);
  for (const g of groupes) {
    const lignes = await tx.select().from(foConnectionLines).where(eq(foConnectionLines.groupId, g.id));
    const reelles = lignes.filter((l) => !l.isFuturePlaceholder).length;
    const futures = lignes.filter((l) => l.isFuturePlaceholder);
    const cible = reserveCible(reelles, RESERVE_PAR_LIGNE_REELLE, RESERVE_DE_DEPART);
    let n = futures.length ? Math.max(...futures.map((l) => Number(l.code.split(":future:")[1] ?? 0))) : 0;
    let position = lignes.length ? Math.max(...lignes.map((l) => l.position)) : 0;
    for (let k = futures.length; k < cible; k++) {
      n += 1;
      position += 1;
      await creerLigne(tx, plateformes, internes, { code: `line:${g.code}:future:${n}`, groupId: g.id, position, gauche: g.leftPlatformId, droite: g.rightPlatformId, label: `Ligne future ${n} — ${g.name}`, realChannel: null, contractRef: null, future: true });
    }
    const total = await tx.select({ id: foConnectionLines.id, f: foConnectionLines.isFuturePlaceholder }).from(foConnectionLines).where(eq(foConnectionLines.groupId, g.id));
    await tx.update(foControlGroups).set({ lineCountReal: total.filter((l) => !l.f).length, lineCountFuture: total.filter((l) => l.f).length }).where(eq(foControlGroups.id, g.id));
  }
}

async function compterTout(base: Db): Promise<Omit<RapportFondation, "cree">> {
  const n = async (q: Promise<{ c: number }[]>): Promise<number> => Number((await q)[0]?.c ?? 0);
  const lignes = await base.select({ f: foConnectionLines.isFuturePlaceholder }).from(foConnectionLines);
  return {
    plateformes: await n(base.select({ c: count() }).from(foPlatforms)),
    groupes: await n(base.select({ c: count() }).from(foControlGroups)),
    moteurs: await n(base.select({ c: count() }).from(foEngines)),
    paires: await n(base.select({ c: count() }).from(foEnginePairs)),
    boutons: await n(base.select({ c: count() }).from(foButtons)),
    zones: await n(base.select({ c: count() }).from(foSecurityZones)),
    lignesReelles: lignes.filter((l) => !l.f).length,
    lignesFutures: lignes.filter((l) => l.f).length,
  };
}

let fondationPrete: Promise<RapportFondation> | null = null;
/** Appelée au premier accès du PDG : la fondation se pose une fois par processus ; un échec n'est jamais mémorisé. */
export function assurerFondationUneFois(): Promise<RapportFondation> {
  if (!fondationPrete) {
    fondationPrete = assurerFondation().catch((e) => {
      fondationPrete = null;
      throw e;
    });
  }
  return fondationPrete;
}
export const oublierFondationPourTests = () => {
  fondationPrete = null;
};

// ── Miroirs : le registre central et le câble sont LUS, jamais commandés ────────────────────────────────────────────
export async function rafraichirMiroirs(): Promise<void> {
  const registre = await db.select({ name: engineRegistry.name, state: engineRegistry.state, health: engineRegistry.health }).from(engineRegistry);
  const maintenant = new Date();
  for (const r of registre) {
    await db
      .update(foEngines)
      .set({ status: etatDepuisRegistre(r.state, r.health), observedAt: maintenant, updatedAt: maintenant })
      .where(and(eq(foEngines.code, `main:${r.name}`), eq(foEngines.stateSource, "registry")));
  }
  const cables = await lireCables();
  for (const canal of CANAUX_IDS) {
    const passage = deciderPassage(cables, canal);
    await db
      .update(foEngines)
      .set({ status: etatDepuisCable(passage.passe, passage.raison), observedAt: maintenant, updatedAt: maintenant })
      .where(eq(foEngines.code, `main:shop-link:${canal}`));
  }
  await rafraichirPaires();
}

export async function rafraichirPaires(): Promise<void> {
  const graphe = await chargerGraphe();
  const maintenant = new Date();
  for (const p of graphe.paires.values()) {
    const v = validerPaire({ externalEngineId: p.externalEngineId, primaryId: p.internalEnginePrimaryId, secondaryId: p.internalEngineSecondaryId }, graphe.moteursLite);
    const statut = v.valide ? "ok" : "invalid";
    if (p.status !== statut) await db.update(foEnginePairs).set({ status: statut, lastCheckAt: maintenant }).where(eq(foEnginePairs.id, p.id));
  }
}

// ── Graphe en mémoire ───────────────────────────────────────────────────────────────────────────────────────────────
interface Graphe {
  plateformes: Map<number, typeof foPlatforms.$inferSelect>;
  moteurs: Map<number, FoEngine>;
  moteursLite: Map<number, EngineLite>;
  paires: Map<number, FoPair>;
  interrupteurs: FoSwitch[];
  pointages: Map<number, FoPointage>;
  lignes: FoLine[];
}

export async function chargerGraphe(groupId?: number): Promise<Graphe> {
  const plateformes = new Map((await db.select().from(foPlatforms)).map((p) => [p.id, p]));
  const moteurs = new Map((await db.select().from(foEngines)).map((e) => [e.id, e]));
  const moteursLite = new Map<number, EngineLite>();
  for (const e of moteurs.values()) {
    moteursLite.set(e.id, { id: e.id, platformCode: plateformes.get(e.platformId)?.code ?? "?", isRealEngine: e.isRealEngine, isFuturePlaceholder: e.isFuturePlaceholder, status: e.status as EngineStatus, name: e.name });
  }
  const paires = new Map((await db.select().from(foEnginePairs)).map((p) => [p.externalEngineId, p]));
  const lignes = await db.select().from(foConnectionLines).where(groupId ? eq(foConnectionLines.groupId, groupId) : undefined).orderBy(foConnectionLines.groupId, foConnectionLines.position);
  const ids = lignes.map((l) => l.id);
  const interrupteurs = ids.length ? await db.select().from(foSwitches).where(inArray(foSwitches.connectionLineId, ids)) : [];
  const pointages = new Map((ids.length ? await db.select().from(foPointages).where(inArray(foPointages.connectionLineId, ids)) : []).map((p) => [p.connectionLineId, p]));
  return { plateformes, moteurs, moteursLite, paires, interrupteurs, pointages, lignes };
}

const lite = (g: Graphe, id: number | null): EngineLite | undefined => (id === null ? undefined : g.moteursLite.get(id));
const pairesLite = (g: Graphe) => new Map([...g.paires.values()].map((p) => [p.externalEngineId, { externalEngineId: p.externalEngineId, primaryId: p.internalEnginePrimaryId, secondaryId: p.internalEngineSecondaryId }]));

export function validerLigneDuGraphe(g: Graphe, l: FoLine): { valide: boolean; raisons: string[] } {
  const sw = (cote: "line_left" | "line_right") => g.interrupteurs.find((s) => s.connectionLineId === l.id && s.switchType === cote);
  const asSwitch = (s?: FoSwitch) => (s ? { status: s.status as "ON" | "OFF" | "locked" | "error", isFuturePlaceholder: s.isFuturePlaceholder, primaryEngineId: s.primaryEngineId, secondaryEngineId: s.secondaryEngineId } : undefined);
  const p = g.pointages.get(l.id);
  return validerLigne(
    {
      isFuture: l.isFuturePlaceholder,
      gauche: { reel: lite(g, l.leftRealEngineId), intermediaire: lite(g, l.leftIntermediaryEngineId), interrupteur: asSwitch(sw("line_left")) },
      droite: { reel: lite(g, l.rightRealEngineId), intermediaire: lite(g, l.rightIntermediaryEngineId), interrupteur: asSwitch(sw("line_right")) },
      pointage: p ? { status: p.status as "connected" | "separated" | "locked" | "error" } : undefined,
    },
    g.moteursLite,
    pairesLite(g),
  );
}

// ── Lecture : lignes, groupes, moteurs, salles, accueil ─────────────────────────────────────────────────────────────
export interface VueLigne {
  id: number;
  code: string;
  groupId: number;
  position: number;
  label: string;
  status: string;
  currentStatus: string;
  testStatus: string;
  estFuture: boolean;
  etatReel: EtatReel;
  canalReel: string | null;
  contrat: string | null;
  valide: boolean;
  raisons: string[];
  maillons: { cle: string; titre: string; moteur: { id: number; nom: string; statut: string } | null }[];
  interrupteurs: { id: number; cote: "gauche" | "droite"; statut: string; manuel: boolean; moteurs: number }[];
  pointage: { id: number; statut: string; couleur: string; dernierContact: Date | null; derniereCoupure: Date | null } | null;
}

export async function lignesVue(groupId?: number): Promise<VueLigne[]> {
  const g = await chargerGraphe(groupId);
  const cables = await lireCables();
  const m = (id: number | null) => (id && g.moteurs.get(id) ? { id, nom: g.moteurs.get(id)!.name, statut: g.moteurs.get(id)!.status } : null);
  return g.lignes.map((l) => {
    const v = validerLigneDuGraphe(g, l);
    const passage = l.realChannel && (CANAUX_IDS as readonly string[]).includes(l.realChannel) ? deciderPassage(cables, l.realChannel as (typeof CANAUX_IDS)[number]) : { passe: false, raison: undefined };
    const p = g.pointages.get(l.id);
    const sw = (c: "line_left" | "line_right") => g.interrupteurs.find((s) => s.connectionLineId === l.id && s.switchType === c)!;
    const swv = (c: "line_left" | "line_right", cote: "gauche" | "droite") => {
      const s = sw(c);
      return { id: s.id, cote, statut: s.status, manuel: s.manualEnabled, moteurs: [s.primaryEngineId, s.secondaryEngineId].filter((x) => x !== null).length };
    };
    return {
      id: l.id, code: l.code, groupId: l.groupId, position: l.position, label: l.label, status: l.status, currentStatus: l.currentStatus, testStatus: l.testStatus, estFuture: l.isFuturePlaceholder,
      etatReel: etatReelDepuisCable(l.realChannel, passage.passe, passage.raison), canalReel: l.realChannel, contrat: l.contractRef, valide: v.valide, raisons: v.raisons,
      maillons: [
        { cle: "gauche-reel", titre: "Moteur réel gauche", moteur: m(l.leftRealEngineId) },
        { cle: "gauche-inter", titre: "Moteur intermédiaire gauche", moteur: m(l.leftIntermediaryEngineId) },
        { cle: "droite-inter", titre: "Moteur intermédiaire droit", moteur: m(l.rightIntermediaryEngineId) },
        { cle: "droite-reel", titre: "Moteur réel droit", moteur: m(l.rightRealEngineId) },
      ],
      interrupteurs: [swv("line_left", "gauche"), swv("line_right", "droite")],
      pointage: p ? { id: p.id, statut: p.status, couleur: p.colorState, dernierContact: p.lastContactAt, derniereCoupure: p.lastSeparationAt } : null,
    };
  });
}

export async function groupesVue() {
  const g = await chargerGraphe();
  const groupes = await db.select().from(foControlGroups).orderBy(foControlGroups.id);
  return groupes.map((x) => {
    const lignes = g.lignes.filter((l) => l.groupId === x.id);
    const reelles = lignes.filter((l) => !l.isFuturePlaceholder);
    return {
      id: x.id, code: x.code, name: x.name, status: x.status, gauche: g.plateformes.get(x.leftPlatformId)?.name ?? "?", droite: g.plateformes.get(x.rightPlatformId)?.name ?? "?",
      lignesReelles: reelles.length, lignesFutures: lignes.length - reelles.length, lignesAllumees: reelles.filter((l) => l.status === "on").length, lignesValides: reelles.filter((l) => validerLigneDuGraphe(g, l).valide).length,
    };
  });
}

export async function moteursListe(filtre: { plateforme?: string; type?: string; statut?: string; q?: string; limite?: number } = {}) {
  const g = await chargerGraphe();
  const q = (filtre.q ?? "").trim().toLowerCase();
  const lignes = [...g.moteurs.values()]
    .filter((e) => !filtre.plateforme || g.plateformes.get(e.platformId)?.code === filtre.plateforme)
    .filter((e) => !filtre.type || e.engineType === filtre.type)
    .filter((e) => !filtre.statut || e.status === filtre.statut)
    .filter((e) => !q || e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q))
    .sort((a, b) => a.code.localeCompare(b.code));
  return lignes.slice(0, Math.min(1000, filtre.limite ?? 500)).map((e) => ({
    id: e.id, code: e.code, name: e.name, type: e.engineType, status: e.status, plateforme: g.plateformes.get(e.platformId)?.name ?? "?", plateformeCode: g.plateformes.get(e.platformId)?.code ?? "?",
    estIntermediaire: e.isIntermediary, estReel: e.isRealEngine, estFutur: e.isFuturePlaceholder, source: e.stateSource, observeLe: e.observedAt,
    externe: estExterne(g.moteursLite.get(e.id)!), paire: g.paires.get(e.id) ? g.paires.get(e.id)!.status : null,
  }));
}

export async function moteurDetail(id: number) {
  const g = await chargerGraphe();
  const e = g.moteurs.get(id);
  if (!e) return null;
  const nom = (x: number | null) => (x && g.moteurs.get(x) ? { id: x, nom: g.moteurs.get(x)!.name, statut: g.moteurs.get(x)!.status } : null);
  const paire = g.paires.get(id);
  const controles = [...g.paires.values()].filter((p) => p.internalEnginePrimaryId === id || p.internalEngineSecondaryId === id).map((p) => nom(p.externalEngineId)!);
  const lignes = g.lignes.filter((l) => [l.engineId, l.leftRealEngineId, l.leftIntermediaryEngineId, l.rightIntermediaryEngineId, l.rightRealEngineId].includes(id)).map((l) => ({ id: l.id, code: l.code, label: l.label, status: l.status }));
  const boutons = await db.select({ id: foButtons.id, name: foButtons.name }).from(foButtons).where(sql`${foButtons.engineId} = ${id} OR ${foButtons.primaryEngineId} = ${id} OR ${foButtons.secondaryEngineId} = ${id}`);
  const interrupteurs = g.interrupteurs.filter((s) => [s.engineId, s.primaryEngineId, s.secondaryEngineId].includes(id)).map((s) => ({ id: s.id, name: s.name, status: s.status }));
  const memoire = await db.select().from(foMemoryBlocks).where(and(eq(foMemoryBlocks.ownerType, "engine"), eq(foMemoryBlocks.ownerId, id))).orderBy(desc(foMemoryBlocks.id)).limit(20);
  const journal = await db.select().from(foAuditLogs).where(and(eq(foAuditLogs.targetType, "engine"), eq(foAuditLogs.targetId, id))).orderBy(desc(foAuditLogs.id)).limit(20);
  const verdict = paire ? validerPaire({ externalEngineId: id, primaryId: paire.internalEnginePrimaryId, secondaryId: paire.internalEngineSecondaryId }, g.moteursLite) : null;
  return {
    moteur: { ...e, plateforme: g.plateformes.get(e.platformId)?.name ?? "?", externe: estExterne(g.moteursLite.get(id)!) },
    paire: paire ? { primaire: nom(paire.internalEnginePrimaryId), secondaire: nom(paire.internalEngineSecondaryId), statut: paire.status, valide: verdict?.valide ?? false, raison: verdict?.raison ?? null, controleMode: paire.controlMode } : null,
    controle: controles, lignes, boutons, interrupteurs, memoire, journal,
  };
}

export const sallesListe = () => db.select().from(foSecurityZones).orderBy(foSecurityZones.id);
export const boutonsListe = () => db.select().from(foButtons).orderBy(foButtons.id);

export async function accueil() {
  await rafraichirMiroirs();
  const g = await chargerGraphe();
  const reelles = g.lignes.filter((l) => !l.isFuturePlaceholder);
  const externes = [...g.moteurs.values()].filter((e) => !e.isFuturePlaceholder && estExterne(g.moteursLite.get(e.id)!));
  const requises = externes.length;
  const valides = externes.filter((e) => g.paires.get(e.id) && g.paires.get(e.id)!.status === "ok").length;
  const stat = (s: string) => [...g.moteurs.values()].filter((e) => !e.isFuturePlaceholder && e.status === s).length;
  const observes = [...g.moteurs.values()].filter((e) => !e.isFuturePlaceholder && e.stateSource !== "inventory");
  const cables = await lireCables();
  const connectes = CANAUX_IDS.filter((c) => deciderPassage(cables, c).passe).length;
  const hier = sql`now() - interval '24 hours'`;
  const [{ refus }] = await db.select({ refus: count() }).from(foAuditLogs).where(and(eq(foAuditLogs.result, "refused"), gt(foAuditLogs.createdAt, hier)));
  const [{ ouvertes }] = await db.select({ ouvertes: count() }).from(foRepairWorkshop).where(isNull(foRepairWorkshop.resolvedAt));
  const [{ resolues }] = await db.select({ resolues: count() }).from(foRepairWorkshop).where(sql`${foRepairWorkshop.resolvedAt} IS NOT NULL`);
  const [{ blocs }] = await db.select({ blocs: count() }).from(foMemoryBlocks);
  const comptes: Comptes = {
    lignesReelles: reelles.length, lignesAllumees: reelles.filter((l) => l.status === "on").length, lignesValides: reelles.filter((l) => validerLigneDuGraphe(g, l).valide).length,
    pairesRequises: requises, pairesValides: valides,
    moteurs: { total: [...g.moteurs.values()].filter((e) => !e.isFuturePlaceholder).length, observes: observes.length, actifs: stat("active"), inactifs: stat("inactive"), erreur: stat("error"), verrouilles: stat("locked"), maintenance: stat("maintenance") },
    canaux: { declares: CANAUX_IDS.length, connectes }, alertes: { reparationsOuvertes: Number(ouvertes), tentativesRefusees24h: Number(refus) }, memoire: Number(blocs), reparation: { ouvertes: Number(ouvertes), resolues: Number(resolues) },
  };
  const futures = g.lignes.filter((l) => l.isFuturePlaceholder).length;
  return {
    mode: MODE, actionReelle: ACTION_REELLE_ACTIVEE, comptes, jauges: jauges(comptes),
    resume: { plateformes: g.plateformes.size, groupes: (await db.select({ c: count() }).from(foControlGroups))[0].c, moteurs: g.moteurs.size, lignesReelles: reelles.length, lignesFutures: futures, lignesValides: comptes.lignesValides },
  };
}

// ── Actions (simulation) ────────────────────────────────────────────────────────────────────────────────────────────
export interface ResultatAction {
  ok: boolean;
  code?: "CONFIRMATION_REQUISE" | "BOUTON_INCONNU" | "BOUTON_INDISPONIBLE" | "MOTEURS_DE_CONTROLE" | "LIGNE_INCONNUE" | "LIGNE_FUTURE" | "LIGNE_INVALIDE" | "LIGNE_VERROUILLEE" | "ETAT_INCOMPATIBLE" | "REPARATION_INCONNUE" | "NON_REPARABLE";
  detail: string;
  details?: Record<string, unknown>;
}

async function recalculerLigne(tx: Db, lineId: number): Promise<LineStatus> {
  const [l] = await tx.select().from(foConnectionLines).where(eq(foConnectionLines.id, lineId));
  const sws = await tx.select().from(foSwitches).where(eq(foSwitches.connectionLineId, lineId));
  const [p] = await tx.select().from(foPointages).where(eq(foPointages.connectionLineId, lineId));
  const gauche = sws.find((s) => s.switchType === "line_left")!.status as "ON" | "OFF" | "locked" | "error";
  const droite = sws.find((s) => s.switchType === "line_right")!.status as "ON" | "OFF" | "locked" | "error";
  const statut = etatLigne({ isFuture: l.isFuturePlaceholder, gauche, droite, pointage: p.status as "connected" | "separated" | "locked" | "error" });
  await tx.update(foConnectionLines).set({ status: statut, currentStatus: etatCourantLigne(statut), isActive: statut === "on", updatedAt: new Date() }).where(eq(foConnectionLines.id, lineId));
  return statut;
}

async function poserLigne(tx: Db, lineId: number, etat: { gauche: "ON" | "OFF" | "locked"; droite: "ON" | "OFF" | "locked"; pointage: "connected" | "separated" | "locked" }): Promise<LineStatus> {
  const maintenant = new Date();
  for (const [type, valeur] of [["line_left", etat.gauche], ["line_right", etat.droite]] as const) {
    await tx
      .update(foSwitches)
      .set({ status: valeur, ...(valeur === "ON" ? { lastOnAt: maintenant } : valeur === "OFF" ? { lastOffAt: maintenant } : {}) })
      .where(and(eq(foSwitches.connectionLineId, lineId), eq(foSwitches.switchType, type)));
  }
  await tx
    .update(foPointages)
    .set({ status: etat.pointage, ...(etat.pointage === "connected" ? { lastContactAt: maintenant } : { lastSeparationAt: maintenant }) })
    .where(eq(foPointages.connectionLineId, lineId));
  return recalculerLigne(tx, lineId);
}

async function ligneEtGraphe(lineId: number) {
  const g = await chargerGraphe();
  const l = g.lignes.find((x) => x.id === lineId);
  return { g, l };
}

async function refuser(acteur: Acteur, action: string, cible: string, cibleId: number | null, r: ResultatAction): Promise<ResultatAction> {
  await journaliser({ acteur, action, cible, cibleId, resultat: "refused", erreur: `${r.code ?? ""} ${r.detail}`.trim() });
  return r;
}

export async function allumerLigne(lineId: number, acteur: Acteur): Promise<ResultatAction> {
  const { g, l } = await ligneEtGraphe(lineId);
  if (!l) return refuser(acteur, "line_on", "line", lineId, { ok: false, code: "LIGNE_INCONNUE", detail: "Ligne inconnue." });
  if (l.isFuturePlaceholder) return refuser(acteur, "line_on", "line", lineId, { ok: false, code: "LIGNE_FUTURE", detail: "Ligne future : vide, désactivée, non connectée." });
  if (l.status === "locked") return refuser(acteur, "line_on", "line", lineId, { ok: false, code: "LIGNE_VERROUILLEE", detail: "Ligne verrouillée : déverrouillez-la d'abord." });
  const v = validerLigneDuGraphe(g, l);
  if (!v.valide) return refuser(acteur, "line_on", "line", lineId, { ok: false, code: "LIGNE_INVALIDE", detail: `Ligne non valide : ${v.raisons[0]}`, details: { raisons: v.raisons } });
  const avant = { status: l.status };
  const statut = await db.transaction(async (t) => poserLigne(t as unknown as Db, lineId, { gauche: "ON", droite: "ON", pointage: "connected" }));
  await journaliser({ acteur, action: "line_on", cible: "line", cibleId: lineId, avant, apres: { status: statut, mode: MODE }, resultat: "ok" });
  await ecrireMemoire({ proprietaire: "line", proprietaireId: lineId, type: "activation", resume: `Ligne « ${l.label} » allumée en simulation (aucune connexion réelle).`, importance: 2 });
  return { ok: true, detail: `Ligne allumée en simulation : ${l.label}. Aucune connexion réelle n'a été modifiée.` };
}

export async function eteindreLigne(lineId: number, acteur: Acteur): Promise<ResultatAction> {
  const { l } = await ligneEtGraphe(lineId);
  if (!l) return refuser(acteur, "line_off", "line", lineId, { ok: false, code: "LIGNE_INCONNUE", detail: "Ligne inconnue." });
  if (l.isFuturePlaceholder) return refuser(acteur, "line_off", "line", lineId, { ok: false, code: "LIGNE_FUTURE", detail: "Ligne future : déjà éteinte et vide." });
  if (l.status === "locked") return refuser(acteur, "line_off", "line", lineId, { ok: false, code: "LIGNE_VERROUILLEE", detail: "Ligne verrouillée : déverrouillez-la d'abord." });
  const statut = await db.transaction(async (t) => poserLigne(t as unknown as Db, lineId, { gauche: "OFF", droite: "OFF", pointage: "separated" }));
  await journaliser({ acteur, action: "line_off", cible: "line", cibleId: lineId, avant: { status: l.status }, apres: { status: statut, mode: MODE }, resultat: "ok" });
  return { ok: true, detail: `Ligne éteinte : ${l.label}.` };
}

export async function verrouillerLigne(lineId: number, acteur: Acteur): Promise<ResultatAction> {
  const { l } = await ligneEtGraphe(lineId);
  if (!l) return refuser(acteur, "lock", "line", lineId, { ok: false, code: "LIGNE_INCONNUE", detail: "Ligne inconnue." });
  if (l.isFuturePlaceholder) return refuser(acteur, "lock", "line", lineId, { ok: false, code: "LIGNE_FUTURE", detail: "Ligne future : rien à verrouiller." });
  const statut = await db.transaction(async (t) => poserLigne(t as unknown as Db, lineId, { gauche: "locked", droite: "locked", pointage: "locked" }));
  await journaliser({ acteur, action: "lock", cible: "line", cibleId: lineId, avant: { status: l.status }, apres: { status: statut }, resultat: "ok" });
  await ecrireMemoire({ proprietaire: "security", proprietaireId: lineId, type: "verrou", resume: `Ligne « ${l.label} » verrouillée.`, importance: 3, securite: 3 });
  return { ok: true, detail: `Ligne verrouillée : ${l.label}.` };
}

export async function deverrouillerLigne(lineId: number, acteur: Acteur): Promise<ResultatAction> {
  const { l } = await ligneEtGraphe(lineId);
  if (!l) return refuser(acteur, "unlock", "line", lineId, { ok: false, code: "LIGNE_INCONNUE", detail: "Ligne inconnue." });
  if (l.status !== "locked") return refuser(acteur, "unlock", "line", lineId, { ok: false, code: "ETAT_INCOMPATIBLE", detail: "Cette ligne n'est pas verrouillée." });
  const statut = await db.transaction(async (t) => poserLigne(t as unknown as Db, lineId, { gauche: "OFF", droite: "OFF", pointage: "separated" }));
  await journaliser({ acteur, action: "unlock", cible: "line", cibleId: lineId, avant: { status: "locked" }, apres: { status: statut }, resultat: "ok" });
  return { ok: true, detail: `Ligne déverrouillée (éteinte) : ${l.label}.` };
}

export async function basculerPointage(lineId: number, acteur: Acteur): Promise<ResultatAction> {
  const { g, l } = await ligneEtGraphe(lineId);
  if (!l) return refuser(acteur, "pointage_toggle", "line", lineId, { ok: false, code: "LIGNE_INCONNUE", detail: "Ligne inconnue." });
  if (l.isFuturePlaceholder) return refuser(acteur, "pointage_toggle", "line", lineId, { ok: false, code: "LIGNE_FUTURE", detail: "Ligne future : le pointage est vide." });
  const p = g.pointages.get(lineId)!;
  if (p.status === "locked" || p.status === "error") return refuser(acteur, "pointage_toggle", "line", lineId, { ok: false, code: "LIGNE_VERROUILLEE", detail: "Pointage verrouillé ou en erreur." });
  if (p.status === "connected") {
    const statut = await db.transaction(async (t) => {
      const tx = t as unknown as Db;
      await tx.update(foPointages).set({ status: "separated", lastSeparationAt: new Date() }).where(eq(foPointages.id, p.id));
      return recalculerLigne(tx, lineId);
    });
    await journaliser({ acteur, action: "pointage_toggle", cible: "line", cibleId: lineId, avant: { pointage: "connected" }, apres: { pointage: "separated", ligne: statut }, resultat: "ok" });
    return { ok: true, detail: "Grande coupure : pointage séparé." };
  }
  const v = validerLigneDuGraphe(g, l);
  if (!v.valide) return refuser(acteur, "pointage_toggle", "line", lineId, { ok: false, code: "LIGNE_INVALIDE", detail: `Ligne non valide : ${v.raisons[0]}`, details: { raisons: v.raisons } });
  const statut = await db.transaction(async (t) => {
    const tx = t as unknown as Db;
    await tx.update(foPointages).set({ status: "connected", lastContactAt: new Date() }).where(eq(foPointages.id, p.id));
    return recalculerLigne(tx, lineId);
  });
  await journaliser({ acteur, action: "pointage_toggle", cible: "line", cibleId: lineId, avant: { pointage: "separated" }, apres: { pointage: "connected", ligne: statut }, resultat: "ok" });
  return { ok: true, detail: statut === "on" ? "Pointage connecté : ligne allumée en simulation." : "Pointage connecté (la ligne reste éteinte tant que ses interrupteurs ne sont pas sur ON)." };
}

export async function actionnerInterrupteur(switchId: number, etat: "ON" | "OFF", acteur: Acteur): Promise<ResultatAction> {
  const [s] = await db.select().from(foSwitches).where(eq(foSwitches.id, switchId));
  if (!s) return refuser(acteur, "switch", "switch", switchId, { ok: false, code: "LIGNE_INCONNUE", detail: "Interrupteur inconnu." });
  const { g, l } = await ligneEtGraphe(s.connectionLineId);
  if (!l || l.isFuturePlaceholder || s.isFuturePlaceholder) return refuser(acteur, "switch", "switch", switchId, { ok: false, code: "LIGNE_FUTURE", detail: "Interrupteur d'une ligne future : désactivé." });
  if (!s.manualEnabled || s.status === "locked" || s.status === "error") return refuser(acteur, "switch", "switch", switchId, { ok: false, code: "LIGNE_VERROUILLEE", detail: "Interrupteur verrouillé, en erreur ou non manuel." });
  if (!moteurInterneUtilisable(lite(g, s.primaryEngineId)) || !moteurInterneUtilisable(lite(g, s.secondaryEngineId))) return refuser(acteur, "switch", "switch", switchId, { ok: false, code: "MOTEURS_DE_CONTROLE", detail: "Les deux moteurs de cet interrupteur ne sont pas tous deux utilisables." });
  if (etat === "ON") {
    const v = validerLigneDuGraphe(g, l);
    if (!v.valide) return refuser(acteur, "switch", "switch", switchId, { ok: false, code: "LIGNE_INVALIDE", detail: `Ligne non valide : ${v.raisons[0]}`, details: { raisons: v.raisons } });
  }
  const statut = await db.transaction(async (t) => {
    const tx = t as unknown as Db;
    await tx.update(foSwitches).set({ status: etat, ...(etat === "ON" ? { lastOnAt: new Date() } : { lastOffAt: new Date() }) }).where(eq(foSwitches.id, switchId));
    return recalculerLigne(tx, s.connectionLineId);
  });
  await journaliser({ acteur, action: etat === "ON" ? "switch_on" : "switch_off", cible: "switch", cibleId: switchId, avant: { status: s.status }, apres: { status: etat, ligne: statut }, resultat: "ok" });
  return { ok: true, detail: `Interrupteur ${etat}.` };
}

export async function toutAllumer(acteur: Acteur): Promise<ResultatAction> {
  const g = await chargerGraphe();
  const allumees: string[] = [];
  const ignorees: { ligne: string; raisons: string[] }[] = [];
  for (const l of g.lignes.filter((x) => !x.isFuturePlaceholder)) {
    if (l.status === "locked") {
      ignorees.push({ ligne: l.label, raisons: ["Ligne verrouillée."] });
      continue;
    }
    const v = validerLigneDuGraphe(g, l);
    if (!v.valide) {
      ignorees.push({ ligne: l.label, raisons: v.raisons });
      continue;
    }
    const r = await allumerLigne(l.id, acteur);
    if (r.ok) allumees.push(l.label);
  }
  await journaliser({ acteur, action: "all_on", cible: "system", apres: { allumees: allumees.length, ignorees: ignorees.length, mode: MODE }, resultat: "ok" });
  return { ok: true, detail: `${allumees.length} ligne(s) allumée(s) en simulation, ${ignorees.length} ignorée(s) (non valides ou verrouillées). Aucune connexion réelle n'a été modifiée.`, details: { allumees, ignorees } };
}

export async function toutEteindre(acteur: Acteur): Promise<ResultatAction> {
  const g = await chargerGraphe();
  const eteintes: string[] = [];
  for (const l of g.lignes.filter((x) => !x.isFuturePlaceholder && x.status !== "locked")) {
    const r = await eteindreLigne(l.id, acteur);
    if (r.ok) eteintes.push(l.label);
  }
  await journaliser({ acteur, action: "all_off", cible: "system", apres: { eteintes: eteintes.length }, resultat: "ok" });
  return { ok: true, detail: `${eteintes.length} ligne(s) éteinte(s).`, details: { eteintes } };
}

/** « Tester courant » : vérifie la ligne et lit l'état RÉEL du canal (lecture seule), sans rien commander. */
export async function testerLigne(lineId: number, acteur: Acteur): Promise<ResultatAction> {
  const { l } = await ligneEtGraphe(lineId);
  if (!l) return refuser(acteur, "test_current", "line", lineId, { ok: false, code: "LIGNE_INCONNUE", detail: "Ligne inconnue." });
  if (l.isFuturePlaceholder) return refuser(acteur, "test_current", "line", lineId, { ok: false, code: "LIGNE_FUTURE", detail: "Ligne future : rien à tester." });
  await rafraichirMiroirs();
  const g2 = await chargerGraphe();
  const v = validerLigneDuGraphe(g2, l);
  const cables = await lireCables();
  const passage = l.realChannel ? deciderPassage(cables, l.realChannel as (typeof CANAUX_IDS)[number]) : { passe: false, raison: undefined };
  const reel = etatReelDepuisCable(l.realChannel, passage.passe, passage.raison);
  const statut = v.valide ? "passed" : "failed";
  await db.update(foConnectionLines).set({ testStatus: statut, lastTestAt: new Date() }).where(eq(foConnectionLines.id, lineId));
  await journaliser({ acteur, action: "test_current", cible: "line", cibleId: lineId, apres: { test: statut, etatReel: reel, raisons: v.raisons.slice(0, 5) }, resultat: "ok" });
  await ecrireMemoire({ proprietaire: "line", proprietaireId: lineId, type: "test", resume: `Test de « ${l.label} » : ${statut === "passed" ? "réussi" : "échoué"} ; état réel du canal : ${reel}.`, importance: statut === "passed" ? 2 : 3 });
  return { ok: true, detail: statut === "passed" ? `Test réussi. État réel du canal : ${reel}.` : `Test échoué : ${v.raisons[0]} État réel du canal : ${reel}.`, details: { test: statut, etatReel: reel, raisons: v.raisons } };
}

// ── Diagnostic, atelier de réparation, intégrité ────────────────────────────────────────────────────────────────────
export interface Anomalie {
  cibleType: "engine" | "group" | "line";
  cibleId: number;
  type: "missing_pair" | "invalid_pair" | "missing_reserve" | "engine_error" | "line_invalid";
  proposition: string;
  reparableAuto: boolean;
  charge: Record<string, unknown>;
}

export async function detecterAnomalies(): Promise<Anomalie[]> {
  await rafraichirMiroirs();
  const g = await chargerGraphe();
  const anomalies: Anomalie[] = [];
  for (const e of g.moteurs.values()) {
    const l = g.moteursLite.get(e.id)!;
    if (e.isFuturePlaceholder || !estExterne(l)) continue;
    const p = g.paires.get(e.id);
    if (!p) anomalies.push({ cibleType: "engine", cibleId: e.id, type: "missing_pair", proposition: `Créer la paire de contrôle par défaut (sécurité + audit) pour « ${e.name} ».`, reparableAuto: true, charge: {} });
    else if (p.status !== "ok") anomalies.push({ cibleType: "engine", cibleId: e.id, type: "invalid_pair", proposition: `Remplacer les moteurs de contrôle de « ${e.name} » par la paire de secours (sécurité + audit).`, reparableAuto: true, charge: { avantPrimaire: p.internalEnginePrimaryId, avantSecondaire: p.internalEngineSecondaryId } });
  }
  for (const grp of await db.select().from(foControlGroups)) {
    const lignes = g.lignes.filter((l) => l.groupId === grp.id);
    const reelles = lignes.filter((l) => !l.isFuturePlaceholder).length;
    const futures = lignes.filter((l) => l.isFuturePlaceholder).length;
    const cible = reserveCible(reelles, RESERVE_PAR_LIGNE_REELLE, RESERVE_DE_DEPART);
    if (futures < cible) anomalies.push({ cibleType: "group", cibleId: grp.id, type: "missing_reserve", proposition: `Recréer ${cible - futures} ligne(s) future(s) vide(s) pour retrouver la réserve (${cible}).`, reparableAuto: true, charge: { manque: cible - futures } });
  }
  for (const e of g.moteurs.values()) {
    if (e.status === "error" && !e.isFuturePlaceholder && e.stateSource !== "inventory") anomalies.push({ cibleType: "engine", cibleId: e.id, type: "engine_error", proposition: `Le moteur « ${e.name} » est en erreur : intervention humaine requise (diagnostic du registre central).`, reparableAuto: false, charge: {} });
  }
  for (const l of g.lignes.filter((x) => !x.isFuturePlaceholder)) {
    const v = validerLigneDuGraphe(g, l);
    if (!v.valide) anomalies.push({ cibleType: "line", cibleId: l.id, type: "line_invalid", proposition: `Ligne « ${l.label} » non valide : ${v.raisons[0]}`, reparableAuto: false, charge: { raisons: v.raisons.slice(0, 6) } });
  }
  return anomalies;
}

export async function lancerDiagnostic(acteur: Acteur): Promise<ResultatAction> {
  const anomalies = await detecterAnomalies();
  let nouvelles = 0;
  for (const a of anomalies) {
    const r = await db
      .insert(foRepairWorkshop)
      .values({ targetType: a.cibleType, targetId: a.cibleId, issueType: a.type, diagnosticStatus: "confirmed", repairStatus: "proposed", proposedFix: tronquer(a.proposition, 400), fixPayload: { reparableAuto: a.reparableAuto, ...a.charge } })
      .onConflictDoNothing()
      .returning({ id: foRepairWorkshop.id });
    nouvelles += r.length;
  }
  // Ce qui n'est plus constaté se referme sans réparation.
  const ouvertes = await db.select().from(foRepairWorkshop).where(isNull(foRepairWorkshop.resolvedAt));
  const cles = new Set(anomalies.map((a) => `${a.cibleType}:${a.cibleId}:${a.type}`));
  let refermees = 0;
  for (const o of ouvertes) {
    if (!cles.has(`${o.targetType}:${o.targetId}:${o.issueType}`)) {
      await db.update(foRepairWorkshop).set({ repairStatus: "not_needed", resolvedAt: new Date() }).where(eq(foRepairWorkshop.id, o.id));
      refermees += 1;
    }
  }
  await journaliser({ acteur, action: "diagnostic", cible: "system", apres: { anomalies: anomalies.length, nouvelles, refermees }, resultat: "ok" });
  await ecrireMemoire({ proprietaire: "repair", type: "diagnostic", resume: `Diagnostic : ${anomalies.length} anomalie(s) constatée(s), ${nouvelles} nouvelle(s), ${refermees} refermée(s).`, importance: anomalies.length ? 3 : 1 });
  return { ok: true, detail: `${anomalies.length} anomalie(s) constatée(s) : ${nouvelles} nouvelle(s) dans l'atelier, ${refermees} refermée(s).`, details: { anomalies: anomalies.length, nouvelles, refermees } };
}

export const atelierListe = (limite = 100) => db.select().from(foRepairWorkshop).orderBy(desc(foRepairWorkshop.id)).limit(Math.min(500, limite));

export async function reparer(repairId: number, acteur: Acteur): Promise<ResultatAction> {
  const [r] = await db.select().from(foRepairWorkshop).where(eq(foRepairWorkshop.id, repairId));
  if (!r) return refuser(acteur, "repair", "repair", repairId, { ok: false, code: "REPARATION_INCONNUE", detail: "Réparation inconnue." });
  if (r.resolvedAt) return refuser(acteur, "repair", "repair", repairId, { ok: false, code: "ETAT_INCOMPATIBLE", detail: "Cette réparation est déjà traitée." });
  const charge = r.fixPayload as Record<string, unknown>;
  if (charge.reparableAuto !== true) {
    await db.update(foRepairWorkshop).set({ repairStatus: "refused" }).where(eq(foRepairWorkshop.id, repairId));
    return refuser(acteur, "repair", "repair", repairId, { ok: false, code: "NON_REPARABLE", detail: "Cette anomalie ne se répare pas automatiquement : elle demande une intervention humaine." });
  }
  const plateformes = new Map((await db.select().from(foPlatforms)).map((p) => [p.code, p.id]));
  const internesRows = await db.select().from(foEngines).where(inArray(foEngines.code, MOTEURS_INTERNES.map((m) => m.code)));
  const internes = new Map(internesRows.map((e) => [e.code, e.id]));
  let appliquee = "";
  let annulation: Record<string, unknown> = {};
  await db.transaction(async (t) => {
    const tx = t as unknown as Db;
    if (r.issueType === "missing_pair" && r.targetId) {
      const [pr] = await tx.insert(foEnginePairs).values({ externalEngineId: r.targetId, internalEnginePrimaryId: internes.get(CODE_PAR_DEFAUT.primaire)!, internalEngineSecondaryId: internes.get(CODE_PAR_DEFAUT.secondaire)!, controlMode: "mixte", status: "ok", lastCheckAt: new Date() }).onConflictDoNothing().returning({ id: foEnginePairs.id });
      appliquee = "Paire de contrôle par défaut créée (sécurité + audit).";
      annulation = { creeePaireId: pr?.id ?? null };
    } else if (r.issueType === "invalid_pair" && r.targetId) {
      const [avant] = await tx.select().from(foEnginePairs).where(eq(foEnginePairs.externalEngineId, r.targetId));
      await tx.update(foEnginePairs).set({ internalEnginePrimaryId: internes.get(CODE_PAR_DEFAUT.primaire)!, internalEngineSecondaryId: internes.get(CODE_PAR_DEFAUT.secondaire)!, status: "ok", lastCheckAt: new Date() }).where(eq(foEnginePairs.externalEngineId, r.targetId));
      appliquee = "Moteurs de contrôle remplacés par la paire de secours (sécurité + audit).";
      annulation = { restaurer: { externalEngineId: r.targetId, primaire: avant.internalEnginePrimaryId, secondaire: avant.internalEnginePrimaryId === avant.internalEngineSecondaryId ? avant.internalEngineSecondaryId : avant.internalEngineSecondaryId } };
    } else if (r.issueType === "missing_reserve" && r.targetId) {
      const avant = await tx.select({ id: foConnectionLines.id }).from(foConnectionLines).where(eq(foConnectionLines.groupId, r.targetId));
      await completerReserves(tx, plateformes, internes, acteur);
      const apres = await tx.select({ id: foConnectionLines.id }).from(foConnectionLines).where(eq(foConnectionLines.groupId, r.targetId));
      const avantIds = new Set(avant.map((x) => x.id));
      annulation = { creesLignes: apres.map((x) => x.id).filter((id) => !avantIds.has(id)) };
      appliquee = `${(annulation.creesLignes as number[]).length} ligne(s) future(s) vide(s) recréée(s).`;
    } else {
      throw new Error("Type d'anomalie sans réparation automatique.");
    }
    await tx.update(foRepairWorkshop).set({ repairStatus: "applied", appliedFix: appliquee, rollbackAvailable: true, fixPayload: { ...charge, annulation }, resolvedAt: new Date() }).where(eq(foRepairWorkshop.id, repairId));
  });
  await rafraichirPaires();
  await journaliser({ acteur, action: "repair", cible: "repair", cibleId: repairId, avant: { issue: r.issueType }, apres: { applied: appliquee }, resultat: "ok" });
  await ecrireMemoire({ proprietaire: "repair", proprietaireId: repairId, type: "reparation", resume: appliquee, importance: 3 });
  return { ok: true, detail: appliquee };
}

/** Retour arrière d'une réparation appliquée : remet exactement l'état d'avant. */
export async function annulerReparation(repairId: number, acteur: Acteur): Promise<ResultatAction> {
  const [r] = await db.select().from(foRepairWorkshop).where(eq(foRepairWorkshop.id, repairId));
  if (!r || r.repairStatus !== "applied" || !r.rollbackAvailable) return refuser(acteur, "rollback", "repair", repairId, { ok: false, code: "ETAT_INCOMPATIBLE", detail: "Rien à annuler pour cette réparation." });
  const annulation = ((r.fixPayload as Record<string, unknown>).annulation ?? {}) as Record<string, any>;
  await db.transaction(async (t) => {
    const tx = t as unknown as Db;
    if (annulation.creeePaireId) await tx.delete(foEnginePairs).where(eq(foEnginePairs.id, annulation.creeePaireId));
    if (annulation.restaurer) {
      await tx.update(foEnginePairs).set({ internalEnginePrimaryId: annulation.restaurer.primaire, internalEngineSecondaryId: annulation.restaurer.secondaire, status: "pending" }).where(eq(foEnginePairs.externalEngineId, annulation.restaurer.externalEngineId));
    }
    if (Array.isArray(annulation.creesLignes) && annulation.creesLignes.length) {
      const ids: number[] = annulation.creesLignes;
      const lignes = await tx.select().from(foConnectionLines).where(inArray(foConnectionLines.id, ids));
      const vides = lignes.filter((l) => l.isFuturePlaceholder);
      const engineIds = new Set<number>();
      for (const l of vides) {
        await tx.update(foConnectionLines).set({ centralPointageId: null }).where(eq(foConnectionLines.id, l.id));
        const sws = await tx.select().from(foSwitches).where(eq(foSwitches.connectionLineId, l.id));
        const [p] = await tx.select().from(foPointages).where(eq(foPointages.connectionLineId, l.id));
        for (const s of sws) if (s.engineId) engineIds.add(s.engineId);
        if (p?.engineId) engineIds.add(p.engineId);
        if (l.engineId) engineIds.add(l.engineId);
        await tx.delete(foSwitches).where(eq(foSwitches.connectionLineId, l.id));
        await tx.delete(foPointages).where(eq(foPointages.connectionLineId, l.id));
        await tx.delete(foConnectionLines).where(eq(foConnectionLines.id, l.id));
      }
      if (engineIds.size) await tx.delete(foEngines).where(inArray(foEngines.id, [...engineIds]));
      const groupes = await tx.select().from(foControlGroups);
      for (const g of groupes) {
        const total = await tx.select({ f: foConnectionLines.isFuturePlaceholder }).from(foConnectionLines).where(eq(foConnectionLines.groupId, g.id));
        await tx.update(foControlGroups).set({ lineCountReal: total.filter((x) => !x.f).length, lineCountFuture: total.filter((x) => x.f).length }).where(eq(foControlGroups.id, g.id));
      }
    }
    await tx.update(foRepairWorkshop).set({ repairStatus: "rolled_back", rollbackAvailable: false }).where(eq(foRepairWorkshop.id, repairId));
  });
  await journaliser({ acteur, action: "rollback", cible: "repair", cibleId: repairId, avant: { applied: r.appliedFix }, apres: { repair: "rolled_back" }, resultat: "ok" });
  return { ok: true, detail: "Réparation annulée : l'état d'avant est rétabli." };
}

/** Vérifie les règles d'or sur l'ensemble des données ; une liste vide veut dire « aucune violation ». */
export async function verifierIntegrite(): Promise<string[]> {
  const g = await chargerGraphe();
  const fautes: string[] = [];
  for (const b of await db.select().from(foButtons)) {
    if (b.primaryEngineId === b.secondaryEngineId) fautes.push(`Bouton ${b.code} : un seul moteur.`);
    if (b.dangerLevel >= 3 && !b.requiresConfirmation) fautes.push(`Bouton ${b.code} : critique sans confirmation.`);
  }
  for (const s of g.interrupteurs) {
    if (!s.isFuturePlaceholder && (!s.primaryEngineId || !s.secondaryEngineId || s.primaryEngineId === s.secondaryEngineId)) fautes.push(`Interrupteur ${s.code} : moins de deux moteurs.`);
    if (s.isFuturePlaceholder && (s.status !== "OFF" || s.manualEnabled || s.automaticEnabled)) fautes.push(`Interrupteur ${s.code} : ligne future non éteinte.`);
  }
  for (const e of g.moteurs.values()) {
    const l = g.moteursLite.get(e.id)!;
    if (estExterne(l) && !e.isFuturePlaceholder && !g.paires.get(e.id)) fautes.push(`Moteur externe ${e.code} : aucune paire de contrôle.`);
  }
  for (const l of g.lignes) {
    if (l.isFuturePlaceholder && (l.isActive || l.status !== "future" || l.leftRealEngineId || l.rightRealEngineId)) fautes.push(`Ligne ${l.code} : une ligne future doit rester vide et éteinte.`);
    if (l.status === "on" && !validerLigneDuGraphe(g, l).valide) fautes.push(`Ligne ${l.code} : allumée alors qu'elle n'est pas valide.`);
  }
  return fautes;
}

// ── Bouton : le seul point d'entrée des actions du centre ───────────────────────────────────────────────────────────
export interface ParamsBouton {
  boutonId: number;
  ligneId?: number;
  reparationId?: number;
  confirme?: boolean;
  acteur: Acteur;
}

export async function appuyerBouton(p: ParamsBouton): Promise<ResultatAction> {
  const [b] = await db.select().from(foButtons).where(eq(foButtons.id, p.boutonId));
  if (!b) return refuser(p.acteur, "button", "button", p.boutonId, { ok: false, code: "BOUTON_INCONNU", detail: "Bouton inconnu." });
  if (b.status !== "active") return refuser(p.acteur, b.buttonType, "button", b.id, { ok: false, code: "BOUTON_INDISPONIBLE", detail: "Bouton verrouillé ou indisponible." });
  const g = await chargerGraphe();
  const [a, c] = [lite(g, b.primaryEngineId), lite(g, b.secondaryEngineId)];
  if (b.primaryEngineId === b.secondaryEngineId || !moteurInterneUtilisable(a) || !moteurInterneUtilisable(c)) {
    return refuser(p.acteur, b.buttonType, "button", b.id, { ok: false, code: "MOTEURS_DE_CONTROLE", detail: "Un bouton exige deux moteurs distincts et utilisables : action refusée." });
  }
  if (b.requiresConfirmation && !p.confirme) return refuser(p.acteur, b.buttonType, "button", b.id, { ok: false, code: "CONFIRMATION_REQUISE", detail: `« ${b.name} » est une action critique : confirmation requise.` });
  const ligne = () => (p.ligneId ? p.ligneId : null);
  const exigerLigne = (): ResultatAction | null => (ligne() ? null : { ok: false, code: "LIGNE_INCONNUE", detail: "Choisissez une ligne." });
  let r: ResultatAction;
  switch (b.buttonType) {
    case "all_on": r = await toutAllumer(p.acteur); break;
    case "all_off": r = await toutEteindre(p.acteur); break;
    case "line_on": r = exigerLigne() ?? (await allumerLigne(p.ligneId!, p.acteur)); break;
    case "line_off": r = exigerLigne() ?? (await eteindreLigne(p.ligneId!, p.acteur)); break;
    case "test_current": r = exigerLigne() ?? (await testerLigne(p.ligneId!, p.acteur)); break;
    case "lock": r = exigerLigne() ?? (await verrouillerLigne(p.ligneId!, p.acteur)); break;
    case "unlock": r = exigerLigne() ?? (await deverrouillerLigne(p.ligneId!, p.acteur)); break;
    case "pointage_toggle": r = exigerLigne() ?? (await basculerPointage(p.ligneId!, p.acteur)); break;
    case "diagnostic": r = await lancerDiagnostic(p.acteur); break;
    case "repair": r = p.reparationId ? await reparer(p.reparationId, p.acteur) : { ok: false, code: "REPARATION_INCONNUE", detail: "Choisissez une réparation." }; break;
    default: r = { ok: false, code: "BOUTON_INCONNU", detail: "Type de bouton non géré." };
  }
  if (!r.ok && r.code === "LIGNE_INCONNUE" && !p.ligneId) await journaliser({ acteur: p.acteur, action: b.buttonType, cible: "button", cibleId: b.id, resultat: "refused", erreur: r.detail });
  await db.update(foButtons).set({ lastPressedAt: new Date() }).where(eq(foButtons.id, b.id));
  return r;
}

export async function journalListe(limite = 100, resultat?: string) {
  return db.select().from(foAuditLogs).where(resultat ? eq(foAuditLogs.result, resultat) : undefined).orderBy(desc(foAuditLogs.id)).limit(Math.min(500, limite));
}
export const memoireListe = (limite = 100) => db.select().from(foMemoryBlocks).orderBy(desc(foMemoryBlocks.id)).limit(Math.min(500, limite));

export async function ecartsPlateformeBoutique() {
  const couverts = new Set(INTERMEDIAIRES_BOUTIQUE.map((i) => i.canalPlateforme).filter(Boolean));
  return {
    canauxPlateformeSansIntermediaireBoutique: CANAUX_IDS.filter((c) => !couverts.has(c)),
    intermediairesBoutiqueSansCanalPlateforme: INTERMEDIAIRES_BOUTIQUE.filter((i) => !i.canalPlateforme).map((i) => i.id),
    moteursNommesParContratAbsentsDuRegistre: INTERMEDIAIRES_BOUTIQUE.filter((i) => !i.dansRegistreBoutique).map((i) => ({ contrat: i.id, moteur: i.moteurBoutique })),
  };
}

export function comptageBoutique() {
  return {
    instantane: SHOP_SNAPSHOT,
    moteursBoutique: SHOP_ENGINES.length,
    intermediairesPrepares: INTERMEDIAIRES_BOUTIQUE.length,
    lignesReellesPrevues: INTERMEDIAIRES_BOUTIQUE.length,
    lignesFuturesPrevues: INTERMEDIAIRES_BOUTIQUE.length * RESERVE_PAR_LIGNE_REELLE,
    totalLignesPrevues: INTERMEDIAIRES_BOUTIQUE.length * (1 + RESERVE_PAR_LIGNE_REELLE),
    detail: INTERMEDIAIRES_BOUTIQUE.map((i) => ({ id: i.id, libelle: i.libelle, etatDeclare: i.etatDeclare, sens: i.sens, preuve: i.preuve, canalPlateforme: i.canalPlateforme })),
  };
}

export type { FoButton };
