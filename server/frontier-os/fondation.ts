/**
 * Centre Cyber-Électrique — FONDATION de la base indépendante : entreprise propriétaire, plateformes (avec les noms exacts et ce qui reste à
 * vérifier), salles, boutons, moteurs internes, moteurs relevés par l'inventaire (avec leurs versions), groupes, lignes réelles à sept éléments
 * et leurs trois coupures, lignes de réserve « À venir » (au moins cinq par ligne réelle), paires commande / vérification, références de secrets,
 * emplacements d'API et d'abonnements, accès, configuration, mémoire. Tout est IDEMPOTENT : relancer ne casse rien et ne remet rien à zéro.
 * Aucun état de coupure n'est jamais modifié ici : une fondation ne branche rien.
 */
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { dbFrontier, type BaseFrontier } from "./base/connexion.js";
import {
  accessGrants, apiSlots, buttons, companies, configHistory, cuts, engineBindings, engineCapabilities, engines, engineVersions, gates, groups, lines, platformAliases, platforms, rooms,
  secretRefs, subscriptions, type CoteCoupure, type Engine,
} from "./base/schema.js";
import { INVENTAIRE_BOUTIQUE } from "./inventaire/boutique.generated.js";
import { INVENTAIRE_PLATEFORME } from "./inventaire/plateforme.generated.js";
import type { LigneInventaire } from "./inventaire/types.js";
import { ecrireConfig, ecrireMemoire, journaliser, lireConfig, SYSTEME, type Acteur } from "./journal.js";
import { MOTEURS_INTERNES, PAIRE_ATELIER, PAIRE_GENERAL, PAIRE_GROUPE, PAIRE_LIGNE, PAIRE_PAR_COTE } from "./moteurs-internes.js";
import { ELEMENTS_CHAINE, ETIQUETTE_RESERVE, MODE, RESERVE_DE_DEPART, RESERVE_PAR_LIGNE_REELLE, reservesAAjouter, validerLigne, type Chaine, type MoteurLite } from "./regles.js";
import { INTERMEDIAIRES_BOUTIQUE } from "./shop-inventory.js";

export const VERSION_CENTRE = "2.0.0";

// ───────────────────────── Codes stables ─────────────────────────
export const codeMoteurBoutique = (id: string) => `shop:${id}`;
export const codeIntermediaireBoutique = (id: string) => `shop:int:${id}`;
export const codeMoteurPrincipal = (id: string) => `main:${id}`;
export const codeCanal = (canal: string) => `main:int:${canal}`;
export const codeElement = (ligne: string, cote: CoteCoupure) => `el:${ligne}:${cote}`;

// ───────────────────────── Données de référence ─────────────────────────
const DEPOT_WEB = "projet-Auto-plus-Africa-MKAPMS/mkapms-web";
const DEPOT_SHOP = "projet-Auto-plus-Africa-MKAPMS/mkapms-shop";
const DEPOT_MAP = "projet-Auto-plus-Africa-MKAPMS/mkapms-carte";

const PLATEFORMES = [
  { code: "frontier", name: "Centre Cyber-Électrique MKA.P-MS / Frontier OS", kind: "center", repository: DEPOT_WEB, exactNames: ["Centre Cyber-Électrique MKA.P-MS", "Frontier OS"], identityStatus: "verified", identityNote: "Le centre vit dans le dépôt de la plateforme principale (server/frontier-os).", status: "active", securityLevel: 5 },
  { code: "main", name: "Plateforme principale MKA.P-MS", kind: "main", repository: DEPOT_WEB, exactNames: ["plateforme principale", "MKA.P-MS"], identityStatus: "verified", identityNote: "Nom employé par le registre et les contrats de la Boutique.", status: "active", securityLevel: 5 },
  { code: "shop", name: "Boutique MKA.P-MS SHOP", kind: "shop", repository: DEPOT_SHOP, exactNames: ["MKA.P-MS SHOP", "MKA.P-MS Shop", "MKAPMS Shop"], identityStatus: "verified", identityNote: "Un seul dépôt de boutique est accessible (mkapms-shop). Les noms « boutique principale », « MKH Shop » et « MKPMS Shop » n'y figurent pas : voir les alias, rien n'est fusionné.", status: "active", securityLevel: 4 },
  { code: "map", name: "Map", kind: "map", repository: DEPOT_MAP, exactNames: [], identityStatus: "to_verify", identityNote: "Le dépôt mkapms-carte existe dans l'organisation mais n'a pas été inventorié dans ce lot (consigne : la Boutique puis la plateforme principale).", status: "to_verify", securityLevel: 3 },
  { code: "ia-alhoudoud", name: "IA Al-Houdoud M.", kind: "ai", repository: "", exactNames: ["AL-HUDHUD·M"], identityStatus: "to_verify", identityNote: "Aujourd'hui l'IA est un moteur de la plateforme principale (« intelligences ») : son rattachement comme plateforme distincte est à confirmer par le PDG.", status: "to_verify", securityLevel: 4 },
  { code: "bijoux", name: "Boutique Bijoux (future)", kind: "jewelry", repository: "", exactNames: [], identityStatus: "to_verify", identityNote: "Future boutique : aucun dépôt, aucun moteur.", status: "future", securityLevel: 3 },
  { code: "futures", name: "Futures plateformes", kind: "future", repository: "", exactNames: [], identityStatus: "to_verify", identityNote: "Espace réservé aux futures plateformes du groupe, extensible sans limite.", status: "future", securityLevel: 2 },
] as const;

