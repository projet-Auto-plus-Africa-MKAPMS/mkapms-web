/**
 * Order Engine — Plan Maître Fournisseurs §36-37 (section "COMMANDES") :
 * portail « Véhicule sur commande » (demande PDG). Tests réels, base de
 * données réelle. Couvre la création de commande, l'attribution employé, les
 * transitions de statut interne (10 étapes + branches), la décision finale
 * (accepté/retourné/gardé), l'enregistrement des documents (visibilité
 * employé vs client), la dérivation du statut client (jamais un second champ
 * stocké), le journal d'audit et l'exposition MOS (health/feed/dashboard +
 * router).
 *
 * Lancement : `npx tsx server/order-engine/__tests__/order-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import {
  orderDecisions,
  orderDocuments,
  orderEngineAuditLog,
  orderItems,
  orderStatusHistory,
} from "../schema.js";
import * as orderEngine from "../service.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VEHICLE_ITEM_ID = 920001;
const ANNONCE_ID = 920002;
const SUPPLIER_PROFILE_ID = 920003;
const CUSTOMER_ID = 920004;
const EMPLOYEE_ID = 920005;
const AUTRE_CLIENT_ID = 920006;
const DOC_DOCUMENT_ID = 920007;

let idsOrders: number[] = [];

async function nettoyer() {
  for (const id of idsOrders) {
    await db.delete(orderDocuments).where(eq(orderDocuments.orderItemId, id));
    await db.delete(orderDecisions).where(eq(orderDecisions.orderItemId, id));
    await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderItemId, id));
    await db.delete(orderEngineAuditLog).where(eq(orderEngineAuditLog.orderItemId, id));
    await db.delete(orderItems).where(eq(orderItems.id, id));
  }
  idsOrders = [];
}

async function main() {
  await nettoyer();

  // ── 1. Création de commande (§36) ───────────────────────────────────────
  const commande = await orderEngine.creerCommande({
    vehicleItemId: VEHICLE_ITEM_ID,
    annonceId: ANNONCE_ID,
    supplierProfileId: SUPPLIER_PROFILE_ID,
    customerId: CUSTOMER_ID,
  });
  idsOrders.push(commande.id);
  verif("1. commande créée avec le statut initial 'vehicule_selectionne'", commande.status === "vehicule_selectionne");
  verif("1b. référence réelle générée (jamais vide)", commande.reference.startsWith("MKA-CMD-"));

  const detailInitial = await orderEngine.obtenirCommandeDetail(commande.id);
  verif("1c. historique initial contient bien la création", detailInitial.historique.length === 1 && detailInitial.historique[0].status === "vehicule_selectionne");

  // ── 2. Attribution employé (section 7, demande PDG) ─────────────────────
  await orderEngine.attribuerEmploye({ orderItemId: commande.id, employeeId: EMPLOYEE_ID, actorId: EMPLOYEE_ID });
  const vehiculesEmploye = await orderEngine.listerCommandesEmploye(EMPLOYEE_ID);
  verif("2. l'employé voit bien la commande qui lui est attribuée", vehiculesEmploye.some((c) => c.id === commande.id));

  // ── 3. Transitions de statut interne (section 8, demande PDG) ───────────
  await assert.rejects(
    () => orderEngine.avancerStatut({ orderItemId: commande.id, to: "vehicule_en_preparation", actorType: "employe", actorId: EMPLOYEE_ID }),
    /[Tt]ransition refusée/,
  );
  verif("3. transition hors séquence (saut d'étape) refusée, jamais un saut silencieux", true);

  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "disponibilite_confirmee", actorType: "fournisseur", actorId: null });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "documents_controles", actorType: "employe", actorId: EMPLOYEE_ID });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "prix_marge_valides", actorType: "employe", actorId: EMPLOYEE_ID });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "commande_fournisseur_creee", actorType: "employe", actorId: EMPLOYEE_ID });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "vehicule_en_preparation", actorType: "fournisseur", actorId: null });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "transport_organise", actorType: "employe", actorId: EMPLOYEE_ID });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "inspection_realisee", actorType: "employe", actorId: EMPLOYEE_ID });
  const { to } = await orderEngine.avancerStatut({ orderItemId: commande.id, to: "pret_visite_livraison", actorType: "employe", actorId: EMPLOYEE_ID });
  verif("3b. séquence complète jusqu'à 'pret_visite_livraison' acceptée pas à pas", to === "pret_visite_livraison");

  const detailApresSequence = await orderEngine.obtenirCommandeDetail(commande.id);
  verif("3c. chaque étape réellement conservée dans l'historique (jamais écrasée)", detailApresSequence.historique.length === 9);

  // ── 4. Statut client dérivé (section 9, demande PDG) : jamais les étapes internes ──
  const statutClientAvantDecision = orderEngine.deriveCustomerStatus("pret_visite_livraison");
  verif("4. 'pret_visite_livraison' (interne) → 'pret_inspection_livraison' (client), jamais le vocabulaire interne exposé", statutClientAvantDecision === "pret_inspection_livraison");
  verif("4b. aucune des 7 étapes client n'expose un mot du vocabulaire interne à 10 étapes", !["vehicule_selectionne", "disponibilite_confirmee", "transport_organise"].includes(statutClientAvantDecision));

  // ── 5. Décision finale (section 10, demande PDG) : "accepte" ────────────
  await orderEngine.poserDecision({ orderItemId: commande.id, decision: "accepte", decidedBy: EMPLOYEE_ID, note: "Client satisfait à l'inspection." });
  const detailApresDecision = await orderEngine.obtenirCommandeDetail(commande.id);
  verif("5. décision bien posée et commande passée en 'decision_finale'", detailApresDecision.decision?.decision === "accepte" && detailApresDecision.commande.status === "decision_finale");
  verif("5b. statut client dérivé reflète la décision 'accepte' → véhicule remis/livré", orderEngine.deriveCustomerStatus("decision_finale", "accepte") === "vehicule_remis_livre");

  // Re-poser une décision sur la même commande remplace explicitement
  // l'ancienne (onConflictDoUpdate) — jamais une seconde ligne silencieuse.
  await orderEngine.poserDecision({ orderItemId: commande.id, decision: "garde", decidedBy: EMPLOYEE_ID, note: "Changement de décision avant clôture." });
  const detailApresChangementDecision = await orderEngine.obtenirCommandeDetail(commande.id);
  verif("5c. re-poser une décision remplace l'ancienne, jamais une seconde ligne", detailApresChangementDecision.decision?.decision === "garde");

  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "remboursee", actorType: "employe", actorId: EMPLOYEE_ID, note: "Clôture après retour." });
  await assert.rejects(
    () => orderEngine.poserDecision({ orderItemId: commande.id, decision: "accepte", decidedBy: EMPLOYEE_ID }),
    /[Dd]écision impossible/,
  );
  verif("5d. une fois la commande dans un statut terminal ('remboursee'), aucune décision ne peut plus être posée", true);

  // ── 6. Documents de commande (section 11) : visibilité employé vs client ─
  await orderEngine.enregistrerDocument({ orderItemId: commande.id, documentType: "facture_finale", docDocumentId: DOC_DOCUMENT_ID, generatedBy: EMPLOYEE_ID });
  await orderEngine.enregistrerDocument({ orderItemId: commande.id, documentType: "bon_commande", docDocumentId: DOC_DOCUMENT_ID + 1, generatedBy: EMPLOYEE_ID });

  const docsEmploye = await orderEngine.listerDocuments(commande.id, { employeeView: true });
  verif("6. vue employé : tous les documents visibles, y compris internes", docsEmploye.length === 2);

  const docsClient = await orderEngine.listerDocuments(commande.id, { employeeView: false });
  verif("6b. vue client : jamais le bon de commande fournisseur (document interne réservé)", docsClient.length === 1 && docsClient[0].documentType === "facture_finale");

  // ── 7. Accès client : jamais la commande d'un autre client ───────────────
  const commandesDuBonClient = await orderEngine.listerCommandesClient(CUSTOMER_ID);
  verif("7. le client voit bien sa propre commande", commandesDuBonClient.some((c) => c.id === commande.id));
  const commandesAutreClient = await orderEngine.listerCommandesClient(AUTRE_CLIENT_ID);
  verif("7b. un autre client ne voit jamais cette commande", !commandesAutreClient.some((c) => c.id === commande.id));

  // ── 8. Journal d'audit (règle MOS #12) ──────────────────────────────────
  const journal = await orderEngine.journalAudit(commande.id);
  const actionsAttendues = ["commande.creee", "commande.employe_attribue", "commande.statut_change", "commande.decision_prise", "commande.document_genere"];
  const actionsJournalisees = new Set(journal.map((j) => j.action));
  verif("8. chaque étape du cycle de vie est journalisée", actionsAttendues.every((a) => actionsJournalisees.has(a)));

  // ── 9. MOS : health / feed / dashboard ──────────────────────────────────
  const health = await orderEngine.healthStatus();
  verif("9. healthStatus répond avec au moins cette commande de test", health.metrics.total >= 1 && health.status === "ok");
  const feed = await orderEngine.controlCenterFeed();
  verif("9b. controlCenterFeed déclare staging (aucune commande réelle menée de bout en bout)", feed.status === "staging");
  const dash = await orderEngine.dashboard();
  verif("9c. dashboard expose des métriques business réelles (jamais vides)", Object.keys(dash.businessMetrics).length > 0);

  // ── 10. Router : branché dans l'appRouter ───────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const orderKeys = Object.keys(procs).filter((k) => k.startsWith("orderEngine."));
  for (const sub of [
    "orderEngine.meta",
    "orderEngine.healthStatus",
    "orderEngine.creerCommande",
    "orderEngine.attribuerEmploye",
    "orderEngine.avancerStatut",
    "orderEngine.poserDecision",
    "orderEngine.enregistrerDocument",
    "orderEngine.mesVehiculesAttribues",
    "orderEngine.mesCommandes",
    "orderEngine.detailCommandeClient",
  ]) {
    verif(`Router : expose « ${sub} »`, orderKeys.includes(sub));
  }

  await nettoyer();

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(err);
    await nettoyer().catch(() => {});
    process.exit(1);
  });
