/**
 * Tests du moteur Investissement (server/investment/).
 *
 * Aucun accès base de données réel dans cet environnement de travail
 * (PostgreSQL injoignable) : seule la logique réellement pure — extraite
 * exprès de la couche base de données pour rester testable — est exercée
 * ici. C'est le même code que la production appelle après sa requête SQL,
 * jamais une réimplémentation parallèle.
 *
 * Lancement : `npx tsx server/investment/__tests__/investment.test.ts`
 */
import assert from "node:assert/strict";
import { calculerAttribution } from "../revenu.js";
import { TRANSITIONS_AUTORISEES } from "../contrat.js";
import { detecterConflit, selectionnerContratActif } from "../ownership.js";
import type { investments } from "../schema.js";

type Investissement = typeof investments.$inferSelect;

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

/** Fabrique un faux investissement minimal pour les tests — jamais utilisé en production. */
function fauxInvestissement(partiel: Partial<Investissement>): Investissement {
  return {
    id: 1,
    investorId: 1,
    organizationId: null,
    universeId: "location_pro",
    countryCode: "FR",
    contractDocumentId: null,
    startAt: null,
    endAt: null,
    status: "ACTIVE",
    exclusive: true,
    pricingModel: "fixed_price",
    fixedPrice: null,
    revenueShare: null,
    currency: "EUR",
    payoutSchedule: "mensuel",
    createdBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partiel,
  } as Investissement;
}