const ALIAS = [
  { name: "plateforme principale", platformCode: "main", status: "found", evidence: "Nom employé dans le registre central, les contrats et la documentation de la Boutique.", note: "" },
  { name: "MKA.P-MS SHOP", platformCode: "shop", status: "found", evidence: "Nom du propriétaire dans le système intelligent de la Boutique (server/shop-intelligent-system.mjs).", note: "" },
  { name: "MKA.P-MS Shop", platformCode: "shop", status: "found", evidence: "Documentation de la Boutique et de la plateforme.", note: "" },
  { name: "MKAPMS Shop", platformCode: "shop", status: "found", evidence: "Une occurrence : docs/SHOP-LIVING-PANELS-2026-10-08.md de la Boutique.", note: "" },
  { name: "boutique principale", platformCode: null, status: "not_found", evidence: "Absent des deux dépôts.", note: "Peut-être la Boutique mkapms-shop, peut-être une autre : à confirmer par le PDG. Aucune fusion." },
  { name: "MKH Shop", platformCode: null, status: "not_found", evidence: "Absent des deux dépôts.", note: "Autre boutique ou autre nom de la Boutique ? À confirmer par le PDG. Aucune fusion." },
  { name: "MKPMS Shop", platformCode: null, status: "not_found", evidence: "Absent des deux dépôts.", note: "Autre boutique ou autre nom de la Boutique ? À confirmer par le PDG. Aucune fusion." },
] as const;

export const SALLES = [
  { code: "accueil", name: "Accueil et tableau de bord général", description: "Entrée du centre : aiguilles mesurées, état général, mode.", securityLevel: 3 },
  { code: "plateforme-principale", name: "Salle de contrôle de la plateforme principale", description: "Moteurs, intermédiaires et lignes côté plateforme principale.", securityLevel: 4 },
  { code: "boutiques", name: "Salle de contrôle de chaque boutique", description: "Une salle par boutique : moteurs inventoriés, intermédiaires, lignes.", securityLevel: 4 },
  { code: "connexions", name: "Salle des connexions et de l'activation", description: "Les lignes à sept éléments, les trois coupures, le grand contact rouge, l'interrupteur général.", securityLevel: 5 },
  { code: "cyber-securite", name: "Cybersécurité", description: "Zones de sécurité, secrets (références seulement), gouvernance, moteurs internes.", securityLevel: 5 },
  { code: "atelier", name: "Atelier de réparation", description: "Diagnostic, réparation testée en environnement isolé, retour arrière.", securityLevel: 4 },
  { code: "memoire", name: "Salle de mémoire", description: "Mémoire extensible du centre : règles, constats, historique de configuration.", securityLevel: 3 },
  { code: "incidents-audit", name: "Salle des incidents et de l'audit", description: "Incidents, journal en ajout seul, sessions de test.", securityLevel: 4 },
  { code: "employes-permissions", name: "Espace des employés et des permissions", description: "Accès actuels (PDG seul) et accès préparés pour plus tard.", securityLevel: 5 },
  { code: "plateformes-futures", name: "Espace des futures plateformes", description: "Groupes à venir, réserves, entreprises et souscriptions préparées.", securityLevel: 3 },
] as const;

interface BoutonDef { code: string; name: string; target: "cut" | "line" | "group" | "general" | "workshop"; danger: number }
const BOUTONS: readonly BoutonDef[] = [
  { code: "general.activer", name: "Interrupteur général — activer", target: "general", danger: 4 },
  { code: "general.desactiver", name: "Interrupteur général — couper", target: "general", danger: 4 },
  { code: "groupe.contact.activer", name: "Grand contact rouge — fermer les contacts centraux", target: "group", danger: 3 },
  { code: "groupe.contact.desactiver", name: "Grand contact rouge — ouvrir les contacts centraux", target: "group", danger: 3 },
  { code: "ligne.activer", name: "Ligne — activer", target: "line", danger: 3 },
  { code: "ligne.desactiver", name: "Ligne — couper", target: "line", danger: 2 },
  { code: "ligne.verrouiller", name: "Ligne — verrouiller", target: "line", danger: 3 },
  { code: "ligne.deverrouiller", name: "Ligne — déverrouiller", target: "line", danger: 3 },
  { code: "coupure.activer", name: "Petit interrupteur — activer une coupure", target: "cut", danger: 3 },
  { code: "coupure.desactiver", name: "Petit interrupteur — couper une coupure", target: "cut", danger: 2 },
  { code: "protocole.lancer", name: "Protocole de test d'une ligne", target: "line", danger: 2 },
  { code: "atelier.diagnostic", name: "Atelier — lancer le diagnostic", target: "workshop", danger: 1 },
  { code: "atelier.proposer", name: "Atelier — proposer une réparation", target: "workshop", danger: 2 },
  { code: "atelier.tester", name: "Atelier — tester dans l'environnement isolé", target: "workshop", danger: 2 },
  { code: "atelier.appliquer", name: "Atelier — appliquer la réparation testée", target: "workshop", danger: 4 },
  { code: "atelier.annuler", name: "Atelier — retour arrière", target: "workshop", danger: 4 },
  { code: "gouvernance.armer", name: "Gouvernance — armer le portier du câble réel", target: "general", danger: 5 },
  { code: "gouvernance.desarmer", name: "Gouvernance — désarmer le portier", target: "general", danger: 3 },
  { code: "moteur.arreter", name: "Moteur interne — arrêter", target: "workshop", danger: 4 },
  { code: "moteur.demarrer", name: "Moteur interne — démarrer", target: "workshop", danger: 3 },
] as const;

const REGLES_MEMOIRE: readonly { cle: string; contenu: Record<string, unknown> }[] = [
  { cle: "regle:mode", contenu: { texte: "Le centre ne pilote que la SIMULATION. Le mode réel est refusé par le code et par la base tant que l'audit final décidé par le PDG n'a pas eu lieu." } },
  { cle: "regle:resultat-observe", contenu: { texte: "Un ordre n'est jamais un résultat. L'état observé n'est écrit que d'après la sonde du moteur de vérification ; une animation n'est jamais une preuve." } },
  { cle: "regle:deux-moteurs", contenu: { texte: "Toute commande (bouton, interrupteur, moteur externe pris en charge) a deux moteurs internes distincts : commande et vérification. L'un indisponible, ou une contradiction : activation bloquée et incident enregistré." } },
  { cle: "regle:coupure-reelle", contenu: { texte: "La coupure est appliquée par le service de transport à chaque envoi, reprise et voie secondaire. Échanges en vol : file suspendue, échange annulé de façon contrôlée, paiement déjà transmis SUIVI (jamais annulé automatiquement)." } },
  { cle: "regle:reserves", contenu: { texte: "Au moins cinq lignes de réserve « À venir » pour chaque ligne réelle inventoriée : vides, désactivées, sans moteur, non comptées parmi les moteurs installés." } },
  { cle: "regle:redemarrage", contenu: { texte: "Après un redémarrage, une connexion coupée reste coupée et une réserve reste désactivée. Rien n'est rebranché automatiquement." } },
  { cle: "regle:secrets", contenu: { texte: "Les secrets restent dans un stockage protégé. Le centre, ses journaux et sa vitrine ne montrent que des références (nom de variable ou chemin de coffre), jamais une valeur." } },
  { cle: "regle:capacite", contenu: { texte: "Deux moteurs logiciels dans un même processus ne prouvent pas une capacité doublée : seules les mesures (débit, latence, mémoire, reprise) font foi." } },
  { cle: "regle:donnees-pdg", contenu: { texte: "Le centre ne modifie jamais un prix, un stock ou une publication décidés par le PDG, ne publie rien automatiquement, ne modifie et ne supprime aucune photo ou vidéo." } },
];

// ───────────────────────── Fondation ─────────────────────────
export interface RapportFondation {
  cree: boolean;
  plateformes: number;
  moteurs: number;
  moteursInternes: number;
  lignesReelles: number;
  lignesReserve: number;
  coupures: number;
  liaisons: number;
  groupes: number;
  reservesAjoutees: number;
}

const enLignes = (n: number) => Array.from({ length: n }, (_, i) => i);

type Tx = BaseFrontier;