function main() {
  // ── Investor Revenue Engine : calcul pur, aucune règle de marge inventée ──
  {
    const r1 = calculerAttribution("fixed_price", null, 1000);
    verif("fixed_price : 100% du brut revient à l'investisseur (droit déjà acheté)", r1.montantNet === 1000 && r1.commission === 0);

    const r2 = calculerAttribution("revenue_share", 0.03, 1000);
    verif("revenue_share : investisseur reçoit exactement la fraction contractuelle (3%)", r2.montantNet === 30);
    verif("revenue_share : MKA.P-MS garde le reste comme commission (97%)", r2.commission === 970);

    const r3 = calculerAttribution("hybrid", 0.1, 2000, 50, 20);
    verif("hybrid : même partage que revenue_share, taxe et remboursement déduits du net investisseur", r3.montantNet === 2000 * 0.1 - 50 - 20);

    const r4 = calculerAttribution("revenue_share", null, 1000);
    verif("revenue_share sans fraction définie : aucune part inventée, net = 0", r4.montantNet === 0);

    const r5 = calculerAttribution("fixed_price", null, 100, 500);
    verif("fixed_price : jamais un montant net négatif même si taxe > brut", r5.montantNet === 0);
  }

  // ── Investment Contract Engine : graphe de transitions ─────────────────
  {
    verif("transitions : DRAFT → UNDER_REVIEW autorisé", TRANSITIONS_AUTORISEES.DRAFT.includes("UNDER_REVIEW"));
    verif("transitions : DRAFT → ACTIVE refusé (aucun saut direct vers actif)", !TRANSITIONS_AUTORISEES.DRAFT.includes("ACTIVE"));
    verif("transitions : ACTIVATING → ACTIVE autorisé (seule voie vers actif)", TRANSITIONS_AUTORISEES.ACTIVATING.includes("ACTIVE"));
    verif("transitions : AWAITING_PAYMENT → ACTIVE refusé sans passer par ACTIVATING", !TRANSITIONS_AUTORISEES.AWAITING_PAYMENT.includes("ACTIVE"));
    verif("transitions : EXPIRED est un statut terminal (aucune sortie)", TRANSITIONS_AUTORISEES.EXPIRED.length === 0);
    verif("transitions : TERMINATED est un statut terminal (aucune sortie)", TRANSITIONS_AUTORISEES.TERMINATED.length === 0);
    verif("transitions : CANCELLED est un statut terminal (aucune sortie)", TRANSITIONS_AUTORISEES.CANCELLED.length === 0);
    verif("transitions : ACTIVE → EXPIRED refusé (doit passer par EXPIRING ou SUSPENDED)", !TRANSITIONS_AUTORISEES.ACTIVE.includes("EXPIRED"));
    verif("transitions : aucun statut ne boucle sur lui-même", (Object.keys(TRANSITIONS_AUTORISEES) as (keyof typeof TRANSITIONS_AUTORISEES)[]).every((s) => !TRANSITIONS_AUTORISEES[s].includes(s)));
  }

  // ── Investment Ownership Router : attribution automatique ──────────────
  {
    const date = new Date("2026-06-01T00:00:00Z");
    const contratFrance = fauxInvestissement({ id: 10, investorId: 100, countryCode: "FR", universeId: "location_pro", startAt: new Date("2026-01-01"), endAt: new Date("2027-01-01") });

    const trouve = selectionnerContratActif([contratFrance], date, "location_pro", "FR");
    verif("ownership router : contrat couvrant la date trouvé", trouve.trouve && trouve.investissement?.id === 10);

    const dateHorsPeriode = new Date("2028-01-01T00:00:00Z");
    const nonTrouve = selectionnerContratActif([contratFrance], dateHorsPeriode, "location_pro", "FR");
    verif("ownership router : hors période → aucune attribution, jamais devinée", !nonTrouve.trouve);

    const aucunCandidat = selectionnerContratActif([], date, "location_pro", "FR");
    verif("ownership router : aucun contrat pour ce périmètre → périmètre reste sous contrôle MKA.P-MS", !aucunCandidat.trouve && aucunCandidat.motif.includes("MKA.P-MS"));

    const incoherence = selectionnerContratActif(
      [contratFrance, fauxInvestissement({ id: 11, investorId: 200, countryCode: "FR", universeId: "location_pro" })],
      date,
      "location_pro",
      "FR",
    );
    verif("ownership router : deux contrats ACTIVE qui se chevauchent → incohérence signalée, jamais un choix arbitraire", !incoherence.trouve && incoherence.motif.includes("Incohérence"));
  }

  // ── Test critique à deux investisseurs (isolation) ─────────────────────
  {
    // Isolation géographique : le sélecteur ne reçoit ici QUE les candidats déjà
    // filtrés par pays+univers (requête réelle : eq(countryCode), eq(universeId))
    // — investisseur A (France) et investisseur B (Belgique) ne sont donc
    // jamais candidats sur la même requête de périmètre.
    const date = new Date("2026-06-01T00:00:00Z");
    const investisseurA = fauxInvestissement({ id: 20, investorId: 1, countryCode: "FR", universeId: "location_pro" });
    const resultatFrance = selectionnerContratActif([investisseurA], date, "location_pro", "FR");
    verif("isolation : requête France ne retourne que le contrat de l'investisseur A", resultatFrance.investissement?.investorId === 1);

    const investisseurB = fauxInvestissement({ id: 21, investorId: 2, countryCode: "BE", universeId: "location_pro" });
    const resultatBelgique = selectionnerContratActif([investisseurB], date, "location_pro", "BE");
    verif(
      "isolation : requête Belgique ne retourne que le contrat de l'investisseur B, jamais celui de l'investisseur A (id différent)",
      resultatBelgique.investissement?.investorId === investisseurB.investorId && resultatBelgique.investissement?.investorId !== investisseurA.investorId,
    );
  }

  // ── Blocage de double attribution incompatible ─────────────────────────
  {
    const existant = fauxInvestissement({ id: 30, status: "ACTIVE", startAt: new Date("2026-01-01"), endAt: new Date("2027-01-01") });

    const chevauche = detecterConflit([existant], { countryCode: "FR", universeId: "location_pro", startAt: new Date("2026-06-01"), endAt: new Date("2028-01-01") }, "location_pro", "FR");
    verif("conflit : période qui chevauche un contrat exclusif existant → bloqué", chevauche.conflit);

    const disjoint = detecterConflit([existant], { countryCode: "FR", universeId: "location_pro", startAt: new Date("2027-02-01"), endAt: new Date("2028-01-01") }, "location_pro", "FR");
    verif("conflit : période strictement après la fin du contrat existant → autorisé", !disjoint.conflit);

    const exclu = detecterConflit([existant], { countryCode: "FR", universeId: "location_pro", startAt: new Date("2026-06-01"), endAt: new Date("2028-01-01"), excludeInvestmentId: 30 }, "location_pro", "FR");
    verif("conflit : le contrat qu'on modifie soi-même (excludeInvestmentId) ne se bloque pas lui-même", !exclu.conflit);

    // Un contrat déjà en attente de paiement pour ce périmètre doit aussi bloquer — pas seulement ACTIVE.
    const enAttentePaiement = fauxInvestissement({ id: 31, status: "AWAITING_PAYMENT", startAt: new Date("2026-01-01"), endAt: new Date("2027-01-01") });
    const bloqueMemeEnAttente = detecterConflit([enAttentePaiement], { countryCode: "FR", universeId: "location_pro", startAt: new Date("2026-06-01"), endAt: new Date("2028-01-01") }, "location_pro", "FR");
    verif("conflit : un contrat AWAITING_PAYMENT (pas encore ACTIVE) bloque déjà un concurrent sur le même périmètre", bloqueMemeEnAttente.conflit);
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main();