async function pose(tx: Tx): Promise<{ reservesAjoutees: number }> {
  // 1. Entreprise, plateformes, noms exacts.
  await tx.insert(companies).values({ code: "mkapms", name: "MKA.P-MS", role: "center_owner", status: "active", note: "Entreprise propriétaire du centre et de toutes les plateformes actuelles." }).onConflictDoNothing();
  await tx.insert(platforms).values(PLATEFORMES.map((p) => ({ ...p, exactNames: [...p.exactNames], companyCode: "mkapms" }))).onConflictDoNothing();
  await tx.insert(platformAliases).values(ALIAS.map((a) => ({ ...a }))).onConflictDoNothing();

  // 2. Salles et boutons.
  await tx.insert(rooms).values(SALLES.map((s, i) => ({ ...s, position: i + 1 }))).onConflictDoNothing();
  await tx.insert(buttons).values(BOUTONS.map((b) => ({ code: b.code, name: b.name, targetKind: b.target, dangerLevel: b.danger, requiresConfirmation: b.danger >= 3 }))).onConflictDoNothing();

  // 3. Moteurs internes du centre.
  await tx
    .insert(engines)
    .values(MOTEURS_INTERNES.map((m) => ({
      code: m.code, platformCode: "frontier", ownerKind: "center" as const, ownerCode: "center", name: m.nom, function: m.fonction, kind: m.kind, origin: "center" as const,
      inputs: m.entrees, outputs: m.sorties, stopMechanism: m.arret, version: VERSION_CENTRE, declaredOnly: false,
    })))
    .onConflictDoNothing();

  // 4. Moteurs relevés par l'inventaire (Boutique et plateforme principale) : importés avec leur version.
  await importerLignes(tx);

  // 5. Groupes.
  const GROUPES = [
    { code: "boutique", name: "Groupe Boutique", platformCode: "shop", position: 1, isFuture: false },
    { code: "map", name: "Groupe Map", platformCode: "map", position: 2, isFuture: true },
    { code: "ia-alhoudoud", name: "Groupe IA Al-Houdoud M.", platformCode: "ia-alhoudoud", position: 3, isFuture: true },
    { code: "bijoux", name: "Groupe Boutique Bijoux (future)", platformCode: "bijoux", position: 4, isFuture: true },
    { code: "futures", name: "Groupe futures plateformes", platformCode: "futures", position: 5, isFuture: true },
  ] as const;
  await tx.insert(groups).values(GROUPES.map((g) => ({ ...g, ownerKind: "platform" as const, ownerCode: g.platformCode }))).onConflictDoNothing();

  // 6. Lignes réelles : un intermédiaire préparé par la Boutique = une ligne réelle à sept éléments.
  const ids = new Map<string, number>();
  for (const [i, inter] of INTERMEDIAIRES_BOUTIQUE.entries()) {
    const cle = inter.id;
    const remoteSwitch = codeElement(cle, "remote");
    const centre = codeElement(cle, "center");
    const mainSwitch = codeElement(cle, "main");
    await tx
      .insert(engines)
      .values([
        { code: remoteSwitch, platformCode: "shop", ownerKind: "center" as const, ownerCode: "center", name: `Interrupteur local Boutique — ${inter.libelle}`, function: "Interrupteur local côté Boutique, simulé et commandé par le centre (à construire côté Boutique pour le réel).", kind: "switch_element" as const, origin: "center" as const, version: VERSION_CENTRE, declaredOnly: false },
        { code: centre, platformCode: "frontier", ownerKind: "center" as const, ownerCode: "center", name: `Contact central — ${inter.libelle}`, function: "Contact central entre les deux moteurs intermédiaires : l'une des trois coupures indépendantes de la ligne.", kind: "contact_element" as const, origin: "center" as const, version: VERSION_CENTRE, declaredOnly: false },
        { code: mainSwitch, platformCode: "main", ownerKind: "center" as const, ownerCode: "center", name: `Interrupteur local plateforme — ${inter.libelle}`, function: "Interrupteur local côté plateforme principale, commandé par le centre.", kind: "switch_element" as const, origin: "center" as const, version: VERSION_CENTRE, declaredOnly: false },
      ])
      .onConflictDoNothing();
    const existe = await tx.select({ id: lines.id }).from(lines).where(and(eq(lines.groupCode, "boutique"), eq(lines.intermediaryRef, cle))).limit(1);
    if (existe[0]) {
      ids.set(cle, existe[0].id);
      continue;
    }
    const remoteReal = inter.dansRegistreBoutique ? codeMoteurBoutique(inter.moteurBoutique) : null;
    const [l] = await tx
      .insert(lines)
      .values({
        groupCode: "boutique", position: i + 1, kind: "real", label: inter.libelle, channel: inter.canalPlateforme, intermediaryRef: cle,
        remoteRealEngine: remoteReal, remoteSwitch, remoteIntermediary: codeIntermediaireBoutique(cle), centerContact: centre,
        mainIntermediary: inter.canalPlateforme ? codeCanal(inter.canalPlateforme) : null, mainSwitch, mainRealEngine: codeMoteurPrincipal(inter.moteurPlateforme),
        enabled: true, ownerKind: "platform", ownerCode: "shop",
      })
      .returning({ id: lines.id });
    ids.set(cle, l!.id);
  }

  // 7. Trois coupures par ligne réelle (coupées, jamais demandées) et leurs portes (fermées).
  const reelles = await tx.select().from(lines).where(eq(lines.kind, "real"));
  for (const l of reelles) {
    const specs: { side: CoteCoupure; el: string | null; plateforme: string }[] = [
      { side: "remote", el: l.remoteSwitch, plateforme: l.ownerCode },
      { side: "center", el: l.centerContact, plateforme: l.ownerCode },
      { side: "main", el: l.mainSwitch, plateforme: l.ownerCode },
    ];
    for (const s of specs) {
      if (!s.el) continue;
      const [c] = await tx.insert(cuts).values({ lineId: l.id, side: s.side, elementCode: s.el, ownerKind: "platform", ownerCode: s.plateforme }).onConflictDoNothing().returning({ id: cuts.id });
      if (c) await tx.insert(gates).values({ cutId: c.id, open: false }).onConflictDoNothing();
    }
  }

  // 8. Paires commande / vérification : cibles = interrupteurs, lignes, groupes, général, boutons, moteurs externes pris en charge.
  const liaisons: { targetKind: "button" | "switch" | "external_engine" | "line" | "group" | "general"; targetCode: string; commandEngine: string; verificationEngine: string }[] = [];
  const lie = (targetKind: (typeof liaisons)[number]["targetKind"], targetCode: string, p: { commande: string; verification: string }) =>
    liaisons.push({ targetKind, targetCode, commandEngine: p.commande, verificationEngine: p.verification });
  for (const l of reelles) {
    const cot: [CoteCoupure, string | null][] = [["remote", l.remoteSwitch], ["center", l.centerContact], ["main", l.mainSwitch]];
    for (const [cote, el] of cot) if (el) lie("switch", el, PAIRE_PAR_COTE(cote));
    lie("line", `line:${l.id}`, PAIRE_LIGNE);
    for (const e of [l.remoteRealEngine, l.remoteIntermediary]) if (e) lie("external_engine", e, PAIRE_PAR_COTE("remote"));
    for (const e of [l.mainIntermediary, l.mainRealEngine]) if (e) lie("external_engine", e, PAIRE_PAR_COTE("main"));
  }
  for (const g of GROUPES) lie("group", `group:${g.code}`, PAIRE_GROUPE);
  lie("general", "general", PAIRE_GENERAL);
  for (const b of BOUTONS) {
    const p = b.target === "general" ? PAIRE_GENERAL : b.target === "group" ? PAIRE_GROUPE : b.target === "line" ? PAIRE_LIGNE : b.target === "workshop" ? PAIRE_ATELIER : PAIRE_PAR_COTE("center");
    lie("button", b.code, p);
  }
  if (liaisons.length) await tx.insert(engineBindings).values(liaisons.map((x) => ({ ...x, ownerKind: "center" as const, ownerCode: "center" }))).onConflictDoNothing();

  // 9. Réserves : au moins cinq par ligne réelle, cinq au départ pour un groupe sans ligne réelle.
  let reservesAjoutees = 0;
  for (const g of GROUPES) {
    const [r] = await tx.select({ n: count() }).from(lines).where(and(eq(lines.groupCode, g.code), eq(lines.kind, "real")));
    const [s] = await tx.select({ n: count() }).from(lines).where(and(eq(lines.groupCode, g.code), eq(lines.kind, "reserve")));
    const [m] = await tx.select({ max: sql<number>`coalesce(max(${lines.position}), 0)::int` }).from(lines).where(eq(lines.groupCode, g.code));
    const a = reservesAAjouter(Number(r?.n ?? 0), Number(s?.n ?? 0));
    if (a > 0) {
      await tx.insert(lines).values(enLignes(a).map((i) => ({ groupCode: g.code, position: (m?.max ?? 0) + i + 1, kind: "reserve" as const, label: ETIQUETTE_RESERVE, enabled: false, ownerKind: "platform" as const, ownerCode: g.platformCode })));
      reservesAjoutees += a;
    }
  }

  // 10. Références de secrets (jamais de valeur), emplacements d'API et d'abonnements, accès, configuration.
  await tx
    .insert(secretRefs)
    .values([
      { name: "boutique-adresse", store: "platform_vault", ref: "vault:boutique-adresse", purpose: "Adresse de la Boutique, déposée dans le Coffre de la plateforme sous « Boutique — adresse ».", status: "declared", ownerKind: "platform", ownerCode: "shop" },
      { name: "boutique-jeton-service", store: "platform_vault", ref: "vault:boutique-jeton-de-service", purpose: "Jeton de l'accès de service de la Boutique (créé par le PDG dans la Boutique), déposé dans le Coffre.", status: "declared", ownerKind: "platform", ownerCode: "shop" },
      { name: "boutique-stripe", store: "railway_env", ref: "SHOP_STRIPE_SECRET_KEY", purpose: "Clé Stripe de la Boutique : en attente de l'activation externe côté Boutique.", status: "missing", ownerKind: "platform", ownerCode: "shop" },
      { name: "centre-base-separee", store: "railway_env", ref: "FRONTIER_DATABASE_URL", purpose: "Adresse d'une base Postgres dédiée au centre (facultative tant que le schéma frontier vit dans la base de la plateforme).", status: "declared", ownerKind: "center", ownerCode: "center" },
    ])
    .onConflictDoNothing();
  await tx
    .insert(apiSlots)
    .values([
      { code: "api-lecture-etat", name: "API de lecture de l'état du centre", companyCode: "mkapms", scope: "lecture seule : état des plateformes et des lignes", note: "Emplacement préparé, inactif : aucune clé d'accès n'existe encore." },
      { code: "api-commandes", name: "API de commandes", companyCode: "mkapms", scope: "ordres de coupure et d'activation (avec confirmation)", note: "Emplacement préparé, inactif." },
      { code: "api-plateformes-clientes", name: "API des plateformes clientes", companyCode: "mkapms", scope: "future souscription d'une plateforme externe", note: "Emplacement préparé, inactif." },
    ])
    .onConflictDoNothing();
  await tx.insert(subscriptions).values({ companyCode: "mkapms", plan: "modele-souscription-plateforme", status: "prepared", note: "Modèle d'architecture : aucune souscription réelle, aucun paiement." }).onConflictDoNothing();
  await tx
    .insert(accessGrants)
    .values([
      { subjectKind: "pdg", subjectRef: "super_admin", scope: "center:*", level: 5, status: "active", grantedBy: "règle du dépôt : seul le rôle super_admin accède au centre" },
      { subjectKind: "employee", subjectRef: "*", scope: "center:lecture", level: 1, status: "prepared", grantedBy: "préparé, non accordé" },
      { subjectKind: "employee", subjectRef: "*", scope: "center:commande", level: 3, status: "prepared", grantedBy: "préparé, non accordé" },
      { subjectKind: "company", subjectRef: "*", scope: "center:plateforme-cliente", level: 2, status: "prepared", grantedBy: "préparé, non accordé" },
    ])
    .onConflictDoNothing();

  // 11. Mémoire de départ (règles d'exploitation) — une seule fois.
  const [mem] = await tx.execute(sql`SELECT count(*)::int AS n FROM frontier.memory_blocks WHERE kind = 'regle'`).then((r) => r.rows as { n: number }[]);
  if ((mem?.n ?? 0) === 0) for (const r of REGLES_MEMOIRE) await ecrireMemoire({ cle: r.cle, kind: "regle", contenu: r.contenu, importance: 5, securite: 3 }, tx);

  return { reservesAjoutees };
}

// ───────────────────────── Import de l'inventaire (moteurs + versions + capacités) ─────────────────────────
interface Importable {
  code: string;
  plateforme: string;
  kind: "real" | "intermediary";
  ligne: LigneInventaire;
  depot: string;
  commit: string;
}

function importables(): Importable[] {
  const b = INVENTAIRE_BOUTIQUE.source;
  const p = INVENTAIRE_PLATEFORME.source;
  return [
    ...INVENTAIRE_BOUTIQUE.moteurs.map((l) => ({ code: codeMoteurBoutique(l.id), plateforme: "shop", kind: "real" as const, ligne: l, depot: b.depot, commit: b.commit })),
    ...INVENTAIRE_BOUTIQUE.intermediaires.map((l) => ({ code: codeIntermediaireBoutique(l.id), plateforme: "shop", kind: "intermediary" as const, ligne: l, depot: b.depot, commit: b.commit })),
    ...INVENTAIRE_PLATEFORME.moteurs.map((l) => ({ code: codeMoteurPrincipal(l.id), plateforme: "main", kind: "real" as const, ligne: l, depot: p.depot, commit: p.commit })),
    ...INVENTAIRE_PLATEFORME.intermediaires.map((l) => ({ code: codeCanal(l.id.replace(/^shop_link:/, "")), plateforme: "main", kind: "intermediary" as const, ligne: l, depot: p.depot, commit: p.commit })),
  ];
}

const detailsDe = (l: LigneInventaire): Record<string, unknown> => ({
  domaine: l.domaine, niveauDeclare: l.niveauDeclare, entrees: l.entrees.slice(0, 12), entreesTrouvees: l.entreesTrouvees, tables: l.tables, dependances: l.dependances, tests: l.tests,
  connexionsExistantes: l.connexionsExistantes, connexionsAConstruire: l.connexionsAConstruire, manques: l.manques, doublons: l.doublons, aVerifier: l.aVerifier,
});

async function importerLignes(tx: Tx): Promise<{ nouveaux: number; mis_a_jour: number; versions: number }> {
  const bilan = { nouveaux: 0, mis_a_jour: 0, versions: 0 };
  const existants = new Map((await tx.select({ code: engines.code, etat: engines.inventoryState, preuve: engines.evidenceLevel, version: engines.version }).from(engines).where(eq(engines.origin, "inventory"))).map((e) => [e.code, e]));
  const aInserer: (typeof engines.$inferInsert)[] = [];
  const versions: (typeof engineVersions.$inferInsert)[] = [];
  const miseAJour: { code: string; l: LigneInventaire; commit: string; ancien: { etat: string | null; preuve: string | null } }[] = [];
  for (const i of importables()) {
    const version = i.commit.slice(0, 7);
    const v = { engineCode: i.code, version, sourceRepo: i.depot, sourceCommit: i.commit, inventoryState: i.ligne.etat, evidenceLevel: i.ligne.preuve, snapshot: { etat: i.ligne.etat, preuve: i.ligne.preuve, entreesTrouvees: i.ligne.entreesTrouvees, tests: i.ligne.tests.length, manques: i.ligne.manques.length } };
    const ex = existants.get(i.code);
    if (!ex) {
      aInserer.push({
        code: i.code, platformCode: i.plateforme, ownerKind: "platform", ownerCode: i.plateforme, name: i.ligne.nom, function: i.ligne.fonction, kind: i.kind, origin: "inventory",
        inventoryState: i.ligne.etat, evidenceLevel: i.ligne.preuve, declaredOnly: i.ligne.declareSeulement, codeLocation: [...i.ligne.code], executionService: i.ligne.serviceExecution,
        plannedIntermediary: i.ligne.intermediairePrevu, details: detailsDe(i.ligne), version, running: true, health: "unknown",
      });
      versions.push(v);
      bilan.nouveaux += 1;
    } else if (ex.version !== version || ex.etat !== i.ligne.etat || ex.preuve !== i.ligne.preuve) {
      miseAJour.push({ code: i.code, l: i.ligne, commit: i.commit, ancien: { etat: ex.etat, preuve: ex.preuve } });
      versions.push(v);
    }
  }
  for (let k = 0; k < aInserer.length; k += 100) await tx.insert(engines).values(aInserer.slice(k, k + 100)).onConflictDoNothing();
  for (const m of miseAJour) {
    await tx.update(engines).set({ name: m.l.nom, function: m.l.fonction, inventoryState: m.l.etat, evidenceLevel: m.l.preuve, declaredOnly: m.l.declareSeulement, codeLocation: [...m.l.code], executionService: m.l.serviceExecution, plannedIntermediary: m.l.intermediairePrevu, details: detailsDe(m.l), version: m.commit.slice(0, 7), updatedAt: new Date() }).where(eq(engines.code, m.code));
    await tx.insert(configHistory).values({ entity: "engine", entityId: m.code, field: "inventory_state", oldValue: m.ancien.etat, newValue: m.l.etat, actor: "system:inventaire", ownerKind: "center", ownerCode: "center" });
    bilan.mis_a_jour += 1;
  }
  for (let k = 0; k < versions.length; k += 100) {
    const r = await tx.insert(engineVersions).values(versions.slice(k, k + 100)).onConflictDoNothing().returning({ id: engineVersions.id });
    bilan.versions += r.length;
  }
  return bilan;
}

/** Réimporte l'inventaire courant (après régénération) : nouvelles versions, changements d'état historisés. Ne touche à aucune coupure. */
export async function importerInventaire(acteur: Acteur = SYSTEME) {
  const bilan = await dbFrontier().transaction((tx) => importerLignes(tx));
  await revaliderLignes();
  await journaliser({ acteur, action: "inventory_import", cible: "center", resultat: "ok", detail: { ...bilan } });
  return bilan;
}

/** Recalcule la validité des lignes réelles à partir des moteurs, des paires et de l'état des éléments du centre. */
export async function revaliderLignes(base: BaseFrontier = dbFrontier()): Promise<{ valides: number; invalides: number }> {
  const reelles = await base.select().from(lines).where(eq(lines.kind, "real"));
  const codes = new Set<string>();
  for (const l of reelles) for (const e of ELEMENTS_CHAINE) { const c = l[e.cle]; if (c) codes.add(c); }
  const moteurs = new Map<string, MoteurLite>();
  if (codes.size) for (const m of await base.select().from(engines).where(inArray(engines.code, [...codes]))) moteurs.set(m.code, { code: m.code, kind: m.kind, running: m.running, health: m.health, inventoryState: m.inventoryState });
  const internes = new Map((await base.select({ code: engines.code, running: engines.running, health: engines.health }).from(engines).where(eq(engines.platformCode, "frontier"))).map((m) => [m.code, m]));
  const liaisons = new Set<string>();
  for (const b of await base.select().from(engineBindings)) {
    const c = internes.get(b.commandEngine);
    const v = internes.get(b.verificationEngine);
    if (b.commandEngine !== b.verificationEngine && c?.running && v?.running && c.health !== "down" && v.health !== "down" && c.health !== "stopped" && v.health !== "stopped") liaisons.add(b.targetCode);
  }
  let valides = 0;
  for (const l of reelles) {
    const elements = Object.fromEntries(ELEMENTS_CHAINE.map((e) => [e.cle, l[e.cle]])) as Chaine;
    const r = validerLigne({ kind: "real", elements, moteurs, liaisonsValides: liaisons });
    if (r.valide) valides += 1;
    const change = l.validity !== (r.valide ? "valid" : "invalid") || l.invalidReasons.join("|") !== r.raisons.join("|");
    if (change) {
      await base.update(lines).set({ validity: r.valide ? "valid" : "invalid", invalidReasons: r.raisons, validatedAt: r.valide ? new Date() : null, updatedAt: new Date() }).where(eq(lines.id, l.id));
      if (l.validity === "valid" && !r.valide) {
        await journaliser({ acteur: SYSTEME, action: "line_invalidated", cible: "line", cibleId: l.id, resultat: "refused", erreur: r.raisons[0], detail: { raisons: r.raisons } }, base);
      }
    }
  }
  return { valides, invalides: reelles.length - valides };
}

export async function assurerFondation(acteur: Acteur = SYSTEME): Promise<RapportFondation> {
  const db = dbFrontier();
  const [avant] = await db.select({ n: count() }).from(platforms);
  const premier = Number(avant?.n ?? 0) === 0;
  const { reservesAjoutees } = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('frontier-fondation'))`);
    return pose(tx);
  });
  if (premier) {
    await ecrireConfig("mode", MODE, acteur);
    await ecrireConfig("governance_armed", false, acteur);
    await ecrireConfig("reserve_par_ligne", RESERVE_PAR_LIGNE_REELLE, acteur);
  }
  await revaliderLignes();
  const r = await compter();
  if (premier || reservesAjoutees > 0) await journaliser({ acteur, action: premier ? "foundation_created" : "foundation_completed", cible: "center", resultat: "ok", detail: { ...r, reservesAjoutees } });
  return { cree: premier, ...r, reservesAjoutees };
}

async function compter(): Promise<Omit<RapportFondation, "cree" | "reservesAjoutees">> {
  const db = dbFrontier();
  const n = async (q: Promise<{ n: unknown }[]>) => Number((await q)[0]?.n ?? 0);
  return {
    plateformes: await n(db.select({ n: count() }).from(platforms)),
    moteurs: await n(db.select({ n: count() }).from(engines)),
    moteursInternes: await n(db.select({ n: count() }).from(engines).where(eq(engines.platformCode, "frontier"))),
    lignesReelles: await n(db.select({ n: count() }).from(lines).where(eq(lines.kind, "real"))),
    lignesReserve: await n(db.select({ n: count() }).from(lines).where(eq(lines.kind, "reserve"))),
    coupures: await n(db.select({ n: count() }).from(cuts)),
    liaisons: await n(db.select({ n: count() }).from(engineBindings)),
    groupes: await n(db.select({ n: count() }).from(groups)),
  };
}

let fondationFaite: Promise<RapportFondation> | null = null;
export function assurerFondationUneFois(): Promise<RapportFondation> {
  if (!fondationFaite) {
    fondationFaite = assurerFondation().catch((e) => {
      fondationFaite = null;
      throw e;
    });
  }
  return fondationFaite;
}
export const oublierFondationPourTests = () => {
  fondationFaite = null;
};

/** Ajoute un groupe (sans limite) avec sa réserve de départ de cinq lignes « À venir ». */
export async function ajouterGroupe(code: string, nom: string, plateformeCode: string | null, acteur: Acteur): Promise<{ ok: boolean; detail: string; reserves?: number }> {
  if (!/^[a-z0-9][a-z0-9_-]{1,38}$/.test(code)) return { ok: false, detail: "Code de groupe invalide (minuscules, chiffres, tiret ; 2 à 39 caractères)." };
  const db = dbFrontier();
  const [existe] = await db.select({ code: groups.code }).from(groups).where(eq(groups.code, code)).limit(1);
  if (existe) return { ok: false, detail: `Le groupe « ${code} » existe déjà.` };
  if (plateformeCode) {
    const [p] = await db.select({ code: platforms.code }).from(platforms).where(eq(platforms.code, plateformeCode)).limit(1);
    if (!p) return { ok: false, detail: `Plateforme « ${plateformeCode} » inconnue.` };
  }
  const [max] = await db.select({ m: sql<number>`coalesce(max(${groups.position}), 0)::int` }).from(groups);
  const proprietaire = plateformeCode ?? "futures";
  await db.transaction(async (tx) => {
    await tx.insert(groups).values({ code, name: nom.slice(0, 160), platformCode: plateformeCode, position: (max?.m ?? 0) + 1, isFuture: true, ownerKind: "platform", ownerCode: proprietaire });
    await tx.insert(lines).values(enLignes(RESERVE_DE_DEPART).map((i) => ({ groupCode: code, position: i + 1, kind: "reserve" as const, label: ETIQUETTE_RESERVE, enabled: false, ownerKind: "platform" as const, ownerCode: proprietaire })));
    await tx.insert(engineBindings).values({ targetKind: "group", targetCode: `group:${code}`, commandEngine: PAIRE_GROUPE.commande, verificationEngine: PAIRE_GROUPE.verification, ownerKind: "center", ownerCode: "center" }).onConflictDoNothing();
  });
  await journaliser({ acteur, action: "group_added", cible: "group", cibleId: code, resultat: "ok", detail: { plateforme: plateformeCode, reserves: RESERVE_DE_DEPART } });
  return { ok: true, detail: `Groupe « ${nom} » ajouté avec ${RESERVE_DE_DEPART} lignes « À venir ».`, reserves: RESERVE_DE_DEPART };
}

export type { Engine };
export { lireConfig, engineCapabilities };
